import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { TableProps, Entity } from "../types/crud";
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function Table({
  entities,
  formStructure,
  onEdit,
  onDelete,
  sorting,
  setSorting,
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
  const columnHelper = createColumnHelper<Entity>();

  const columns = [
    ...formStructure
      .filter((field) => field.isShowInList)
      .map((field) =>
        columnHelper.accessor((row) => row.data[field.name] as string, {
          id: field.name,
          header: field.title,
          cell: (info) => {
            const value = info.getValue();
            const field = formStructure.find((f) => f.name === info.column.id);
            const style = field?.listLabelColor
              ? { color: field.listLabelColor }
              : {};

            if (typeof value === "boolean") {
              return (
                <span style={style} dir={layout.direction}>
                  {value ? "Yes" : "No"}
                </span>
              );
            }
            return (
              <span style={style} dir={layout.direction}>
                {String(value ?? "")}
              </span>
            );
          },
        })
      ),
    ...(onEdit || onDelete
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
    },
    onSortingChange: (updater) =>
      setSorting(updater instanceof Function ? updater(sorting) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      layout.direction === "rtl" ? "text-right" : "text-left"
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
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
