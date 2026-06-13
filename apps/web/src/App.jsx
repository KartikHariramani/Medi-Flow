import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import PatientHome from './pages/patient/PatientHome';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { MedicalRecordView } from './components/MedicalRecordSystem';

// Mock/Placeholder Pages for the new navigation items
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center min-h-[60vh] text-text-secondary">
    <div className="text-center">
      <h2 className="text-2xl font-display mb-2">{title}</h2>
      <p>This module is currently being integrated...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background-primary text-text-primary">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Patient Routes */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="home" element={<PatientHome />} />
            <Route path="book" element={<PatientHome />} />
            <Route path="token" element={<PatientHome />} />
            <Route path="reports" element={<MedicalRecordView type="patient" />} />
            <Route path="profile" element={<PlaceholderPage title="Patient Profile & Settings" />} />
          </Route>
          
          {/* Doctor Routes */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="queue" element={<DoctorDashboard />} />
            <Route path="history" element={<MedicalRecordView type="doctor" />} />
            <Route path="profile" element={<PlaceholderPage title="Dr. Profile & Availability" />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="doctors" element={<AdminDashboard />} />
            <Route path="patients" element={<AdminDashboard />} />
            <Route path="settings" element={<PlaceholderPage title="Platform Control Center" />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
