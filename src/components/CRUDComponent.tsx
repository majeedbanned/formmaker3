import { useState } from "react";
import { CRUDComponentProps, Entity } from "../types/crud";
import { useCrud } from "../hooks/useCrud";
import { Button } from "./ui/button";
import SearchBar from "./SearchBar";
import Table from "./Table";
import FormModal from "./FormModal";
import DeleteModal from "./DeleteModal";
import AdvancedSearchModal from "./AdvancedSearchModal";

export default function CRUDComponent({
  formStructure,
  collectionName,
  connectionString,
  initialFilter,
  permissions = {
    canList: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canAdvancedSearch: true,
    canSearchAllFields: true,
  },
  layout = {
    direction: "ltr",
    width: "100%",
    texts: {
      addButton: "Add New",
      editButton: "Edit",
      deleteButton: "Delete",
      cancelButton: "Cancel",
      clearButton: "Clear",
      searchButton: "Search",
      advancedSearchButton: "Advanced Search",
      applyFiltersButton: "Apply Filters",
      addModalTitle: "Add New Entry",
      editModalTitle: "Edit Entry",
      deleteModalTitle: "Delete Confirmation",
      advancedSearchModalTitle: "Advanced Search",
      deleteConfirmationMessage:
        "Are you sure you want to delete this item? This action cannot be undone.",
      noResultsMessage: "No results found",
      loadingMessage: "Loading...",
      processingMessage: "Processing...",
      actionsColumnTitle: "Actions",
      showEntriesText: "Show",
      pageText: "Page",
      ofText: "of",
      searchPlaceholder: "Search all fields...",
      selectPlaceholder: "Select an option",
      filtersAppliedText: "Advanced search filters applied",
      clearFiltersText: "Clear filters",
    },
  },
}: CRUDComponentProps) {
  const {
    entities,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    advancedSearch,
    setAdvancedSearch,
    sorting,
    setSorting,
    createEntity,
    updateEntity,
    deleteEntity,
  } = useCrud({ collectionName, connectionString, initialFilter });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Only show content if user has list permission
  if (!permissions.canList) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        You don't have permission to view this content.
      </div>
    );
  }

  const handleAdd = () => {
    if (!permissions.canAdd) return;
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
    setIsModalOpen(true);
  };

  const handleEdit = (entity: Entity) => {
    if (!permissions.canEdit) return;
    setEditingId(entity._id);
    window.__EDITING_ENTITY_DATA__ = entity.data;
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!permissions.canDelete) return;
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingId) {
        if (!permissions.canEdit) return;
        await updateEntity(editingId, data);
      } else {
        if (!permissions.canAdd) return;
        await createEntity(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
      window.__EDITING_ENTITY_DATA__ = undefined;
    } catch {
      // Error is handled by the hook
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || !permissions.canDelete) return;

    try {
      await deleteEntity(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleAdvancedSearch = (data: Record<string, unknown>) => {
    if (!permissions.canAdvancedSearch) return;
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    setAdvancedSearch({ ...initialFilter, ...cleanedData });
    setIsSearchModalOpen(false);
  };

  const clearAdvancedSearch = () => {
    if (!permissions.canAdvancedSearch) return;
    setAdvancedSearch(initialFilter || {});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
  };

  return (
    <div
      className={`mx-auto p-6 ${layout.direction === "rtl" ? "rtl" : "ltr"}`}
      style={{ maxWidth: layout.width }}
      dir={layout.direction}
    >
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div
          className={`flex justify-between items-center gap-4 ${
            layout.direction === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          {permissions.canSearchAllFields && (
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdvancedSearchClick={() =>
                permissions.canAdvancedSearch && setIsSearchModalOpen(true)
              }
              layout={layout}
            />
          )}
          {permissions.canAdd && (
            <Button onClick={handleAdd}>{layout.texts?.addButton}</Button>
          )}
        </div>

        {permissions.canAdvancedSearch &&
          Object.keys(advancedSearch).length >
            Object.keys(initialFilter || {}).length && (
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {layout.texts?.filtersAppliedText} (
                {Object.keys(advancedSearch).length -
                  Object.keys(initialFilter || {}).length}
                )
              </div>
              <Button
                onClick={clearAdvancedSearch}
                variant="ghost"
                className="text-sm text-destructive hover:text-destructive/80"
              >
                {layout.texts?.clearFiltersText}
              </Button>
            </div>
          )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <div className="mt-2 text-muted-foreground">
              {layout.texts?.loadingMessage}
            </div>
          </div>
        )}
      </div>

      {!loading && entities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {layout.texts?.noResultsMessage}
        </div>
      ) : (
        <Table
          entities={entities}
          formStructure={formStructure}
          onEdit={permissions.canEdit ? handleEdit : undefined}
          onDelete={permissions.canDelete ? handleDelete : undefined}
          sorting={sorting}
          setSorting={setSorting}
          layout={layout}
        />
      )}

      {(permissions.canAdd || permissions.canEdit) && (
        <FormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          formStructure={formStructure}
          editingId={editingId}
          loading={loading}
          layout={layout}
        />
      )}

      {permissions.canDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          loading={loading}
          layout={layout}
        />
      )}

      {permissions.canAdvancedSearch && (
        <AdvancedSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSubmit={handleAdvancedSearch}
          onClear={clearAdvancedSearch}
          formStructure={formStructure}
          initialValues={advancedSearch}
          layout={layout}
        />
      )}
    </div>
  );
}
