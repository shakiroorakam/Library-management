// --- FILE: src/components/Header.js ---
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';

export default function Header() {
    const { currentUser, logout } = useAuth();
    const { status } = useData();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const getStatusIndicator = () => {
        if (!status.isOnline) return <span className="badge bg-danger ms-3">Offline</span>;
        if (!status.db) return <span className="badge bg-secondary ms-3">No DB Config</span>;
        return <span className="badge bg-success ms-3">Live Sync</span>;
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: 'var(--primary-color)' }}>
            <div className="container">
                <NavLink className="navbar-brand" to="/">
                    <i className="fas fa-book-open me-2"></i>LibraryMS
                    {getStatusIndicator()}
                </NavLink>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">
                                <i className="fas fa-book me-1"></i>Catalogue
                            </NavLink>
                        </li>
                        {currentUser && (
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/admin">
                                    <i className="fas fa-user-shield me-1"></i>Admin
                                </NavLink>
                            </li>
                        )}
                        {currentUser ? (
                            <li className="nav-item">
                                <button className="btn btn-link nav-link" onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt me-1"></i>Logout
                                </button>
                            </li>
                        ) : (
                             <li className="nav-item">
                                <NavLink className="nav-link" to="/login">
                                    <i className="fas fa-sign-in-alt me-1"></i>Admin Login
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
