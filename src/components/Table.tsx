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

export default function Table({
  entities,
  formStructure,
  onEdit,
  onDelete,
  sorting,
  setSorting,
  layout = { direction: "ltr" },
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
            header: "Actions",
            cell: (props) => (
              <div
                className={`flex space-x-2 ${
                  layout.direction === "rtl"
                    ? "justify-start flex-row-reverse"
                    : "justify-end"
                }`}
              >
                {onEdit && (
                  <button
                    onClick={() => onEdit(props.row.original)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(props.row.original._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
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
    <>
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200"
          dir={layout.direction}
        >
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-${
                      layout.direction === "rtl" ? "right" : "left"
                    } text-xs font-medium text-gray-500 uppercase tracking-wider`}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center space-x-1 ${
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
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${
                      layout.direction === "rtl" ? "right" : "left"
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {layout.direction === "rtl" ? ">>" : "<<"}
          </button>
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {layout.direction === "rtl" ? ">" : "<"}
          </button>
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {layout.direction === "rtl" ? "<" : ">"}
          </button>
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {layout.direction === "rtl" ? "<<" : ">>"}
          </button>
          <span
            className={`flex items-center gap-1 text-sm ${
              layout.direction === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </strong>
          </span>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="px-3 py-1 border rounded text-sm"
          dir={layout.direction}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
