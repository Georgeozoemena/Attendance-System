import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
    const adminKey = localStorage.getItem('adminKey');

    if (!adminKey) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}
