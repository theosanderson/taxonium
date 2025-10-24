# Taxonium React Component

Taxonium is now available as a React component. There are a few different ways you can use this.

```{eval-rst}
.. note::
    This component is new and in flux.
```

## Basic HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taxonium Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    #root {
      width: 100vw;
      height: 100vh;
    }
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
      const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

      const metadata_text = `Node,Name,Species
A,Bob,Cow
B,Jim,Cow
C,Joe,Fish
D,John,Fish`;

      // Metadata is optional
      const metadata = {
        filename: "test.csv",
        data: metadata_text,
        status: "loaded",
        filetype: "meta_csv",
      };

      const sourceData = {
        status: "loaded",
        filename: "test.nwk",
        data: nwk,
        filetype: "nwk",
        metadata: metadata,
      };
      
      return h(Taxonium, { sourceData: sourceData });
    }

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
  </script>
</body>
</html>
```

## In a React project

### Install Taxonium Component

```
npm install taxonium-component
```

### Import and use Taxonium Component in your React jsx

```js
import Taxonium from "taxonium-component";

const App = () => {
  return <Taxonium backendUrl="https://api.cov2tree.org" />;
};
```


## Properties

In either case the following properties are available.

| Property   | Type                  | Default | Description                                                    |
| ---------- | --------------------- | ------- | -------------------------------------------------------------- |
| backendUrl | string                | None    | (Optional) a backend to connect to                             |
| sourceData | Javascript dictionary | None    | (Optional) Tree / metadata to load locally (see section below) |
| configDict | Javascript dictionary | None    | (Optional) configuration (see [advanced](./advanced.md))       |

## sourceData

The `sourceData` property allows you to load a tree and metadata directly into the component.

Examples:

```js
sourceData: {
      status: "url_supplied",
      filename:
        "https://cov2tree.nyc3.cdn.digitaloceanspaces.com/ncbi/special_filtered.jsonl.gz",
      filetype: "jsonl",
}
```

```js
 sourceData: {
      status: "loaded",
      filename: "test.nwk",
      data: `((A:0.1,B:0.2):0.3,C:0.4);`,
      filetype: "nwk",
    }
```

## Building the library

To build the component yourself, run:

```bash
cd taxonium_component
npm install
npm run build
```

The bundles will be written to `taxonium_component/dist`.

## Demo

You can experiment with the component locally via Storybook:

```bash
npm run storybook
```

By default Storybook runs at [http://localhost:6006](http://localhost:6006).


## In an Angular project

Taxonium can be integrated into Angular applications using a React wrapper directive. This approach allows you to embed the React-based Taxonium component seamlessly within your Angular templates.

### Install Dependencies

```bash
npm install taxonium-component react react-dom
npm install --save-dev @types/react @types/react-dom
```

### Create the React Wrapper Directive

Create a directive file `taxonium-react.directive.ts`:

```typescript
import { Directive, ElementRef, Input, OnChanges, OnInit, OnDestroy, SimpleChanges } from '@angular/core';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';

@Directive({
  selector: '[appTaxoniumReact]',
  standalone: true,
})
export class TaxoniumReactDirective implements OnInit, OnChanges, OnDestroy {
  @Input() backendUrl?: string;
  @Input() sourceData?: any;
  @Input() configDict?: any;
  @Input() metadata?: any;

  private root: Root | null = null;
  private Taxonium: any = null;
  private isBrowser = typeof window !== 'undefined';
  private mounted = false;

  constructor(private el: ElementRef) {}

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;

    const module = await import('taxonium-component');
    this.Taxonium = module.default;

    this.tryRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.tryRender();
  }

  private tryRender() {
    if (!this.isBrowser || !this.Taxonium || this.mounted) return;
    if (!this.sourceData || (!this.sourceData.data && !this.sourceData.filename)) return;

    this.root = createRoot(this.el.nativeElement);
    const element = React.createElement(this.Taxonium, {
      backendUrl: this.backendUrl,
      sourceData: this.sourceData,
      configDict: this.configDict,
      metadata: this.metadata,
      height: "100%",
      width: "100%",
    });

    this.root.render(element);
    this.mounted = true;
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.root?.unmount();
      this.mounted = false;
    }
  }
}
```

### Use in Your Component

Create or update your Angular component:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxoniumReactDirective } from './taxonium-react.directive';

@Component({
  selector: 'app-phylogenetics',
  templateUrl: './phylogenetics.component.html',
  imports: [TaxoniumReactDirective, CommonModule],
  styleUrls: ['./phylogenetics.component.scss'],
})
export class PhylogeneticsComponent {
  isBrowser = typeof window !== 'undefined';

  // Example Newick tree data
  nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

  // Example metadata
  metadata = {
    filename: "test.csv",
    data: `Node,Name,Species
A,Bob,Cow
B,Jim,Cow
C,Joe,Fish
D,John,Fish`,
    status: "loaded",
    filetype: "meta_csv",
  };
}
```

### Template Usage

In your component template (`phylogenetics.component.html`):

```html
<ng-container *ngIf="isBrowser">
  <div
    appTaxoniumReact
    [sourceData]="{
      status: 'loaded',
      filename: 'test.nwk',
      data: nwk,
      filetype: 'nwk'
    }"
    [metadata]="metadata"
    style="width: 100%; height: 600px;"
  ></div>
</ng-container>
```

### Alternative: Using a Backend URL

You can also connect to a Taxonium backend instead of loading data locally:

```html
<ng-container *ngIf="isBrowser">
  <div
    appTaxoniumReact
    [backendUrl]="'https://api.cov2tree.org'"
    style="width: 100%; height: 600px;"
  ></div>
</ng-container>
```

### Component Styling

Add styles to your component's SCSS file to ensure proper display:

```scss
.map-content {
  width: 100%;
  height: 100vh;
  min-height: 600px;
}
```


