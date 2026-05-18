import React, { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, clearAuth } from "../utils/token";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Placeholder logic to verify token/user if needed
    const token = getAccessToken();
    if (token) {
      setUser({ authenticated: true });
    }
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = "/login";
  };

  const value = {
    user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
