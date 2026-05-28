import React, { createContext, useContext, useMemo, useState } from "react";
import { clearSession, getStoredUser, setStoredSession } from "../lib/session.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());

  const login = ({ user: nextUser, accessToken, refreshToken }) => {
    setStoredSession({ user: nextUser, accessToken, refreshToken });
    setUser(nextUser);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
