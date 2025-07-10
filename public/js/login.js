document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    window.location.href = "login.html";
  }
});




document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  // Simple auth demo — update with real credentials check later
  if (username === 'admin' && password === 'consent123') {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loggedInUser', username);

    // Show notification
    const notifyBox = document.getElementById('notifyBox');
    notifyBox.classList.remove('hidden');

    // Hide after 4 seconds and redirect
    setTimeout(() => {
      notifyBox.classList.add('hidden');
      window.location.href = 'index.html';
    }, 4000);
  } else {
    errorMsg.textContent = 'Invalid username or password';
    errorMsg.style.display = 'block';
  }
});
