import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import EmergencyVehicles from './pages/EmergencyVehicles';
import Tracking from './pages/Tracking';
import GreenCorridor from './pages/GreenCorridor';
import TrafficSignals from './pages/TrafficSignals';
import AIDetection from './pages/AIDetection';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<EmergencyVehicles />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="corridor" element={<GreenCorridor />} />
            <Route path="signals" element={<TrafficSignals />} />
            <Route path="ai-detect" element={<AIDetection />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
