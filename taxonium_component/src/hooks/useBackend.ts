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
): Backend | null {
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

  if (backend_url) {
    return serverBackend;
  }
  if (uploaded_data) {
    return localBackend;
  }
  return null;
}
export default useBackend;
