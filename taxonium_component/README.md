# Taxonium component

This React component allows phylogenetic trees of up to millions of nodes to be efficiently viewed in the browser.

You can try out Taxonium at [taxonium.org](https://taxonium.org).

You can also find fuller [documentation for the component](https://docs.taxonium.org/en/latest/component.html) and how to embed it in your own site.


## Basics

Set up the source data:
```{js}

const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

const metadata_text = 
`Node,Name,Species
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

```

In React, 

```{js}
import Taxonium from 'taxonium-component';

const App = () => {
  return (
    <Taxonium sourceData={sourceData} />
  );
};
```

In basic HTML, 

```{html}
<body>
  <div id="root"></div>

  <!-- Include peer dependencies -->
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>

  <!-- Include Taxonium Component -->
  <script src="https://unpkg.com/taxonium-component@2.100.0/dist/taxonium-component.umd.js"></script>

  <script>
    const MyComponent = TaxoniumComponent.Taxonium;

    ReactDOM.render(
      React.createElement(MyComponent, { sourceData: sourceData}),
      document.getElementById('root')
    );
  </script>
</body>
```




### Developing the package

```
yarn install
yarn storybook
```