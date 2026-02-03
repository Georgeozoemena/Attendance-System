import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import QRPage from './pages/QRPage.jsx';
import AttendanceFormPage from './pages/AttendanceFormPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';
import QuickCheckInPage from './pages/QuickCheckInPage.jsx';
import AdminLayout from './pages/Admin/AdminLayout.jsx';
import AdminLoginPage from './pages/Admin/AdminLoginPage.jsx';
import ProtectedRoute from './components/Admin/ProtectedRoute.jsx';
import { AdminLive, AdminAnalytics, AdminCategories, AdminQR } from './pages/Admin/AdminWrapper.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<QRPage />} />
          <Route path="check-in" element={<QuickCheckInPage />} />
          <Route path="attend" element={<AttendanceFormPage />} />
          <Route path="thank-you" element={<ThankYouPage />} />

          <Route path="admin/login" element={<AdminLoginPage />} />

          <Route path="admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="live" replace />} />
              <Route path="live" element={<AdminLive />} />
              <Route path="analysis" element={<AdminAnalytics />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="qrcode" element={<AdminQR />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);