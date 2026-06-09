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
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-normal text-[#2c3b42]">{title}</h3>
        <span className="text-xs font-medium uppercase tracking-normal text-[#7a8a90]">Users</span>
      </div>

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
              <span
                className="rounded-md bg-[#eef3f4] px-1.5 py-0.5 text-xs font-medium tabular-nums text-[#607077]"
                title={`${facet.count.toLocaleString()} users`}
              >
                {facet.count.toLocaleString()}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
};
