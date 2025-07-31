// --- FILE: src/components/Footer.js ---
import React from 'react';

export default function Footer() {
    return (
        <footer className="footer mt-auto py-3 bg-light text-center border-top">
            <div className="container">
                <span className="text-muted">Library Management System © {new Date().getFullYear()}</span>
            </div>
        </footer>
    );
}
