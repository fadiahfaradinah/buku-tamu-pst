/**
 * app.js
 * Application bootstrap – registers routes and starts the router.
 */

// Register all routes
Router.on('/',              () => WelcomePage.render());
Router.on('/register',      () => RegistrationPage.render());
Router.on('/skd',           () => window.open('https://skd.bps.go.id/skd/s/7372'));
Router.on('/admin/login',   () => LoginPage.render());
Router.on('/admin/dashboard', () => {
  // Guard: redirect to login if not authenticated
  if (!AuthService.isLoggedIn()) {
    Router.navigate('/admin/login');
    return;
  }
  // Dashboard will be implemented next
  // DashboardPage.render();
  const session = AuthService.getSession();
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;">
      <div style="text-align:center;padding:40px;">
        <p style="font-size:1.1rem;color:#1a3a6b;font-weight:700;">Halo, ${session.name}!</p>
        <p style="color:#6b7280;margin-top:8px;">Dashboard admin akan segera hadir.</p>
        <button onclick="AuthService.clearSession(); Router.navigate('/');"
          style="margin-top:24px;padding:12px 28px;background:#1a3a6b;color:#fff;border:none;border-radius:12px;font-size:0.95rem;font-weight:600;cursor:pointer;">
          Logout
        </button>
      </div>
    </div>`;
});

// Load welcome-specific styles on demand
(function loadWelcomeStyles() {
  if (!document.getElementById('css-welcome')) {
    const link = document.createElement('link');
    link.id   = 'css-welcome';
    link.rel  = 'stylesheet';
    link.href = 'src/styles/welcome.css';
    document.head.appendChild(link);
  }
})();

// Start
Router.init();
