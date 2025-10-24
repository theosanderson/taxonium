# Taxonium Component

`taxonium-component` provides the tree viewer used by [Taxonium](https://taxonium.org) as a reusable React component for embedding phylogenetic tree visualization into web applications.

[![npm version](https://img.shields.io/npm/v/taxonium-component)](https://www.npmjs.com/package/taxonium-component)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- **Visualize large phylogenetic trees** (millions of nodes supported)
- **Interactive exploration** with pan, zoom, and search
- **Rich metadata support** for coloring and filtering
- **Mutation tracking** and genome browser integration (JBrowse)
- **Event handlers** for integrating with your application
- **TypeScript support** with full type definitions
- **Multiple data formats**: Newick, JSONL, Nextstrain JSON, Nexus
- **Backend or local mode** for flexible deployment

## Installation

Install the package from npm:

```bash
npm install taxonium-component
```

**Peer dependencies** (React 19+):

```bash
npm install react@19 react-dom@19
```

## Quick Start

### Basic Usage with Backend

The simplest way to use Taxonium is with a backend URL:

```jsx
import Taxonium from "taxonium-component";

function App() {
  return <Taxonium backendUrl="https://api.cov2tree.org" />;
}

export default App;
```

### Local Tree with Metadata

Load a tree directly from local data:

```jsx
import Taxonium from "taxonium-component";

function App() {
  const sourceData = {
    status: "loaded",
    filename: "tree.nwk",
    data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
    filetype: "nwk",
    metadata: {
      filename: "metadata.csv",
      data: "Node,Species\nA,Cow\nB,Cow\nC,Fish\nD,Fish",
      status: "loaded",
      filetype: "meta_csv",
    },
  };

  return <Taxonium sourceData={sourceData} />;
}
```

### Event Handlers

Respond to user interactions with the tree:

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeInfo, setNodeInfo] = useState(null);

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    console.log("Node selected:", nodeId);
  };

  const handleNodeDetailsLoaded = (nodeId, nodeDetails) => {
    setNodeInfo(nodeDetails);
    console.log("Node details:", nodeDetails);
  };

  return (
    <div>
      <div>Selected: {selectedNode ?? "None"}</div>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        onNodeSelect={handleNodeSelect}
        onNodeDetailsLoaded={handleNodeDetailsLoaded}
      />
    </div>
  );
}

export default App;
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `sourceData` | `SourceData` | Local tree data with status, filename, filetype, and data |
| `backendUrl` | `string` | URL of the Taxonium backend server |
| `configDict` | `Record<string, unknown>` | Configuration object for customizing appearance |
| `configUrl` | `string` | URL to fetch remote configuration JSON |
| `query` | `Query` | Current query/state object for external state management |
| `updateQuery` | `(q: Partial<Query>) => void` | Function to update query state |
| `overlayContent` | `React.ReactNode` | Custom React content to overlay on the tree |
| `sidePanelHiddenByDefault` | `boolean` | Start with sidebar collapsed |
| `onNodeSelect` | `(nodeId: string \| number \| null) => void` | Callback when a node is selected/deselected |
| `onNodeDetailsLoaded` | `(nodeId: string \| number \| null, nodeDetails: NodeDetails \| null) => void` | Callback when node details are loaded |
| `setAboutEnabled` | `(val: boolean) => void` | Control about panel visibility |
| `setOverlayContent` | `(content: React.ReactNode) => void` | Dynamically update overlay content |
| `onSetTitle` | `(title: string) => void` | Callback when tree title changes |

## Event Handlers

### onNodeSelect

Fired when a node is clicked in the tree, or when selection is cleared.

- **Parameters**: `nodeId` (string | number | null)
- **Usage**: Track selected nodes, update UI, trigger additional data fetching

### onNodeDetailsLoaded

Fired when detailed information about a node has been loaded from the backend.

- **Parameters**:
  - `nodeId` (string | number | null)
  - `nodeDetails` (NodeDetails | null) - Complete node information including metadata, mutations, acknowledgements
- **Usage**: Display node information, export data, integrate with other tools

## Configuration

Customize the tree appearance and behavior with `configDict`:

```jsx
const config = {
  title: "My Phylogenetic Tree",
  source: "Lab Data",
  initial_zoom: 2,
  colorMapping: {
    "USA": [255, 0, 0],
    "UK": [0, 0, 255],
  },
  colorRamps: {
    meta_date: {
      scale: [
        [0, "#0000ff"],
        [100, "#ff0000"],
      ],
    },
  },
};

<Taxonium sourceData={sourceData} configDict={config} />
```

## TypeScript Support

Full TypeScript definitions are included:

```tsx
import Taxonium from "taxonium-component";
import type { NodeDetails, SourceData, Config } from "taxonium-component";

const sourceData: SourceData = {
  status: "loaded",
  filename: "tree.nwk",
  filetype: "nwk",
  data: "((A:0.1,B:0.2):0.3,C:0.4);",
};

const handleNodeDetailsLoaded = (
  nodeId: string | number | null,
  nodeDetails: NodeDetails | null
): void => {
  console.log(nodeDetails?.meta);
};
```

## Using Script Tags (No Build Step)

```html
<div id="root"></div>

<script type="module">
  import React from 'https://esm.sh/react@19';
  import { createRoot } from 'https://esm.sh/react-dom@19/client';
  import Taxonium from 'https://esm.sh/taxonium-component';

  const sourceData = {
    status: "loaded",
    filename: "test.nwk",
    data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
    filetype: "nwk",
  };

  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(Taxonium, { sourceData }));
</script>
```

## Documentation

For comprehensive documentation including:
- Complete API reference
- Advanced examples
- Configuration options
- Performance optimization
- Troubleshooting

Visit the [full component documentation](https://docs.taxonium.org/component.html).

## Building from Source

```bash
cd taxonium_component
npm install
npm run build
```

The compiled bundles (ES module and UMD) will be in the `dist` directory.

## Development

### Development Server

```bash
npm run dev
```

### Storybook Demo

Explore interactive examples:

```bash
npm run storybook
```

Launches at [http://localhost:6006](http://localhost:6006) with examples for:
- Backend integration
- Local data loading
- Metadata attachment
- Custom color mapping
- Event handlers
- Different file formats

### Running Tests

```bash
npm run test
```

## Supported File Formats

- **Newick** (`.nwk`, `.nwk.gz`)
- **JSONL** (mutation-annotated trees, `.jsonl.gz`)
- **Nextstrain JSON** (Augur format)
- **Nexus** (`.tree`, experimental)
- **Metadata**: CSV/TSV (`.csv`, `.tsv`, gzipped variants)

## Performance

For large trees (>100k nodes):
- Use **backend mode** to stream only visible nodes
- Supports trees with **millions of nodes**
- Use **JSONL format** for optimal performance
- Limit metadata to necessary fields only

## Examples

See the [documentation examples](https://docs.taxonium.org/component.html#examples) for:
- Multi-tree selector
- External state management
- Data export integration
- Custom styling
- Responsive design
- File upload integration

## Resources

- **Documentation**: [docs.taxonium.org](https://docs.taxonium.org)
- **GitHub**: [github.com/theosanderson/taxonium](https://github.com/theosanderson/taxonium)
- **Paper**: [eLife 2022](https://doi.org/10.7554/eLife.82392)
- **Live Examples**: [taxonium.org](https://taxonium.org), [cov2tree.org](https://cov2tree.org)

## License

MIT License - see [LICENSE](https://github.com/theosanderson/taxonium/blob/master/LICENSE) file for details.

## Citation

If you use Taxonium in your research, please cite:

> Sanderson, T. (2022). Taxonium, a web-based tool for exploring large phylogenetic trees. *eLife*, 11, e82392. https://doi.org/10.7554/eLife.82392

