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
  uniqueMessage?: string;
  groupUniqueMessage?: string;
}

export interface DropdownDataSource {
  collectionName: string;  // Name of the collection to fetch options from
  labelField: string;     // Field to use as label (can be dot notation for nested fields)
  valueField: string;     // Field to use as value (can be dot notation for nested fields)
  filterQuery?: Record<string, unknown>;  // MongoDB query to filter options
  sortField?: string;     // Field to sort by
  sortOrder?: 'asc' | 'desc';  // Sort direction
  limit?: number;         // Maximum number of options to fetch
  dependsOn?: string | string[];     // Field name(s) this dropdown depends on (for cascading dropdowns)
  customLabel?: string;   // Template for custom label using field values (e.g., "{firstName} {lastName}")
  cacheOptions?: boolean; // Whether to cache the options (defaults to true)
  refreshInterval?: number; // Interval in seconds to refresh options (0 means no refresh)
}

export interface FileUploadConfig {
  allowedTypes?: string[];
  maxSize?: number;
  directory?: string;
  multiple?: boolean;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface FormFieldMinimal {
  name: string;
  title: string;
  type: string;  // Can be "text", "email", "checkbox", "radio", "dropdown", "textarea", "switch", "togglegroup", "label", "datepicker", "autocomplete", "file", "shadcnmultiselect", "autoCompleteText"
  required: boolean;
  defaultValue?: unknown;
  validation?: FieldValidation;
  enabled: boolean;
  visible: boolean;
  readonly?: boolean;
  isShowInList: boolean;
  isSearchable: boolean;
  isUnique?: boolean;
  groupUniqueness?: boolean;
  listLabelColor?: string;
  options?: { label: string; value: unknown }[];  // For radio, checkbox, dropdown, togglegroup, autocomplete, and shadcnmultiselect
  dataSource?: DropdownDataSource;  // For dropdown, checkbox, autocomplete, and shadcnmultiselect
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
  layout?: 'inline' | 'stacked';  // Layout for radio/checkbox/togglegroup groups
  displayFormat?: (value: string | number | Date) => string;  // For custom value formatting
  fileConfig?: FileUploadConfig;  // New field for file upload configuration
  labelStyle?: {  // For label type
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
  switchStyle?: {  // For switch type
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    thumbColor?: string;
  };
  datepickerStyle?: {  // For datepicker type
    format?: string;  // Date format (e.g., "YYYY-MM-DD")
    calendar?: 'gregorian' | 'persian' | 'arabic';  // Calendar type
    locale?: string;  // Locale for the calendar (e.g., "en", "fa")
    timePicker?: boolean;  // Whether to show time picker
    onlyTimePicker?: boolean;  // Whether to show only time picker
    onlyMonthPicker?: boolean;  // Whether to show only month picker
    onlyYearPicker?: boolean;  // Whether to show only year picker
    minDate?: string | Date;  // Minimum selectable date
    maxDate?: string | Date;  // Maximum selectable date
    weekStartDayIndex?: number;  // Index of the first day of week (0 for Sunday)
    disableYearPicker?: boolean;  // Whether to disable year picker
    disableMonthPicker?: boolean;  // Whether to disable month picker
    readOnly?: boolean;  // Whether the datepicker is read-only
    disabled?: boolean;  // Whether the datepicker is disabled
    hideWeekDays?: boolean;  // Whether to hide week days
    hideMonth?: boolean;  // Whether to hide month in header
    hideYear?: boolean;  // Whether to hide year in header
    className?: string;  // Additional CSS class name
    containerClassName?: string;  // Additional CSS class name for container
    calendarPosition?: 'top' | 'bottom' | 'left' | 'right';  // Calendar position relative to input
  };
  autocompleteStyle?: {  // For autocomplete type
    allowNew?: boolean;  // Whether to allow creating new tags
    allowBackspace?: boolean;  // Whether to allow deleting tags with backspace
    maxTags?: number;  // Maximum number of tags allowed
    minLength?: number;  // Minimum length of search text
    suggestionsFilter?: (suggestion: { label: string; value: unknown }, query: string) => boolean;  // Custom filter function for suggestions
    className?: string;  // Additional CSS class name for the autocomplete container
    tagClassName?: string;  // Additional CSS class name for tags
    suggestionsClassName?: string;  // Additional CSS class name for suggestions list
  };
  
  // For autoCompleteText type
  autoCompleteStyle?: {
    allowNew?: boolean;  // Whether to allow creating new/custom values
    maxTags?: number;   // Maximum number of tags allowed
    minLength?: number; // Minimum length of search text before showing options
    className?: string; // Additional CSS class name
  };
}

export interface FormField extends FormFieldMinimal {
  required?: boolean;
  disabled?: boolean;
  controlSize?: "sm" | "md" | "lg";
  // Add any additional field props here
  options?: Array<{ label: string; value: string | number }>;
  isMultiple?: boolean;
  dataRange?: {
    min?: number;
    max?: number;
  };
  dataStep?: number;
  dataSource?: {
    collectionName: string;
    labelField: string;
    valueField: string;
    filterQuery?: Record<string, unknown>;
    dependsOn?: string | string[];
    sortField?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    refreshInterval?: number;
    customLabel?: string;
  };
  icon?: any;
  placeholder?: string;
  autoCompleteStyle?: {
    className?: string;
    tagClassName?: string;
    suggestionsClassName?: string;
    allowNew?: boolean;
    allowBackspace?: boolean;
    minLength?: number;
    maxTags?: number;
    suggestionsFilter?: (
      suggestion: { label: string; value: string },
      query: string
    ) => boolean;
  };
  // Default value for the field
  defaultValue?: any;
  // Validator function
  validator?: (value: any) => string | null;
  // Mask function
  mask?: (value: any) => string;
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
    canGroupDelete?: boolean;
    canAdvancedSearch?: boolean;
    canSearchAllFields?: boolean;
  };
  rowActions?: RowAction[];
  layout?: LayoutSettings;
  // Event handlers
  onAfterAdd?: (newEntity: Entity) => void | Promise<void>;
  onAfterEdit?: (editedEntity: Entity) => void | Promise<void>;
  onAfterDelete?: (deletedId: string) => void | Promise<void>;
  onAfterGroupDelete?: (deletedIds: string[]) => void | Promise<void>;
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