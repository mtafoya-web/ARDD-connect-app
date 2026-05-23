import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#f7f9ff]">
        <div className="rounded-full border border-[#012585]/[0.12] bg-white px-5 py-3 text-sm font-semibold text-zinc-600 shadow-sm">
          Loading...
        </div>
      </main>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
