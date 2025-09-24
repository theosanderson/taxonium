import TaxoniumModal from "./TaxoniumModal";
import { useState } from "react";
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
    maxWidth: "500px",
  },
};

interface TreenomeModalProps {
  treenomeSettingsOpen: boolean;
  setTreenomeSettingsOpen: (open: boolean) => void;
  settings: {
    chromosomeName: string;
    setChromosomeName: (name: string) => void;
    isCov2Tree?: boolean;
  };
}

const TreenomeModal = ({
  treenomeSettingsOpen,
  setTreenomeSettingsOpen,
  settings,
}: TreenomeModalProps) => {
  const [inputChromosome, setInputChromosome] = useState(
    settings.chromosomeName
  );
  return (
    <TaxoniumModal
      isOpen={treenomeSettingsOpen}
      style={settingsModalStyle}
      onRequestClose={() => {
        settings.setChromosomeName(inputChromosome);
        setTreenomeSettingsOpen(false);
      }}
    >
      <h2 className="font-medium mb-3">Treenome Settings</h2>
      <div>
        <label>
          Reference chromosome name{" "}
          <input
            type="text"
            value={inputChromosome}
            onChange={(e) => {
              setInputChromosome(e.target.value);
            }}
            className="border py-1 px-1 text-grey-darkest text-sm"
          />
        </label>
        <br />
        <span style={{ fontSize: "10pt" }}>
          <em>
            <strong>Loaded annotations must match this name.</strong>
            <br />
            {settings.isCov2Tree
              ? "Cov2Tree uses the NC_045512v2 / MN908947.3 / WuhCor1 reference assembly. If you change this name, make sure your annotations target the same assembly."
              : ""}
          </em>
        </span>
      </div>
    </TaxoniumModal>
  );
};
export default TreenomeModal;
