export interface ModuleConfig {
  id: string;
  type: ModuleType;
  order: number;
  isVisible: boolean;
  isEnabled: boolean;
  config: Record<string, unknown>; // Module-specific configuration
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleDefinition {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType<ModuleProps>;
  editModal: React.ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
    initialData: unknown;
    moduleId?: string;
  }>;
  category: ModuleCategory;
  isRequired: boolean; // Some modules like navbar and footer might be required
  defaultConfig: Record<string, unknown>;
}

export enum ModuleType {
  NAVBAR = 'navbar',
  HERO = 'hero',
  FEATURES = 'features',
  ABOUT = 'about',
  TEACHERS = 'teachers',
  GALLERY = 'gallery',
  NEWS = 'news',
  ARTICLES = 'articles',
  APP_DOWNLOAD = 'app_download',
  TESTIMONIALS = 'testimonials',
  PRICING = 'pricing',
  CONTACT = 'contact',
  FOOTER = 'footer',
  HTML_CONTENT = 'html_content',
}

export enum ModuleCategory {
  HEADER = 'header',
  HERO = 'hero',
  CONTENT = 'content',
  SOCIAL_PROOF = 'social_proof',
  CONTACT = 'contact',
  FOOTER = 'footer',
}

export interface ModuleManagerState {
  modules: ModuleConfig[];
  availableModules: ModuleDefinition[];
  loading: boolean;
  error: string | null;
}

export interface ModuleProps {
  moduleConfig: ModuleConfig;
  isEditMode?: boolean;
  onEdit?: (moduleId: string) => void;
  onToggleVisibility?: (moduleId: string, isVisible: boolean) => void;
  onDelete?: (moduleId: string) => void;
  onSave?: (moduleId: string, updatedConfig: Record<string, unknown>) => void;
}

export interface ModuleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
  initialData: Record<string, unknown>;
  moduleId?: string;
}

export interface PageModuleConfiguration {
  schoolId?: string;
  pageId: string;
  pageName: string;
  modules: ModuleConfig[];
  createdAt: Date;
  updatedAt: Date;
}

// Dynamic page interface
export interface DynamicPage {
  _id?: string;
  title: string;
  slug: string;
  metaDescription: string;
  metaKeywords: string;
  isPublished: boolean;
  modules: ModuleConfig[];
  schoolId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean; // For backward compatibility
}