import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { SearchBarProps } from "../types/crud";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onAdvancedSearchClick,
  layout = {
    direction: "ltr",
    texts: {
      searchPlaceholder: "Search all fields...",
      advancedSearchButton: "Advanced Search",
    },
  },
}: SearchBarProps) {
  return (
    <div
      className={`flex justify-between items-center gap-4 ${
        layout.direction === "rtl" ? "flex-row-reverse" : ""
      }`}
    >
      <div className="relative flex-1 max-w-xs">
        <Input
          type="text"
          placeholder={layout.texts?.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${
            layout.direction === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
          }`}
          dir={layout.direction}
        />
        <MagnifyingGlassIcon
          className={`h-5 w-5 text-muted-foreground absolute top-2.5 ${
            layout.direction === "rtl" ? "right-3" : "left-3"
          }`}
        />
      </div>
      <Button
        onClick={onAdvancedSearchClick}
        variant="outline"
        className="gap-2"
      >
        <FunnelIcon className="h-4 w-4" />
        {layout.texts?.advancedSearchButton}
      </Button>
    </div>
  );
}
