import React, { useMemo, useEffect } from "react";
import "@fontsource/roboto";
import "../App.css";
import useTreenomeAnnotations from "../hooks/useTreenomeAnnotations";

import {
  createViewState,
  JBrowseLinearGenomeView,
} from "@jbrowse/react-linear-genome-view";

function JBrowsePanel(props) {
  const treenomeAnnotations = useTreenomeAnnotations();

  const assembly = useMemo(() => {
    return {
      name: props.treenomeState.chromosomeName
        ? props.treenomeState.chromosomeName
        : "chromosome",
      sequence: {
        type: "ReferenceSequenceTrack",
        trackId: props.treenomeState.chromosomeName + "-ReferenceSequenceTrack",
        adapter: {
          type: "FromConfigSequenceAdapter",
          features: [
            {
              refName: props.treenomeState.chromosomeName,
              uniqueId: props.treenomeState.chromosomeName,
              start: 0,
              end:
                props.treenomeState.genomeSize > 0
                  ? props.treenomeState.genomeSize
                  : 29903,
              seq: props.treenomeState.genome
                ? props.treenomeState.genome
                : "A",
            },
          ],
        },
      },
    };
  }, [
    props.treenomeState.genome,
    props.treenomeState.genomeSize,
    props.treenomeState.chromosomeName,
  ]);

  const tracks = useMemo(() => {
    return [
      {
        type: "FeatureTrack",
        trackId: "nextstrain-annotations",
        name: "Genes",
        assemblyNames: ["NC_045512v2"],
        category: [],
        adapter: {
          type: "FromConfigAdapter",
          features: [
            {
              refName: "NC_045512v2",
              name: "E",
              uniqueId: 4,
              start: 26244,
              end: 26472,
              fill: "#D9AD3D",
            },
            {
              refName: "NC_045512v2",
              name: "M",
              uniqueId: 5,
              start: 26522,
              end: 27191,
              fill: "#5097BA",
            },
            {
              refName: "NC_045512v2",
              name: "N",
              uniqueId: 10,
              start: 28273,
              end: 29533,
              fill: "#E67030",
            },
            {
              refName: "NC_045512v2",
              name: "Orf1a",
              uniqueId: 0,
              start: 265,
              end: 13468,
              fill: "#8EBC66",
            },
            {
              refName: "NC_045512v2",
              name: "ORF1b",
              uniqueId: 1,
              start: 13467,
              end: 21555,
              fill: "#E59637",
            },
            {
              refName: "NC_045512v2",
              name: "ORF3a",
              uniqueId: 3,
              start: 25392,
              end: 26220,
              fill: "#AABD52",
            },
            {
              refName: "NC_045512v2",
              name: "ORF6",
              uniqueId: 6,
              start: 27201,
              end: 27387,
              fill: "#DF4327",
            },
            {
              refName: "NC_045512v2",
              name: "ORF7a",
              uniqueId: 7,
              start: 27393,
              end: 27759,
              fill: "#C4B945",
            },
            {
              refName: "NC_045512v2",
              name: "ORF7b",
              uniqueId: 8,
              start: 27755,
              end: 27887,
              fill: "#75B681",
            },
            {
              refName: "NC_045512v2",
              name: "ORF8",
              uniqueId: 9,
              start: 27893,
              end: 28259,
              fill: "#60AA9E",
            },
            {
              refName: "NC_045512v2",
              name: "ORF9b",
              uniqueId: 11,
              start: 28283,
              end: 28577,
              fill: "#D9AD3D",
            },
            {
              refName: "NC_045512v2",
              name: "S",
              uniqueId: 2,
              start: 21562,
              end: 25384,
              fill: "#5097BA",
            },
          ],
        },
        displays: [
          {
            type: "LinearBasicDisplay",
            displayId: "nextstrain-color-display",
            renderer: {
              type: "SvgFeatureRenderer",
              color1: "jexl:get(feature,'fill') || 'black'",
            },
          },
        ],
      },
      ...treenomeAnnotations.json,
    ];
  }, [treenomeAnnotations.json]);

  const defaultSession = useMemo(() => {
    return {
      name: "Default",
      view: {
        id: "linearGenomeView",
        type: "LinearGenomeView",
        hideCloseButton: true,
        tracks: props.settings.isCov2Tree
          ? [
              {
                type: "FeatureTrack",
                configuration: "nextstrain-annotations",
                displays: [
                  {
                    type: "LinearBasicDisplay",
                    configuration: "nextstrain-color-display",
                    height: 60,
                  },
                ],
              },
            ]
          : [],
      },
    };
  }, [props.settings.isCov2Tree]);

  const theme = useMemo(() => {
    return {
      configuration: {
        theme: {
          palette: {
            primary: {
              main: "#555e6c",
            },
            secondary: {
              main: "#2463eb",
            },
            tertiary: {
              main: "#bcbcbc",
            },
            quaternary: {
              main: "#2463eb",
            },
          },
        },
      },
    };
  }, []);

  const state = useMemo(
    () =>
      createViewState({
        assembly,
        tracks: props.settings.isCov2Tree ? tracks : undefined,
        location: props.settings.isCov2Tree
          ? "NC_045512v2:0-29903"
          : props.treenomeState.chromosomeName +
            ":0-" +
            props.treenomeState.genomeSize,
        defaultSession: defaultSession,
        ...theme,
        onChange: (patch) => {
          if (patch.op !== "replace") {
            return;
          }
          const v = state.session.view;

          const leftNtBound = v.offsetPx * v.bpPerPx;
          const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
          if (
            leftNtBound !== props.treenomeState.ntBounds[0] ||
            rightNtBound !== props.treenomeState.ntBounds[1]
          ) {
            props.treenomeState.setNtBounds([leftNtBound, rightNtBound]);
          }
          const pxPerBp = 1 / v.bpPerPx;
          if (pxPerBp !== props.treenomeState.pxPerBp) {
            props.treenomeState.setPxPerBp(pxPerBp);
          }
        },
      }),
    [assembly, tracks, props.settings.isCov2Tree, defaultSession, theme]
  );
  // TODO: Adding treenomState as dependency above breaks things

  useEffect(() => {
    if (!props.treenomeState.ntBoundsExt) {
      return;
    }
    const v = state.session.view;
    v.navToLocString(
      props.treenomeState.chromosomeName +
        ":" +
        props.treenomeState.ntBoundsExt[0] +
        ".." +
        props.treenomeState.ntBoundsExt[1]
    );
    props.treenomeState.setNtBoundsExt(null);
  }, [props.treenomeState, state.session.view]);

  useEffect(() => {
    const v = state.session.view;
    if (!v.initialized) {
      return;
    }
    const leftNtBound = v.offsetPx * v.bpPerPx;
    const rightNtBound = v.offsetPx * v.bpPerPx + v.width * v.bpPerPx;
    if (
      leftNtBound !== props.treenomeState.ntBounds[0] ||
      rightNtBound !== props.treenomeState.ntBounds[1]
    ) {
      props.treenomeState.setNtBounds([leftNtBound, rightNtBound]);
    }
    const pxPerBp = 1 / v.bpPerPx;
    if (pxPerBp !== props.treenomeState.pxPerBp) {
      props.treenomeState.setPxPerBp(pxPerBp);
    }
  }, [props.treenomeState, state.session.view]);

  return <JBrowseLinearGenomeView viewState={state} />;
}

export default JBrowsePanel;
