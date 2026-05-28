import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getApiErrorMessage,
  hasNonEmptyValue,
  isStrongEnoughPassword,
  isValidEmail
} from "../../lib/form-utils.js";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowAdminRegistration, setAllowAdminRegistration] = useState(false);

  React.useEffect(() => {
    const loadBootstrapStatus = async () => {
      try {
        const res = await api.get("/auth/bootstrap");
        setAllowAdminRegistration(Boolean(res.data.allowAdminRegistration));
      } catch (err) {
        setAllowAdminRegistration(false);
      }
    };

    loadBootstrapStatus();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasNonEmptyValue(form.name)) {
      setError("Full name is required.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isStrongEnoughPassword(form.password)) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", form);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-8 shadow-[0_16px_48px_rgba(15,23,42,0.08)] md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Create your FutsalHub account
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Register as a player or a booking user. The app will only expose the navigation and
          workflows that belong to your role.
        </p>
        <Notice tone="error" className="mt-5">{error}</Notice>
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="USER">Booking User</option>
              <option value="PLAYER">Player</option>
              {allowAdminRegistration && <option value="ADMIN">Platform Admin</option>}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-950 hover:underline">
            Login
          </Link>
        </p>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] md:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Role-based access</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          The app only shows what your role should actually use.
        </h2>
        <div className="mt-8 grid gap-4">
          {[
            {
              title: "Booking users",
              text: "Venue discovery, booking flow, booking history"
            },
            {
              title: "Players",
              text: "Profile card, availability, teams, recruitment"
            },
            {
              title: "Venue admins",
              text: "Created by platform admin together with venue records"
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Register;
