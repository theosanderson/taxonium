import pako from "pako";
import axios from "axios";

function getRawfile(protoUrl, uploadedData, setMainData) {
  if (uploadedData) {
    return new Promise((resolve, reject) => {
      resolve(uploadedData);
    });
  } else {
    console.log("aaaa", protoUrl);

    return axios
      .get(protoUrl, {
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor(
            1 * (progressEvent.loaded / 50000000) * 100
          );
          setMainData({
            status: "loading",
            progress: percentCompleted,
            data: { node_data: { ids: [] } },
          });
        },
      })
      .catch((err) => {
        console.log(err);
        window.alert(
          err +
            "\n\nPlease check the URL entered, or your internet connection, and try again."
        );
      })
      .then(function (response) {
        if (protoUrl.endsWith(".gz")) {
          return pako.ungzip(response.data);
        } else {
          return response.data;
        }
      });
  }
}

export default getRawfile;
