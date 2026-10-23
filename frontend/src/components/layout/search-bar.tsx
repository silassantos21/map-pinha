"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePoiSearch } from "@/hooks/use-poi-search";
import { useMapStore } from "@/stores/map-store";

interface SearchBarProps {
  userId?: string | null;
}

export function SearchBar({ userId }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const flyToPoi = useMapStore((s) => s.flyToPoi);

  const debouncedQuery = useDebouncedValue(inputValue, 300);
  const { data: results = [] } = usePoiSearch(debouncedQuery, userId);

  const showDropdown = isFocused && debouncedQuery.trim().length >= 2;

  return (
    <div className="relative min-w-0 flex-1">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          name="poi-search"
          id="poi-search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder="Buscar POIs..."
          className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {showDropdown && (
        <div className="pointer-events-auto absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum POI encontrado.</p>
          ) : (
            results.map((poi) => (
              <button
                key={poi.id}
                type="button"
                onClick={() => {
                  flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng });
                  setInputValue(poi.name);
                  setIsFocused(false);
                }}
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                <span className="text-sm text-foreground">{poi.name}</span>
                {poi.address && (
                  <span className="text-xs text-muted-foreground">{poi.address}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
