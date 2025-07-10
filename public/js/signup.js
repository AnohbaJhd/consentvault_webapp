document.getElementById('signupForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const errorMsg = document.getElementById('signupError');

  if (!username || !password || !confirmPassword) {
    showError('All fields are required');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }

  let users = JSON.parse(localStorage.getItem('users')) || [];

  if (users.some(user => user.username === username)) {
    showError('Username already exists');
    return;
  }

  users.push({ username, password });
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('loggedInUser', username);

  window.location.href = 'index.html';

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }
});

// After localStorage.setItem('isLoggedIn', 'true');
document.getElementById('notifyBox').classList.remove('hidden');

setTimeout(() => {
  document.getElementById('notifyBox').classList.add('hidden');
}, 4000);

