import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── DEV BYPASS ──────────────────────────────────────────────────────────────
// In locale (npm run dev) l'auth è disabilitata per comodità.
// In produzione (build) il guard è pienamente attivo.
const DEV_BYPASS = import.meta.env.DEV;
// ─────────────────────────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
 const { user, loading } = useAuth();

 // Bypass completo in sviluppo locale
 if (DEV_BYPASS) return children;

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-background text-text">
 <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
 </div>
 );
 }

 if (!user) {
 return <Navigate to="/login"replace />;
 }

 return children;
};

export default ProtectedRoute;

