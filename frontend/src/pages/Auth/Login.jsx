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
      <section className="rounded-[28px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] md:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Welcome back</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Sign in to run your futsal day.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
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
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_16px_48px_rgba(15,23,42,0.08)] md:p-10">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Login</h2>
        <p className="mt-2 text-sm text-slate-500">
          Use your role-based account to access the right dashboard and navigation automatically.
        </p>
        <Notice tone="error" className="mt-5">{error}</Notice>
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-slate-950 hover:underline">
            Register
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
