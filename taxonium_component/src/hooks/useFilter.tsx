import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type {
  FilterState,
  FilterSpec,
  FilterResults,
  FilterBackendResult,
  FilterResultItem,
  FilterControllerEntry,
} from "../types/filter";
import type { QueryBounds, Config, Backend } from "../types/backend";
import type { Query } from "../types/query";
import { getDefaultSearch } from "../utils/searchUtil";
import getDefaultQuery from "../utils/getDefaultQuery";
const default_query = getDefaultQuery();

interface UseFilterParams {
  config: Config;
  boundsForQueries: QueryBounds | null;
  backend: Backend;
  query: Query;
  updateQuery: (q: Partial<Query>) => void;
}

const useFilter = ({
  config,
  boundsForQueries,
  backend,
  query,
  updateQuery,
}: UseFilterParams): FilterState => {
  const { singleSearch } = backend;

  const [inflightFilters, setInflightFilters] = useState<string[]>([]);

  const [filterControllers, setFilterControllers] = useState<
    Record<string, FilterControllerEntry[]>
  >({});

  const filterSpec = useMemo(() => {
    if (!query.fltr) {
      return JSON.parse(default_query.fltr as string);
    }
    return JSON.parse(query.fltr as string);
  }, [query.fltr]);

  const filtersEnabled = query.filterEnabled
    ? JSON.parse(query.filterEnabled as string)
    : JSON.parse(default_query.filterEnabled as string);

  const filterEnabled =
    query.filterOn === undefined
      ? default_query.filterOn === "true" || default_query.filterOn === true
      : query.filterOn === "true" || query.filterOn === true;

  const setFilterEnabled = (enabled: boolean) => {
    updateQuery({ filterOn: enabled ? "true" : "false" });
  };

  const setEnabled = (key: string, enabled: boolean) => {
    const newFiltersEnabled = { ...filtersEnabled, [key]: enabled };
    updateQuery({ filterEnabled: JSON.stringify(newFiltersEnabled) });
  };

  const setFilterSpec = (newFilterSpec: FilterSpec[]) => {
    updateQuery({
      fltr: JSON.stringify(newFilterSpec),
    });
  };

  const [filterResults, setFilterResults] = useState<FilterResults>({});
  const [jsonFilter, setJsonFilter] = useState<Record<string, string>>({});

  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});
  const [filterLoadingStatus, setFilterLoadingStatus] = useState<Record<string, string>>({});

  const setIndividualFilterLoadingStatus = (key: string, status: string) => {
    setFilterLoadingStatus((prev) => ({ ...prev, [key]: status }));
  };

  const singleFilterWrapper = useCallback(
    (
      key: string,
      this_json: string,
      boundsForQueries: QueryBounds | null,
      setter: (result: FilterBackendResult) => void
    ) => {
      const everything = { key, this_json, boundsForQueries };
      const everything_string = JSON.stringify(everything);
      if (inflightFilters.includes(everything_string)) {
        return;
      }
      setInflightFilters((prev) => [...prev, everything_string]);

      if (filterControllers[key]) {
        filterControllers[key].forEach((controller: FilterControllerEntry) => {
          if (controller && boundsForQueries == controller.bounds) {
            controller.con.abort();
          }
        });
      }
      filterControllers[key] = [];

      const { abortController } = singleSearch(
        this_json,
        boundsForQueries,
        (x: FilterBackendResult) => {
          setInflightFilters((prev) =>
            prev.filter((s: string) => s !== everything_string)
          );
          setter(x);
        }
      );
      filterControllers[key] = [
        ...filterControllers[key],
        { con: abortController, bounds: boundsForQueries },
      ];
      setFilterControllers({ ...filterControllers });
    },
    [filterControllers, singleSearch, inflightFilters]
  );

  useEffect(() => {
    if (!filterEnabled) {
      return;
    }

    const spec_keys = filterSpec.map((spec: FilterSpec) => spec.key);
    const result_keys = Object.keys(filterResults);
    const keys_to_remove = result_keys.filter(
      (key) => !spec_keys.includes(key)
    );
    keys_to_remove.forEach((key) => {
      delete filterResults[key];
    });

    const spec_json: Record<string, string> = {};
    filterSpec.forEach((spec: FilterSpec) => {
      spec_json[spec.key] = JSON.stringify(spec);
    });

    const json_changed = Object.keys(spec_json).filter(
      (key) => spec_json[key] !== jsonFilter[key]
    );

    const result_changed = Object.keys(filterResults).filter((key: string) => {
      if (
        !(filterResults[key].result.type === "complete") &&
        filterResults[key].boundingBox !== boundsForQueries
      ) {
        return true;
      }
      return false;
    });

    if (json_changed.length > 0) {
      setJsonFilter(spec_json);
    }

    const all_changed_with_dupes = json_changed.concat(result_changed);
    const all_changed = [...new Set(all_changed_with_dupes)];

    if (all_changed.length > 0) {
      all_changed.forEach((key: string) => {
        const this_json = spec_json[key];

        const do_filter = () => {
          setIndividualFilterLoadingStatus(key, "loading");

          singleFilterWrapper(key, this_json, boundsForQueries, (result) => {
            setFilterResults((prevState) => {
              const new_result: FilterResultItem = {
                boundingBox: boundsForQueries,
                result: result,
              };
              if (result.type === "complete") {
                new_result.overview = result.data;
              } else {
                if (
                  prevState[key] &&
                  prevState[key].overview &&
                  !json_changed.includes(key)
                ) {
                  new_result.overview = prevState[key].overview;
                } else {
                  if (
                    !boundsForQueries ||
                    isNaN(boundsForQueries.min_x ?? NaN)
                  ) {
                    new_result.overview = result.data;
                  } else {
                    singleFilterWrapper(key, this_json, null, (result) => {
                      setFilterResults((prevState) => {
                        let new_result: FilterResultItem | undefined =
                          prevState[key];
                        if (new_result) {
                          new_result.overview = result.data;
                        } else {
                          new_result = { overview: result.data } as FilterResultItem;
                        }
                        return {
                          ...prevState,
                          [key]: new_result,
                        };
                      });
                    });
                  }
                }
              }
              return {
                ...prevState,
                [key]: new_result,
              };
            });
            setIndividualFilterLoadingStatus(key, "loaded");
          });
        };

        if (timeouts.current[key]) {
          clearTimeout(timeouts.current[key]);
        }
        timeouts.current[key] = setTimeout(do_filter, 500);
      });
    }
  }, [
    filterSpec,
    filterResults,
    jsonFilter,
    singleSearch,
    singleFilterWrapper,
    boundsForQueries,
    filterEnabled,
  ]);

  const addNewTopLevelFilter = () => {
    const newFilter = getDefaultSearch(config as any);

    setFilterSpec([...filterSpec, newFilter]);
    setTimeout(() => {
      setEnabled(newFilter.key, true);
    }, 50);
  };

  const deleteTopLevelFilter = (key: string) => {
    setFilterSpec(filterSpec.filter((s: FilterSpec) => s.key !== key));
  };

  return {
    filterResults,
    filterSpec,
    setFilterSpec,
    addNewTopLevelFilter,
    deleteTopLevelFilter,
    filtersEnabled,
    setEnabled,
    filterLoadingStatus,
    filterEnabled,
    setFilterEnabled,
  };
};

export default useFilter;
