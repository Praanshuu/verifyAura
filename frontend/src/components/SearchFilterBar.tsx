import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { ReactNode } from "react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  options: FilterOption[];
}

interface SearchFilterBarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  filters?: FilterConfig[];
  rightContent?: ReactNode;
}

export const SearchFilterBar = ({ search, filters = [], rightContent }: SearchFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
      {/* Search */}
      {search && (
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder || "Search..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      )}

      {/* Filters */}
      {filters.map((filter, index) => (
        <Select key={index} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Optional Right Content */}
      {rightContent && <div className="ml-auto">{rightContent}</div>}
    </div>
  );
};
