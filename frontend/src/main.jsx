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
import PermissionGuard from './components/Admin/PermissionGuard.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import {
  AdminLive, AdminAnalytics, AdminQR,
  AdminMembers, AdminAbsentees, AdminEvents,
  AdminSettings, AdminTestimonies,
  AdminPrayer, AdminDepartments,
  AdminFollowUp, AdminUsers, AdminAudit, AdminUsherCheckIn
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
          <Route path="admin" element={<AuthProvider><ProtectedRoute /></AuthProvider>}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="live" replace />} />
              <Route path="live" element={
                <PermissionGuard route="/admin/live">
                  <AdminLive />
                </PermissionGuard>
              } />
              <Route path="analysis" element={
                <PermissionGuard route="/admin/analysis" module="analytics">
                  <AdminAnalytics />
                </PermissionGuard>
              } />
              <Route path="events" element={
                <PermissionGuard route="/admin/events" module="events">
                  <AdminEvents />
                </PermissionGuard>
              } />
              <Route path="qrcode" element={<AdminQR />} />
              <Route path="members" element={
                <PermissionGuard route="/admin/members" module="members">
                  <AdminMembers />
                </PermissionGuard>
              } />
              <Route path="departments" element={
                <PermissionGuard route="/admin/departments">
                  <AdminDepartments />
                </PermissionGuard>
              } />
              <Route path="absentees" element={
                <PermissionGuard route="/admin/absentees" module="absentees">
                  <AdminAbsentees />
                </PermissionGuard>
              } />
              <Route path="prayer" element={
                <PermissionGuard route="/admin/prayer" module="prayer">
                  <AdminPrayer />
                </PermissionGuard>
              } />
              <Route path="testimonies" element={
                <PermissionGuard route="/admin/testimonies" module="testimonies">
                  <AdminTestimonies />
                </PermissionGuard>
              } />
              <Route path="settings" element={
                <PermissionGuard route="/admin/settings">
                  <AdminSettings />
                </PermissionGuard>
              } />
              <Route path="followup" element={
                <PermissionGuard route="/admin/followup">
                  <AdminFollowUp />
                </PermissionGuard>
              } />
              <Route path="users" element={
                <PermissionGuard route="/admin/users">
                  <AdminUsers />
                </PermissionGuard>
              } />
              <Route path="audit" element={
                <PermissionGuard route="/admin/audit">
                  <AdminAudit />
                </PermissionGuard>
              } />
              <Route path="check-in" element={
                <PermissionGuard route="/admin/check-in">
                  <AdminUsherCheckIn />
                </PermissionGuard>
              } />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
