import React from "react";
import Modal from "react-modal";
import ColorPicker from "./ColorPicker";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

const settingsModalStyle = {
  content: {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fafafa",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "700px",
    maxHeight: "80vh",
    minWidth: "400px",
    minHeight: "400px",
  },
  overlay: {
    backgroundColor: "rgba(100, 100, 100, 0.3)",
    zIndex: 1000,
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
  noneColor,
  setNoneColor,
}) => {
  return (
    <Modal
      isOpen={deckSettingsOpen}
      style={settingsModalStyle}
      onRequestClose={() => setDeckSettingsOpen(false)}
      contentLabel="Deck Settings Modal"
    >
      <h2 className="font-medium mb-5 text-lg">Settings</h2>
      <Tabs>
        <TabList className="">
          <Tab>Toggle</Tab>
          <Tab>Appearance</Tab>

          <Tab>Search</Tab>
          <Tab>Color</Tab>
        </TabList>

        <TabPanel>
          <div className="mt-6">
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
          </div>
          <div className="space-y-3 mt-6">
            <h3 className="font-medium">Mutation types enabled</h3>
            {Object.keys(settings.mutationTypesEnabled).map((key) => (
              <div key={key}>
                <label>
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
        </TabPanel>

        <TabPanel>
          <div className="space-y-3">
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
          </div>
        </TabPanel>

        <TabPanel>
          <div className="space-y-3">
            <h3 className="font-medium">Search</h3>
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
            <div>
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
        </TabPanel>
        <TabPanel>
          <div className="space-y-3">
            <h3 className="font-medium">Color</h3>
            <div>
              <label>
                Default color for nodes:
                <ColorPicker color={noneColor} setColor={setNoneColor} />
              </label>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </Modal>
  );
};

export default DeckSettingsModal;
