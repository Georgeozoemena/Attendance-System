import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import QRPage from './pages/QRPage.jsx';
import AttendanceFormPage from './pages/AttendanceFormPage.jsx';
import ThankYouPage from './pages/ThankYouPage.jsx';
import AdminDashboard from './pages/Admin/Dashboard.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<QRPage />} />
          <Route path="attend" element={<AttendanceFormPage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);