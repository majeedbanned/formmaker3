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

export interface FormField {
  name: string;
  title: string;
  type: string;
  required: boolean;
  defaultValue: unknown;
  validation?: FieldValidation;
  enabled: boolean;
  visible: boolean;
  readonly: boolean;
  isShowInList: boolean;
  isSearchable: boolean;
  listLabelColor?: string;
  options?: { label: string; value: unknown }[];
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
  canAdvancedSearch: boolean;
  canSearchAllFields: boolean;
}

export interface CRUDComponentProps {
  formStructure: FormField[];
  collectionName: string;
  connectionString: string;
  initialFilter?: Record<string, unknown>;
  permissions?: Permissions;  // Optional, defaults to all permissions enabled
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
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
}

export interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAdvancedSearchClick: () => void;
}

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  formStructure: FormField[];
  editingId: string | null;
  loading: boolean;
}

export interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  onClear: () => void;
  formStructure: FormField[];
  initialValues?: Record<string, unknown>;
} 