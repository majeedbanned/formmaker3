import { useEffect, useState } from 'react';

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
  maghta?: string;
  grade?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Public authentication hook that doesn't redirect to login
 * Use this for public pages that optionally show different content for authenticated users
 */
export function usePublicAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setState({
            user: data.user,
            isLoading: false,
            error: null,
          });
        } else {
          // User is not authenticated, but that's okay for public pages
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        // Authentication failed, but continue without redirect
        setState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };

    fetchUser();
  }, []);

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

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: !!state.user,
    getMaghta: () => state.user?.userType === 'school' ? state.user.maghta : undefined,
    getGrade: () => state.user?.userType === 'school' ? state.user.grade : undefined,
  };
} 