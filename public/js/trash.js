document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("loggedInUser") || "User";

  // 🔐 Protect access
  if (!userId || localStorage.getItem("isLoggedIn") !== "true") {
    return (window.location.href = "login.html");
  }

  // 👋 Greet user
  const userEl = document.getElementById("usernamePlaceholder");
  if (userEl) userEl.textContent = username;

  // 📦 Load trashed consents
  try {
    const res = await fetch(`http://localhost:3000/api/consents/trashed/${userId}`);
    const data = await res.json();
    renderTrashTable(data);
  } catch (err) {
    console.error("❌ Error loading trashed consents:", err);
    const tbody = document.querySelector("#trashTable tbody");
    if (tbody)
      tbody.innerHTML = `<tr><td colspan='6' style="color:red;">Failed to load data.</td></tr>`;
  }
});

// 🧱 Build trash table
function renderTrashTable(consents) {
  const tbody = document.querySelector("#trashTable tbody");
  if (!tbody) return;

  tbody.innerHTML = consents.length
    ? ""
    : "<tr><td colspan='6'>No trashed consents.</td></tr>";

  consents.forEach((consent) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${consent.service_name}</td>
      <td>${consent.data_shared}</td>
      <td>${consent.consent_type}</td>
      <td>${formatDate(consent.consent_date)}</td>
      <td>${consent.notes || "—"}</td>
      <td>
        <button class="restore-btn" onclick="restoreConsent('${consent.id}')">Restore</button>
        <button class="delete-btn" onclick="deleteForever('${consent.id}', '${consent.service_name}')">Delete Forever</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

// 🔁 Restore consent
async function restoreConsent(id) {
  if (!confirm("Restore this consent?")) return;

  const res = await fetch(`http://localhost:3000/api/consents/restore/${id}`, {
    method: "PUT",
  });

  if (res.ok) {
    alert("✅ Restored!");
    location.reload();
  } else {
    alert("❌ Failed to restore.");
  }
}

// 💀 Delete forever with webhook
async function deleteForever(id, service) {
  if (!confirm("⚠️ Permanently delete this consent?")) return;

  const res = await fetch(`http://localhost:3000/api/consents/delete/${id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    alert("🗑️ Deleted permanently.");
    sendWebhook(service); // Optional notification
    location.reload();
  } else {
    alert("❌ Failed to delete.");
  }
}

// 📡 Optional webhook trigger on delete
function sendWebhook(service) {
  const username = localStorage.getItem("loggedInUser") || "Unknown User";

  fetch("https://webhook.site/your-real-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "Consent Deleted Permanently",
      user: username,
      service,
      deleted_at: new Date().toISOString(),
    }),
  }).then(() => {
    console.log("📡 Webhook: consent deleted.");
  });
}
