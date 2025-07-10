document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("loggedInUser") || "User";
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  // 👋 Greet user
  const userPlaceholder = document.getElementById("usernamePlaceholder");
  if (userPlaceholder) userPlaceholder.textContent = username;

  const tbody = document.querySelector("#consentTable tbody");
  const chartCanvas = document.getElementById("typeChart");
  const exportJSONBtn = document.getElementById("export-json");
  const exportCSVBtn = document.getElementById("export-csv");

  fetch(`http://localhost:3000/api/consents/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No consents found.</td></tr>';
        return;
      }

      // ✅ Render Table
      data.forEach((c) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${c.service_name}</td>
          <td>${c.data_shared}</td>
          <td>${c.consent_type}</td>
          <td>${new Date(c.consent_date).toLocaleDateString()}</td>
          <td>${c.notes || "—"}</td>
        `;
        tbody.appendChild(row);
      });

      // ✅ Count types for Chart
      const typeCounts = {};
      data.forEach((c) => {
        const type = c.consent_type || c.type || "Unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // ✅ Build Chart
      if (chartCanvas && Object.keys(typeCounts).length > 0) {
        const ctx = chartCanvas.getContext("2d");
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: Object.keys(typeCounts),
            datasets: [{
              label: "Consent Count",
              data: Object.values(typeCounts),
              backgroundColor: ["#1B3C53", "#456882", "#D2C1B6", "#F9F3EF"],
              borderRadius: 8,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: "Consent Type Breakdown",
                color: "#1B3C53",
                font: { size: 18 },
              },
            },
            scales: {
              x: { ticks: { color: "#456882" } },
              y: {
                beginAtZero: true,
                ticks: { color: "#456882" },
              },
            },
          },
        });
      }

      // ✅ Export Handlers
      if (exportJSONBtn) {
        exportJSONBtn.addEventListener("click", () => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          downloadFile(url, "consents.json");
        });
      }

      if (exportCSVBtn) {
        exportCSVBtn.addEventListener("click", () => {
          const csv = convertToCSV(data);
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          downloadFile(url, "consents.csv");
        });
      }
    })
    .catch((err) => {
      console.error("❌ Failed to load consents:", err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading data.</td></tr>';
    });

  // 🔧 Reusable Export Helpers
  function downloadFile(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function convertToCSV(data) {
    const headers = ["Service", "Data Shared", "Consent Type", "Date", "Notes"];
    const rows = data.map((c) =>
      [
        c.service_name,
        c.data_shared,
        c.consent_type,
        new Date(c.consent_date).toLocaleDateString(),
        (c.notes || "").replace(/\n/g, " "),
      ].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
});
