import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const VenueAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Stats and charts
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeCourts: 0,
    occupancyRate: 0
  });
  const [venue, setVenue] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);

  // Sub-views state for inline quick actions
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, bookings, courts, pricing, edit-venue
  const [saving, setSaving] = useState(false);

  // Forms
  const [courtForm, setCourtForm] = useState({ name: "", isActive: true });
  const [pricingRules, setPricingRules] = useState([]);
  const [venueForm, setVenueForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    hourlyRate: 1000,
    description: "",
    mapsUrl: ""
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, bookingsRes] = await Promise.all([
        api.get("/venues/my/stats"),
        api.get("/venues/my/bookings")
      ]);

      const data = statsRes.data;
      setStats(data.stats || { totalRevenue: 0, totalBookings: 0, activeCourts: 0, occupancyRate: 0 });
      setVenue(data.venue);
      setChartData(data.revenueChartData || []);
      setTodayBookings(data.todayBookings || []);
      setAllBookings(bookingsRes.data.bookings || []);

      if (data.venue) {
        setVenueForm({
          name: data.venue.name || "",
          phone: data.venue.phone || "",
          address: data.venue.address || "",
          city: data.venue.city || "",
          hourlyRate: data.venue.hourlyRate || 1000,
          description: data.venue.description || "",
          mapsUrl: data.venue.mapsUrl || ""
        });
        setPricingRules(data.venue.pricingRules || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAddCourtSubmit = async (e) => {
    e.preventDefault();
    if (!courtForm.name.trim()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updatedCourts = [...(venue?.courts || []), { name: courtForm.name, isActive: courtForm.isActive }];
      const res = await api.put(`/venues/${venue.id}`, {
        ...venueForm,
        courts: updatedCourts,
        pricingRules
      });

      setVenue(res.data.venue);
      setSuccess("Court added successfully!");
      setCourtForm({ name: "", isActive: true });
      await loadDashboardData();
      setActiveTab("dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add court.");
    } finally {
      setSaving(false);
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await api.put(`/venues/${venue.id}`, {
        ...venueForm,
        courts: venue.courts,
        pricingRules
      });

      setVenue(res.data.venue);
      setSuccess("Pricing rules updated successfully!");
      await loadDashboardData();
      setActiveTab("dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update pricing rules.");
    } finally {
      setSaving(false);
    }
  };

  const handleVenueUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await api.put(`/venues/${venue.id}`, {
        ...venueForm,
        courts: venue.courts,
        pricingRules
      });

      setVenue(res.data.venue);
      setSuccess("Venue profile updated successfully!");
      await loadDashboardData();
      setActiveTab("dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update venue profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePricingRuleChange = (index, field, value) => {
    setPricingRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPricingRuleRow = () => {
    setPricingRules((prev) => [
      ...prev,
      { dayOfWeek: "MONDAY", startTime: "06:00", endTime: "22:00", hourlyRate: venue?.hourlyRate || 1000 }
    ]);
  };

  const removePricingRuleRow = (index) => {
    setPricingRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {venue?.name || "Venue Admin Dashboard"}
            </h1>
            <button
              onClick={() => setActiveTab(activeTab === "edit-venue" ? "dashboard" : "edit-venue")}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              {activeTab === "edit-venue" ? "Back to Dash" : "Edit Venue"}
            </button>
          </div>
          <p className="text-slate-500 mt-1">{venue?.address}, {venue?.city}</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "dashboard" && (
            <button
              onClick={() => { setActiveTab("dashboard"); setError(""); setSuccess(""); }}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50"
            >
              Dashboard Home
            </button>
          )}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      {/* Main Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Sub-View: Edit Venue Profile */}
          {activeTab === "edit-venue" && (
            <form onSubmit={handleVenueUpdate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Edit Venue Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Venue Name</label>
                  <input
                    type="text"
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={venueForm.phone}
                    onChange={(e) => setVenueForm({ ...venueForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={venueForm.address}
                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                  <input
                    type="text"
                    value={venueForm.city}
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Base Hourly Rate (NPR)</label>
                  <input
                    type="number"
                    value={venueForm.hourlyRate}
                    onChange={(e) => setVenueForm({ ...venueForm, hourlyRate: Number(e.target.value) })}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Google Maps URL</label>
                  <input
                    type="url"
                    value={venueForm.mapsUrl}
                    onChange={(e) => setVenueForm({ ...venueForm, mapsUrl: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Venue Description</label>
                  <textarea
                    value={venueForm.description}
                    onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}

          {/* Sub-View: Add Court */}
          {activeTab === "courts" && (
            <form onSubmit={handleAddCourtSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Add Futsal Court</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Court Name</label>
                  <input
                    type="text"
                    value={courtForm.name}
                    onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                    placeholder="e.g. Court A (Indoor)"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courtForm.isActive}
                      onChange={(e) => setCourtForm({ ...courtForm, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    Mark Court as Active
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Court"}
                </button>
              </div>
            </form>
          )}

          {/* Sub-View: Edit Pricing Rules */}
          {activeTab === "pricing" && (
            <form onSubmit={handlePricingSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Configure Dynamic Pricing Rules</h2>
                <button
                  type="button"
                  onClick={addPricingRuleRow}
                  className="px-3 py-1.5 bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-200"
                >
                  + Add Rule Row
                </button>
              </div>

              <div className="space-y-4">
                {pricingRules.length === 0 ? (
                  <p className="text-slate-500 text-sm">No rules configured. The base rate will apply to all schedules.</p>
                ) : (
                  pricingRules.map((rule, idx) => (
                    <div key={idx} className="grid gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl sm:grid-cols-5 items-center">
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Day of Week</label>
                        <select
                          value={rule.dayOfWeek}
                          onChange={(e) => handlePricingRuleChange(idx, "dayOfWeek", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={rule.startTime}
                          onChange={(e) => handlePricingRuleChange(idx, "startTime", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={rule.endTime}
                          onChange={(e) => handlePricingRuleChange(idx, "endTime", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-1">Hourly Rate (NPR)</label>
                        <input
                          type="number"
                          value={rule.hourlyRate}
                          onChange={(e) => handlePricingRuleChange(idx, "hourlyRate", Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => removePricingRuleRow(idx)}
                          className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Pricing Rules"}
                </button>
              </div>
            </form>
          )}

          {/* Sub-View: All Bookings List */}
          {activeTab === "bookings" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900">All Booking Records</h2>
              {allBookings.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-200 rounded-xl">No bookings have been made at this venue yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Court</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Time Slot</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{b.user?.name}</td>
                          <td className="py-3.5 px-4 font-medium">{b.court?.name}</td>
                          <td className="py-3.5 px-4">
                            {new Date(b.startTime).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            {new Date(b.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {new Date(b.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{formatCurrency(b.totalPrice)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                              b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Core Dashboard Overview */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), color: "text-emerald-600" },
                  { label: "Total Bookings", value: stats.totalBookings, color: "text-slate-900" },
                  { label: "Active Courts", value: stats.activeCourts, color: "text-blue-600" },
                  { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, color: "text-amber-600" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart Block */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Daily Revenue (Last 30 Days)</h2>
                {chartData.length === 0 ? (
                  <div className="h-72 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                    No booking revenue data to chart.
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickFormatter={(str) => {
                            const parts = str.split("-");
                            return parts[2] ? `${parts[1]}/${parts[2]}` : str;
                          }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickFormatter={(num) => `Rs ${num}`}
                        />
                        <Tooltip
                          contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                          labelFormatter={(str) => `Date: ${str}`}
                          formatter={(value) => [`Rs ${value}`, "Revenue"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1.5, fill: "#ffffff" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                {/* Today's Booking Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-5">Today's Booking Schedule</h2>
                  
                  {todayBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-400 font-medium">No bookings scheduled for today</p>
                      <p className="text-xs text-slate-400 mt-1">Users bookings today will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayBookings.map((b) => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                          <div>
                            <p className="font-semibold text-slate-900">{b.user?.name}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Court: {b.court?.name} • Rate: {formatCurrency(b.totalPrice)}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0 font-mono text-xs font-bold text-slate-700 bg-white border border-slate-250/50 px-3 py-1.5 rounded-lg shadow-sm">
                            {new Date(b.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {new Date(b.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Quick Actions</h2>
                  <div className="grid gap-3">
                    <button
                      onClick={() => setActiveTab("courts")}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 font-semibold text-sm text-slate-900 transition-colors flex items-center justify-between"
                    >
                      <span>Add New Court</span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("pricing")}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 font-semibold text-sm text-slate-900 transition-colors flex items-center justify-between"
                    >
                      <span>Configure Pricing Rules</span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 font-semibold text-sm text-slate-900 transition-colors flex items-center justify-between"
                    >
                      <span>View All Bookings</span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VenueAdminDashboard;
