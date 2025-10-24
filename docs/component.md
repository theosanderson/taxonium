# Taxonium React Component

Taxonium is now available as a React component for embedding phylogenetic tree visualization into your applications. This guide covers everything from basic usage to advanced integration patterns.

```{eval-rst}
.. note::
    The Taxonium component is actively developed and may introduce new features. Check the `changelog <https://github.com/theosanderson/taxonium/releases>`_ for updates.
```

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component Props](#component-props)
- [Data Sources](#data-sources)
- [Event Handlers](#event-handlers)
- [Configuration](#configuration)
- [Examples](#examples)
- [TypeScript Support](#typescript-support)
- [Storybook Demo](#storybook-demo)
- [Building from Source](#building-from-source)

---

## Installation

### npm/yarn

```bash
npm install taxonium-component
```

Or with yarn:

```bash
yarn add taxonium-component
```

### Peer Dependencies

Taxonium requires React 19+ as a peer dependency:

```bash
npm install react@19 react-dom@19
```

---

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
    filename: "mytree.nwk",
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

### Using ESM/CDN (No Build Step)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taxonium Demo</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    #root { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="module">
    import React from 'https://esm.sh/react@19';
    import { createRoot } from 'https://esm.sh/react-dom@19/client';
    import Taxonium from 'https://esm.sh/taxonium-component';

    const { createElement: h } = React;

    function App() {
      const sourceData = {
        status: "loaded",
        filename: "test.nwk",
        data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
        filetype: "nwk",
        metadata: {
          filename: "test.csv",
          data: "Node,Name,Species\nA,Bob,Cow\nB,Jim,Cow\nC,Joe,Fish\nD,John,Fish",
          status: "loaded",
          filetype: "meta_csv",
        },
      };

      return h(Taxonium, { sourceData });
    }

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
  </script>
</body>
</html>
```

---

## Component Props

The `Taxonium` component accepts the following props:

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sourceData` | `SourceData` | No | Local tree and metadata to load. See [Data Sources](#data-sources) |
| `backendUrl` | `string` | No | URL of a Taxonium backend server |
| `configDict` | `Record<string, unknown>` | No | Configuration object for customizing appearance and behavior |
| `configUrl` | `string` | No | URL to fetch remote configuration JSON |

**Note:** You must provide either `sourceData` or `backendUrl` (or both).

### State Management Props

| Prop | Type | Description |
|------|------|-------------|
| `query` | `Query` | Current query/state object containing viewport, search, and filter settings |
| `updateQuery` | `(q: Partial<Query>) => void` | Callback function to update query state |

**Usage:** These props enable external state management. If not provided, Taxonium manages state internally.

### UI Customization Props

| Prop | Type | Description |
|------|------|-------------|
| `overlayContent` | `React.ReactNode` | Custom React content to overlay on the tree visualization |
| `setAboutEnabled` | `(val: boolean) => void` | Control visibility of the about panel |
| `setOverlayContent` | `(content: React.ReactNode) => void` | Dynamically update overlay content |
| `onSetTitle` | `(title: string) => void` | Callback when the tree title changes |
| `sidePanelHiddenByDefault` | `boolean` | If `true`, the search/info sidebar starts collapsed |

### Event Handlers

| Prop | Type | Description |
|------|------|-------------|
| `onNodeSelect` | `(nodeId: string \| number \| null) => void` | Fired when a node is clicked (or deselected if `null`) |
| `onNodeDetailsLoaded` | `(nodeId: string \| number \| null, nodeDetails: NodeDetails \| null) => void` | Fired when node details are loaded from the backend |

See [Event Handlers](#event-handlers) for detailed usage.

---

## Data Sources

### sourceData Object

The `sourceData` prop defines the tree data to visualize. It supports multiple formats and loading strategies.

#### Basic Structure

```typescript
interface SourceData {
  status: "loaded" | "url_supplied";
  filename: string;
  filetype: "nwk" | "jsonl" | "json" | "nexus";
  data?: string;           // Required if status is "loaded"
  metadata?: MetadataData; // Optional
}
```

### Supported File Formats

#### 1. Newick (.nwk)

Standard phylogenetic tree format:

```jsx
const sourceData = {
  status: "loaded",
  filename: "tree.nwk",
  filetype: "nwk",
  data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
};
```

#### 2. JSONL (Mutation-Annotated Trees)

Taxonium's native format with mutation information:

```jsx
const sourceData = {
  status: "url_supplied",
  filename: "https://example.com/tree.jsonl.gz",
  filetype: "jsonl",
};
```

**Note:** JSONL trees can include mutation annotations, metadata, and custom attributes.

#### 3. Nextstrain JSON

```jsx
const sourceData = {
  status: "url_supplied",
  filename: "https://nextstrain.org/charon/getDataset?prefix=...",
  filetype: "json",
};
```

#### 4. Nexus (.tree, experimental)

```jsx
const sourceData = {
  status: "url_supplied",
  filename: "https://example.com/tree.nexus",
  filetype: "nexus",
};
```

### Loading Strategies

#### From URL

```jsx
const sourceData = {
  status: "url_supplied",
  filename: "https://example.com/tree.jsonl.gz",
  filetype: "jsonl",
};
```

#### From Local String

```jsx
const sourceData = {
  status: "loaded",
  filename: "local.nwk",
  filetype: "nwk",
  data: "((A:0.1,B:0.2):0.3,C:0.4);",
};
```

### Adding Metadata

Metadata enriches tree nodes with additional attributes for coloring and searching:

```jsx
const sourceData = {
  status: "loaded",
  filename: "tree.nwk",
  filetype: "nwk",
  data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
  metadata: {
    filename: "metadata.csv",
    status: "loaded",
    filetype: "meta_csv",
    data: `Node,Location,Date,Species
A,USA,2020-01-01,Human
B,UK,2020-02-15,Human
C,France,2020-03-20,Dog
D,Germany,2020-04-10,Cat`,
  },
};
```

**Supported metadata formats:**
- CSV (`.csv`)
- TSV (`.tsv`)
- Gzipped variants (`.csv.gz`, `.tsv.gz`)

---

## Event Handlers

Event handlers enable your application to respond to user interactions with the tree.

### onNodeSelect

Fired when a user clicks on a node in the tree, or when selection is cleared.

**Type:** `(nodeId: string | number | null) => void`

**Parameters:**
- `nodeId`: The ID of the selected node, or `null` if the selection is cleared

**Example:**

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function App() {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    console.log("Selected node:", nodeId);

    if (nodeId === null) {
      console.log("Node deselected");
    } else {
      // Perform actions based on node selection
      // e.g., fetch additional data, update UI, etc.
    }
  };

  return (
    <div>
      <div>Currently selected: {selectedNode ?? "None"}</div>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        onNodeSelect={handleNodeSelect}
      />
    </div>
  );
}
```

### onNodeDetailsLoaded

Fired when detailed information about a selected node has been loaded from the backend.

**Type:** `(nodeId: string | number | null, nodeDetails: NodeDetails | null) => void`

**Parameters:**
- `nodeId`: The ID of the node
- `nodeDetails`: Object containing complete node information, including:
  - Metadata fields
  - Mutations
  - Acknowledgements (if available)
  - Parent/child relationships

**NodeDetails Structure:**

```typescript
interface NodeDetails {
  node_id: string | number;
  name?: string;
  meta?: Record<string, any>;
  mutations?: Mutation[];
  acknowledgements?: {
    covv_orig_lab?: string;
    covv_subm_lab?: string;
    covv_authors?: string;
    authors?: string;
  };
  // Additional backend-specific fields
}
```

**Example:**

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function App() {
  const [nodeInfo, setNodeInfo] = useState(null);

  const handleNodeDetailsLoaded = (nodeId, nodeDetails) => {
    if (nodeDetails) {
      setNodeInfo(nodeDetails);
      console.log("Node details:", nodeDetails);

      // Extract specific information
      if (nodeDetails.meta) {
        console.log("Location:", nodeDetails.meta.location);
        console.log("Date:", nodeDetails.meta.date);
      }

      if (nodeDetails.mutations) {
        console.log("Mutations:", nodeDetails.mutations.length);
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1 }}>
        <Taxonium
          backendUrl="https://api.cov2tree.org"
          onNodeDetailsLoaded={handleNodeDetailsLoaded}
        />
      </div>
      <div style={{ width: 300, padding: 20, overflowY: "auto" }}>
        <h3>Node Information</h3>
        {nodeInfo ? (
          <pre>{JSON.stringify(nodeInfo, null, 2)}</pre>
        ) : (
          <p>Select a node to view details</p>
        )}
      </div>
    </div>
  );
}
```

### Combined Event Handler Example

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
    if (nodeId === null) {
      setNodeDetails(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  const handleNodeDetailsLoaded = (nodeId, details) => {
    setNodeDetails(details);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ padding: 10, background: "#f0f0f0" }}>
        {selectedNodeId ? (
          loading ? (
            <span>Loading details for node {selectedNodeId}...</span>
          ) : (
            <span>
              Selected: {nodeDetails?.name || selectedNodeId}
              {nodeDetails?.meta?.location && ` - ${nodeDetails.meta.location}`}
            </span>
          )
        ) : (
          <span>Click a node to view details</span>
        )}
      </div>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        onNodeSelect={handleNodeSelect}
        onNodeDetailsLoaded={handleNodeDetailsLoaded}
      />
    </div>
  );
}
```

---

## Configuration

The `configDict` prop allows extensive customization of the tree appearance and behavior.

### Basic Configuration

```jsx
const config = {
  title: "My Phylogenetic Tree",
  source: "Data from Example Lab",
  initial_x: 0,
  initial_y: 0,
  initial_zoom: 1,
};

<Taxonium
  sourceData={sourceData}
  configDict={config}
/>
```

### Color Mapping

Map specific metadata values to RGB colors:

```jsx
const config = {
  colorMapping: {
    // Metadata field values -> [R, G, B]
    "USA": [255, 0, 0],       // Red
    "UK": [0, 0, 255],        // Blue
    "France": [0, 255, 0],    // Green
    "Germany": [255, 255, 0], // Yellow
  },
};
```

### Color Ramps

Define custom color scales for continuous/categorical metadata:

```jsx
const config = {
  colorRamps: {
    meta_temperature: {
      scale: [
        [0, "#0000ff"],    // 0° - Blue
        [20, "#00ff00"],   // 20° - Green
        [40, "#ffff00"],   // 40° - Yellow
        [60, "#ff0000"],   // 60° - Red
      ],
    },
    meta_severity: {
      scale: [
        [0, "#ffffff"],    // Low - White
        [1, "#ffcccc"],    // Medium-low
        [2, "#ff6666"],    // Medium-high
        [3, "#ff0000"],    // High - Red
      ],
    },
  },
};

<Taxonium
  sourceData={sourceData}
  configDict={config}
/>
```

**Usage:** When coloring by `temperature` metadata field, values will interpolate between the defined colors.

### Custom Overlays

Add custom React content over the tree:

```jsx
const config = {
  overlay: (
    <div style={{
      position: "absolute",
      top: 10,
      left: 10,
      background: "rgba(255,255,255,0.9)",
      padding: 10,
      borderRadius: 5,
    }}>
      <h3>Study Information</h3>
      <p>SARS-CoV-2 Phylogeny</p>
      <p>Updated: 2024-01-15</p>
    </div>
  ),
};
```

### Search Configuration

Customize available search types:

```jsx
const config = {
  search_types: [
    { name: "name", label: "Node Name", type: "text_match" },
    { name: "meta_location", label: "Location", type: "text_match" },
    { name: "meta_date", label: "Collection Date", type: "text_match" },
  ],
};
```

### Complete Configuration Example

```jsx
const config = {
  title: "Global SARS-CoV-2 Phylogeny",
  source: "GISAID",
  initial_x: 100,
  initial_y: 0,
  initial_zoom: 2,

  colorMapping: {
    "Alpha": [255, 100, 100],
    "Delta": [100, 100, 255],
    "Omicron": [100, 255, 100],
  },

  colorRamps: {
    meta_date: {
      scale: [
        [new Date("2020-01-01").getTime(), "#0000ff"],
        [new Date("2023-01-01").getTime(), "#ff0000"],
      ],
    },
  },

  search_types: [
    { name: "name", label: "Strain Name", type: "text_match" },
    { name: "meta_lineage", label: "Pango Lineage", type: "text_match" },
    { name: "meta_country", label: "Country", type: "text_match" },
  ],
};

<Taxonium
  sourceData={sourceData}
  configDict={config}
/>
```

### Remote Configuration

Load configuration from a URL:

```jsx
<Taxonium
  sourceData={sourceData}
  configUrl="https://example.com/config.json"
/>
```

**Note:** `configDict` and `configUrl` can be combined. `configDict` will override matching fields from `configUrl`.

---

## Examples

### Example 1: Multi-Tree Selector

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

const trees = [
  { name: "SARS-CoV-2", url: "https://api.cov2tree.org" },
  { name: "Influenza", url: "https://api.flu.example.com" },
  { name: "HIV", url: "https://api.hiv.example.com" },
];

function MultiTreeApp() {
  const [selectedTree, setSelectedTree] = useState(trees[0]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 10, background: "#333", color: "#fff" }}>
        <h2>Phylogenetic Tree Viewer</h2>
        <select
          value={selectedTree.name}
          onChange={(e) => {
            const tree = trees.find((t) => t.name === e.target.value);
            setSelectedTree(tree);
          }}
        >
          {trees.map((tree) => (
            <option key={tree.name} value={tree.name}>
              {tree.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <Taxonium key={selectedTree.url} backendUrl={selectedTree.url} />
      </div>
    </div>
  );
}
```

### Example 2: External State Management

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function StatefulApp() {
  const [query, setQuery] = useState({
    xType: "x_dist",
    color: "meta_location",
    search: "",
  });

  const updateQuery = (updates) => {
    setQuery((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div>
      <div style={{ padding: 10 }}>
        <button onClick={() => updateQuery({ xType: "x_dist" })}>
          Distance View
        </button>
        <button onClick={() => updateQuery({ xType: "x_time" })}>
          Time View
        </button>
        <pre>Current state: {JSON.stringify(query, null, 2)}</pre>
      </div>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        query={query}
        updateQuery={updateQuery}
      />
    </div>
  );
}
```

### Example 3: Data Export Integration

```jsx
import { useState, useCallback } from "react";
import Taxonium from "taxonium-component";

function ExportApp() {
  const [selectedNodes, setSelectedNodes] = useState([]);

  const handleNodeSelect = useCallback((nodeId) => {
    if (nodeId !== null) {
      setSelectedNodes((prev) => [...prev, nodeId]);
    }
  }, []);

  const handleNodeDetailsLoaded = useCallback((nodeId, details) => {
    // Store details for export
    const exportData = {
      nodeId,
      name: details?.name,
      location: details?.meta?.location,
      date: details?.meta?.date,
      mutations: details?.mutations?.length || 0,
    };
    console.log("Export data:", exportData);
  }, []);

  const exportToCSV = () => {
    const csv = selectedNodes.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-nodes.csv";
    a.click();
  };

  return (
    <div>
      <div style={{ padding: 10 }}>
        <button onClick={exportToCSV} disabled={selectedNodes.length === 0}>
          Export {selectedNodes.length} Selected Nodes
        </button>
      </div>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        onNodeSelect={handleNodeSelect}
        onNodeDetailsLoaded={handleNodeDetailsLoaded}
      />
    </div>
  );
}
```

### Example 4: Custom Styling and Layout

```jsx
import Taxonium from "taxonium-component";

function StyledApp() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(to bottom, #1e3c72, #2a5298)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 10px 50px rgba(0,0,0,0.3)",
        }}
      >
        <Taxonium
          backendUrl="https://api.cov2tree.org"
          configDict={{
            title: "Styled Tree Viewer",
            colorMapping: {
              "Alpha": [255, 200, 100],
              "Delta": [100, 200, 255],
            },
          }}
        />
      </div>
    </div>
  );
}
```

### Example 5: Responsive Design

```jsx
import { useState, useEffect } from "react";
import Taxonium from "taxonium-component";

function ResponsiveApp() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Taxonium
        backendUrl="https://api.cov2tree.org"
        sidePanelHiddenByDefault={isMobile}
      />
    </div>
  );
}
```

### Example 6: Loading Local Files

```jsx
import { useState } from "react";
import Taxonium from "taxonium-component";

function FileLoaderApp() {
  const [sourceData, setSourceData] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const filetype = file.name.endsWith(".nwk") ? "nwk" : "jsonl";

    setSourceData({
      status: "loaded",
      filename: file.name,
      filetype,
      data: text,
    });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 10 }}>
        <input type="file" accept=".nwk,.jsonl" onChange={handleFileUpload} />
      </div>
      <div style={{ flex: 1 }}>
        {sourceData ? (
          <Taxonium sourceData={sourceData} />
        ) : (
          <div style={{ padding: 20 }}>
            <p>Please upload a tree file (.nwk or .jsonl)</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## TypeScript Support

Taxonium is written in TypeScript and provides full type definitions.

### Basic TypeScript Usage

```tsx
import Taxonium from "taxonium-component";
import type { NodeDetails } from "taxonium-component";

interface AppState {
  selectedNodeId: string | number | null;
  nodeDetails: NodeDetails | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    selectedNodeId: null,
    nodeDetails: null,
  });

  const handleNodeSelect = (nodeId: string | number | null): void => {
    setState((prev) => ({ ...prev, selectedNodeId: nodeId }));
  };

  const handleNodeDetailsLoaded = (
    nodeId: string | number | null,
    nodeDetails: NodeDetails | null
  ): void => {
    setState((prev) => ({ ...prev, nodeDetails }));
  };

  return (
    <Taxonium
      backendUrl="https://api.cov2tree.org"
      onNodeSelect={handleNodeSelect}
      onNodeDetailsLoaded={handleNodeDetailsLoaded}
    />
  );
}
```

### Type Definitions

```typescript
import type {
  NodeDetails,
  Query,
  Config,
  SourceData,
  Mutation,
  NodeSelectHandler,
  NodeDetailsLoadedHandler,
} from "taxonium-component";

// SourceData type
interface SourceData {
  status: "loaded" | "url_supplied";
  filename: string;
  filetype: "nwk" | "jsonl" | "json" | "nexus";
  data?: string;
  metadata?: {
    filename: string;
    status: "loaded" | "url_supplied";
    filetype: "meta_csv" | "meta_tsv";
    data?: string;
  };
}

// NodeDetails type
interface NodeDetails {
  node_id: string | number;
  name?: string;
  meta?: Record<string, any>;
  mutations?: Mutation[];
  acknowledgements?: {
    covv_orig_lab?: string;
    covv_subm_lab?: string;
    covv_authors?: string;
    authors?: string;
  };
  [key: string]: unknown;
}

// Event handler types
type NodeSelectHandler = (nodeId: string | number | null) => void;
type NodeDetailsLoadedHandler = (
  nodeId: string | number | null,
  nodeDetails: NodeDetails | null
) => void;
```

---

## Storybook Demo

Explore interactive examples and experiment with different configurations using Storybook:

### Running Storybook Locally

```bash
cd taxonium_component
npm install
npm run storybook
```

Storybook will launch at [http://localhost:6006](http://localhost:6006).

### Available Stories

The Storybook demo includes examples for:
- Backend integration
- Local data loading
- Metadata attachment
- Custom color mapping
- Event handlers
- Configuration options
- Different file formats

---

## Building from Source

To build the component yourself:

```bash
cd taxonium_component
npm install
npm run build
```

The compiled bundles will be written to `taxonium_component/dist/` in both ES module and UMD formats.

### Development Mode

Run the development server with hot reloading:

```bash
npm run dev
```

### Running Tests

```bash
npm run test
```

---

## Advanced Topics

### Performance Optimization

For large trees (>100k nodes):

1. **Use backend mode**: Backend mode streams only visible nodes, enabling trees with millions of nodes
2. **Limit metadata**: Include only necessary metadata fields
3. **Use JSONL format**: Pre-processed JSONL trees load faster than raw Newick

### Custom Backends

Create your own Taxonium backend to serve tree data dynamically. See the [advanced documentation](./advanced.md) for backend API specifications.

### Integration with Other Tools

Taxonium can integrate with:
- **JBrowse**: Genome browser for viewing sequences
- **Nextstrain**: Import Nextstrain JSON trees
- **GISAID**: Specialized integration for SARS-CoV-2 data

---

## Troubleshooting

### Component doesn't render

**Problem:** Empty or blank screen

**Solutions:**
- Ensure parent container has defined `width` and `height` (e.g., `100%` or `500px`)
- Check browser console for errors
- Verify React version is 19+

```jsx
// Good
<div style={{ width: "100%", height: "600px" }}>
  <Taxonium backendUrl="..." />
</div>

// Bad - no height defined
<div>
  <Taxonium backendUrl="..." />
</div>
```

### Data doesn't load

**Problem:** Tree doesn't appear after providing `sourceData`

**Solutions:**
- Verify `filetype` matches actual file format
- Check `status` is either `"loaded"` or `"url_supplied"`
- Ensure `data` is provided when `status` is `"loaded"`
- Check browser network tab for failed requests when using URLs

### Events not firing

**Problem:** `onNodeSelect` or `onNodeDetailsLoaded` not called

**Solutions:**
- Ensure handlers are stable (wrap in `useCallback` if needed)
- Verify nodes are clickable (not filtered out by search)
- Check backend is responding with node details

### Performance issues

**Problem:** Slow rendering or interaction

**Solutions:**
- Use backend mode for trees >50k nodes
- Reduce metadata fields to only necessary columns
- Enable hardware acceleration in browser settings
- Consider using JSONL pre-processed format

---

## Additional Resources

- **Main Documentation**: [Taxonium Docs](https://docs.taxonium.org)
- **GitHub Repository**: [github.com/theosanderson/taxonium](https://github.com/theosanderson/taxonium)
- **Paper**: [eLife 2022](https://doi.org/10.7554/eLife.82392)
- **Example Deployments**: [taxonium.org](https://taxonium.org), [cov2tree.org](https://cov2tree.org)

---

## License

Taxonium is released under the MIT License. See the [LICENSE](https://github.com/theosanderson/taxonium/blob/master/LICENSE) file for details.
