import Modal from "react-modal";
import ColorPicker from "./ColorPicker";
const settingsModalStyle = {
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
};

const prettifyMutationTypes = {
  aa: "Amino acid",
  nt: "Nucleotide",
};

const DeckSettingsModal = ({
  settings,
  deckSettingsOpen,
  setDeckSettingsOpen,
}) => {
  return (
    <Modal
      isOpen={deckSettingsOpen}
      style={settingsModalStyle}
      onRequestClose={() => setDeckSettingsOpen(false)}
      contentLabel="Example Modal"
    >
      <h2 className="font-medium mb-3">Settings</h2>
      <div className="text-sm">
        <div>
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={settings.minimapEnabled}
              onChange={() => settings.toggleMinimapEnabled()}
            />{" "}
            Enable minimap
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={settings.displayTextForInternalNodes}
              onChange={() =>
                settings.setDisplayTextForInternalNodes(
                  !settings.displayTextForInternalNodes
                )
              }
            />{" "}
            Display labels for internal nodes if present
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={settings.displayPointsForInternalNodes}
              onChange={() =>
                settings.setDisplayPointsForInternalNodes(
                  !settings.displayPointsForInternalNodes
                )
              }
            />{" "}
            Display points for internal nodes
          </label>
        </div>

        <div>
          <label>
            Max density of node label text:{" "}
            <input
              type="number"
              value={settings.thresholdForDisplayingText}
              onChange={(e) =>
                settings.setThresholdForDisplayingText(
                  parseFloat(e.target.value)
                )
              }
              step="0.1"
              min="0"
              max="10"
              className="border py-1 px-1 text-grey-darkest text-sm"
            />
          </label>
        </div>
        <div>
          <label>
            Max clade labels to show
            <input
              type="number"
              value={settings.maxCladeTexts}
              onChange={(e) =>
                settings.setMaxCladeTexts(parseInt(e.target.value))
              }
              step="1"
              min="0"
              max="10000000"
              className="border py-1 px-1 text-grey-darkest text-sm"
            />
          </label>
        </div>
        <div>
          <label>
            Color for terminal node labels
            <ColorPicker
              color={settings.terminalNodeLabelColor}
              setColor={settings.setTerminalNodeLabelColor}
            />
          </label>
        </div>
        <div>
          <label>
            Color for tree lines
            <ColorPicker
              color={settings.lineColor}
              setColor={settings.setLineColor}
            />
          </label>
        </div>

        <div>
          <label>
            Color for clade labels
            <ColorPicker
              color={settings.cladeLabelColor}
              setColor={settings.setCladeLabelColor}
            />
          </label>
        </div>
        <h3 className="mt-5 font-medium">Mutation types enabled</h3>
        <div className="mt-2">
          {Object.keys(settings.mutationTypesEnabled).map((key) => (
            <div key={key}>
              <label key={key}>
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={settings.mutationTypesEnabled[key]}
                  onChange={() =>
                    settings.setMutationTypeEnabled(
                      key,
                      !settings.mutationTypesEnabled[key]
                    )
                  }
                />{" "}
                {prettifyMutationTypes[key] ? prettifyMutationTypes[key] : key}
              </label>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <h3 className="mt-5 font-medium">Search</h3>
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={settings.displaySearchesAsPoints}
              onChange={() =>
                settings.setDisplaySearchesAsPoints(
                  !settings.displaySearchesAsPoints
                )
              }
            />{" "}
            Display searches as points
          </label>
        </div>
        <div className="mt-2">
          <label>
            Point Size:{" "}
            <input
              type="number"
              value={settings.searchPointSize}
              onChange={(e) =>
                settings.setSearchPointSize(parseInt(e.target.value))
              }
              step="1"
              min="1"
              max="10"
              className={`border py-1 px-1 text-grey-darkest text-sm ${
                !settings.displaySearchesAsPoints ? "bg-gray-200" : ""
              }`}
              disabled={!settings.displaySearchesAsPoints}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
};
export default DeckSettingsModal;
