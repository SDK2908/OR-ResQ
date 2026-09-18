/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import { ThemeProvider } from "./context/ThemeContext";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import { Dashboard } from "./pages/Dashboard";
import { Schedule } from "./pages/Schedule";
import { EmergencyRecovery } from "./pages/EmergencyRecovery";
import { Procedures } from "./pages/Procedures";
import { Surgeons } from "./pages/Surgeons";
import { OperatingRooms } from "./pages/OperatingRooms";
import { Equipment } from "./pages/Equipment";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { ForgotPassword } from "./pages/ForgotPassword";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ScheduleProvider>
            <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Application Main Layout Routes */}
            <Route
              path="/dashboard"
              element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              }
            />
            <Route
              path="/schedule"
              element={
                <MainLayout>
                  <Schedule />
                </MainLayout>
              }
            />
            <Route
              path="/recovery"
              element={
                <MainLayout>
                  <EmergencyRecovery />
                </MainLayout>
              }
            />
            <Route
              path="/procedures"
              element={
                <MainLayout>
                  <Procedures />
                </MainLayout>
              }
            />
            <Route
              path="/surgeons"
              element={
                <MainLayout>
                  <Surgeons />
                </MainLayout>
              }
            />
            <Route
              path="/operating-rooms"
              element={
                <MainLayout>
                  <OperatingRooms />
                </MainLayout>
              }
            />
            <Route
              path="/equipment"
              element={
                <MainLayout>
                  <Equipment />
                </MainLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <MainLayout>
                  <Analytics />
                </MainLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <MainLayout>
                  <Settings />
                </MainLayout>
              }
            />

            {/* Root & Wildcard Fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ScheduleProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  );
}
