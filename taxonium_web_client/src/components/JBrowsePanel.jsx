import React, { useMemo, useEffect, useState } from 'react'
import '@fontsource/roboto'
import { StylesProvider } from "@material-ui/core/styles";
import "../App.css";
import useGenomeBrowserAnnotations from '../hooks/useGenomeBrowserAnnotations';

import {
  createViewState,
  JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view'

const referenceUrl = 'https://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/bigZips/wuhCor1.2bit'

function JBrowsePanel(props) {

  const genomeBrowserAnnotations = useGenomeBrowserAnnotations();

  const assembly = useMemo(() => {
      return {
        name: props.genomeBrowserState.chromosomeName ? props.genomeBrowserState.chromosomeName : 'chromosome',
        sequence: {
          type: 'ReferenceSequenceTrack',
          trackId: props.genomeBrowserState.chromosomeName + '-ReferenceSequenceTrack',
          adapter: {
            type: 'FromConfigSequenceAdapter',
            features: [{
              refName: props.genomeBrowserState.chromosomeName,
              uniqueId: props.genomeBrowserState.chromosomeName,
              start: 0,
              end: props.genomeBrowserState.genomeSize > 0 ? props.genomeBrowserState.genomeSize : 1,
              seq: props.genomeBrowserState.genome ? props.genomeBrowserState.genome : "A"
            }]
          }
        }
      }

}, [props.genomeBrowserState.isCov2Tree, props.genomeBrowserState.genome, props.genomeBrowserState.genomeSize, props.genomeBrowserState.chromosomeName]);

const tracks = useMemo(() => {
  return [
    {
      type: 'FeatureTrack',
      trackId: 'nextstrain-annotations',
      name: 'Genes',
      assemblyNames: ['NC_045512v2'],
      category: [],
      adapter: {
        type: 'FromConfigAdapter',
        features: [
          {
            "refName": "NC_045512v2",
            "name": "E",
            "uniqueId": 4,
            "start": 26244,
            "end": 26472,
            "fill": "#D9AD3D"
          },
          {
            "refName": "NC_045512v2",
            "name": "M",
            "uniqueId": 5,
            "start": 26522,
            "end": 27191,
            "fill": "#5097BA"
          },
          {
            "refName": "NC_045512v2",
            "name": "N",
            "uniqueId": 10,
            "start": 28273,
            "end": 29533,
            "fill": "#E67030"
          },
          {
            "refName": "NC_045512v2",
            "name": "Orf1a",
            "uniqueId": 0,
            "start": 265,
            "end": 13468,
            "fill": "#8EBC66"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF1b",
            "uniqueId": 1,
            "start": 13467,
            "end": 21555,
            "fill": "#E59637"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF3a",
            "uniqueId": 3,
            "start": 25392,
            "end": 26220,
            "fill": "#AABD52"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF6",
            "uniqueId": 6,
            "start": 27201,
            "end": 27387,
            "fill": "#DF4327"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF7a",
            "uniqueId": 7,
            "start": 27393,
            "end": 27759,
            "fill": "#C4B945"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF7b",
            "uniqueId": 8,
            "start": 27755,
            "end": 27887,
            "fill": "#75B681"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF8",
            "uniqueId": 9,
            "start": 27893,
            "end": 28259,
            "fill": "#60AA9E"
          },
          {
            "refName": "NC_045512v2",
            "name": "ORF9b",
            "uniqueId": 11,
            "start": 28283,
            "end": 28577,
            "fill": "#D9AD3D"
          },
          {
            "refName": "NC_045512v2",
            "name": "S",
            "uniqueId": 2,
            "start": 21562,
            "end": 25384,
            "fill": "#5097BA"
          }
        ]
      },
      displays: [
        {
          type: "LinearBasicDisplay",
          displayId: "nextstrain-color-display",
          renderer: {
            type: "SvgFeatureRenderer",
            color1: "jexl:get(feature,'fill') || 'black'"
          }
        }
      ]
    },
    ...genomeBrowserAnnotations.json
  ]
}, [genomeBrowserAnnotations.json]);

const defaultSession = useMemo(() => {
  return {
    name: 'Default',
    view: {
      id: 'linearGenomeView',
      type: 'LinearGenomeView',
      hideCloseButton: true,
      tracks: [
        {
          type: 'FeatureTrack',
          configuration: 'nextstrain-annotations',
          displays: [
            {
              type: 'LinearBasicDisplay',
              configuration: 'nextstrain-color-display',
              height: 60,
            },
          ],

        },
      ],
    },
  }
}, []);


useEffect(() => {
  if (!props.genomeBrowserState.ntBoundsExt) {
    return;
  }
  const v = state.session.view;
  v.navToLocString('NC_045512v2:' + props.genomeBrowserState.ntBoundsExt[0] + '..' + props.genomeBrowserState.ntBoundsExt[1]);
  props.genomeBrowserState.setNtBoundsExt(null);

}, [props.genomeBrowserState]);


// Read JBrowse state to determine nt bounds
const onChange = (patch) => {
  if (patch.op != "replace") {
    return;
  }
  const v = state.session.view;

  const leftNtBound = v.offsetPx * v.bpPerPx;
  const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
  if (leftNtBound != props.genomeBrowserState.ntBounds[0] || rightNtBound != props.genomeBrowserState.ntBounds[1]) {
    props.genomeBrowserState.setNtBounds([leftNtBound, rightNtBound]);
  }
  const pxPerBp = 1 / v.bpPerPx;
  if (pxPerBp != props.genomeBrowserState.pxPerBp) {
    props.genomeBrowserState.setPxPerBp(pxPerBp);
  }
};
const theme = useMemo(() => {
  return {
    configuration: {
      theme: {
        palette: {
          primary: {
            main: '#555e6c',
          },
          secondary: {
            main: '#2463eb',
          },
          tertiary: {
            main: '#bcbcbc',
          },
          quaternary: {
            main: '#2463eb',
          },
        },
      },
    },
  }
}, []);

const state = useMemo(() => createViewState({
  assembly,
  tracks,
  location: props.genomeBrowserState.isCov2Tree ? 'NC_045512v2:0-29903' : '',
  defaultSession: props.genomeBrowserState.isCov2Tree ? defaultSession : {},
  ...theme,
  onChange: onChange
}), [assembly, tracks, defaultSession, theme, props.genomeBrowserState.isCov2Tree]);


useEffect(() => {
  const v = state.session.view;
  if (!v.initialized) {
    return;
  }
  const leftNtBound = v.offsetPx * v.bpPerPx;
  const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
  if (leftNtBound != props.genomeBrowserState.ntBounds[0] || rightNtBound != props.genomeBrowserState.ntBounds[1]) {
    props.genomeBrowserState.setNtBounds([leftNtBound, rightNtBound]);
  }
  const pxPerBp = 1 / v.bpPerPx;
  if (pxPerBp != props.genomeBrowserState.pxPerBp) {
    props.genomeBrowserState.setPxPerBp(pxPerBp);
  }
}, [props.genomeBrowserState, state.session.view]);

return (
  <JBrowseLinearGenomeView viewState={state} />
);
}

export default JBrowsePanel