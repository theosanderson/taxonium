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

  const updateRef = useRef({ decodedSearch, pathname });
  useEffect(() => {
    updateRef.current = { decodedSearch, pathname };
  }, [decodedSearch, pathname]);

  const updateQuery = useCallback(
    (updatedParams: Record<string, any>, method = "push") => {
      const { pathname, decodedSearch } = updateRef.current;
      const newParams = { ...decodedSearch, ...updatedParams };

      // Remove null values from the query parameters
      Object.keys(updatedParams).forEach((key) => {
        if (updatedParams[key] === null) {
          delete newParams[key];
        }
      });

      const newSearch = objectToQueryParams(newParams);
      const newUrl = `${pathname}${newSearch}`;

      if (method === "replace") {
        router.replace(newUrl);
      } else {
        router.push(newUrl);
      }
    },
    [router, pathname]
  );

  const queryWithDefault = useMemo(
    () => ({ ...defaultValues, ...removeUndefined(decodedSearch) }),
    [decodedSearch, defaultValues]
  );

  return [queryWithDefault, updateQuery] as const;
};

export default useQueryAsState;
