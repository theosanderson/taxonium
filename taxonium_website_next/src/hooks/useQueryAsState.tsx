"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const queryParamsToObject = (search: string) => {
  const params: Record<string, string> = {};
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

const objectToQueryParams = (obj: Record<string, any>) =>
  "?" +
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .map((key) => `${key}=${encodeURIComponent(obj[key])}`)
    .join("&");

const removeUndefined = (obj: Record<string, any>) => {
  const nextObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      nextObj[key] = value;
    }
  }
  return nextObj;
};

const useQueryAsState = (defaultValues: Record<string, any> = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const decodedSearch = useMemo(() => queryParamsToObject(search), [search]);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Fallback for environments where window is unavailable (SSR). Kept in a
  // ref so updateQuery's identity doesn't change on every URL update — that
  // would cascade through downstream useCallback/useEffect deps (e.g.
  // setxType in Taxonium.tsx) and cause redundant effect re-runs.
  const decodedSearchRef = useRef(decodedSearch);
  useEffect(() => {
    decodedSearchRef.current = decodedSearch;
  }, [decodedSearch]);

  const updateQuery = useCallback(
    (updatedParams: Record<string, any>, method = "push") => {
      // Read from window.location rather than the decodedSearch ref. Routers
      // may defer the React state update (e.g. startTransition), so a ref
      // synced via useEffect can lag behind when updateQuery is called twice
      // in quick succession. history.pushState is synchronous, so
      // window.location always reflects the latest URL.
      const currentSearch =
        typeof window !== "undefined"
          ? queryParamsToObject(window.location.search)
          : decodedSearchRef.current;
      const newParams = { ...currentSearch, ...updatedParams };

      // Remove null values from the query parameters
      Object.keys(updatedParams).forEach((key) => {
        if (updatedParams[key] === null) {
          delete newParams[key];
        }
      });

      const newSearch = objectToQueryParams(newParams);
      const newUrl = `${pathnameRef.current}${newSearch}`;

      if (method === "replace") {
        router.replace(newUrl);
      } else {
        router.push(newUrl);
      }
    },
    [router]
  );

  const queryWithDefault = useMemo(
    () => ({ ...defaultValues, ...removeUndefined(decodedSearch) }),
    [decodedSearch, defaultValues]
  );

  return [queryWithDefault, updateQuery] as const;
};

export default useQueryAsState;
