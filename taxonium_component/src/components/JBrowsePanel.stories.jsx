import { fn } from "@storybook/test";
import JBrowsePanel from "./JBrowsePanel";

export default {
  title: "Taxonium/JBrowsePanel",
  component: JBrowsePanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

// Note: JBrowsePanel requires complex props and may not render fully in Storybook without mocks
export const JBrowsePanelInfo = {
  render: () => (
    <div className="p-4 border border-gray-300 rounded m-4">
      <h3 className="text-lg font-semibold mb-2">JBrowsePanel</h3>
      <p className="mb-2">
        This component integrates the JBrowse linear genome browser into
        Taxonium.
      </p>
      <ul className="list-disc pl-5 mb-3">
        <li>Displays genomic data in a linear view</li>
        <li>Supports SARS-CoV-2 gene annotations for COVID data</li>
        <li>Allows users to add custom tracks</li>
        <li>Syncs view with other components via the treenomeState</li>
      </ul>
      <p className="text-sm text-gray-600">
        Note: This component requires complex props including JBrowse state
        management and may not render fully in Storybook without proper data and
        context providers.
      </p>
    </div>
  ),
};

export const Default = {
  args: {
    settings: {
      chromosomeName: "chromosome",
      isCov2Tree: true,
    },
    treenomeState: {
      genome:
        "ACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTGACTG",
      genomeSize: 29903,
      ntBounds: [0, 29903],
      ntBoundsExt: null,
      pxPerBp: 0.1,
      setNtBounds: fn(),
      setNtBoundsExt: fn(),
      setPxPerBp: fn(),
    },
  },
};

// This component has complex dependencies and state management
// For actual testing, consider using the component in a real app context
