"use client";

import { useCategories } from "@/hooks/use-categories";
import { useMapStore } from "@/stores/map-store";

export function CategoryChips() {
  const { data: categories } = useCategories();
  const activeCategorySlug = useMapStore((s) => s.activeCategorySlug);
  const setActiveCategorySlug = useMapStore((s) => s.setActiveCategorySlug);

  return (
    <div className="pointer-events-auto -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories?.map((category) => {
        const isActive = activeCategorySlug === category.slug;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategorySlug(isActive ? null : category.slug)}
            style={{ backgroundColor: category.color_hex }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-background shadow-sm transition-opacity ${
              isActive ? "ring-2 ring-foreground/60" : "opacity-80 hover:opacity-100"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
