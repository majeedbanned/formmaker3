import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  widgetType: string;
  position: WidgetPosition;
  config: Record<string, unknown>;
}

export interface UseDashboardLayoutReturn {
  layout: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
  updateLayout: (newLayout: DashboardWidget[]) => Promise<void>;
  addWidget: (widgetType: string, position?: Partial<WidgetPosition>) => void;
  removeWidget: (widgetId: string) => void;
  moveWidget: (widgetId: string, newPosition: WidgetPosition) => void;
  resetToDefault: () => Promise<void>;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
  {
    id: 'survey-widget',
    widgetType: 'SurveyWidget',
    position: { row: 0, col: 0, width: 2, height: 1 },
    config: {}
  },
  {
    id: 'birthdate-widget',
    widgetType: 'BirthdateWidget',
    position: { row: 0, col: 2, width: 1, height: 1 },
    config: {}
  }
];

export function useDashboardLayout(): UseDashboardLayoutReturn {
  const [layout, setLayout] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load layout from server
  const loadLayout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('/api/dashboard-layout');
      setLayout(response.data.layout || DEFAULT_LAYOUT);
    } catch (err) {
      console.error('Failed to load dashboard layout:', err);
      setError('Failed to load dashboard layout');
      setLayout(DEFAULT_LAYOUT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save layout to server
  const saveLayout = useCallback(async (newLayout: DashboardWidget[]) => {
    try {
      await axios.post('/api/dashboard-layout', { layout: newLayout });
    } catch (err) {
      console.error('Failed to save dashboard layout:', err);
      throw new Error('Failed to save dashboard layout');
    }
  }, []);

  // Update layout
  const updateLayout = useCallback(async (newLayout: DashboardWidget[]) => {
    setLayout(newLayout);
    try {
      await saveLayout(newLayout);
    } catch {
      setError('Failed to save layout changes');
    }
  }, [saveLayout]);

  // Add new widget
  const addWidget = useCallback((widgetType: string, position?: Partial<WidgetPosition>) => {
    const newWidget: DashboardWidget = {
      id: `${widgetType.toLowerCase()}-${Date.now()}`,
      widgetType,
      position: {
        row: position?.row ?? 0,
        col: position?.col ?? 0,
        width: position?.width ?? 1,
        height: position?.height ?? 1
      },
      config: {}
    };

    const newLayout = [...layout, newWidget];
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    const newLayout = layout.filter(widget => widget.id !== widgetId);
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // Move widget
  const moveWidget = useCallback((widgetId: string, newPosition: WidgetPosition) => {
    const newLayout = layout.map(widget =>
      widget.id === widgetId
        ? { ...widget, position: newPosition }
        : widget
    );
    updateLayout(newLayout);
  }, [layout, updateLayout]);

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    await updateLayout(DEFAULT_LAYOUT);
  }, [updateLayout]);

  // Load layout on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  return {
    layout,
    isLoading,
    error,
    updateLayout,
    addWidget,
    removeWidget,
    moveWidget,
    resetToDefault
  };
} 