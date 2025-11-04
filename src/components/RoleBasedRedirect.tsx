import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const RoleBasedRedirect = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !userProfile) return;

    // Redirecionar baseado no role
    switch (userProfile.role) {
      case 'padaria':
        navigate('/padaria/dashboard', { replace: true });
        break;
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'cliente':
        navigate('/', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  }, [userProfile, loading, navigate]);

  return null;
};
