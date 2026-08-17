import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navBaseClass =
  "px-3 py-2 rounded-lg text-sm font-medium transition-colors";

const navClassName = ({ isActive }) =>
  `${navBaseClass} ${
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                FH
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">FutsalHub</p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Booking and team operations
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
              {!user ? (
                <>
                  <NavLink to="/login" className={navClassName}>
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800"
                  >
                    Create account
                  </NavLink>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                      {user.name?.[0] || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500 truncate">
                        {user.role.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium shadow-sm hover:bg-rose-700"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm lg:hidden"
            >
              Menu
            </button>
          </div>

          {menuOpen && (
            <div className="border-t border-slate-200 py-3 lg:hidden">
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
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800"
                    >
                      Create account
                    </NavLink>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span className="font-medium text-slate-950">{user.name}</span>
                      <span className="ml-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                        {user.role.replaceAll("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium shadow-sm hover:bg-rose-700"
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

      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-slate-500">
          <p>Copyright {new Date().getFullYear()} FutsalHub</p>
          <p>Designed for fast booking decisions and role-based operations.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
