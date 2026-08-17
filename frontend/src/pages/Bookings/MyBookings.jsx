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
      <section className="rounded-4xl border border-line bg-surface p-8 shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Bookings</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Track your booked slots, review venue details, and cancel only when you are within the 2-hour window before start time.
        </p>
      </section>

      <Notice tone="success">{message}</Notice>
      <Notice tone="error">{error}</Notice>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-3xl border border-line bg-surface p-5 shadow-[0_10px_36px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {booking.court?.venue?.name} - {booking.court?.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {new Date(booking.startTime).toLocaleString()} to{" "}
                  {new Date(booking.endTime).toLocaleTimeString()}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Total</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">Rs. {booking.totalPrice}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">Status</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      booking.status === "CANCELLED" ? "text-red-600" : "text-pitch-strong"
                    }`}
                  >
                    {booking.status}
                  </p>
                </div>
                {booking.status !== "CANCELLED" ? (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Cancel booking
                  </button>
                ) : (
                  <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
                    This booking has already been cancelled.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <p className="text-sm text-muted">You have no bookings yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
