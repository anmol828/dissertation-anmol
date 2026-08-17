import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getApiErrorMessage, isValidEmail } from "../../lib/form-utils.js";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="fh-panel-dark relative overflow-hidden p-8 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-pitch/30 blur-3xl"
        />
        <p className="fh-kicker text-pitch-strong">Welcome back</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[1.05] tracking-tight md:text-5xl">
          Sign in to run your futsal day.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
          Move between bookings, venue operations, player identity, and admin controls without
          losing context. The interface adapts to the role you sign in with.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Players", value: "Profile + team visibility" },
            { label: "Owners", value: "Calendar + pricing control" },
            { label: "Admins", value: "Venue lifecycle oversight" }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pitch-strong">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fh-panel p-8 md:p-10">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">Login</h2>
        <p className="mt-2 text-sm text-muted">
          Use your role-based account to access the right dashboard and navigation automatically.
        </p>
        <Notice tone="error" className="mt-5">{error}</Notice>
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="fh-label">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="fh-input"
            />
          </div>
          <div>
            <label className="fh-label">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="fh-input"
            />
          </div>
          <button type="submit" disabled={loading} className="fh-btn-primary w-full">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-5 text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-pitch hover:text-pitch-strong">
            Register
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
