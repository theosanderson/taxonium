import { useEffect } from "react";
import useServerBackend from "./useServerBackend";
import useLocalBackend from "./useLocalBackend";
import type { Backend } from "../types/backend";

interface WindowWithAnalytics extends Window {
  done_ev?: boolean;
  gtag?: (...args: unknown[]) => void;
}

function useBackend(
  backend_url: string | null | undefined,
  sid: string | null | undefined,
  uploaded_data: Record<string, unknown> | null
): Backend {
  const serverBackend = useServerBackend(backend_url ?? null, sid ?? null);
  const localBackend = useLocalBackend(uploaded_data);

  // Fire analytics as a side-effect (not during render) so we don't
  // violate the Rules of Hooks and so we only fire once per backend URL.
  useEffect(() => {
    if (backend_url) {
      const w = window as WindowWithAnalytics;
      if (!w.done_ev) {
        w.done_ev = true;
        if (w.gtag) {
          w.gtag("event", "backend", {
            event_category: "backend",
            event_label: backend_url,
          });
        }
      }
    }
  }, [backend_url]);

  // Always return a valid backend object. Returning null here would cause
  // the caller to early-return before calling other hooks, violating the
  // Rules of Hooks (React error #310) when the backend later becomes
  // available. If no source is provided we fall back to serverBackend;
  // this is a transient state (e.g. while protoUrl is being converted
  // into uploaded_data) and the downstream hooks tolerate a backend
  // that hasn't yet been pointed at a real URL.
  if (backend_url) {
    return serverBackend;
  }
  if (uploaded_data) {
    return localBackend;
  }
  return serverBackend;
}
export default useBackend;
