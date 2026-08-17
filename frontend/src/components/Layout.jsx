import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const navBaseClass =
  "px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors";

const navClassName = ({ isActive }) =>
  `${navBaseClass} ${
    isActive
      ? "bg-pitch text-pitch-fg shadow-soft"
      : "text-muted hover:bg-surface-2 hover:text-foreground"
  }`;

const BallMark = () => (
  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pitch text-pitch-fg shadow-glow">
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5l3.2 2.3-1.2 3.7h-4l-1.2-3.7L12 7.5z" fill="currentColor" stroke="none" />
      <path d="M12 3v2.2M4.8 8.9l1.8 1M19.2 8.9l-1.8 1M7.4 20l1-2M16.6 20l-1-2" />
    </svg>
  </span>
);

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLinks = [];
  if (user) {
    if (user.role === "PLAYER") {
      roleLinks.push({ to: "/player/dashboard", label: "Dashboard" });
      roleLinks.push({ to: "/venues", label: "Venue" });
      roleLinks.push({ to: "/bookings", label: "Bookings" });
      roleLinks.push({ to: "/player/profile", label: "Player Profile" });
      roleLinks.push({ to: "/teams", label: "Teams" });
    }
    else if (user.role === "VENUE_ADMIN") {
      roleLinks.push({ to: "/venue-admin", label: "Venue Panel" });
    }
    else if (user.role === "ADMIN") {
      roleLinks.push({ to: "/admin", label: "Admin Panel" });
    }
    else{
      roleLinks.push({ to: "/player/dashboard", label: "Dashboard" });
      roleLinks.push({ to: "/bookings", label: "Bookings" });
      roleLinks.push({ to: "/venues", label: "Venues" });
    }
  }

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Search" },
    ...roleLinks
  ];

  return (
    <div className="min-h-screen bg-bg bg-pitch-lines text-foreground flex flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
              <BallMark />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold uppercase tracking-tight text-foreground">
                  Futsal<span className="text-pitch">Hub</span>
                </p>
                <p className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted sm:block">
                  Book. Play. Manage.
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={navClassName}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <ThemeToggle />
              {!user ? (
                <>
                  <NavLink to="/login" className={navClassName}>
                    Login
                  </NavLink>
                  <NavLink to="/register" className="fh-btn-primary px-4 py-2">
                    Create account
                  </NavLink>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pitch text-sm font-bold text-pitch-fg">
                      {user.name?.[0] || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pitch truncate">
                        {user.role.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="fh-btn-danger px-4 py-2">
                    Logout
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="fh-btn-secondary px-3 py-2"
              >
                Menu
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="border-t border-line py-3 lg:hidden">
              <nav className="grid gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={navClassName}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!user ? (
                  <>
                    <NavLink to="/login" className={navClassName} onClick={() => setMenuOpen(false)}>
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="fh-btn-primary px-4 py-2"
                    >
                      Create account
                    </NavLink>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-sm">
                      <span className="font-semibold text-foreground">{user.name}</span>
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-pitch">
                        {user.role.replaceAll("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="fh-btn-danger px-4 py-2"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">{children}</main>

      <footer className="border-t border-line bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-muted">
          <div className="flex items-center gap-2">
            <BallMark />
            <p className="font-display font-bold uppercase tracking-tight text-foreground">
              Futsal<span className="text-pitch">Hub</span>
            </p>
          </div>
          <p>Copyright {new Date().getFullYear()} FutsalHub - Designed for fast booking decisions.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
