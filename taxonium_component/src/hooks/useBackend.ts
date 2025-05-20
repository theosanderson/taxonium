import useServerBackend from "./useServerBackend";
import useLocalBackend from "./useLocalBackend";

function useBackend(backend_url, sid, uploaded_data) {
  const serverBackend = useServerBackend(backend_url, sid);
  const localBackend = useLocalBackend(uploaded_data);
  if (backend_url) {
    if (!(window as any).done_ev) {
      (window as any).done_ev = true;
      if ((window as any).gtag) {
        (window as any).gtag("event", "backend", {
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
      "Taxonium did not receive the information it needed to launch."
    );
    return null;
  }
}
export default useBackend;
