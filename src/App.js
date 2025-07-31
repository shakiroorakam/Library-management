// --- FILE: src/App.js ---
// This is the main application component that sets up routing.
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CataloguePage from './pages/CataloguePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="d-flex flex-column" style={{minHeight: "100vh"}}>
            <Header />
            <main className="container flex-grow-1 mt-4 mb-4">
              <Routes>
                <Route path="/" element={<CataloguePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                {/* Redirect any unknown paths to the new homepage */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
