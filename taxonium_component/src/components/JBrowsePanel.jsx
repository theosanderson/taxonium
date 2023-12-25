import React, { useMemo, useEffect, useRef, useState } from "react";
import "@fontsource/roboto";
import "@jbrowse/plugin-data-management";
import "../App.css";
import useTreenomeAnnotations from "../hooks/useTreenomeAnnotations";
import {
  createViewState,
  JBrowseLinearGenomeView,
} from "@jbrowse/react-linear-genome-view";
import { protect, unprotect } from "mobx-state-tree";

function JBrowsePanel(props) {
  const treenomeAnnotations = useTreenomeAnnotations(props.settings);

  const assembly = useMemo(() => {
    return {
      name: props.settings.chromosomeName
        ? props.settings.chromosomeName
        : "chromosome",
      sequence: {
        type: "ReferenceSequenceTrack",
        trackId: props.settings.chromosomeName + "-ReferenceSequenceTrack",
        adapter: {
          type: "FromConfigSequenceAdapter",
          features: [
            {
              refName: props.settings.chromosomeName,
              uniqueId: props.settings.chromosomeName,
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
    props.settings.chromosomeName,
  ]);

  const [userTracks, setUserTracks] = useState([]);

  const tracks = useMemo(() => {
    const covTracks = [
      {
        type: "FeatureTrack",
        trackId: "nextstrain-annotations",
        name: "Genes",
        assemblyNames: [props.settings.chromosomeName],
        category: [],
        adapter: {
          type: "FromConfigAdapter",
          features: [
            {
              refName: props.settings.chromosomeName,
              name: "E",
              uniqueId: 4,
              start: 26244,
              end: 26472,
              fill: "#D9AD3D",
            },
            {
              refName: props.settings.chromosomeName,
              name: "M",
              uniqueId: 5,
              start: 26522,
              end: 27191,
              fill: "#5097BA",
            },
            {
              refName: props.settings.chromosomeName,
              name: "N",
              uniqueId: 10,
              start: 28273,
              end: 29533,
              fill: "#E67030",
            },
            {
              refName: props.settings.chromosomeName,
              name: "Orf1a",
              uniqueId: 0,
              start: 265,
              end: 13468,
              fill: "#8EBC66",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF1b",
              uniqueId: 1,
              start: 13467,
              end: 21555,
              fill: "#E59637",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF3a",
              uniqueId: 3,
              start: 25392,
              end: 26220,
              fill: "#AABD52",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF6",
              uniqueId: 6,
              start: 27201,
              end: 27387,
              fill: "#DF4327",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF7a",
              uniqueId: 7,
              start: 27393,
              end: 27759,
              fill: "#C4B945",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF7b",
              uniqueId: 8,
              start: 27755,
              end: 27887,
              fill: "#75B681",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF8",
              uniqueId: 9,
              start: 27893,
              end: 28259,
              fill: "#60AA9E",
            },
            {
              refName: props.settings.chromosomeName,
              name: "ORF9b",
              uniqueId: 11,
              start: 28283,
              end: 28577,
              fill: "#D9AD3D",
            },
            {
              refName: props.settings.chromosomeName,
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
    if (props.settings.isCov2Tree) {
      return userTracks.concat(covTracks);
    } else {
      return userTracks;
    }
  }, [
    props.settings.chromosomeName,
    props.settings.isCov2Tree,
    treenomeAnnotations.json,
    userTracks,
  ]);

  useEffect(() => {});
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
              main: "#aaa",
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

  const [freezeTracks, setFreezeTracks] = useState([]);
  const [enabledTracks, setEnabledTracks] = useState([]);

  const state = useMemo(() => {
    setFreezeTracks(enabledTracks);
    return createViewState({
      assembly,
      tracks: tracks,
      location: props.settings.isCov2Tree
        ? `${props.settings.chromosomeName}:0-29903`
        : props.settings.chromosomeName +
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
    });
  }, [
    assembly,
    props.settings.isCov2Tree,
    props.settings.chromosomeName,
    tracks,
    defaultSession,
    theme,
  ]);

  useEffect(() => {
    if (
      freezeTracks.length > 0 &&
      state &&
      state.session &&
      state.session.view
    ) {
      freezeTracks.forEach((t) =>
        state.session.view.showTrack(t.configuration.trackId),
      );
    }
  }, [freezeTracks, state]);

  useEffect(() => {
    if (state && state.session && state.session.view) {
      setEnabledTracks(state.session.view.tracks);
    }
  }, [state]);

  const [showThis, setShowThis] = useState(null);

  useEffect(() => {
    if (showThis && state && state.session && state.session.view) {
      state.session.view.showTrack(showThis);
      setShowThis(null);
    }
  }, [showThis, state]);

  useEffect(() => {
    if (state && state.session && state.session.view) {
      const widget = state.session.addWidget(
        "AddTrackWidget",
        "addTrackWidget",
        { view: state.session.view.id },
      );
      // AddTrackWidget calls session.addTrackConf, which
      // doesn't appear to be defined in the session object
      // for some reason. So we add it here.
      unprotect(state);
      state.session.addTrackConf = (trackConf) => {
        setUserTracks((userTracks) => [...userTracks, trackConf]);
        setShowThis(trackConf.trackId);
      };
      protect(state);
    }
  }, [state, userTracks]);

  useEffect(() => {
    if (!props.treenomeState.ntBoundsExt) {
      return;
    }
    const v = state.session.view;
    v.navToLocString(
      props.settings.chromosomeName +
        ":" +
        props.treenomeState.ntBoundsExt[0] +
        ".." +
        props.treenomeState.ntBoundsExt[1],
    );
    props.treenomeState.setNtBoundsExt(null);
  }, [props.settings.chromosomeName, props.treenomeState, state.session.view]);

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
