document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");

  document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");

    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("loggedInUser", data.username);

    alert("Signup successful ✅");
    window.location.href = "dashboard.html";

  } catch (err) {
    alert("❌ " + err.message);
  }
});
});
