// --- FILE: src/contexts/AuthContext.js ---
// Manages user authentication state globally.
import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (email, password) => {
        if (!auth) return Promise.reject(new Error("Firebase not initialized."));
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        if (!auth) return Promise.reject(new Error("Firebase not initialized."));
        return signOut(auth);
    };

    useEffect(() => {
        let unsubscribe;
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, user => {
                setCurrentUser(user);
                setLoading(false);
            });
        } else {
            // If firebase is not configured, run in offline mode with no user.
            setLoading(false);
        }
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const value = {
        currentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
