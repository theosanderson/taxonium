import Modal from "react-modal";
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
  
const DeckSettingsModal = ({settings, deckSettingsOpen, setDeckSettingsOpen}) => {
    return (<Modal
        isOpen={deckSettingsOpen}
        style={settingsModalStyle}
        onRequestClose={() => setDeckSettingsOpen(false)}
        contentLabel="Example Modal"
      >
        <h2 className="font-medium mb-3">Settings</h2>
        <div className="text-sm">
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={settings.minimapEnabled}
              onChange={() => settings.toggleMinimapEnabled()}
            />{" "}
            Enable minimap
          </label>

          <h3 className="mt-5 font-medium">Mutation types enabled</h3>
          <div className="mt-2">
            {Object.keys(settings.mutationTypesEnabled).map((key) => (
              <div>
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
                  {prettifyMutationTypes[key]
                    ? prettifyMutationTypes[key]
                    : key}
                </label>
              </div>
            ))}
          </div>
        </div>
      </Modal>)}
export default DeckSettingsModal;