import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import QRPage from './pages/QRPage.jsx';
import AttendanceFormPage from './pages/AttendanceFormPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';
import QuickCheckInPage from './pages/QuickCheckInPage.jsx';
import TestimonyPage from './pages/TestimonyPage.jsx';
import PrayerRequestPage from './pages/PrayerRequestPage.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminLoginPage from './pages/Admin/AdminLoginPage.jsx';
import ProtectedRoute from './components/Admin/ProtectedRoute.jsx';
import {
  AdminLive, AdminAnalytics, AdminQR,
  AdminMembers, AdminAbsentees, AdminEvents,
  AdminSettings, AdminTestimonies,
  AdminPrayer, AdminDepartments
} from './pages/Admin/AdminWrapper.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<App />}>
          {/* Public pages */}
          <Route index element={<QRPage />} />
          <Route path="qr" element={<QRPage />} />
          <Route path="check-in" element={<QuickCheckInPage />} />
          <Route path="attend" element={<AttendanceFormPage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="testimony" element={<TestimonyPage />} />
          <Route path="prayer" element={<PrayerRequestPage />} />

          {/* Admin */}
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="live" replace />} />
              <Route path="live" element={<AdminLive />} />
              <Route path="analysis" element={<AdminAnalytics />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="qrcode" element={<AdminQR />} />
              <Route path="members" element={<AdminMembers />} />
              <Route path="departments" element={<AdminDepartments />} />
              <Route path="absentees" element={<AdminAbsentees />} />
              <Route path="prayer" element={<AdminPrayer />} />
              <Route path="testimonies" element={<AdminTestimonies />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
