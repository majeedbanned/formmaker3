import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { SearchBarProps } from "../types/crud";

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onAdvancedSearchClick,
  layout = { direction: "ltr" },
}: SearchBarProps) {
  return (
    <div
      className={`flex justify-between items-center gap-4 ${
        layout.direction === "rtl" ? "flex-row-reverse" : ""
      }`}
    >
      <div className="relative flex-1 max-w-xs">
        <input
          type="text"
          placeholder="Search all fields..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${
            layout.direction === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
          } py-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500`}
          dir={layout.direction}
        />
        <MagnifyingGlassIcon
          className={`h-5 w-5 text-gray-400 absolute top-2.5 ${
            layout.direction === "rtl" ? "right-3" : "left-3"
          }`}
        />
      </div>
      <button
        onClick={onAdvancedSearchClick}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FunnelIcon
          className={`h-4 w-4 ${layout.direction === "rtl" ? "ml-2" : "mr-2"}`}
        />
        Advanced Search
      </button>
    </div>
  );
}
