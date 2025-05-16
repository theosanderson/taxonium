import { useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const queryParamsToObject = (search) => {
  const params = {};
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
};

const objectToQueryParams = (obj) =>
  "?" +
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .map((key) => `${key}=${encodeURIComponent(obj[key])}`) // Directly encode here
    .join("&");

const removeUndefined = (obj) => {
  const nextObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      nextObj[key] = value;
    }
  }
  return nextObj;
};

const useQueryAsState = (defaultValues = {}) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const decodedSearch = useMemo(() => queryParamsToObject(search), [search]);

  const updateRef = useRef({ decodedSearch, pathname });
  useEffect(() => {
    updateRef.current = { decodedSearch, pathname };
  }, [decodedSearch, pathname]);

  const updateQuery = useCallback(
    (updatedParams, method = "push") => {
      const { pathname, decodedSearch } = updateRef.current;
      const newParams = { ...decodedSearch, ...updatedParams };

      // Remove null values from the query parameters
      Object.keys(updatedParams).forEach((key) => {
        if (updatedParams[key] === null) {
          delete newParams[key];
        }
      });

      navigate(
        {
          pathname,
          search: objectToQueryParams(newParams),
        },
        { replace: method === "replace" }
      ); // Use the replace option for "replace" method
    },
    [navigate]
  );

  const queryWithDefault = useMemo(
    () => ({ ...defaultValues, ...removeUndefined(decodedSearch) }),
    [decodedSearch, defaultValues]
  );

  return [queryWithDefault, updateQuery];
};

export default useQueryAsState;
