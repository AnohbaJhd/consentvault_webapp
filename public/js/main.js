document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".main-header h1");
  const tagline = document.querySelector(".tagline");
  const user = localStorage.getItem("loggedInUser");
  const userId = localStorage.getItem('user_id');
if (!userId) {
  window.location.href = 'login.html';
}


  // 👋 Personalized Welcome (optional)
  if (user && document.getElementById("usernamePlaceholder")) {
    document.getElementById("usernamePlaceholder").textContent = user;
  }

  // ✨ Fade in animation
  if (header && tagline) {
    header.style.opacity = 0;
    tagline.style.opacity = 0;

    setTimeout(() => {
      header.style.transition = "opacity 0.8s ease-in-out";
      tagline.style.transition = "opacity 1s ease-in-out";
      header.style.opacity = 1;
      tagline.style.opacity = 1;
    }, 300);
  }
});

// 🔐 Logout
function logout() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}
