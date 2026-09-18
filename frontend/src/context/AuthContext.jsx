/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_USERS } from "../data/mockData";

const AuthContext = createContext(null);

const STORAGE_KEY = "or_resq_user_session";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default logged-in user for effortless hackathon demo experience
    return MOCK_USERS[0];
  });

  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError("");

    await new Promise((r) => setTimeout(r, 400));

    const matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      setIsLoading(false);
      return { success: true, user: matchedUser };
    }

    // Allow flexible login for demonstration if non-empty
    if (email && password) {
      const demoUser = {
        id: `USER-${Date.now().toString().slice(-4)}`,
        name: email.split("@")[0].replace(".", " ").toUpperCase(),
        email: email.trim(),
        role: "OR Coordinator",
        department: "Surgical Operations Command",
      };
      setCurrentUser(demoUser);
      setIsLoading(false);
      return { success: true, user: demoUser };
    }

    setIsLoading(false);
    setAuthError("Invalid credentials. Please enter a valid email and password.");
    return { success: false, error: "Invalid credentials" };
  };

  const signup = async ({ name, email, role, department }) => {
    setIsLoading(true);
    setAuthError("");

    await new Promise((r) => setTimeout(r, 400));

    const newUser = {
      id: `USER-${Date.now().toString().slice(-4)}`,
      name: name.trim() || "Staff Member",
      email: email.trim(),
      role: role || "OR Coordinator",
      department: department || "General Surgical Department",
    };

    setCurrentUser(newUser);
    setIsLoading(false);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchDemoUser = (userId) => {
    const target = MOCK_USERS.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        switchDemoUser,
        authError,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
