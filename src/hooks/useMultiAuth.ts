import { useEffect, useState, useCallback } from 'react';
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
  domain: string;
  maghta?: string;
  grade?: string;
  classCode?: Array<{value: string, label: string}>;
  groups?: Array<{value: string, label: string}>;
}

interface MultiAuthState {
  users: User[];
  activeUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'multi_auth_users';
const ACTIVE_USER_KEY = 'active_user_id';

export function useMultiAuth() {
  const router = useRouter();
  const [state, setState] = useState<MultiAuthState>({
    users: [],
    activeUser: null,
    isLoading: true,
    error: null,
  });

  // Load users from localStorage on mount
  useEffect(() => {
    const loadStoredUsers = () => {
      try {
        const storedUsers = localStorage.getItem(STORAGE_KEY);
        const activeUserId = localStorage.getItem(ACTIVE_USER_KEY);
        
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const activeUser = activeUserId ? users.find((u: User) => u.id === activeUserId) : users[0];
          
          setState({
            users,
            activeUser: activeUser || null,
            isLoading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading stored users:', error);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to load stored users' 
        }));
      }
    };

    loadStoredUsers();
  }, []);

  // Fetch current user from API and add to users list
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          // If no valid session, redirect to login
          router.push('/login');
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }, [router]);

  // Refresh users from server
  const refreshUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/users');
      if (response.ok) {
        const data = await response.json();
        setState({
          users: data.users || [],
          activeUser: data.activeUser || null,
          isLoading: false,
          error: null,
        });
        
        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users || []));
        if (data.activeUser) {
          localStorage.setItem(ACTIVE_USER_KEY, data.activeUser.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  }, []);

  // Initialize with current session user
  useEffect(() => {
    const initializeWithCurrentUser = async () => {
      // First try to get users from server
      await refreshUsers();
      
      // If no users from server, try to get current user
      const currentUser = await fetchCurrentUser();
      if (currentUser) {
        setState(prev => {
          if (prev.users.length === 0) {
            const newUsers = [currentUser];
            const newState = {
              users: newUsers,
              activeUser: currentUser,
              isLoading: false,
              error: null,
            };
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
            localStorage.setItem(ACTIVE_USER_KEY, currentUser.id);
            return newState;
          }
          return prev;
        });
      }
    };

    initializeWithCurrentUser();
  }, [fetchCurrentUser, refreshUsers]);

  // Add a new user after successful login
  const addUser = useCallback(async (credentials: {
    userType: 'school' | 'teacher' | 'student';
    schoolCode: string;
    username: string;
    password: string;
  }) => {
    try {
      const response = await fetch('/api/auth/multi-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Redirect to dashboard to load the new user's dashboard
      window.location.href = '/admin/dashboard';

      return data.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Switch to a different user
  const switchUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to switch user');
      }

      // Redirect to dashboard to load the new user's dashboard
      window.location.href = '/admin/dashboard';
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch user'
      }));
      throw error;
    }
  }, []);

  // Remove a user from the list
  const removeUser = useCallback(async (userId: string) => {
    try {
      // For now, we'll handle this client-side by removing from localStorage
      // In a production app, you might want a server endpoint to revoke specific tokens
      setState(prev => {
        const newUsers = prev.users.filter(u => u.id !== userId);
        let newActiveUser = prev.activeUser;
        
        // If the removed user was active, switch to another user
        if (prev.activeUser?.id === userId) {
          newActiveUser = newUsers.length > 0 ? newUsers[0] : null;
        }

        const newState = {
          users: newUsers,
          activeUser: newActiveUser,
          isLoading: false,
          error: null,
        };

        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
        if (newActiveUser) {
          localStorage.setItem(ACTIVE_USER_KEY, newActiveUser.id);
          // Switch to the new active user if needed (this will redirect to dashboard)
          if (prev.activeUser?.id === userId && newActiveUser) {
            switchUser(newActiveUser.id).catch(console.error);
          }
        } else {
          localStorage.removeItem(ACTIVE_USER_KEY);
          // If no users left, redirect to login page
          window.location.href = '/login';
        }

        return newState;
      });
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }, [switchUser]);

  // Permission check methods
  const hasPermission = useCallback((system: string, action: string): boolean => {
    if (!state.activeUser?.permissions) return false;
    
    return state.activeUser.permissions.some(
      (permission) =>
        permission.systems === system && permission.access.includes(action)
    );
  }, [state.activeUser]);

  const hasAnyPermission = useCallback((system: string, actions: string[]): boolean => {
    if (!state.activeUser?.permissions) return false;
    
    return state.activeUser.permissions.some(
      (permission) =>
        permission.systems === system &&
        actions.some((action) => permission.access.includes(action))
    );
  }, [state.activeUser]);

  const hasAllPermissions = useCallback((system: string, actions: string[]): boolean => {
    if (!state.activeUser?.permissions) return false;
    
    return state.activeUser.permissions.some(
      (permission) =>
        permission.systems === system &&
        actions.every((action) => permission.access.includes(action))
    );
  }, [state.activeUser]);

  // Logout current user
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      
      if (state.activeUser) {
        removeUser(state.activeUser.id);
      }
      
      // If no users left, redirect to login
      if (state.users.length <= 1) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to logout'
      }));
    }
  }, [state.activeUser, state.users.length, removeUser, router]);

  return {
    users: state.users,
    activeUser: state.activeUser,
    isLoading: state.isLoading,
    error: state.error,
    addUser,
    switchUser,
    removeUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
    isAuthenticated: !!state.activeUser,
    getMaghta: () => state.activeUser?.userType === 'school' ? state.activeUser.maghta : undefined,
    getGrade: () => state.activeUser?.userType === 'school' ? state.activeUser.grade : undefined,
  };
}