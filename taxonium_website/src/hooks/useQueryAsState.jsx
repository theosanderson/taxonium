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

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const updateQuery = useCallback(
    (updatedParams, method = "push") => {
      // Read from window.location rather than a ref synced via useEffect.
      // React Router v7 wraps navigate's state update in startTransition, so
      // the useEffect that would update the ref may not have run by the time
      // a second updateQuery call happens (e.g. two calls in rapid
      // succession). history.pushState is synchronous, so window.location
      // always reflects the latest committed URL and prevents the second
      // call from clobbering the first.
      const currentSearch = queryParamsToObject(window.location.search);
      const newParams = { ...currentSearch, ...updatedParams };

      // Remove null values from the query parameters
      Object.keys(updatedParams).forEach((key) => {
        if (updatedParams[key] === null) {
          delete newParams[key];
        }
      });

      navigate(
        {
          pathname: pathnameRef.current,
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
