import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import VenueList from "./pages/Venues/VenueList.jsx";
import VenueDetail from "./pages/Venues/VenueDetail.jsx";
import Search from "./pages/Search.jsx";
import MyBookings from "./pages/Bookings/MyBookings.jsx";
import PlayerProfile from "./pages/Player/PlayerProfile.jsx";
import PlayerDetail from "./pages/Player/PlayerDetail.jsx";
import PlayerDashboard from "./pages/Player/PlayerDashboard.jsx";
import TeamsPage from "./pages/Teams/TeamsPage.jsx";
import VenueAdminDashboard from "./pages/VenueAdmin/VenueAdminDashboard.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import { useAuth } from "./context/AuthContext.jsx";

const RequireAuth = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user } = useAuth();

  if (user) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />

        <Route path="/venues" element={<VenueList />} />
        <Route path="/venues/:id" element={<VenueDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/players/:id" element={<PlayerDetail />} />

        <Route
          path="/bookings"
          element={
            <RequireAuth>
              <MyBookings />
            </RequireAuth>
          }
        />

        <Route
          path="/player/dashboard"
          element={
            <RequireAuth roles={["PLAYER", "USER"]}>
              <PlayerDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/player/profile"
          element={
            <RequireAuth roles={["PLAYER"]}>
              <PlayerProfile />
            </RequireAuth>
          }
        />

        <Route
          path="/teams"
          element={
            <RequireAuth roles={["PLAYER"]}>
              <TeamsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/venue-admin"
          element={
            <RequireAuth roles={["VENUE_ADMIN"]}>
              <VenueAdminDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth roles={["ADMIN"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  );
};

export default App;

