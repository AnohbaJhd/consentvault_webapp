document.addEventListener("DOMContentLoaded", () => {
  // ✅ Session/User check
  const userId = localStorage.getItem("user_id");
  const username = localStorage.getItem("loggedInUser") || "User";

  if (!userId || localStorage.getItem("isLoggedIn") !== "true") {
    return (window.location.href = "login.html");
  }

  // ✅ Greet user
  const nameEl = document.getElementById("usernamePlaceholder");
  if (nameEl) nameEl.textContent = username;

  // ✅ Load dashboard data
  const tbody = document.querySelector("#consentTable tbody");
  if (!tbody) return;

  fetch(`http://localhost:3000/api/consents/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No consents found.</td></tr>`;
        return;
      }

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
    })
    .catch((err) => {
      console.error("❌ Failed to fetch consents:", err);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading data</td></tr>`;
    });
});

// ✅ Global logout function
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}
