// --- FILE: src/components/ProtectedRoute.js ---
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();
    
    if (!currentUser) {
        // Redirect them to the /login page if not authenticated
        return <Navigate to="/login" replace />;
    }

    return children;
}
