import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Permission {
  systems: string;
  access: string[];
}

interface User {
  id: string;
  userType: 'school' | 'teacher' | 'student';
  schoolCode: string;
  username: string;
  name: string;
  role: string;
  permissions: Permission[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setState({
          user: data.user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    fetchUser();
  }, [router]);

  const hasPermission = (system: string, action: string): boolean => {
    if (!state.user?.permissions) return false;
    
    return state.user.permissions.some(
      (permission) =>
        permission.systems === system && permission.access.includes(action)
    );
  };

  const hasAnyPermission = (system: string, actions: string[]): boolean => {
    if (!state.user?.permissions) return false;
    
    return state.user.permissions.some(
      (permission) =>
        permission.systems === system &&
        actions.some((action) => permission.access.includes(action))
    );
  };

  const hasAllPermissions = (system: string, actions: string[]): boolean => {
    if (!state.user?.permissions) return false;
    
    return state.user.permissions.some(
      (permission) =>
        permission.systems === system &&
        actions.every((action) => permission.access.includes(action))
    );
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setState({ user: null, isLoading: false, error: null });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to logout'
      }));
    }
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
    isAuthenticated: !!state.user,
  };
} 