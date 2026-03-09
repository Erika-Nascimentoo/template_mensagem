import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation
} from 'react-router-dom';
import App from './App-tailwind';
import Templates from './Templates-tailwind';
import TemplateTest from './TemplateTest-tailwind';

const NAV_ITEMS = [
  { to: '/',              icon: 'chat',         label: 'Chat' },
  { to: '/templates',     icon: 'content_copy', label: 'Templates' },
];

function NavBar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#fff',
      borderBottom: '1px solid #eeeeee',
      fontFamily: "'DM Sans', sans-serif",
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 32px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo / brand */}
        
        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(({ to, icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px',
                  borderRadius: 0,
                  fontSize: 14, fontWeight: active ? 500 : 400,
                  textDecoration: 'none',
                  color: active ? '#7622E2' : '#666',
                  background: active ? 'transparent' : 'transparent',
                  borderBottom: active ? '3px solid #7622E2' : 'none',
                  transition: 'background .15s, color .15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f7f7f7'; e.currentTarget.style.color = '#333'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; } }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function AppRouter() {
  return (
    <Router>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'DM Sans', sans-serif" }}>
        <NavBar />
        <Routes>
          <Route path="/"              element={<App />} />
          <Route path="/templates"     element={<Templates />} />
          <Route path="/test-template" element={<TemplateTest />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;