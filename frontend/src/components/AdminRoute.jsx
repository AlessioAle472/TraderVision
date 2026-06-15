import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── DEV BYPASS ──────────────────────────────────────────────────────────────
// In locale (npm run dev) l'auth è disabilitata per comodità.
// In produzione (build) il guard è pienamente attivo.
const DEV_BYPASS = import.meta.env.DEV;
// ─────────────────────────────────────────────────────────────────────────────

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Se siamo in locale e lo user simulato non è admin ma è un test environment
  if (DEV_BYPASS && (!user || user.role !== 'admin')) {
    // In dev locale forziamo o bypassiamo, ma seguiamo la stessa logica di ProtectedRoute
    // Tuttavia per testare il ruolo admin potremmo voler effettivamente testare il blocco.
    // Lo bypassiamo solo se non c'è user per evitare crash, se c'è verifichiamo il role.
    if (!user) return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="animate-spin rounded-full h-12 w-12"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
