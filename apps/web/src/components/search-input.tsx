"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  queryParam?: string;
}

export function SearchInput({
  placeholder = "Search...",
  queryParam = "search",
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [inputValue, setInputValue] = useState(
    searchParams.get(queryParam) || "",
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(queryParam, value);
    } else {
      params.delete(queryParam);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative max-w-s mr-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        className="pl-8"
      />
    </div>
  );
}
