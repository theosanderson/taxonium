import useServerBackend from "./useServerBackend";
import useLocalBackend from "./useLocalBackend";

function useBackend(backend_url, sid, uploaded_data, proto) {
  const serverBackend = useServerBackend(backend_url, sid);
  const localBackend = useLocalBackend(uploaded_data, proto);
  if (backend_url) {
    return serverBackend;
  }
  if (uploaded_data) {
    return localBackend;
  } else {
    return null;
  }
}
export default useBackend;
