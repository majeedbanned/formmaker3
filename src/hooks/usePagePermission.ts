import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface PagePermissionState {
  isLoading: boolean;
  hasAccess: boolean;
  error: string | null;
}

interface AdminSystemDoc {
  _id: string;
  data: {
    systemID: string;
    systemName: string;
    urls: Array<{ url: string }>;
  };
}

interface UserPermission {
  systems: string;
  access: string[];
}

interface UserDoc {
  _id: string;
  data: {
    premisions?: UserPermission[];
    [key: string]: unknown;
  };
}

// Cache for user permissions to avoid repeated database calls
const permissionsCache = new Map<string, { permissions: UserPermission[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Helper function to get the collection name based on user type
 */
function getCollectionName(userType: string): string {
  switch (userType) {
    case 'student':
      return 'students';
    case 'teacher':
      return 'teachers';
    case 'school':
      return 'schools';
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
}

/**
 * Helper function to get the identifier field name based on user type
 */
function getIdentifierField(userType: string): string {
  switch (userType) {
    case 'student':
      return 'studentCode';
    case 'teacher':
      return 'teacherCode';
    case 'school':
      return 'schoolCode';
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
}

/**
 * Clear permissions cache for a specific user or all users
 */
export function clearPermissionsCache(userType?: string, username?: string): void {
  if (userType && username) {
    // Clear cache for specific user
    const cacheKey = `${userType}-${username}`;
    permissionsCache.delete(cacheKey);
  } else {
    // Clear all cache
    permissionsCache.clear();
  }
}

/**
 * Fetch user permissions from the database with caching
 */
async function fetchUserPermissions(userType: string, username: string): Promise<UserPermission[]> {
  const cacheKey = `${userType}-${username}`;
  const cached = permissionsCache.get(cacheKey);
  
  // Return cached permissions if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.permissions;
  }

  try {
    const collectionName = getCollectionName(userType);
    const identifierField = getIdentifierField(userType);
    
    // Build query to find user by their identifier
    const queryParams = new URLSearchParams({
      filters: JSON.stringify({ [identifierField]: username })
    });

    const response = await fetch(`/api/crud/${collectionName}?${queryParams}`, {
      headers: {
        'x-domain': window.location.host,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data from ${collectionName}`);
    }

    const userData: UserDoc[] = await response.json();
    
    if (!userData || userData.length === 0) {
      throw new Error(`User not found in ${collectionName}`);
    }

    const userPermissions = userData[0].data.premisions || [];
    
    // Cache the permissions
    permissionsCache.set(cacheKey, {
      permissions: userPermissions,
      timestamp: Date.now()
    });

    return userPermissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Custom hook to check if user has permission to access a page
 * @param requiredPermission - The permission level required (e.g., "show", "list", "create", etc.)
 * @returns Object with loading state, access status, and error
 */
export function usePagePermission(requiredPermission: string = "show") {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<PagePermissionState>({
    isLoading: true,
    hasAccess: false,
    error: null,
  });

  useEffect(() => {
    const checkPermission = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;
      
      // If no user, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Get page name from current path
        const pageName = window.location.pathname;
        
        if (!pageName) {
          setState({
            isLoading: false,
            hasAccess: false,
            error: 'Invalid page path'
          });
          return;
        }

        // Fetch both admin systems and user permissions concurrently for better performance
        const [adminSystemsResponse, userPermissions] = await Promise.all([
          fetch('/api/crud/adminsystems', {
            headers: {
              'x-domain': window.location.host,
            },
          }),
          fetchUserPermissions(user.userType, user.username)
        ]);

        if (!adminSystemsResponse.ok) {
          throw new Error('Failed to fetch admin systems');
        }

        const adminSystems: AdminSystemDoc[] = await adminSystemsResponse.json();
        
        // Find the system that contains this page URL
        let systemID: string | null = null;
        
        for (const system of adminSystems) {
          if (system.data?.urls) {
            for (const urlObj of system.data.urls) {
              if (urlObj.url === pageName) {
                systemID = system.data.systemID;
                break;
              }
            }
          }
          if (systemID) break;
        }

        if (!systemID) {
          setState({
            isLoading: false,
            hasAccess: false,
            error: `No system found for page: ${pageName}`
          });
          return;
        }

        // Check if user has permission for this systemID using fresh permissions from database
        const hasPermission = checkUserPermission(userPermissions, systemID, requiredPermission);

        setState({
          isLoading: false,
          hasAccess: hasPermission,
          error: null
        });

        // Redirect to no access page if permission denied
        if (!hasPermission) {
          router.push('/noaccess');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Permission check failed';
        setState({
          isLoading: false,
          hasAccess: false,
          error: errorMessage
        });
        console.error('Permission check error:', error);
      }
    };

    checkPermission();
  }, [user, authLoading, router, requiredPermission]);

  return state;
}

/**
 * Helper function to check if user has specific permission for a system
 */
function checkUserPermission(
  userPermissions: UserPermission[],
  systemID: string,
  requiredPermission: string
): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  return userPermissions.some(permission => 
    permission.systems === systemID && 
    permission.access.includes(requiredPermission)
  );
}

/**
 * Alternative hook for multiple page permission checks
 */
export function useMultiPagePermission(pagePermissions: Array<{ page: string; permission?: string }>) {
  const { user, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMultiplePermissions = async () => {
      if (authLoading || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch both admin systems and user permissions concurrently
        const [adminSystemsResponse, userPermissions] = await Promise.all([
          fetch('/api/crud/adminsystems', {
            headers: {
              'x-domain': window.location.host,
            },
          }),
          fetchUserPermissions(user.userType, user.username)
        ]);

        if (!adminSystemsResponse.ok) {
          throw new Error('Failed to fetch admin systems');
        }

        const adminSystems: AdminSystemDoc[] = await adminSystemsResponse.json();
        const permissionResults: Record<string, boolean> = {};

        for (const { page, permission = "show" } of pagePermissions) {
          let systemID: string | null = null;
          
          // Find systemID for this page
          for (const system of adminSystems) {
            if (system.data?.urls) {
              for (const urlObj of system.data.urls) {
                if (urlObj.url === page) {
                  systemID = system.data.systemID;
                  break;
                }
              }
            }
            if (systemID) break;
          }

          if (systemID) {
            permissionResults[page] = checkUserPermission(userPermissions, systemID, permission);
          } else {
            permissionResults[page] = false;
          }
        }

        setResults(permissionResults);
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Permission check failed';
        setError(errorMessage);
        setIsLoading(false);
        console.error('Multi-permission check error:', error);
      }
    };

    checkMultiplePermissions();
  }, [user, authLoading, pagePermissions]);

  return { results, isLoading, error };
}

/**
 * Lightweight hook for simple permission checking without redirect
 * Useful for showing/hiding UI elements
 */
export function usePermissionCheck(systemName: string, requiredPermission: string = "show") {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const checkPermission = async () => {
      if (!user) {
        setHasPermission(false);
        return;
      }

      try {
        const userPermissions = await fetchUserPermissions(user.userType, user.username);
        setHasPermission(checkUserPermission(userPermissions, systemName, requiredPermission));
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [user, systemName, requiredPermission]);
  
  return hasPermission;
}

/**
 * Hook to get all systems that user has access to
 * Useful for building dynamic navigation
 */
export function useUserSystems() {
  const { user, isLoading: authLoading } = useAuth();
  const [systems, setSystems] = useState<Array<{ systemID: string; systemName: string; permissions: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSystems = async () => {
      if (authLoading || !user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/crud/adminsystems', {
          headers: {
            'x-domain': window.location.host,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin systems');
        }

        // Fetch both admin systems and user permissions concurrently
        const [adminSystemsResponse, userPermissions] = await Promise.all([
          response,
          fetchUserPermissions(user.userType, user.username)
        ]);

        const adminSystems: AdminSystemDoc[] = await adminSystemsResponse.json();
        const userSystems: Array<{ systemID: string; systemName: string; permissions: string[] }> = [];

        for (const system of adminSystems) {
          const userPermission = userPermissions.find(p => p.systems === system.data.systemID);
          if (userPermission) {
            userSystems.push({
              systemID: system.data.systemID,
              systemName: system.data.systemName,
              permissions: userPermission.access
            });
          }
        }

        setSystems(userSystems);
        setIsLoading(false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user systems';
        setError(errorMessage);
        setIsLoading(false);
        console.error('User systems fetch error:', error);
      }
    };

    fetchUserSystems();
  }, [user, authLoading]);

  return { systems, isLoading, error };
} 