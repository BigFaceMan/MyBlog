import type { TaxonomyItem } from "@/types/blog";

export function flattenTaxonomy(items: TaxonomyItem[], depth = 0): TaxonomyItem[] {
  return items.flatMap((item) => {
    const current = {
      ...item,
      depth: item.depth ?? depth
    };

    return [current, ...flattenTaxonomy(item.children ?? [], current.depth + 1)];
  });
}

export function taxonomyOptionLabel(item: TaxonomyItem) {
  const prefix = item.depth ? `${"— ".repeat(item.depth)}` : "";

  return `${prefix}${item.name}`;
}
