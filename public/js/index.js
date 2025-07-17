document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("loggedInUser") || "User"; 
   if (!userId) {
      window.location.href = 'login.html';
  }

  // Greet user
  const greeting = document.getElementById("greeting");
  if (greeting) greeting.textContent = `Welcome back, ${username}!`;

  const cardContainer = document.getElementById("cardContainer");
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const consentForm = document.getElementById("consentForm");

  let allConsentData = [];

  // 🔄 Fetch consents for this user
  fetch(`/api/consents/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      allConsentData = data;
      filterAndRenderCards(allConsentData);
    });

  // 🔍 Filtering
  searchInput?.addEventListener("input", () => filterAndRenderCards(allConsentData));
  typeFilter?.addEventListener("change", () => filterAndRenderCards(allConsentData));

  document.getElementById("startDate")?.addEventListener("change", () => {
    filterAndRenderCards(allConsentData);
  });
  document.getElementById("endDate")?.addEventListener("change", () => {
    filterAndRenderCards(allConsentData);
  });

  // 🎨 Render Card
  function renderConsentCard(consent) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${consent.service}</h3>
      <div><strong>Data Shared:</strong> <span class="tag-container">
        ${consent.data.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
      </span></div>
      <p><strong>Consent Type:</strong> ${consent.type}</p>
      <p><strong>Date:</strong> ${consent.date || 'Not specified'}</p>
      <p><strong>Notes:</strong> ${consent.notes || 'None'}</p>
      <div class="card-actions">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
        <button class="copy-btn">Copy</button>
      </div>
    `;

    // ✂️ Delete
    card.querySelector('.delete-btn').addEventListener('click', () => {
      fetch(`/api/consents/${consent.id}`, { method: 'DELETE' })
        .then(() => {
          allConsentData = allConsentData.filter(c => c.id !== consent.id);
          filterAndRenderCards(allConsentData);
        });
    });

    // ✏️ Edit
    card.querySelector('.edit-btn').addEventListener('click', () => {
      document.getElementById('service').value = consent.service;
      document.getElementById('data').value = consent.data;
      document.getElementById('notes').value = consent.notes;
      document.getElementById('date').value = consent.date;
      document.getElementById('consentType').value = consent.type;
      document.getElementById('consentId').value = consent.id;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 📋 Copy
    card.querySelector('.copy-btn').addEventListener('click', () => {
      const text = `
        Service: ${consent.service}
        Data Shared: ${consent.data}
        Type: ${consent.type}
        Date: ${consent.date || 'N/A'}
        Notes: ${consent.notes || 'None'}
      `.trim();
      navigator.clipboard.writeText(text).then(() => alert('Copied!'));
    });

    cardContainer.appendChild(card);
  }

  function filterAndRenderCards(data) {
    const container = document.getElementById("cardContainer");
    container.innerHTML = "";

    const search = searchInput?.value.toLowerCase() || "";
    const type = typeFilter?.value || "";

    const filtered = data.filter(c => {
      const matchesSearch =
        c.service.toLowerCase().includes(search) ||
        c.data.toLowerCase().includes(search);

      const matchesType = !type || c.type === type;
      return matchesSearch && matchesType;
    });

    filtered.forEach(renderConsentCard);
  }

  // 💾 Submit Form (with Webhook)
  consentForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("consentId").value;
    const service = document.getElementById("service").value;
    const type = document.getElementById("consentType").value;
    const dataShared = document.getElementById("data").value;
    const date = document.getElementById("date").value || new Date().toISOString();
    const notes = document.getElementById("notes").value;

    const payload = {
      user_id: userId,
      service,
      type,
      data: dataShared,
      date,
      notes,
    };

    fetch("/api/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((newConsent) => {
        allConsentData.push(newConsent);
        filterAndRenderCards(allConsentData);
        consentForm.reset();
        alert("Consent saved ✅");

        // 🔔 Webhook Notification (optional)
        const webhookPayload = {
          event: "New Consent Added",
          user: username,
          service,
          type,
          data: dataShared,
          date,
          notes,
        };

        fetch("https://webhook.site/f1ff0617-0cd6-4eca-ada4-5203adfc87cd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        }).then(() => console.log("📡 Webhook sent!"));
      })
      .catch((err) => {
        console.error("❌ Error saving consent:", err);
        alert("Something went wrong.");
      });
  });

  // 🌙 Dark Mode
  const darkToggle = document.getElementById("darkToggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    if (darkToggle) darkToggle.checked = true;
  }
  darkToggle?.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  // 📁 Export
  document.getElementById("export-json")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(allConsentData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "consents.json");
  });

  document.getElementById("export-csv")?.addEventListener("click", () => {
    const csv = convertToCSV(allConsentData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    downloadFile(url, "consents.csv");
  });

  function downloadFile(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function convertToCSV(data) {
    const headers = ["Service", "Data Shared", "Consent Type", "Date", "Notes"];
    const rows = data.map(c =>
      [c.service, c.data, c.type, c.date, (c.notes || "").replace(/\n/g, " ")].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
});
