import { useState } from "react";
import { CRUDComponentProps, Entity } from "../types/crud";
import { useCrud } from "../hooks/useCrud";
import { Button } from "./ui/button";
import SearchBar from "./SearchBar";
import Table from "./Table";
import FormModal from "./FormModal";
import DeleteModal from "./DeleteModal";
import AdvancedSearchModal from "./AdvancedSearchModal";
import ImportModal from "./ImportModal";
import { toast } from "sonner";
// import { FileUpIcon } from "@heroicons/react/24/outline";

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
    canGroupDelete: true,
    canAdvancedSearch: true,
    canSearchAllFields: true,
  },
  importFunction,
  excelExport,
  rowActions = [],
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
      importButton: "Import Data",
      addModalTitle: "Add New Entry",
      editModalTitle: "Edit Entry",
      deleteModalTitle: "Delete Confirmation",
      advancedSearchModalTitle: "Advanced Search",
      importTitle: "Import Data",
      deleteConfirmationMessage:
        "Are you sure you want to delete this item? This action cannot be undone.",
      deleteConfirmationMessagePlural:
        "Are you sure you want to delete these items? This action cannot be undone.",
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
  onAfterAdd,
  onAfterEdit,
  onAfterDelete,
  onAfterGroupDelete,
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
  } = useCrud({
    collectionName,
    connectionString,
    initialFilter,
    formStructure,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Only show content if user has list permission
  if (!permissions.canList) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        You don&apos;t have permission to view this content.
      </div>
    );
  }

  const handleAdd = () => {
    if (!permissions.canAdd) return;
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
    setIsModalOpen(true);
  };

  const handleImport = () => {
    if (!permissions.canAdd || !importFunction?.active) return;
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = async (data: Record<string, unknown>[]) => {
    if (!permissions.canAdd || !importFunction?.active || data.length === 0)
      return;

    try {
      // Create entities for each imported item
      const createdEntities = await Promise.all(
        data.map(async (item) => {
          return await createEntity(item);
        })
      );

      // Call onAfterAdd for each entity if provided
      if (onAfterAdd) {
        createdEntities.forEach((entity) => {
          onAfterAdd(entity);
        });
      }

      setIsImportModalOpen(false);
    } catch (error) {
      throw error; // Let the ImportModal handle the error
    }
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
    setDeleteIds([]);
    setIsDeleteModalOpen(true);
  };

  const handleGroupDelete = (ids: string[]) => {
    if (!permissions.canGroupDelete) return;
    setDeleteIds(ids);
    setDeleteId(null);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      let entity: Entity;
      if (editingId) {
        if (!permissions.canEdit) return;
        entity = await updateEntity(editingId, data);

        onAfterEdit?.(entity);
      } else {
        if (!permissions.canAdd) return;
        entity = await createEntity(data);
        // console.log("entity", entity);
        // console.log("data", data);
        onAfterAdd?.(entity);
      }
      setIsModalOpen(false);
      setEditingId(null);
      window.__EDITING_ENTITY_DATA__ = undefined;
    } catch (error: Error | unknown) {
      try {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorData = JSON.parse(errorMessage);
        if (errorData.duplicateFields) {
          Object.entries(errorData.duplicateFields).forEach(
            ([field, message]) => {
              const fieldTitle =
                formStructure.find((f) => f.name === field)?.title || field;
              toast.error(fieldTitle, {
                description: message as string,
                duration: 5000,
              });
            }
          );
        } else {
          toast.error("خطا", {
            description: errorMessage,
            duration: 5000,
          });
        }
      } catch {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error("خطا", {
          description: errorMessage,
          duration: 5000,
        });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!permissions.canDelete && !permissions.canGroupDelete) return;

    try {
      if (deleteId) {
        const deletedEntity = await deleteEntity(deleteId);
        if (onAfterDelete) {
          onAfterDelete(deletedEntity);
        }
      } else if (deleteIds.length > 0) {
        const deletedEntities = await Promise.all(
          deleteIds.map(async (id) => {
            return await deleteEntity(id);
          })
        );
        if (onAfterGroupDelete) {
          onAfterGroupDelete(deletedEntities);
        }
      }
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setDeleteIds([]);
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

  const exportToExcel = async () => {
    if (!excelExport?.enabled || entities.length === 0) return;

    try {
      // Dynamically import ExcelJS (only when needed)
      const ExcelJS = (await import("exceljs")).default;

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FormMaker";
      workbook.lastModifiedBy = "FormMaker CRUD";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add a worksheet
      const worksheet = workbook.addWorksheet(
        excelExport.sheetName || collectionName
      );

      // Set RTL direction for the worksheet
      worksheet.views = [{ rightToLeft: layout.direction === "rtl" }];

      // Define headers - use Farsi titles from formStructure
      const headers: string[] = [];
      const fieldKeys: string[] = [];

      // Add row number column
      headers.push("ردیف");
      fieldKeys.push("__rowNumber");

      // Add headers for all fields (not just visible ones), excluding image fields
      formStructure
        .filter((field) => field.type !== "file" || !field.fileConfig?.allowedTypes?.some(type => type.startsWith("image/")))
        .forEach((field) => {
          headers.push(field.title); // Use Farsi title
          fieldKeys.push(field.name);
        });

      // Add headers to worksheet
      const headerRow = worksheet.addRow(headers);

      // Style the header row
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add data rows
      entities.forEach((entity, index) => {
        const row: (string | number | boolean)[] = [];

        // Add row number
        row.push(index + 1);

        // Add field values for all fields, excluding image fields
        formStructure
          .filter((field) => field.type !== "file" || !field.fileConfig?.allowedTypes?.some(type => type.startsWith("image/")))
          .forEach((field) => {
            const value = entity.data[field.name];

            if (field.type === "dropdown" && field.options) {
              // For dropdown fields, show the label instead of value
              const option = field.options.find((opt) => opt.value === value);
              row.push(option ? option.label : String(value || ""));
            } else if (field.type === "checkbox" || field.type === "switch") {
              // For boolean fields, show Yes/No in Farsi
              row.push(value ? "بله" : "خیر");
            } else if (field.type === "datepicker" && value) {
              // For date fields, show as plain string (as stored in database)
              row.push(String(value));
            } else if (Array.isArray(value)) {
              // For array values, handle objects in simple delimited format
              if (value.length === 0) {
                row.push("");
              } else if (typeof value[0] === "object" && value[0] !== null) {
                // Array of objects - format as simple delimited strings
                try {
                  const formattedItems = value.map((item, index) => {
                    if (typeof item === "object" && item !== null) {
                      // Convert object to key:value pairs
                      const pairs = Object.entries(item)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(", ");
                      return `[${index + 1}] ${pairs}`;
                    }
                    return String(item);
                  });
                  row.push(formattedItems.join(" | "));
                } catch (error) {
                  row.push(String(value));
                }
              } else {
                // Array of simple values - join them
                row.push(value.join(", "));
              }
            } else if (typeof value === "object" && value !== null) {
              // For object values, show as formatted JSON for readability
              try {
                row.push(JSON.stringify(value, null, 2));
              } catch (error) {
                // Fallback if JSON.stringify fails
                row.push(String(value));
              }
            } else {
              // For simple values
              row.push(String(value || ""));
            }
          });

        const addedRow = worksheet.addRow(row);
        
        // Apply text wrapping only for cells that contain JSON objects (not arrays)
        addedRow.eachCell((cell, colNumber) => {
          if (cell.value && typeof cell.value === 'string' && 
              cell.value.includes('{') && !cell.value.includes('|')) {
            cell.alignment = { 
              wrapText: true, 
              vertical: 'top',
              horizontal: 'left' 
            };
          }
        });
      });

      // Auto-fit columns with special handling for JSON content
      worksheet.columns.forEach((column, index) => {
        if (column.header) {
          let maxWidth = Math.max(15, String(column.header).length + 5);
          
          // Check if this column might contain JSON objects by sampling first few rows
          const sampleRows = Math.min(5, entities.length);
          for (let rowIndex = 0; rowIndex < sampleRows; rowIndex++) {
            const cellValue = worksheet.getCell(rowIndex + 2, index + 1).value; // +2 for header row, +1 for 1-based indexing
            if (cellValue && typeof cellValue === 'string' && 
                (cellValue.includes('{') || cellValue.includes('|'))) {
              // Likely complex content, set wider column
              maxWidth = Math.max(maxWidth, 50);
              break;
            }
          }
          
          column.width = Math.min(maxWidth, 100); // Cap at 100 to prevent extremely wide columns
        }
      });

      // Generate the Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Create a Blob from the buffer
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheet.sheet",
      });

      // Create a download link and trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download =
        excelExport.filename ||
        `${collectionName}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("صدور فایل موفقیت‌آمیز بود", {
        description: "فایل اکسل با موفقیت ایجاد شد.",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("خطا در صدور فایل", {
        description: "مشکلی در ایجاد فایل اکسل رخ داد.",
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    window.__EDITING_ENTITY_DATA__ = undefined;
  };

  return (
    <div
      className={`mx-auto p-0 ${layout.direction === "rtl" ? "rtl" : "ltr"}`}
      style={{ maxWidth: layout.width }}
      dir={layout.direction}
    >
      {/* {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )} */}

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
          <div className="flex gap-2">
            {excelExport?.enabled && entities.length > 0 && (
              <Button
                onClick={exportToExcel}
                variant="outline"
                className="flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 5a2 2 0 012-2h6.586A2 2 0 0113 3.586L15.414 6A2 2 0 0116 7.414V9a1 1 0 11-2 0V8h-2a2 2 0 01-2-2V4H5v8a1 1 0 11-2 0V5z"
                    clipRule="evenodd"
                  />
                </svg>
                {excelExport.buttonText || "صدور اکسل"}
              </Button>
            )}
            {importFunction?.active && permissions.canAdd && (
              <Button
                onClick={handleImport}
                variant="outline"
                className="flex items-center gap-1"
              >
                {/* <FileUpIcon className="h-4 w-4" /> */}
                {layout.texts?.importButton || "Import"}
              </Button>
            )}
            {permissions.canAdd && (
              <Button onClick={handleAdd}>{layout.texts?.addButton}</Button>
            )}
          </div>
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
          onGroupDelete={
            permissions.canGroupDelete ? handleGroupDelete : undefined
          }
          sorting={sorting}
          setSorting={setSorting}
          rowActions={rowActions}
          canGroupDelete={permissions.canGroupDelete}
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
          collectionName={collectionName}
        />
      )}

      {(permissions.canDelete || permissions.canGroupDelete) && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            setDeleteIds([]);
          }}
          onConfirm={handleConfirmDelete}
          loading={loading}
          itemCount={deleteIds.length || (deleteId ? 1 : 0)}
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

      {importFunction?.active && permissions.canAdd && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportSubmit}
          config={importFunction}
          loading={loading}
          layout={layout}
        />
      )}
    </div>
  );
}
