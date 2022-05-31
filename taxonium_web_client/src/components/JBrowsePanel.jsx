import React, { useMemo, useEffect, useState } from 'react'
import '@fontsource/roboto'
import { StylesProvider } from "@material-ui/core/styles";
import "../App.css";

import {
  createViewState,
  JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view'

const referenceUrl = 'https://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/bigZips/wuhCor1.2bit'

function JBrowsePanel(props) {

  const assembly = useMemo(() => {
    return {
      name: 'NC_045512v2',
      sequence: {
        type: 'ReferenceSequenceTrack',
        trackId: 'NC_045512v2-ReferenceSequenceTrack',
        adapter: {
          type: 'TwoBitAdapter',
          twoBitLocation: {
            uri: referenceUrl,
            locationType: 'UriLocation',
          },
        },
      },
    }
  }, []);

  const tracks = useMemo(() => {
    return [
      {
        type: 'FeatureTrack',
        trackId: 'nextstrain-annotations',
        name: 'Genes',
        assemblyNames: ['NC_045512v2'],
        category: ['Annotation'],
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
      {
        type: "FeatureTrack",
        trackId: "ARTIC-v4.1",
        name: "ARTIC v4.1",
        assemblyNames: ['NC_045512v2'],
        category: ['Annotation'],
        adapter: {
          type: 'BigBedAdapter',
          bigBedLocation: {
            uri: 'https://hgdownload.soe.ucsc.edu/gbdb/wuhCor1/bbi/articV4.1.bb',
            locationType: 'UriLocation',
          },
        },
      },
      {
        type: "FeatureTrack",
        trackId: "shannon-entropy",
        name: "Shannon Entropy",
        assemblyNames: ['NC_045512v2'],
        category: ['Annotation'],
        adapter: {
          type: 'BigWigAdapter',
          bigWigLocation: {
            uri: 'https://hgdownload.soe.ucsc.edu/gbdb/wuhCor1/pyle/Full_Length_Shannon_Entropy.bw',
            locationType: 'UriLocation',
          }
        }
      }
    ]
  }, []);

  const defaultSession = useMemo(() => {
    return {
      name: 'Default',
      view: {
        id: 'linearGenomeView',
        type: 'LinearGenomeView',
        hideHeader: true,
        hideCloseButton: true,
        tracks: [
          {
            type: 'ReferenceSequenceTrack',
            configuration: 'NC_045512v2-ReferenceSequenceTrack',
            displays: [
              {
                type: 'LinearReferenceSequenceDisplay',
                configuration:
                  'NC_045512v2-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
                  height: 40
              },
            ],
          },
          {
            type: 'FeatureTrack',
            configuration: 'nextstrain-annotations',
            displays: [
              {
                type: 'LinearBasicDisplay',
                configuration: 'nextstrain-color-display',
                height: 100
              },
            ],
          },
          {
            type: 'FeatureTrack',
            configuration: 'ARTIC-v4.1',
            displays: [
              {
                type: 'LinearBasicDisplay',
        //        configuration: 'ARTIC-v4.1',
                height: 100
              },
            ]
          }
        ],
      },
    }
  }, []);

  useEffect(() => {
    console.log("??")
    if (!props.browserState.ntBoundsExt) {
      return;
    }
    const v = state.session.view;
    v.navToLocString('NC_045512v2:' + props.browserState.ntBoundsExt[0] + '..' + props.browserState.ntBoundsExt[1]);
    console.log("nav to " + 'NC_045512v2:' + props.browserState.ntBoundsExt[0] + '..' + props.browserState.ntBoundsExt[1])
    props.browserState.setNtBoundsExt(null);

  }, [props.browserState.ntBoundsExt]);


  // Read JBrowse state to determine nt bounds
  const onChange = (patch) => {
    if (patch.op != "replace") {
      return;
    }
    const v = state.session.view;

    const leftNtBound = v.offsetPx * v.bpPerPx;
    const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
    if (leftNtBound != props.browserState.ntBounds[0] || rightNtBound != props.browserState.ntBounds[1]) {
      props.browserState.setNtBounds([leftNtBound, rightNtBound]);
   }
   const pxPerBp = 1 / v.bpPerPx;
   if (pxPerBp != props.browserState.pxPerBp) {
     props.browserState.setPxPerBp(pxPerBp);
   }
  };
  const state = useMemo(() => createViewState({
    assembly,
    tracks,
    location: 'NC_045512v2:0-29903',
    defaultSession,
    onChange: onChange
  }), [assembly, tracks, defaultSession]);

  useEffect(() => {
    const v = state.session.view;
    if (!v.initialized) {
      return;
    }
    const leftNtBound = v.offsetPx * v.bpPerPx;
    const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
    if (leftNtBound != props.browserState.ntBounds[0] || rightNtBound != props.browserState.ntBounds[1]) {
      props.browserState.setNtBounds([leftNtBound, rightNtBound]);
   }
   const pxPerBp = 1 / v.bpPerPx;
   if (pxPerBp != props.browserState.pxPerBp) {
     props.browserState.setPxPerBp(pxPerBp);
   }
  }, [props.browserState, state.session.view]);

  return (
    <JBrowseLinearGenomeView viewState={state} />
  );
}

export default JBrowsePanel