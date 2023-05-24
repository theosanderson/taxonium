import Modal from "react-modal";
import { useState, useEffect } from "react";

const ListOutputModal = ({
  backend,
  listOutputModalOpen,
  setListOutputModalOpen,
  nodeId,
  possibleKeys,
}) => {
  // display the output in a textarea

  const [selectedKey, setSelectedKey] = useState(possibleKeys[0]);
  const [listOutput, setListOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listOutputModalOpen) {
      setListOutput([]);
    }
  }, [listOutputModalOpen]);

  useEffect(() => {
    if (listOutputModalOpen) {
      setLoading(true);
      backend.getTipAtts(nodeId, selectedKey, (err, res) => {
        if (err) {
          console.log(err);
        } else {
          setListOutput(res);
        }
        setLoading(false);
      });
    }
  }, [selectedKey, nodeId, listOutputModalOpen, backend]);

  return (
    <Modal
      ariaHideApp={false}
      isOpen={listOutputModalOpen}
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          //width: '50%',
          backgroundColor: "#fafafa",
        },
      }}
      onRequestClose={() => setListOutputModalOpen(false)}
      contentLabel="Example Modal"
    >
      <h2 className="font-medium mb-3">Tip list</h2>
      <div className="text-sm">
        <div className="flex justify-between">
          <div className="flex-1">
            <label>
              <select
                className="block  w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {possibleKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => setListOutputModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
        {loading && (
          <div>
            <div className="text-gray-500">Loading data...</div>
          </div>
        )}
        {!loading && listOutput.length === 0 && (
          <div className="text-gray-500">No data available.</div>
        )}
        {!loading && listOutput.length > 0 && (
          <textarea
            className="w-full h-64 bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 shadow leading-tight focus:outline-none focus:shadow-outline"
            value={listOutput.join("\n")}
            readOnly
          />
        )}
      </div>
    </Modal>
  );
};

export default ListOutputModal;
