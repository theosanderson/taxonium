import useServerBackend from "./useServerBackend";
import useLocalBackend from "./useLocalBackend";

function useBackend(backend_url, sid, url_on_fail, uploaded_data) {
  const serverBackend = useServerBackend(backend_url, sid, url_on_fail);
  const localBackend = useLocalBackend(uploaded_data);
  if (backend_url) {
    if (!window.done_ev) {
      window.done_ev = true;
      if (window.gtag) {
        window.gtag("event", "backend", {
          event_category: "backend",
          event_label: backend_url,
        });
      }
    }
    return serverBackend;
  }
  if (uploaded_data) {
    return localBackend;
  } else {
    window.alert(
      "Taxonium did not receive the information it needed to launch.",
    );
    return null;
  }
}
export default useBackend;
