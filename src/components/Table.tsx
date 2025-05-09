import React from "react";
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
  EyeIcon,
  CheckIcon,
  XMarkIcon,
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
import { Badge } from "./ui/badge";

const formatNestedValue = (value: unknown, field: FormField): string => {
  if (!value) return "";

  if (field.nestedType === "array" && Array.isArray(value)) {
    return value
      .map((item) => {
        if (!field.fields) return "";
        return field.fields
          .map((nestedField: FormField) => {
            const nestedValue = item[nestedField.name];

            // Handle different field types
            if (nestedField.type === "dropdown") {
              const option = nestedField.options?.find(
                (opt: { value: unknown; label: string }) =>
                  opt.value === nestedValue
              );
              return option ? option.label : nestedValue;
            } else if (nestedField.type === "autoCompleteText") {
              // Handle autoCompleteText fields
              if (Array.isArray(nestedValue)) {
                return nestedValue
                  .map((item: unknown) => {
                    if (
                      typeof item === "object" &&
                      item !== null &&
                      "label" in item
                    ) {
                      return String((item as { label: string }).label);
                    }
                    return String(item);
                  })
                  .join(" / ");
              } else if (
                typeof nestedValue === "object" &&
                nestedValue !== null &&
                "label" in nestedValue
              ) {
                return String((nestedValue as { label: string }).label);
              }
            } else if (nestedField.type === "shadcnmultiselect") {
              // Handle shadcnmultiselect fields
              if (Array.isArray(nestedValue)) {
                return nestedValue
                  .map((item: unknown) => {
                    if (
                      typeof item === "object" &&
                      item !== null &&
                      "label" in item
                    ) {
                      return String((item as { label: string }).label);
                    }
                    return String(item);
                  })
                  .join(", ");
              } else if (
                typeof nestedValue === "object" &&
                nestedValue !== null &&
                "label" in nestedValue
              ) {
                return String((nestedValue as { label: string }).label);
              }
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

        // Handle different field types
        if (nestedField.type === "dropdown") {
          const option = nestedField.options?.find(
            (opt: { value: unknown; label: string }) =>
              opt.value === nestedValue
          );
          return option ? option.label : nestedValue;
        } else if (nestedField.type === "autoCompleteText") {
          // Handle autoCompleteText fields
          if (Array.isArray(nestedValue)) {
            return nestedValue
              .map((item: unknown) => {
                if (
                  typeof item === "object" &&
                  item !== null &&
                  "label" in item
                ) {
                  return String((item as { label: string }).label);
                }
                return String(item);
              })
              .join(" / ");
          } else if (
            typeof nestedValue === "object" &&
            nestedValue !== null &&
            "label" in nestedValue
          ) {
            return String((nestedValue as { label: string }).label);
          }
        } else if (nestedField.type === "shadcnmultiselect") {
          // Handle shadcnmultiselect fields
          if (Array.isArray(nestedValue)) {
            return nestedValue
              .map((item: unknown) => {
                if (
                  typeof item === "object" &&
                  item !== null &&
                  "label" in item
                ) {
                  return String((item as { label: string }).label);
                }
                return String(item);
              })
              .join(", ");
          } else if (
            typeof nestedValue === "object" &&
            nestedValue !== null &&
            "label" in nestedValue
          ) {
            return String((nestedValue as { label: string }).label);
          }
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
}): React.ReactElement => {
  if (!field.fields) {
    // Handle shadcnmultiselect fields - display comma-separated labels
    if (field.type === "shadcnmultiselect") {
      if (Array.isArray(value)) {
        return (
          <Badge variant="outline">
            <span dir={layout?.direction}>
              {value
                .map((item) =>
                  typeof item === "object" && item !== null && "label" in item
                    ? String(item.label)
                    : String(item)
                )
                .join(", ")}
            </span>
          </Badge>
        );
      } else if (
        typeof value === "object" &&
        value !== null &&
        "label" in value
      ) {
        return (
          <Badge variant="outline">
            <span dir={layout?.direction}>{String(value.label)}</span>
          </Badge>
        );
      }
      return (
        <Badge variant="outline">
          <span dir={layout?.direction}>{String(value)}</span>
        </Badge>
      );
    }

    // Handle autoCompleteText fields specifically - display with slash separator
    if (field.type === "autoCompleteText") {
      if (Array.isArray(value)) {
        return (
          <Badge variant="outline">
            <span dir={layout?.direction}>
              {value
                .map((item) =>
                  typeof item === "object" && item !== null && "label" in item
                    ? String(item.label)
                    : String(item)
                )
                .join(" / ")}
            </span>
          </Badge>
        );
      } else if (
        typeof value === "object" &&
        value !== null &&
        "label" in value
      ) {
        return <span dir={layout?.direction}>{String(value.label)}</span>;
      }
      return <span dir={layout?.direction}>{String(value)}</span>;
    }

    // Handle dropdown fields
    if (field.type === "dropdown") {
      if (field.isMultiple && Array.isArray(value)) {
        return (
          <span dir={layout?.direction}>
            {value
              .map((v) => {
                const option = field.options?.find((opt) => opt.value === v);
                return option?.label || String(v);
              })
              .join(", ")}
          </span>
        );
      }
      const option = field.options?.find((opt) => opt.value === value);
      return (
        <span dir={layout?.direction}>{option?.label || String(value)}</span>
      );
    }

    // Handle other field types
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

                    let displayValue;

                    // Handle different field types appropriately
                    if (nestedField.type === "dropdown") {
                      // For dropdown fields, look up the label from options
                      const option = nestedField.options?.find(
                        (opt) => opt.value === nestedValue
                      );
                      displayValue = option ? option.label : nestedValue;
                    } else if (nestedField.type === "autoCompleteText") {
                      // For autoCompleteText fields, extract labels
                      if (Array.isArray(nestedValue)) {
                        // Handle array of items
                        displayValue = nestedValue
                          .map((item) => {
                            if (
                              typeof item === "object" &&
                              item !== null &&
                              "label" in item
                            ) {
                              return String(item.label);
                            }
                            return String(item);
                          })
                          .join(" / ");
                      } else if (
                        typeof nestedValue === "object" &&
                        nestedValue !== null &&
                        "label" in nestedValue
                      ) {
                        // Handle single object with label
                        displayValue = String(nestedValue.label);
                      } else {
                        // Fallback
                        displayValue = nestedValue;
                      }
                    } else if (nestedField.type === "shadcnmultiselect") {
                      // For shadcnmultiselect fields, extract labels
                      if (Array.isArray(nestedValue)) {
                        // Handle array of items
                        displayValue = nestedValue
                          .map((item) => {
                            if (
                              typeof item === "object" &&
                              item !== null &&
                              "label" in item
                            ) {
                              return String(item.label);
                            }
                            return String(item);
                          })
                          .join(", ");
                      } else if (
                        typeof nestedValue === "object" &&
                        nestedValue !== null &&
                        "label" in nestedValue
                      ) {
                        // Handle single object with label
                        displayValue = String(nestedValue.label);
                      } else {
                        // Fallback
                        displayValue = nestedValue;
                      }
                    } else {
                      // Default handling for other field types
                      displayValue = nestedValue;
                    }

                    return (
                      <div
                        key={nestedField.name}
                        className="pl-2 text-muted-foreground"
                      >
                        <span className="font-medium">
                          {nestedField.title}:
                        </span>{" "}
                        {String(displayValue !== undefined ? displayValue : "")}
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

                let displayValue;

                // Handle different field types appropriately
                if (nestedField.type === "dropdown") {
                  // For dropdown fields, look up the label from options
                  const option = nestedField.options?.find(
                    (opt) => opt.value === nestedValue
                  );
                  displayValue = option ? option.label : nestedValue;
                } else if (nestedField.type === "autoCompleteText") {
                  // For autoCompleteText fields, extract labels
                  if (Array.isArray(nestedValue)) {
                    // Handle array of items
                    displayValue = nestedValue
                      .map((item) => {
                        if (
                          typeof item === "object" &&
                          item !== null &&
                          "label" in item
                        ) {
                          return String(item.label);
                        }
                        return String(item);
                      })
                      .join(" / ");
                  } else if (
                    typeof nestedValue === "object" &&
                    nestedValue !== null &&
                    "label" in nestedValue
                  ) {
                    // Handle single object with label
                    displayValue = String(nestedValue.label);
                  } else {
                    // Fallback
                    displayValue = nestedValue;
                  }
                } else if (nestedField.type === "shadcnmultiselect") {
                  // For shadcnmultiselect fields, extract labels
                  if (Array.isArray(nestedValue)) {
                    // Handle array of items
                    displayValue = nestedValue
                      .map((item) => {
                        if (
                          typeof item === "object" &&
                          item !== null &&
                          "label" in item
                        ) {
                          return String(item.label);
                        }
                        return String(item);
                      })
                      .join(", ");
                  } else if (
                    typeof nestedValue === "object" &&
                    nestedValue !== null &&
                    "label" in nestedValue
                  ) {
                    // Handle single object with label
                    displayValue = String(nestedValue.label);
                  } else {
                    // Fallback
                    displayValue = nestedValue;
                  }
                } else {
                  // Default handling for other field types
                  displayValue = nestedValue;
                }

                return (
                  <div
                    key={nestedField.name}
                    className="text-sm text-muted-foreground"
                  >
                    <span className="font-medium">{nestedField.title}:</span>{" "}
                    {String(displayValue !== undefined ? displayValue : "")}
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
): React.ReactNode => {
  //return;
  if (!value) return <span></span>;
  if (!field) return <span>{String(value)}</span>;
  //console.log("value", field.type);
  // Handle special field types
  switch (field.type) {
    case "file":
      if (field.isMultiple) {
        const files = value as UploadedFile[];
        console.log("filesx", files);
        return (
          <HoverCard>
            <HoverCardTrigger>
              <button
                type="button"
                className="flex items-center gap-2 cursor-help"
              >
                <span>{files?.length} فایل</span>
                <span className="text-xs text-gray-500">
                  {/* (برای مشاهده جزئیات کلیک کنید) */}
                  <EyeIcon className="w-4 h-4" />
                </span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold"> فایل ها</h4>
                <div className="flex flex-col gap-2">
                  {files.map((file) => (
                    <a
                      key={file.filename}
                      href={file.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline p-1 rounded-sm hover:bg-accent"
                    >
                      <span>{getFileIcon(file.type)}</span>
                      <span className="flex-1 truncate">
                        {file.originalName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      } else {
        // Handle single file
        const file = value as UploadedFile;
        if (!file) return <span></span>;

        // Check if the file is an image
        const isImage = file.type && file.type.startsWith("image/");

        return (
          <HoverCard>
            <HoverCardTrigger>
              <a
                href={file.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {isImage ? (
                  <img
                    src={file.path}
                    alt={file.originalName}
                    className="h-8 w-8 object-cover rounded-sm"
                  />
                ) : (
                  <span>{getFileIcon(file.type)}</span>
                )}
                {/* <span className="truncate max-w-[150px]">
                  {file.originalName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span> */}
              </a>
            </HoverCardTrigger>
            {isImage && (
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <img
                    src={file.path}
                    alt={file.originalName}
                    className="w-full h-auto object-contain rounded-md"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    {file.originalName}
                  </p>
                </div>
              </HoverCardContent>
            )}
          </HoverCard>
        );
      }

    case "checkbox":
      if (field.isMultiple && Array.isArray(value)) {
        //  console.log("valuex", value);
        return (
          <span>
            {value
              .map((v) => {
                const option = field.options?.find((opt) => opt.value === v);
                return option?.label || v;
              })
              .join(", ")}
          </span>
        );
      }
      // console.log("valuey", value);
      return (
        <span className="flex justify-center">
          {value === true ? (
            <CheckIcon className="h-5 w-5 text-green-600" />
          ) : (
            <XMarkIcon className="h-5 w-5 text-red-600" />
          )}
        </span>
      );

    case "dropdown":
      if (field.isMultiple && Array.isArray(value)) {
        return (
          <span>
            {value
              .map((v) => {
                const option = field.options?.find((opt) => opt.value === v);
                return option?.label || String(v);
              })
              .join(", ")}
          </span>
        );
      }
      const option = field.options?.find((opt) => opt.value === value);
      return <span>{option?.label || String(value)}</span>;

    case "radio":
    case "togglegroup":
      if (field.isMultiple && Array.isArray(value)) {
        return (
          <span>
            {value
              .map((v) => {
                const option = field.options?.find((opt) => opt.value === v);
                return option?.label || v;
              })
              .join(", ")}
          </span>
        );
      }
      const radioOption = field.options?.find((opt) => opt.value === value);
      return <span>{radioOption?.label || String(value)}</span>;

    case "datepicker":
      if (field.displayFormat) {
        return (
          <span>{field.displayFormat(value as string | number | Date)}</span>
        );
      }
      return <span>{String(value)}</span>;

    case "switch":
      return <span>{value === true ? "Yes" : "No"}</span>;

    case "autocomplete":
      if (field.isMultiple && Array.isArray(value)) {
        return (
          <span>
            {value
              .map((v) => {
                const option = field.options?.find((opt) => opt.value === v);
                return option?.label || v;
              })
              .join(", ")}
          </span>
        );
      }
      const autoOption = field.options?.find((opt) => opt.value === value);
      return <span>{autoOption?.label || String(value)}</span>;

    case "richtextbox":
      // For rich text, strip HTML tags and truncate text for display
      const htmlString = String(value);
      const plainText = htmlString
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const truncatedText =
        plainText.length > 80 ? plainText.substring(0, 5) + "..." : plainText;

      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="cursor-help" title={plainText}>
              {truncatedText}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 max-h-72 overflow-y-auto">
            <div
              className="prose prose-sm"
              dangerouslySetInnerHTML={{ __html: htmlString }}
            />
          </HoverCardContent>
        </HoverCard>
      );

    case "shadcnmultiselect":
      return renderMultiValue(value);

    case "autoCompleteText":
      // Format autoCompleteText fields with labels separated by slashes
      if (Array.isArray(value)) {
        // For array values, extract and join labels with slash separator
        const formattedLabels = value
          .map((item) => {
            if (typeof item === "object" && item !== null && "label" in item) {
              return String(item.label);
            }
            return String(item);
          })
          .join(" / ");
        return formattedLabels;
      } else if (
        typeof value === "object" &&
        value !== null &&
        "label" in value
      ) {
        // For single object values with label property
        return String(value.label);
      }
      // Fallback for other value types
      return String(value);

    default:
      if (field.fields) {
        return (
          <NestedValueDisplay value={value} field={field} layout={layout} />
        );
      }
      return (
        <Badge variant="outline">
          <span>{String(value)}</span>
        </Badge>
      );
  }
};

const renderMultiValue = (value: unknown): React.ReactNode => {
  if (!value) return "-";

  // For array values, extract just the labels and display as comma-separated list
  if (Array.isArray(value)) {
    const labels = value
      .map((item) =>
        typeof item === "object" && item !== null && "label" in item
          ? String(item.label)
          : String(item)
      )
      .join(", ");

    return (
      <Badge variant="outline">
        <span>{labels}</span>
      </Badge>
    );
  }

  // For single value objects with label property
  if (typeof value === "object" && value !== null && "label" in value) {
    return <span>{String(value.label)}</span>;
  }

  // Fallback for simple values
  return <span>{String(value)}</span>;
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
                className="mr-4"
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                className="mr-4"
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            ),
          }),
        ]
      : []),

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
                          layout.direction === "rtl"
                            ? "flex-row"
                            : "flex-row-reverse"
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
                        field.type === "file" ||
                        field.type === "shadcnmultiselect" ||
                        field.type === "richtextbox" ||
                        field.type === "checkbox" ||
                        field.fields ? (
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
