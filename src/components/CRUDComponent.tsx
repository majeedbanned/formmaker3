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
  } = useCrud({ collectionName, connectionString });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
    setIsModalOpen(true);
  };

  const handleEdit = (entity: Entity) => {
    setEditingId(entity._id);
    window.__EDITING_ENTITY_DATA__ = entity.data;
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingId) {
        await updateEntity(editingId, data);
      } else {
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
    if (!deleteId) return;

    try {
      await deleteEntity(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleAdvancedSearch = (data: Record<string, unknown>) => {
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    setAdvancedSearch(cleanedData);
    setIsSearchModalOpen(false);
  };

  const clearAdvancedSearch = () => {
    setAdvancedSearch({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center gap-4">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAdvancedSearchClick={() => setIsSearchModalOpen(true)}
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Add New
          </button>
        </div>

        {Object.keys(advancedSearch).length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Advanced search filters applied (
              {Object.keys(advancedSearch).length})
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          sorting={sorting}
          setSorting={setSorting}
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formStructure={formStructure}
        editingId={editingId}
        loading={loading}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />

      <AdvancedSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSubmit={handleAdvancedSearch}
        onClear={clearAdvancedSearch}
        formStructure={formStructure}
      />
    </div>
  );
}
