import { useState } from "react";
import { CRUDComponentProps, Entity } from "../types/crud";
import { useCrud } from "../hooks/useCrud";
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
      className={`max-w-4xl mx-auto p-6 ${
        layout.direction === "rtl" ? "rtl" : "ltr"
      }`}
      dir={layout.direction}
    >
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
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
            <button
              onClick={handleAdd}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add New
            </button>
          )}
        </div>

        {permissions.canAdvancedSearch &&
          Object.keys(advancedSearch).length >
            Object.keys(initialFilter || {}).length && (
            <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Advanced search filters applied (
                {Object.keys(advancedSearch).length -
                  Object.keys(initialFilter || {}).length}
                )
              </div>
              <button
                onClick={clearAdvancedSearch}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear filters
              </button>
            </div>
          )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {!loading && entities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No results found</div>
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
