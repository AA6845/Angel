// LOGIN
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.verified) {
          localStorage.setItem("username", data.username); // 💾
          window.location.href = "chat.html";
        } else if (data.success && !data.verified) {
          alert("⚠️ Bitte bestätige deine E-Mail zuerst.");
          document.getElementById('verifyUsername').value = username;
          showVerify();
        } else {
          alert(data.error || "Login fehlgeschlagen.");
        }
      })
      .catch(err => {
        console.error("Fehler beim Login:", err);
        alert("Serverfehler beim Login.");
      });
  });
  
  // REGISTRIERUNG
  document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const email = document.getElementById('email').value.trim();
    const promoCode = document.getElementById('promoCode')?.value.trim() || "";
  
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms.checked) {
      alert("Bitte akzeptiere die AGB und Datenschutzerklärung.");
      return;
    }
  
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        email: email,
        promoCode: promoCode
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("✅ Registrierung erfolgreich. Bitte überprüfe dein E-Mail-Postfach.");
          document.getElementById('verifyUsername').value = newUsername;
          showVerify();
        } else {
          alert(data.error || "Registrierung fehlgeschlagen.");
        }
      })
      .catch(err => {
        console.error("Fehler bei Registrierung:", err);
        alert("Serverfehler bei der Registrierung.");
      });
  });
  
  // VERIFIZIERUNG
  document.getElementById('verifyForm').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('verifyUsername').value.trim();
    const code = document.getElementById('verifyCode').value.trim();
  
    fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("✅ Verifizierung erfolgreich. Du kannst dich jetzt einloggen.");
          showLogin();
        } else {
          alert(data.error || "Verifizierung fehlgeschlagen.");
        }
      })
      .catch(err => {
        console.error("Fehler bei Verifizierung:", err);
        alert("Serverfehler bei der Verifizierung.");
      });
  });
  
  // Umschalten zwischen Ansichten
  function showRegister() {
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'block';
    document.querySelector('.verify-container').style.display = 'none';
  }
  function showLogin() {
    document.querySelector('.login-container').style.display = 'block';
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.verify-container').style.display = 'none';
  }
  function showVerify() {
    console.log("🔍 showVerify() wurde ausgelöst");
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.verify-container').style.display = 'block';
  }
  