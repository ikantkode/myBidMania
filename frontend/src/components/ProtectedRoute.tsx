import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authAPI.getMe();
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !token || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Agency is now optional - just show the children
  return <>{children}</>;
}
