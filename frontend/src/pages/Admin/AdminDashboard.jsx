import React, { useEffect, useState } from "react";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [chartData, setChartData] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);

  // Sub-views state
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, create-venue, edit-venue
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialFormState = {
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    venueName: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    hourlyRate: 1000,
    mapsUrl: "",
    courts: [{ name: "Main Court", isActive: true }],
    pricingRules: [
      { dayOfWeek: "MONDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1000 },
      { dayOfWeek: "TUESDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1000 },
      { dayOfWeek: "WEDNESDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1000 },
      { dayOfWeek: "THURSDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1000 },
      { dayOfWeek: "FRIDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1000 },
      { dayOfWeek: "SATURDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1200 },
      { dayOfWeek: "SUNDAY", startTime: "06:00", endTime: "22:00", hourlyRate: 1200 }
    ],
    galleryImages: []
  };
  const [formData, setFormData] = useState(initialFormState);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, usersRes, venuesRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/venues")
      ]);

      setStats(statsRes.data.stats || { totalUsers: 0, totalVenues: 0, totalBookings: 0, totalRevenue: 0 });
      setChartData(statsRes.data.monthlyRevenueChartData || []);
      setUsersList(usersRes.data.users || []);
      setVenuesList(venuesRes.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin stats and list records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const res = await api.patch(`/admin/users/${userId}/toggle`);
      setSuccess(`User status for ${res.data.user?.name} has been toggled!`);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourtChange = (index, field, value) => {
    const nextCourts = [...formData.courts];
    nextCourts[index] = { ...nextCourts[index], [field]: value };
    setFormData((prev) => ({ ...prev, courts: nextCourts }));
  };

  const addCourtRow = () => {
    setFormData((prev) => ({
      ...prev,
      courts: [...prev.courts, { name: "", isActive: true }]
    }));
  };

  const removeCourtRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      courts: prev.courts.filter((_, i) => i !== index)
    }));
  };

  const handlePricingRuleChange = (index, field, value) => {
    const nextRules = [...formData.pricingRules];
    nextRules[index] = { ...nextRules[index], [field]: value };
    setFormData((prev) => ({ ...prev, pricingRules: nextRules }));
  };

  const addPricingRuleRow = () => {
    setFormData((prev) => ({
      ...prev,
      pricingRules: [
        ...prev.pricingRules,
        { dayOfWeek: "MONDAY", startTime: "06:00", endTime: "22:00", hourlyRate: prev.hourlyRate }
      ]
    }));
  };

  const removePricingRuleRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingRules: prev.pricingRules.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (activeTab === "create-venue") {
        await api.post("/admin/venues", formData);
        setSuccess("Venue and Admin created successfully!");
      } else {
        await api.put(`/admin/venues/${selectedVenueId}`, formData);
        setSuccess("Venue and Admin updated successfully!");
      }

      await loadAdminData();
      setActiveTab("dashboard");
      setFormData(initialFormState);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (venue) => {
    setFormData({
      ownerName: venue.admin?.name || "",
      ownerEmail: venue.admin?.email || "",
      ownerPassword: "", // Don't show existing hash
      venueName: venue.name || "",
      description: venue.description || "",
      address: venue.address || "",
      city: venue.city || "",
      phone: venue.phone || "",
      hourlyRate: venue.hourlyRate || 1000,
      mapsUrl: venue.mapsUrl || "",
      courts: venue.courts || [],
      pricingRules: venue.pricingRules || [],
      galleryImages: venue.galleryImages || []
    });
    setSelectedVenueId(venue.id);
    setActiveTab("edit-venue");
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this venue? This will also deactivate the admin account.")) return;
    try {
      setActionLoading(true);
      await api.delete(`/admin/venues/${id}`);
      setSuccess("Venue deleted successfully.");
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete venue.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface rounded-2xl p-6 border border-line shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            System Administration Panel
          </h1>
          <p className="text-muted mt-1">Monitor users, futsal centers, booking statistics, and revenue collections.</p>
        </div>
        <div>
          <button
            onClick={() => { setActiveTab("create-venue"); setFormData(initialFormState); setError(""); setSuccess(""); }}
            className="px-4 py-2 bg-charcoal text-white rounded-xl text-sm font-semibold hover:bg-charcoal shadow-sm transition-colors"
          >
            + Add New Venue & Admin
          </button>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 bg-surface border border-line rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-surface border border-line rounded-2xl"></div>
        </div>
      ) : (
        <>
          {/* Sub-View: Create or Edit Venue Form */}
          {(activeTab === "create-venue" || activeTab === "edit-venue") && (
            <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="text-xl font-bold text-foreground">
                  {activeTab === "create-venue" ? "Register New Venue & Admin" : "Update Venue & Admin Account"}
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  Cancel and Return
                </button>
              </div>

              {/* Step 1: Owner Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Section 1: Venue Admin Account</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Admin Full Name</label>
                    <input type="text" name="ownerName" value={formData.ownerName} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Admin Email Address</label>
                    <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="owner@futsal.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">
                      {activeTab === "create-venue" ? "Temporary Password" : "Reset Password (Optional)"}
                    </label>
                    <input type="password" name="ownerPassword" value={formData.ownerPassword} onChange={handleFormChange} required={activeTab === "create-venue"} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="Min 6 chars" />
                  </div>
                </div>
              </div>

              {/* Step 2: Venue Profile */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Section 2: Venue Profile Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Futsal Center Name</label>
                    <input type="text" name="venueName" value={formData.venueName} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Base Hourly Rate (NPR)</label>
                    <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none" />
                  </div>
                  <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleFormChange} required className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Contact Phone</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Google Maps URL (Location)</label>
                    <input type="url" name="mapsUrl" value={formData.mapsUrl} onChange={handleFormChange} className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="https://maps.google.com/..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-muted mb-1">Venue Description</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Step 3: Courts & Availability */}
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Section 3: Courts</h3>
                    <button type="button" onClick={addCourtRow} className="text-xs font-bold text-blue-600 hover:underline">+ Add Court</button>
                  </div>
                  <div className="space-y-2">
                    {formData.courts.map((court, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input type="text" value={court.name} onChange={(e) => handleCourtChange(idx, "name", e.target.value)} required placeholder="Court name" className="flex-1 border border-line rounded-lg px-3 py-1.5 text-sm" />
                        <label className="flex items-center gap-1.5 text-xs text-muted px-2">
                          <input type="checkbox" checked={court.isActive} onChange={(e) => handleCourtChange(idx, "isActive", e.target.checked)} />
                          Active
                        </label>
                        <button type="button" onClick={() => removeCourtRow(idx)} className="text-rose-500 p-1 text-lg leading-none">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Section 4: Weekly Pricing</h3>
                    <button type="button" onClick={addPricingRuleRow} className="text-xs font-bold text-blue-600 hover:underline">+ Add Rule</button>
                  </div>
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.pricingRules.map((rule, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_auto] gap-2 items-center bg-surface-2 p-2 rounded-lg border border-line">
                        <select value={rule.dayOfWeek} onChange={(e) => handlePricingRuleChange(idx, "dayOfWeek", e.target.value)} className="border border-line rounded px-1 py-1 text-xs">
                          {["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
                        </select>
                        <input type="time" value={rule.startTime} onChange={(e) => handlePricingRuleChange(idx, "startTime", e.target.value)} className="border border-line rounded px-1 py-1 text-xs" />
                        <input type="time" value={rule.endTime} onChange={(e) => handlePricingRuleChange(idx, "endTime", e.target.value)} className="border border-line rounded px-1 py-1 text-xs" />
                        <input type="number" value={rule.hourlyRate} onChange={(e) => handlePricingRuleChange(idx, "hourlyRate", Number(e.target.value))} className="border border-line rounded px-1 py-1 text-xs w-full" />
                        <button type="button" onClick={() => removePricingRuleRow(idx)} className="text-rose-500 font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-line">
                <button type="button" onClick={() => setActiveTab("dashboard")} className="px-5 py-2.5 border border-line text-foreground rounded-xl text-sm font-semibold hover:bg-surface-2 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-8 py-2.5 bg-charcoal text-white rounded-xl text-sm font-semibold hover:bg-charcoal disabled:opacity-50 transition-colors shadow-sm">
                  {saving ? "Processing..." : activeTab === "create-venue" ? "Register Venue & Admin" : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "dashboard" && (
            <>
              {/* Stats Cards */}
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Users", value: stats.totalUsers, color: "text-foreground" },
                  { label: "Total Venues", value: stats.totalVenues, color: "text-blue-600" },
                  { label: "Total Bookings", value: stats.totalBookings, color: "text-purple-600" },
                  { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), color: "text-pitch" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Bar Chart (recharts) */}
              <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Monthly Platform Revenue (Last 6 Months)</h2>
                {chartData.length === 0 ? (
                  <div className="h-72 border border-dashed border-line rounded-xl flex items-center justify-center text-muted">
                    No monthly revenue chart data available.
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          stroke="#94a3b8"
                          fontSize={11}
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
                          formatter={(value) => [`Rs ${value}`, "Revenue"]}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#6366f1"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Lists Block */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Recent Users Table */}
                <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Platform Users</h2>
                  {usersList.length === 0 ? (
                    <p className="text-muted text-sm py-8 text-center border border-dashed border-line rounded-xl">No users registered on the platform.</p>
                  ) : (
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm text-muted">
                        <thead className="text-xs uppercase tracking-wider text-muted border-b border-line bg-surface-2">
                          <tr>
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Joined Date</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {usersList.map((usr) => (
                            <tr key={usr.id} className="hover:bg-surface-2">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{usr.name}</div>
                                <div className="text-xs text-muted">{usr.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 text-3xs font-semibold rounded-full uppercase tracking-wider bg-surface-2 text-foreground">
                                  {usr.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-muted">
                                {new Date(usr.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleToggleUserStatus(usr.id)}
                                  disabled={actionLoading || usr.id === user.id}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors border ${
                                    usr.isActive
                                      ? "bg-emerald-550 border-emerald-200 text-pitch-strong bg-pitch-soft hover:bg-pitch-soft"
                                      : "bg-rose-550 border-rose-200 text-red-600 bg-red-500/10 hover:bg-rose-100"
                                  } disabled:opacity-50`}
                                >
                                  {usr.isActive ? "Active" : "Banned"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent Venues Table */}
                <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-foreground mb-5">Registered Futsal Venues</h2>
                  {venuesList.length === 0 ? (
                    <p className="text-muted text-sm py-8 text-center border border-dashed border-line rounded-xl">No venues registered on the platform.</p>
                  ) : (
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left text-sm text-muted">
                        <thead className="text-xs uppercase tracking-wider text-muted border-b border-line bg-surface-2">
                          <tr>
                            <th className="py-3 px-4">Venue</th>
                            <th className="py-3 px-4">Location</th>
                            <th className="py-3 px-4">Admin</th>
                            <th className="py-3 px-4">Courts</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {venuesList.map((vn) => (
                            <tr key={vn.id} className="hover:bg-surface-2">
                              <td className="py-3.5 px-4 font-semibold text-foreground">{vn.name}</td>
                              <td className="py-3.5 px-4 text-xs text-muted">{vn.city}</td>
                              <td className="py-3.5 px-4">{vn.admin?.name || "No Admin"}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center justify-center h-6 w-8 font-bold text-foreground bg-surface-2 rounded-md text-xs">
                                  {vn.courts?.length || 0}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleEditClick(vn)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Venue"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVenue(vn.id)}
                                    disabled={actionLoading}
                                    className="p-1.5 text-rose-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete Venue"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
