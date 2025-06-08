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
const MENU_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours (menu data rarely changes)

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
        Object.entries(data.cache).forEach(([key, value]) => {
          // Only restore if not expired
          const cacheData = value as { menus: MenuSection[]; timestamp: number };
          if (Date.now() - cacheData.timestamp < MENU_CACHE_DURATION) {
            menuCache.set(key, cacheData);
          }
        });
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

    return userData[0].data.premisions || [];
  } catch (error) {
    console.error('Error fetching user permissions:', error);
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
  
  console.log('🔍 Building menu structure for user:', { userType: user?.userType, username: user?.username });
  console.log('📋 User permissions from database:', userPermissions);
  console.log('🔑 User accessible system IDs (with "show" access):', Array.from(userSystemIDs));
  console.log('🏢 All admin systems available:', adminSystems.map(s => ({ systemID: s.data.systemID, systemName: s.data.systemName })));
  
  // Filter admin systems to only include those the user has access to
  const accessibleSystems = adminSystems.filter(system => 
    userSystemIDs.has(system.data.systemID)
  );
  
  console.log('✅ Accessible systems after permission filtering:', accessibleSystems.map(s => ({ 
    systemID: s.data.systemID, 
    systemName: s.data.systemName,
    menuID: s.data.menuID
  })));
  
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
  
  console.log('🎯 Final menu structure:', sortedMenuSections.map(section => ({
    title: section.title,
    menuID: section.menuID,
    menuIDOrder: section.menuIDOrder,
    itemCount: section.items.length,
    items: section.items.map(item => ({ title: item.title, url: item.url }))
  })));
  
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
        
        if (cached && Date.now() - cached.timestamp < MENU_CACHE_DURATION) {
          setState(prev => {
            // Only update if menus are different to prevent unnecessary re-render
            if (JSON.stringify(prev.menus) !== JSON.stringify(cached.menus)) {
              return { menus: cached.menus, isLoading: false, error: null };
            }
            return { ...prev, isLoading: false, error: null };
          });
          return;
        }

        // Set loading only if we don't have any cached data
        setState(prev => ({ 
          ...prev, 
          isLoading: prev.menus.length === 0, // Don't show loading if we have cached data
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

        // Cache the result
        menuCache.set(userKey, {
          menus,
          timestamp: Date.now()
        });

        // Save to persistent storage
        saveCacheToStorage();

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
 * Hook to refresh menu cache when needed (e.g., after permission changes)
 */
export function useRefreshMenu() {
  const { user } = useAuth();
  
  return useCallback(() => {
    if (user) {
      clearMenuCache(user.userType, user.username);
      // Force a page refresh to reload menus with new permissions
      window.location.reload();
    }
  }, [user?.userType, user?.username]);
} 