import React, { useEffect, useState } from "react";
import api from "../../lib/api.js";
import Notice from "../../components/Notice.jsx";
import { getApiErrorMessage } from "../../lib/form-utils.js";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/bookings/me");
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load bookings"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.post(`/bookings/${id}/cancel`);
      setMessage("Booking cancelled successfully.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to cancel booking"));
    }
  };

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">My Bookings</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Track your booked slots, review venue details, and cancel only when you are still
          outside the 2-hour lock window.
        </p>
      </section>

      <Notice tone="success">{message}</Notice>
      <Notice tone="error">{error}</Notice>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  {booking.court?.venue?.name} - {booking.court?.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(booking.startTime).toLocaleString()} to{" "}
                  {new Date(booking.endTime).toLocaleTimeString()}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">Rs. {booking.totalPrice}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      booking.status === "CANCELLED" ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {booking.status}
                  </p>
                </div>
                {booking.status !== "CANCELLED" ? (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    Cancel booking
                  </button>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    This booking has already been cancelled.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="text-sm text-slate-600">You have no bookings yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
