import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Check token expiry using a stable reference time
function isTokenExpired(expiry) {
    if (!expiry) return false;
    // Use a fixed threshold if available, otherwise use Date.now()
    // This is intentionally called during render for auth checks
    return Date.now() > parseInt(expiry, 10);
}

export default function ProtectedRoute() {
    const adminKey = localStorage.getItem('adminKey');
    const tokenExpiry = localStorage.getItem('adminTokenExpiry');

    // Check if token exists and hasn't expired
    if (!adminKey) {
        return <Navigate to="/admin/login" replace />;
    }

    // Check token expiry (only if expiry is set)
    if (isTokenExpired(tokenExpiry)) {
        // Token expired, clear storage and redirect to login
        localStorage.removeItem('adminKey');
        localStorage.removeItem('adminTokenExpiry');
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
