import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

// Import the permission fetching logic from usePagePermission
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

interface AdminSystemDoc {
  _id: string;
  data: {
    systemID: string;
    systemName: string;
    mainUrl?: string;
    menuID?: string;
    menuIDOrder?: number;
    [key: string]: unknown;
  };
}

interface MenuItemDoc {
  _id: string;
  data: {
    menuID: string;
    title: string;
    url: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
    [key: string]: unknown;
  };
}

interface MenuGroupDoc {
  _id: string;
  data: {
    menuID: string;
    menuName: string;
    order?: number;
    [key: string]: unknown;
  };
}

interface MenuItem {
  title: string;
  url: string;
  icon?: string;
  order: number;
}

interface MenuSection {
  title: string;
  url: string;
  menuID: string;
  menuIDOrder: number;
  items: MenuItem[];
}

interface DynamicMenuState {
  menus: MenuSection[];
  isLoading: boolean;
  error: string | null;
}

// Cache for menu data to avoid repeated database calls
const menuCache = new Map<string, { menus: MenuSection[]; timestamp: number }>();
const MENU_CACHE_DURATION =5 * 60 *  1000; // 5 minutes - fresh data every 5 minutes 5 * 60 *

// Persistent cache using localStorage
const STORAGE_KEY = 'dynamic_menu_cache';
const STORAGE_VERSION = 'v1';

/**
 * Load cache from localStorage
 */
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.version === STORAGE_VERSION) {
        let loadedCount = 0;
        let expiredCount = 0;
        
        Object.entries(data.cache).forEach(([key, value]) => {
          // Only restore if not expired
          const cacheData = value as { menus: MenuSection[]; timestamp: number };
          const age = Date.now() - cacheData.timestamp;
          
          if (age < MENU_CACHE_DURATION) {
            menuCache.set(key, cacheData);
            loadedCount++;
            // console.log(`📱 Loaded cached menu for ${key} from localStorage (${Math.round(age / 1000)}s old)`);
          } else {
            expiredCount++;
          }
        });
        
        if (loadedCount > 0) {
          // console.log(`✅ Loaded ${loadedCount} valid menu caches from localStorage`);
        }
        if (expiredCount > 0) {
          // console.log(`🗑️ Skipped ${expiredCount} expired menu caches`);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load menu cache from storage:', error);
  }
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage(): void {
  try {
    const cacheObj: Record<string, { menus: MenuSection[]; timestamp: number }> = {};
    menuCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      cache: cacheObj
    }));
  } catch (error) {
    console.warn('Failed to save menu cache to storage:', error);
  }
}

// Load cache on module initialization
loadCacheFromStorage();

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
 * Default permissions for students when no permissions are found
 */
const DEFAULT_STUDENT_PERMISSIONS: UserPermission[] = [
  {
    "systems": "9",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "31",
    "access": [
      "show"
    ]
  },
  {
    "systems": "38",
    "access": [
      "show",
      "list",
      "search"
    ]
  },
  {
    "systems": "29",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "35",
    "access": [
      "show",
      "list",
      "search"
    ]
  },
  {
    "systems": "11",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "20",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "32",
    "access": [
      "show",
      "list",
      "search"
    ]
  },
  {
    "systems": "16",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "12",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "26",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "17",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "25",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "36",
    "access": [
      "show",
      "list",
      "search"
    ]
  },
  {
    "systems": "7",
    "access": [
      "show",
      "list",
      "create",
      "search"
    ]
  }
];

/**
 * Default permissions for teachers when no permissions are found
 */
const DEFAULT_TEACHER_PERMISSIONS: UserPermission[] = [
  {
    "systems": "39",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "9",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "28",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "27",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "30",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "31",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete",
      "search"
    ]
  },
  {
    "systems": "38",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "29",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "35",
    "access": [
      "show",
      "list",
      "create"
    ]
  },
  {
    "systems": "20",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "32",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "24",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "15",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "12",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "26",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "10",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "25",
    "access": [
      "show"
    ]
  },
  {
    "systems": "36",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "14",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  },
  {
    "systems": "13",
    "access": [
      "show",
      "list"
    ]
  },
  {
    "systems": "7",
    "access": [
      "show",
      "list",
      "create",
      "edit",
      "delete"
    ]
  }
];

/**
 * Fetch user permissions from the database
 */
async function fetchUserPermissions(userType: string, username: string): Promise<UserPermission[]> {
  try {
    const collectionName = getCollectionName(userType);
    const identifierField = getIdentifierField(userType);
    
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

    const permissions = userData[0].data.premisions || [];
    
    // If permissions are empty, return default permissions based on user type
    if (permissions.length === 0) {
      if (userType === 'student') {
        // console.log('📚 No permissions found for student, using default permissions');
        return DEFAULT_STUDENT_PERMISSIONS;
      } else if (userType === 'teacher') {
        // console.log('👨‍🏫 No permissions found for teacher, using default permissions');
        return DEFAULT_TEACHER_PERMISSIONS;
      }
    }

    return permissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    // If there's an error, return default permissions based on user type
    if (userType === 'student') {
      // console.log('📚 Error fetching student permissions, using default permissions as fallback');
      return DEFAULT_STUDENT_PERMISSIONS;
    } else if (userType === 'teacher') {
      // console.log('👨‍🏫 Error fetching teacher permissions, using default permissions as fallback');
      return DEFAULT_TEACHER_PERMISSIONS;
    }
    
    return [];
  }
}

/**
 * Fetch admin systems data for given system IDs
 */
async function fetchAdminSystems(systemIDs: string[]): Promise<AdminSystemDoc[]> {
  if (systemIDs.length === 0) return [];

  try {
    const queryParams = new URLSearchParams({
      filters: JSON.stringify({ systemID: { $in: systemIDs } })
    });

    const response = await fetch(`/api/crud/adminsystems?${queryParams}`, {
      headers: {
        'x-domain': window.location.host,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin systems');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching admin systems:', error);
    return [];
  }
}

/**
 * Fetch menu groups for given menu IDs
 */
async function fetchMenuGroups(menuIDs: string[]): Promise<MenuGroupDoc[]> {
  if (menuIDs.length === 0) return [];

  try {
    const queryParams = new URLSearchParams({
      filters: JSON.stringify({ menuID: { $in: menuIDs } })
    });

    const response = await fetch(`/api/crud/adminsystemmenues?${queryParams}`, {
      headers: {
        'x-domain': window.location.host,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch menu groups');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching menu groups:', error);
    return [];
  }
}

/**
 * Fetch menu items for given menu IDs
 */
async function fetchMenuItems(menuIDs: string[]): Promise<MenuItemDoc[]> {
  if (menuIDs.length === 0) return [];

  try {
    const queryParams = new URLSearchParams({
      filters: JSON.stringify({ menuID: { $in: menuIDs } })
    });

    const response = await fetch(`/api/crud/adminsystemmenus?${queryParams}`, {
      headers: {
        'x-domain': window.location.host,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

/**
 * Build menu structure from fetched data
 */
function buildMenuStructure(
  adminSystems: AdminSystemDoc[],
  menuItems: MenuItemDoc[],
  menuGroups: MenuGroupDoc[],
  userPermissions: UserPermission[],
  user: { userType: string; username: string } | null
): MenuSection[] {
  // Create a set of system IDs the user has access to (with "show" permission)
  const userSystemIDs = new Set(
    userPermissions
      .filter(p => p.access && p.access.includes('show')) // Only include systems with "show" permission
      .map(p => p.systems)
  );
  
  // console.log('🔍 Building menu structure for user:', { userType: user?.userType, username: user?.username });
  // console.log('📋 User permissions from database:', userPermissions);
  // console.log('🔑 User accessible system IDs (with "show" access):', Array.from(userSystemIDs));
  // console.log('🏢 All admin systems available:', adminSystems.map(s => ({ systemID: s.data.systemID, systemName: s.data.systemName })));
  
  // Filter admin systems to only include those the user has access to
  const accessibleSystems = adminSystems.filter(system => 
    userSystemIDs.has(system.data.systemID)
  );
  
  // console.log('✅ Accessible systems after permission filtering:', accessibleSystems.map(s => ({
  //   systemID: s.data.systemID, 
  //   systemName: s.data.systemName,
  //   menuID: s.data.menuID
  // })));
  
  // Group accessible admin systems by menuID
  const systemGroups = new Map<string, AdminSystemDoc[]>();
  
  accessibleSystems.forEach(system => {
    const menuID = system.data.menuID;
    if (menuID) {
      if (!systemGroups.has(menuID)) {
        systemGroups.set(menuID, []);
      }
      systemGroups.get(menuID)!.push(system);
    }
  });

  // Create menu sections
  const menuSections: MenuSection[] = [];

  systemGroups.forEach((systems, menuID) => {
    // Get menu group info
    const menuGroup = menuGroups.find(group => group.data.menuID === menuID);
    const menuTitle = menuGroup?.data.menuName || systems[0]?.data.systemName || 'Unknown Menu';
    const menuOrder = menuGroup?.data.order || systems[0]?.data.menuIDOrder || 0;
    
    // Convert admin systems to menu items (these are the user's accessible systems)
    const systemMenuItems = systems.map(system => ({
      title: system.data.systemName,
      url: system.data.mainUrl || '#',
      icon: undefined, // Can be extended later if needed
      order: system.data.menuIDOrder || 0
    }));

    // Get additional menu items from adminsystemmenus collection
    const additionalMenuItems = menuItems
      .filter(item => item.data.menuID === menuID)
      .map(item => ({
        title: item.data.title,
        url: item.data.url,
        icon: item.data.icon,
        order: item.data.order || 999 // Put additional items at the end
      }));

    // Combine both types of menu items
    const allItems = [...systemMenuItems, ...additionalMenuItems]
      .sort((a, b) => a.order - b.order);

    // Only create menu section if it has items (user has access to at least one system in this menu)
    if (allItems.length > 0) {
      menuSections.push({
        title: menuTitle,
        url: '#', // Menu groups typically don't have URLs
        menuID,
        menuIDOrder: menuOrder,
        items: allItems
      });
    }
  });

  // Sort menu sections by menuIDOrder
  const sortedMenuSections = menuSections.sort((a, b) => a.menuIDOrder - b.menuIDOrder);
  
  // console.log('🎯 Final menu structure:', sortedMenuSections.map(section => ({
  //   title: section.title,
  //   menuID: section.menuID,
  //   menuIDOrder: section.menuIDOrder,
  //   itemCount: section.items.length,
  //   items: section.items.map(item => ({ title: item.title, url: item.url }))
  // })));
  
  return sortedMenuSections;
}

/**
 * Custom hook for dynamic menu generation
 */
export function useDynamicMenu(): DynamicMenuState {
  const { user, isLoading: authLoading } = useAuth();
  
  // Initialize state with cache check to avoid loading state
  const [state, setState] = useState<DynamicMenuState>(() => {
    if (!user) {
      return { menus: [], isLoading: true, error: null };
    }
    
    const cacheKey = `${user.userType}-${user.username}`;
    const cached = menuCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < MENU_CACHE_DURATION) {
      return { menus: cached.menus, isLoading: false, error: null };
    }
    
    return { menus: [], isLoading: true, error: null };
  });

  // Create stable user key to prevent unnecessary re-runs
  const userKey = user ? `${user.userType}-${user.username}` : null;

  useEffect(() => {
    const fetchMenuData = async () => {
      if (authLoading || !user || !userKey) return;

      try {
        // Check cache first (in case it was updated since state initialization)
        const cached = menuCache.get(userKey);
        const now = Date.now();
        const isCacheValid = cached && (now - cached.timestamp < MENU_CACHE_DURATION);
        
        if (isCacheValid) {
          // console.log(`📦 Using cached menu data for ${userKey} (cached ${Math.round((now - cached!.timestamp) / 1000)}s ago)`);
          setState(prev => {
            // Only update if menus are different to prevent unnecessary re-render
            if (JSON.stringify(prev.menus) !== JSON.stringify(cached!.menus)) {
              return { menus: cached!.menus, isLoading: false, error: null };
            }
            return { ...prev, isLoading: false, error: null };
          });
          return;
        }

        // Cache expired or doesn't exist - need to fetch from database
        // console.log(`🔄 Cache expired or missing for ${userKey}, fetching from database...`);
        
        // Set loading only if we don't have any cached data
        setState(prev => ({ 
          ...prev, 
          isLoading: prev.menus.length === 0, // Don't show loading if we have expired cached data
          error: null 
        }));

        // Step 1: Fetch user permissions
        const userPermissions = await fetchUserPermissions(user.userType, user.username);
        
        if (userPermissions.length === 0) {
          setState({
            menus: [],
            isLoading: false,
            error: null
          });
          return;
        }

        // Extract system IDs from permissions
        const systemIDs = userPermissions.map(p => p.systems);

        // Step 2: Fetch admin systems data for the system IDs
        const adminSystems = await fetchAdminSystems(systemIDs);
        
        if (adminSystems.length === 0) {
          setState({
            menus: [],
            isLoading: false,
            error: null
          });
          return;
        }

        // Extract unique menu IDs
        const menuIDSet = new Set<string>();
        adminSystems.forEach(system => {
          if (system.data.menuID) {
            menuIDSet.add(system.data.menuID);
          }
        });
        const menuIDs = Array.from(menuIDSet);

        // Step 3: Fetch menu groups and menu items concurrently
        const [menuGroups, menuItems] = await Promise.all([
          fetchMenuGroups(menuIDs),
          fetchMenuItems(menuIDs)
        ]);

        // Step 4: Build menu structure
        const menus = buildMenuStructure(adminSystems, menuItems, menuGroups, userPermissions, user);

        // Cache the result with current timestamp
        const cacheTimestamp = Date.now();
        menuCache.set(userKey, {
          menus,
          timestamp: cacheTimestamp
        });

        // Save to persistent storage
        saveCacheToStorage();

        // console.log(`💾 Menu data cached for ${userKey} - valid for next ${MENU_CACHE_DURATION / 1000}s`);
        // console.log(`📊 Generated ${menus.length} menu sections with ${menus.reduce((acc, section) => acc + section.items.length, 0)} total items`);

        setState({
          menus,
          isLoading: false,
          error: null
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu data';
        setState(prev => ({
          menus: prev.menus, // Keep existing menus if we had them
          isLoading: false,
          error: errorMessage
        }));
        console.error('Error fetching menu data:', error);
      }
    };

    fetchMenuData();
  }, [userKey, authLoading]); // Use userKey instead of user object to prevent unnecessary re-runs

  return state;
}

/**
 * Clear menu cache for performance management
 */
export function clearMenuCache(userType?: string, username?: string): void {
  if (userType && username) {
    const cacheKey = `${userType}-${username}`;
    menuCache.delete(cacheKey);
  } else {
    menuCache.clear();
  }
  
  // Also clear from persistent storage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear menu cache from storage:', error);
  }
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(userType?: string, username?: string): { cached: boolean; age?: number; expires?: number } {
  if (!userType || !username) return { cached: false };
  
  const cacheKey = `${userType}-${username}`;
  const cached = menuCache.get(cacheKey);
  
  if (!cached) return { cached: false };
  
  const now = Date.now();
  const age = now - cached.timestamp;
  const expires = MENU_CACHE_DURATION - age;
  
  return {
    cached: true,
    age: Math.round(age / 1000), // seconds
    expires: Math.round(expires / 1000) // seconds until expiry
  };
}

/**
 * Hook to refresh menu cache when needed (e.g., after permission changes)
 */
export function useRefreshMenu() {
  const { user } = useAuth();
  
  return useCallback(() => {
    if (user) {
      // console.log(`🔄 Manually refreshing menu cache for ${user.userType}-${user.username}`);
      clearMenuCache(user.userType, user.username);
      // Force a page refresh to reload menus with new permissions
      window.location.reload();
    }
  }, [user?.userType, user?.username]);
}

/**
 * Development helper - expose cache utilities to window for debugging
 * Only in development mode
 */
interface CacheDebugEntry {
  menuCount: number;
  totalItems: number;
  cachedAt: string;
  expiresIn: number;
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as typeof window & { menuCacheDebug: object }).menuCacheDebug = {
    getStatus: getCacheStatus,
    clearCache: clearMenuCache,
    viewCache: () => {
      const cacheEntries: Record<string, CacheDebugEntry> = {};
      menuCache.forEach((value, key) => {
        cacheEntries[key] = {
          menuCount: value.menus.length,
          totalItems: value.menus.reduce((acc, section) => acc + section.items.length, 0),
          cachedAt: new Date(value.timestamp).toLocaleString(),
          expiresIn: Math.round((MENU_CACHE_DURATION - (Date.now() - value.timestamp)) / 1000)
        };
      });
      console.table(cacheEntries);
      return cacheEntries;
    }
  };
  
  // console.log('🔧 Menu cache debug utilities available at window.menuCacheDebug');
} 