import { SortingState } from "@tanstack/react-table";

declare global {
  interface Window {
    __EDITING_ENTITY_DATA__?: Record<string, unknown>;
  }
}

export interface FieldValidation {
  regex?: string;
  requiredMessage?: string;
  validationMessage?: string;
}

export interface DropdownDataSource {
  collectionName: string;  // Name of the collection to fetch options from
  labelField: string;     // Field to use as label (can be dot notation for nested fields)
  valueField: string;     // Field to use as value (can be dot notation for nested fields)
  filterQuery?: Record<string, unknown>;  // MongoDB query to filter options
  sortField?: string;     // Field to sort by
  sortOrder?: 'asc' | 'desc';  // Sort direction
  limit?: number;         // Maximum number of options to fetch
  dependsOn?: string;     // Field name this dropdown depends on (for cascading dropdowns)
  customLabel?: string;   // Template for custom label using field values (e.g., "{firstName} {lastName}")
  cacheOptions?: boolean; // Whether to cache the options (defaults to true)
  refreshInterval?: number; // Interval in seconds to refresh options (0 means no refresh)
}

export interface FormField {
  name: string;
  title: string;
  type: string;  // Can be "text", "email", "checkbox", "radio", "dropdown", "textarea"
  required: boolean;
  defaultValue?: unknown;
  validation?: FieldValidation;
  enabled: boolean;
  visible: boolean;
  readonly?: boolean;
  isShowInList: boolean;
  isSearchable: boolean;
  listLabelColor?: string;
  options?: { label: string; value: unknown }[];  // For radio, checkbox, and dropdown
  dataSource?: DropdownDataSource;  // For dropdown only
  fields?: FormField[];  // For nested fields
  isExpanded?: boolean;  // For controlling nested field visibility in forms
  path?: string;  // Full path to the field (e.g., "address.street")
  parentField?: string;  // Name of the parent field
  isNested?: boolean;  // Whether this field is nested
  nestedType?: 'object' | 'array';  // Type of nesting
  arrayMinItems?: number;  // Minimum items for array type
  arrayMaxItems?: number;  // Maximum items for array type
  orientation?: 'vertical' | 'horizontal';  // Layout orientation for nested fields
  isOpen?: boolean;  // Whether nested fields should be open by default
  isMultiple?: boolean;  // For checkbox/select fields that support multiple values
  layout?: 'inline' | 'stacked';  // Layout for radio/checkbox groups
}

export interface Entity {
  _id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Permissions {
  canList: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGroupDelete: boolean;
  canAdvancedSearch: boolean;
  canSearchAllFields: boolean;
}

export interface LayoutSettings {
  direction: 'rtl' | 'ltr';
  width?: string;  // Can be px or % (e.g. '800px' or '90%')
  texts?: {
    // Button texts
    addButton?: string;
    editButton?: string;
    deleteButton?: string;
    cancelButton?: string;
    clearButton?: string;
    searchButton?: string;
    advancedSearchButton?: string;
    applyFiltersButton?: string;
    
    // Modal titles
    addModalTitle?: string;
    editModalTitle?: string;
    deleteModalTitle?: string;
    advancedSearchModalTitle?: string;
    
    // Messages
    deleteConfirmationMessage?: string;
    deleteConfirmationMessagePlural?: string;
    noResultsMessage?: string;
    loadingMessage?: string;
    processingMessage?: string;
    
    // Table texts
    actionsColumnTitle?: string;
    showEntriesText?: string;
    pageText?: string;
    ofText?: string;
    
    // Search
    searchPlaceholder?: string;
    selectPlaceholder?: string;
    
    // Filter indicators
    filtersAppliedText?: string;
    clearFiltersText?: string;
  };
}

export interface RowAction {
  label: string;
  link?: string;  // If provided, will be used as navigation link with rowId as query param
  action?: (rowId: string) => void;  // If provided, will be called when menu item is clicked
  icon?: React.ComponentType<{ className?: string }>;  // Optional icon component
}

export interface CRUDComponentProps {
  formStructure: FormField[];
  collectionName: string;
  connectionString: string;
  initialFilter?: Record<string, unknown>;
  permissions?: {
    canList?: boolean;
    canAdd?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canAdvancedSearch?: boolean;
    canSearchAllFields?: boolean;
  };
  rowActions?: RowAction[];  // New property for row actions
  layout?: {
    direction?: "ltr" | "rtl";
    width?: string;
    texts?: {
      addButton?: string;
      editButton?: string;
      deleteButton?: string;
      cancelButton?: string;
      clearButton?: string;
      searchButton?: string;
      advancedSearchButton?: string;
      applyFiltersButton?: string;
      addModalTitle?: string;
      editModalTitle?: string;
      deleteModalTitle?: string;
      advancedSearchModalTitle?: string;
      deleteConfirmationMessage?: string;
      noResultsMessage?: string;
      loadingMessage?: string;
      processingMessage?: string;
      actionsColumnTitle?: string;
      showEntriesText?: string;
      pageText?: string;
      ofText?: string;
      searchPlaceholder?: string;
      selectPlaceholder?: string;
      filtersAppliedText?: string;
      clearFiltersText?: string;
    };
  };
}

export interface ValidationRules {
  required?: string;
  pattern?: {
    value: RegExp;
    message: string;
  };
}

export interface TableProps {
  entities: Entity[];
  formStructure: FormField[];
  onEdit?: (entity: Entity) => void;
  onDelete?: (id: string) => void;
  onGroupDelete?: (ids: string[]) => void;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
  rowActions?: RowAction[];
  layout?: LayoutSettings;
  canGroupDelete?: boolean;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdvancedSearchClick: () => void;
  layout?: LayoutSettings;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  formStructure: FormField[];
  editingId: string | null;
  loading: boolean;
  layout?: LayoutSettings;
}

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  layout?: LayoutSettings;
  itemCount?: number;
}

export interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  onClear: () => void;
  formStructure: FormField[];
  initialValues?: Record<string, unknown>;
  layout?: LayoutSettings;
} 