import type { Facet } from "../types";

type FacetSectionProps = {
  title: string;
  facets: Facet[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

const mergeSelectedFacets = (facets: Facet[], selectedValues: string[]) => {
  const facetMap = new Map(facets.map((facet) => [facet.value, facet]));

  return [
    ...selectedValues
      .filter((value) => !facetMap.has(value))
      .map((value) => ({
        value,
        count: 0,
      })),
    ...facets,
  ];
};

export const FacetSection = ({ title, facets, selectedValues, onToggle }: FacetSectionProps) => {
  const items = mergeSelectedFacets(facets, selectedValues);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold tracking-normal text-[#2c3b42]">{title}</h3>

      <div className="space-y-1.5">
        {items.map((facet) => {
          const checked = selectedValues.includes(facet.value);

          return (
            <label
              key={facet.value}
              className="grid cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#253238] transition hover:bg-[#edf4f1]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(facet.value)}
                className="h-4 w-4 accent-[#1b7f6b]"
              />
              <span className="min-w-0 truncate">{facet.value}</span>
              <span className="text-xs tabular-nums text-[#66757a]">{facet.count}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
};
