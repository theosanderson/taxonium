// https://github.com/baruchiro/use-route-as-state
// (via @richardgoater)

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";

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
    .map((key) => `${key}=${obj[key]}`)
    .join("&");

const encodeValues = (obj) => {
  const nextObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      nextObj[key] = encodeURIComponent(value);
    }
  }
  return nextObj;
};

const removeUndefined = (obj) => {
  const nextObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      nextObj[key] = value;
    }
  }
  return nextObj;
};

const useQueryAsState = (defaultValues) => {
  const history = useHistory();
  const { pathname, search } = useLocation();

  const decodedSearch = useMemo(() => queryParamsToObject(search), [search]);

  const updateRef = useRef({ decodedSearch, pathname });
  useEffect(() => {
    updateRef.current = { decodedSearch, pathname };
  }, [decodedSearch, pathname]);

  const updateQuery = useCallback(
    (updatedParams, method = "push") => {
      const { pathname, decodedSearch } = updateRef.current;
      const new_vals = { ...decodedSearch, ...updatedParams };
      Object.keys(updatedParams).forEach((key) => {
        const value = updatedParams[key];
        if (value === null) {
          delete new_vals[key];
        }
      });
      history[method](pathname + objectToQueryParams(encodeValues(new_vals)));
    },
    [history],
  );

  const queryWithDefault = useMemo(
    () => Object.assign({}, defaultValues, removeUndefined(decodedSearch)),
    [decodedSearch, defaultValues],
  );

  return [queryWithDefault, updateQuery];
};

export default useQueryAsState;
