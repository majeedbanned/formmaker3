import { useState, useEffect, useCallback } from 'react';

const MENU_STATE_KEY = 'app-sidebar-menu-state';

interface MenuState {
  activeMenuIndex: number | null;
  expandedMenus: Set<number>;
}

export function useMenuState() {
  const [menuState, setMenuState] = useState<MenuState>({
    activeMenuIndex: null,
    expandedMenus: new Set()
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load menu state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(MENU_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMenuState({
            activeMenuIndex: parsed.activeMenuIndex ?? null,
            expandedMenus: new Set(parsed.expandedMenus || [])
          });
        }
      } catch (error) {
        console.warn('Failed to load menu state from localStorage:', error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save menu state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        const stateToSave = {
          activeMenuIndex: menuState.activeMenuIndex,
          expandedMenus: Array.from(menuState.expandedMenus)
        };
        localStorage.setItem(MENU_STATE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save menu state to localStorage:', error);
      }
    }
  }, [menuState, isLoaded]);

  // Toggle menu expansion (for accordion behavior)
  const toggleMenu = useCallback((index: number) => {
    setMenuState(prev => {
      const newExpandedMenus = new Set(prev.expandedMenus);
      
      if (newExpandedMenus.has(index)) {
        newExpandedMenus.delete(index);
        return {
          activeMenuIndex: null,
          expandedMenus: newExpandedMenus
        };
      } else {
        // For accordion behavior, close all other menus
        newExpandedMenus.clear();
        newExpandedMenus.add(index);
        return {
          activeMenuIndex: index,
          expandedMenus: newExpandedMenus
        };
      }
    });
  }, []);

  // Check if a menu is expanded
  const isMenuExpanded = useCallback((index: number) => {
    return menuState.expandedMenus.has(index);
  }, [menuState.expandedMenus]);

  // Set active menu (for when navigating to a page)
  const setActiveMenu = useCallback((index: number | null) => {
    setMenuState(prev => ({
      ...prev,
      activeMenuIndex: index
    }));
  }, []);

  return {
    activeMenuIndex: menuState.activeMenuIndex,
    expandedMenus: menuState.expandedMenus,
    isLoaded,
    toggleMenu,
    isMenuExpanded,
    setActiveMenu
  };
} 