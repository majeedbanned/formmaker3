import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { TableProps, Entity, FormField, UploadedFile } from "../types/crud";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import Link from "next/link";
import { useState } from "react";
import { getFileIcon, formatFileSize } from "@/utils/fileUpload";

const formatNestedValue = (value: unknown, field: FormField): string => {
  if (!value) return "";

  if (field.nestedType === "array" && Array.isArray(value)) {
    return value
      .map((item) => {
        if (!field.fields) return "";
        return field.fields
          .map((nestedField: FormField) => {
            const nestedValue = item[nestedField.name];
            if (nestedField.type === "dropdown") {
              const option = nestedField.options?.find(
                (opt: { value: unknown; label: string }) =>
                  opt.value === nestedValue
              );
              return option ? option.label : nestedValue;
            }
            return nestedValue;
          })
          .filter(Boolean)
          .join(" - ");
      })
      .join(" | ");
  }

  if (typeof value === "object" && value !== null && field.fields) {
    return field.fields
      .map((nestedField: FormField) => {
        const nestedValue = (value as Record<string, unknown>)[
          nestedField.name
        ];
        if (nestedField.type === "dropdown") {
          const option = nestedField.options?.find(
            (opt: { value: unknown; label: string }) =>
              opt.value === nestedValue
          );
          return option ? option.label : nestedValue;
        }
        return nestedValue;
      })
      .filter(Boolean)
      .join(" - ");
  }

  return String(value);
};

const NestedValueDisplay = ({
  value,
  field,
  layout,
}: {
  value: unknown;
  field: FormField;
  layout: TableProps["layout"];
}) => {
  if (!field.fields) {
    return (
      <span dir={layout?.direction}>
        {typeof value === "boolean"
          ? value
            ? "Yes"
            : "No"
          : String(value ?? "")}
      </span>
    );
  }

  const formattedValue = formatNestedValue(value, field);
  const truncatedValue =
    formattedValue.length > 30
      ? formattedValue.substring(0, 30) + "..."
      : formattedValue;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span
          className="cursor-help border-b border-dotted border-muted-foreground"
          dir={layout?.direction}
        >
          {truncatedValue}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" dir={layout?.direction}>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{field.title}</h4>
          {field.nestedType === "array" && Array.isArray(value) ? (
            <div className="space-y-2">
              {value.map((item, index) => (
                <div key={index} className="text-sm space-y-1">
                  <div className="font-medium">Item {index + 1}</div>
                  {field.fields?.map((nestedField) => {
                    const nestedValue = item[nestedField.name];
                    const displayValue =
                      nestedField.type === "dropdown"
                        ? nestedField.options?.find(
                            (opt) => opt.value === nestedValue
                          )?.label
                        : nestedValue;
                    return (
                      <div
                        key={nestedField.name}
                        className="pl-2 text-muted-foreground"
                      >
                        <span className="font-medium">
                          {nestedField.title}:
                        </span>{" "}
                        {String(displayValue)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {field.fields?.map((nestedField) => {
                const nestedValue = (value as Record<string, unknown>)?.[
                  nestedField.name
                ];
                const displayValue =
                  nestedField.type === "dropdown"
                    ? nestedField.options?.find(
                        (opt) => opt.value === nestedValue
                      )?.label
                    : nestedValue;
                return (
                  <div
                    key={nestedField.name}
                    className="text-sm text-muted-foreground"
                  >
                    <span className="font-medium">{nestedField.title}:</span>{" "}
                    {String(displayValue)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const renderCellContent = (
  field: FormField | undefined,
  value: unknown,
  layout: TableProps["layout"]
) => {
  if (!value) return "-";
  if (!field) return String(value);

  switch (field.type) {
    case "file":
      if (field.isMultiple) {
        const files = value as UploadedFile[];
        return (
          <div className="flex flex-col gap-1">
            {files.map((file) => (
              <a
                key={file.filename}
                href={file.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <span>{getFileIcon(file.type)}</span>
                <span className="truncate max-w-xs">{file.originalName}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
              </a>
            ))}
          </div>
        );
      } else {
        const file = value as UploadedFile;
        return (
          <a
            href={file.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <span>{getFileIcon(file.type)}</span>
            <span className="truncate max-w-xs">{file.originalName}</span>
            <span className="text-xs text-gray-500">
              ({formatFileSize(file.size)})
            </span>
          </a>
        );
      }

    case "checkbox":
      if (field.isMultiple && Array.isArray(value)) {
        return value
          .map((v) => {
            const option = field.options?.find((opt) => opt.value === v);
            return option?.label || v;
          })
          .join(", ");
      }
      return value === true ? "Yes" : "No";

    case "dropdown":
    case "radio":
    case "togglegroup":
      if (field.isMultiple && Array.isArray(value)) {
        return value
          .map((v) => {
            const option = field.options?.find((opt) => opt.value === v);
            return option?.label || v;
          })
          .join(", ");
      }
      const option = field.options?.find((opt) => opt.value === value);
      return option?.label || value;

    case "datepicker":
      if (field.displayFormat) {
        return field.displayFormat(value as string | number | Date);
      }
      return String(value);

    case "switch":
      return value === true ? "Yes" : "No";

    case "autocomplete":
      if (field.isMultiple && Array.isArray(value)) {
        return value
          .map((v) => {
            const option = field.options?.find((opt) => opt.value === v);
            return option?.label || v;
          })
          .join(", ");
      }
      const autoOption = field.options?.find((opt) => opt.value === value);
      return autoOption?.label || value;

    default:
      if (field.fields) {
        return (
          <NestedValueDisplay value={value} field={field} layout={layout} />
        );
      }
      return String(value);
  }
};

export default function Table({
  entities,
  formStructure,
  onEdit,
  onDelete,
  onGroupDelete,
  sorting,
  setSorting,
  rowActions = [],
  canGroupDelete,
  layout = {
    direction: "ltr",
    texts: {
      actionsColumnTitle: "Actions",
      showEntriesText: "Show",
      pageText: "Page",
      ofText: "of",
    },
  },
}: TableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const columnHelper = createColumnHelper<Entity>();

  const columns = [
    ...(canGroupDelete
      ? [
          columnHelper.display({
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
          }),
        ]
      : []),
    ...formStructure
      .filter((field) => field.isShowInList)
      .map((field) =>
        columnHelper.accessor((row) => row.data[field.name] as unknown, {
          id: field.name,
          header: field.title,
          cell: (info) => {
            const value = info.getValue();
            const field = formStructure.find((f) => f.name === info.column.id);
            if (!field) return null;

            const style = field.listLabelColor
              ? { color: field.listLabelColor }
              : {};

            return (
              <div style={style}>
                <NestedValueDisplay
                  value={value}
                  field={field}
                  layout={layout}
                />
              </div>
            );
          },
        })
      ),
    ...(onEdit || onDelete || rowActions?.length
      ? [
          columnHelper.display({
            id: "actions",
            header: layout.texts?.actionsColumnTitle,
            cell: (props) => (
              <div
                className={`flex gap-2 ${
                  layout.direction === "rtl"
                    ? "justify-start flex-row-reverse"
                    : "justify-end"
                }`}
              >
                {onEdit && (
                  <Button
                    onClick={() => onEdit(props.row.original)}
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:text-blue-800"
                    title={layout.texts?.editButton}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={() => onDelete(props.row.original._id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-800"
                    title={layout.texts?.deleteButton}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
                {rowActions?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {rowActions.map((action, index) => (
                        <DropdownMenuItem key={index}>
                          {action.link ? (
                            <Link
                              href={`${action.link}?id=${props.row.original._id}`}
                              className="flex items-center gap-2 w-full"
                            >
                              {action.icon && (
                                <action.icon className="h-4 w-4" />
                              )}
                              {action.label}
                            </Link>
                          ) : (
                            <button
                              onClick={() =>
                                action.action?.(props.row.original._id)
                              }
                              className="flex items-center gap-2 w-full"
                            >
                              {action.icon && (
                                <action.icon className="h-4 w-4" />
                              )}
                              {action.label}
                            </button>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ),
          }),
        ]
      : []),
  ];

  const table = useReactTable({
    data: entities,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: canGroupDelete,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) =>
      setSorting(updater instanceof Function ? updater(sorting) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = Object.keys(rowSelection).length;

  return (
    <div>
      {canGroupDelete && selectedRows > 0 && (
        <div className="mb-4 flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedRows} {selectedRows === 1 ? "item" : "items"} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const selectedIds = table
                .getSelectedRowModel()
                .rows.map((row) => row.original._id);
              onGroupDelete?.(selectedIds);
            }}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <ShadcnTable dir={layout.direction}>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      layout.direction === "rtl" ? "text-right" : "text-left"
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        } ${
                          layout.direction === "rtl" ? "flex-row-reverse" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.column.id === "select" ? (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        ) : (
                          <>
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {{
                              asc: <ChevronUpIcon className="h-4 w-4" />,
                              desc: <ChevronDownIcon className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const field = formStructure.find(
                    (f) => f.name === cell.column.id
                  );
                  const value = cell.getValue();

                  if (
                    cell.column.id === "select" ||
                    cell.column.id === "actions"
                  ) {
                    return (
                      <TableCell
                        key={cell.id}
                        className={
                          layout.direction === "rtl"
                            ? "text-right"
                            : "text-left"
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={cell.id}
                      className={
                        layout.direction === "rtl" ? "text-right" : "text-left"
                      }
                    >
                      {field ? (
                        field.type === "file" || field.fields ? (
                          renderCellContent(field, value, layout)
                        ) : (
                          <NestedValueDisplay
                            value={value}
                            field={field}
                            layout={layout}
                          />
                        )
                      ) : (
                        String(value ?? "")
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      </div>

      <div
        className={`mt-4 flex items-center justify-between ${
          layout.direction === "rtl" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            layout.direction === "rtl" ? "flex-row-reverse" : ""
          }`}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {layout.direction === "rtl" ? ">>" : "<<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {layout.direction === "rtl" ? ">" : "<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {layout.direction === "rtl" ? "<" : ">"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {layout.direction === "rtl" ? "<<" : ">>"}
          </Button>
          <span
            className={`flex items-center gap-1 text-sm ${
              layout.direction === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            <div>{layout.texts?.pageText}</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} {layout.texts?.ofText}{" "}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {layout.texts?.showEntriesText} {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
