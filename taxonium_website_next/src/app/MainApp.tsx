"use client";

import React, { useState, Suspense, useRef, useEffect } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import AboutOverlay from "../components/AboutOverlay";
import dynamic from "next/dynamic";
import { CgListTree } from "react-icons/cg";
import { BsInfoSquare } from "react-icons/bs";
import { FaGithub, FaArrowRight, FaSearch } from "react-icons/fa";
import { HiOutlineBookOpen } from "react-icons/hi";
import useQueryAsState from "../hooks/useQueryAsState";
import classNames from "classnames";
import { useInputHelper } from "../hooks/useInputHelper";
import InputSupplier from "../components/InputSupplier";
import { Combobox } from '@headlessui/react';

// Import TaxoniumBit with client-side only rendering to avoid SSR issues
const TaxoniumBit = dynamic(() => import("../components/TaxoniumBit"), {
  ssr: false,
});

// Hardcoded list of paths to show in the showcase
const SHOWCASE_PATHS = [
  "sars-cov-2/public",
  "taxonomy/visual",
  "taxonomy/full",
  "tuberculosis/SRA",
  "mpox/clade-I",
  "mpox/clade-IIb",
  "flu/H5N1-Outbreak",
  "flu/H5N1-Outbreak-D1-1",
];

function getConfigFromPath(pathname: string, treeConfig: Record<string, any>) {
  // Remove leading slash and get full path
  const path = pathname.substring(1);
  const decodedPath = decodeURIComponent(path);

  // Return the configuration for this path, if it exists
  return treeConfig[decodedPath] || null;
}

function MainApp({ pathname }: { pathname: string }) {
  const [treeConfig, setTreeConfig] = useState<Record<string, any>>({});
  const [isLoadingTrees, setIsLoadingTrees] = useState(true);

  const pathConfig = getConfigFromPath(pathname, treeConfig);
  const default_query = pathConfig || {};

  const [uploadedData, setUploadedData] = useState(null);
  const [query, updateQuery] = useQueryAsState(default_query);
  const [title, setTitle] = useState(null);
  const [beingDragged, setBeingDragged] = useState(false);
  const [aboutEnabled, setAboutEnabled] = useState(false);
  const [overlayContent, setOverlayContent] = useState(null);
  const [selectedTree, setSelectedTree] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viralUsherSearch, setViralUsherSearch] = useState("");

  // Fetch tree configurations from API with localStorage caching
  useEffect(() => {
    async function fetchTrees() {
      try {
        const CACHE_KEY = 'taxonium_trees_cache';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

        // Check localStorage for cached data
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Use cached data if less than 5 minutes old
          if (age < CACHE_DURATION) {
            setTreeConfig(data);
            setIsLoadingTrees(false);
            return;
          }
        }

        // Fetch fresh data from API
        const response = await fetch('/api/trees');
        const data = await response.json();

        // Cache the data with timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

        setTreeConfig(data);
      } catch (error) {
        console.error('Error fetching trees:', error);
      } finally {
        setIsLoadingTrees(false);
      }
    }
    fetchTrees();
  }, []);

  // Update document title when title changes
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  // Sync selectedTree with current pathname
  useEffect(() => {
    if (!pathname) return;
    const path = pathname.substring(1);
    const decodedPath = decodeURIComponent(path);
    if (decodedPath && treeConfig[decodedPath]) {
      setSelectedTree(decodedPath);
    }
  }, [pathname, treeConfig]);

  const dragTimeout = useRef<NodeJS.Timeout | null>(null);

  const inputHelper = useInputHelper({
    setUploadedData,
    updateQuery,
    query,
    uploadedData,
  });

  function onDrop(ev: React.DragEvent) {
    console.log("File(s) dropped");
    setBeingDragged(false);
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        if (ev.dataTransfer.items[i].kind === "file") {
          var file = ev.dataTransfer.items[i].getAsFile();
          if (file) inputHelper.readFile(file);
        }
      }
    } else {
      inputHelper.readFile(ev.dataTransfer.files[0]);
    }
  }

  function onDragOver(ev: React.DragEvent) {
    if (
      uploadedData &&
      ((uploadedData as any).status === "loaded" || (uploadedData as any).status === "loading")
    ) {
      ev.preventDefault();
      return;
    }
    setBeingDragged(true);
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }
    ev.preventDefault();
  }

  function onDragLeave(ev: React.DragEvent) {
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
    }
    dragTimeout.current = setTimeout(() => {
      setBeingDragged(false);
    }, 500);
  }

  // Generate showcase items from hardcoded list
  const showCase = SHOWCASE_PATHS.map((path) => {
    const config = treeConfig[path];
    if (!config) {
      return null;
    }
    return {
      title: config.title,
      url: `/${path}`,
      desc: config.description,
      icon: config.icon,
      maintainerMessage: config.maintainerMessage,
    };
  }).filter(Boolean); // Remove any null entries from missing configs

  // Get viral_usher trees and filter by search
  const viralUsherTrees = Object.entries(treeConfig)
    .filter(([path]) => path.startsWith('viral-usher/'))
    .map(([path, config]) => ({
      path,
      title: config.title,
      description: config.description,
      organism: config.metadata?.organism || '',
      tipCount: config.metadata?.tipCount || '',
      icon: config.icon,
    }))
    .sort((a, b) => {
      // Sort by tip count descending (largest trees first)
      const countA = parseInt(a.tipCount) || 0;
      const countB = parseInt(b.tipCount) || 0;
      return countB - countA;
    });

  const filteredViralUsherTrees = viralUsherTrees.filter(tree =>
    viralUsherSearch === '' ||
    tree.title.toLowerCase().includes(viralUsherSearch.toLowerCase()) ||
    tree.organism.toLowerCase().includes(viralUsherSearch.toLowerCase())
  );

  // Filter trees based on search query
  const filteredTrees = Object.keys(treeConfig)
    .filter(path =>
      searchQuery === '' ||
      path.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort()
    .slice(0, 1500); // Limit to 500 results for performance

  useEffect(() => {
    if (selectedTree) {
      const currentPath = pathname.substring(1);
      const decodedPath = decodeURIComponent(currentPath);
      // Only navigate if the selected tree is different from current path
      if (selectedTree !== decodedPath) {
        const newPath = `/${selectedTree}${window.location.search}`;
        window.location.href = newPath; // Trigger a page refresh on selection change
      }
    }
  }, [selectedTree, pathname]);

  return (
    <>
      <AboutOverlay
        enabled={aboutEnabled}
        setEnabled={setAboutEnabled}
        overlayContent={overlayContent}
      />
      <ReactTooltip
        id="global-tooltip"
        delayHide={400}
        className="infoTooltip"
        place="top"
        style={{ backgroundColor: "#e5e7eb", color: "#000" }}
      />

      <div
        className={`h-screen w-screen flex flex-col ${
          (query as any).backend ||
          (uploadedData &&
            ((uploadedData as any).status === "loaded" ||
              (uploadedData as any).status === "url_supplied"))
            ? "overflow-hidden"
            : "overflow-auto"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {beingDragged && (
          <div className="bg-sky-200 p-5 font-bold">Drop file to import</div>
        )}
        <div
          className={classNames(
            "from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md",
            "flex justify-between items-center px-4 flex-shrink-0",
            "h-16"
          )}
        >
          <h1 className="text-xl text-white flex items-center space-x-2">
            {title ? (
              <>
                {/* Mobile view - hidden on larger screens */}
                <span className="sm:hidden font-medium pr-2 text-lg">{title}</span>
                <span className="sm:hidden flex flex-col text-center">
                  <span className="text-xs">visualised with</span>
                  <a
                    href="/"
                    className="underline hover:no-underline text-sm flex items-center"
                  >
                    <CgListTree className="h-4 w-4 mr-1 mt-0.5" />
                    <span>Taxonium</span>
                  </a>
                </span>

                {/* Desktop view - hidden on mobile */}
                <div className="hidden sm:flex items-center space-x-2">
                  {pathConfig &&
                    pathConfig.maintainerMessage &&
                    pathConfig.icon && (
                      <img
                        src={pathConfig.icon}
                        className="w-6 h-6 rounded border-gray-400 border inline-block"
                        title={pathConfig.maintainerMessage}
                        alt={pathConfig.title}
                      />
                    )}
                  <span
                    className={`font-medium ${
                      title.length > 12 ? "text-lg leading-tight" : ""
                    }`}
                  >
                    {title}
                  </span>
                  <div className="flex flex-row mt-4">
                    <CgListTree className="h- ml-1 w-4 mr-1" />
                    <span className="text-xs ml-1">visualised with </span>
                    <a
                      href="/"
                      className="underline hover:no-underline text-xs ml-0.5"
                    >
                      <span>Taxonium</span>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <a href="/" className="hover:underline">
                <CgListTree className="h-6 w-6 inline-block mr-2 -mt-1" />
                <span className="font-bold">Taxonium</span>
              </a>
            )}
          </h1>
          <div className="flex items-center">
            {/* Hide the menu on mobile using CSS */}
            <div className="hidden sm:block relative">
              <Combobox value={selectedTree} onChange={setSelectedTree}>
                <div className="relative mr-4 ml-4" style={{ maxWidth: '300px' }}>
                  <Combobox.Input
                    className="w-full border bg-gray-50 text-gray-900 text-sm hover:text-gray-700 py-1 pl-2 pr-8 rounded"
                    placeholder={isLoadingTrees ? "Loading trees..." : "Search trees..."}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    displayValue={(path: string) => path}
                    autoComplete="off"
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Combobox.Button>
                  <Combobox.Options className="absolute right-0 z-10 mt-1 max-h-60 min-w-full w-96 overflow-auto rounded-md bg-white py-1 text-sm shadow-lg border border-gray-200">
                    {filteredTrees.length === 0 && searchQuery !== '' ? (
                      <div className="px-2 py-2 text-gray-500">No trees found</div>
                    ) : (
                      filteredTrees.map((path) => (
                        <Combobox.Option
                          key={path}
                          value={path}
                          className={({ active }) =>
                            classNames(
                              'cursor-pointer select-none px-2 py-1',
                              active ? 'bg-blue-500 text-white' : 'text-gray-900'
                            )
                          }
                        >
                          {path}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
            <button
              onClick={() => setAboutEnabled(true)}
              className="text-white font-bold hover:underline flex items-center cursor-pointer"
              title="Info"
            >
              <BsInfoSquare className="w-6 h-6 opacity-80 mr-4" />
            </button>
            <a
              href="https://github.com/theosanderson/taxonium"
              className="text-white font-bold hover:underline flex items-center"
              title="Source code"
            >
              <FaGithub className="w-6 h-6 opacity-80 mr-2" />
            </a>
          </div>
        </div>
        <Suspense fallback={<div></div>}>
          {(query as any).backend ||
          (uploadedData &&
            ((uploadedData as any).status === "loaded" ||
              (uploadedData as any).status === "url_supplied")) ? (
            <div className="h-[calc(100%-4rem)]">
              <TaxoniumBit
                sourceData={uploadedData}
                query={query}
                updateQuery={updateQuery}
                setOverlayContent={setOverlayContent}
                onSetTitle={setTitle}
                overlayContent={overlayContent}
                setAboutEnabled={setAboutEnabled}
                usherProtobuf={pathConfig?.usherProtobuf}
                referenceGBFF={pathConfig?.referenceGBFF}
                referenceFasta={pathConfig?.referenceFasta}
                metadataUrl={pathConfig?.metadataUrl}
              />
            </div>
          ) : (
            <div className="m-10 space-y-3">
              <p className="text-lg text-gray-700 mb-5 font-bold">
                Welcome to Taxonium, a tool for exploring large trees
              </p>
              <div className={`grid ${inputHelper.inputs.length === 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-3">Explore your tree</h3>
                  <InputSupplier inputHelper={inputHelper} />
                </div>
                {inputHelper.inputs.length === 0 && (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">...or create a tree using UShER</h3>
                    <div className="space-y-3">
                      <a
                        href="/build"
                        className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-800">Build a new tree</div>
                          <div className="text-xs text-gray-500">From your sequences</div>
                        </div>
                        <FaArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </a>
                      <a
                        href="/place"
                        className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 transition group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-800">Place on existing tree</div>
                          <div className="text-xs text-gray-500">Add your sequences to an existing tree</div>
                        </div>
                        <FaArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-3 pt-6">
                <div className="flex flex-row items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <div className="px-2 text-gray-500 text-sm">
                    or load an existing tree:
                  </div>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div className="flex justify-end">
                  <a
                    href="/browse"
                    className="text-sm text-gray-600 hover:text-gray-800 hover:underline cursor-pointer"
                  >
                    Browse all trees →
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showCase.map((item: any, i: number) => (
                    <div key={i} className="border border-gray-300 rounded p-3 hover:bg-gray-50 transition">
                      <a
                        href={item.url}
                        className="text-gray-800 hover:underline cursor-pointer"
                      >
                        <img
                          src={item.icon}
                          className="w-6 h-6 rounded border-gray-500 mb-2 inline-block mr-2"
                          title={item.maintainerMessage}
                          alt={item.title}
                        />
                        {item.title}
                      </a>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Viral Usher Trees Section */}
                {viralUsherTrees.length > 0 && (
                  <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src="/assets/usher.png"
                        alt="UShER"
                        className="w-6 h-6 rounded"
                      />
                      <h3 className="text-base font-medium text-gray-900">
                        Viral UShER Trees
                      </h3>
                      <span className="text-xs text-gray-500">
                        ({viralUsherTrees.length} organisms)
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Pre-built trees for various viral pathogens, maintained at UCSC
                    </p>
                    <div className="relative mb-3">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={viralUsherSearch}
                        onChange={(e) => setViralUsherSearch(e.target.value)}
                        placeholder="Search organisms (e.g., Zika, Ebola, Dengue...)"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-gray-500 focus:border-gray-500 outline-none"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {(viralUsherSearch ? filteredViralUsherTrees : filteredViralUsherTrees.slice(0, 8)).map((tree) => (
                        <a
                          key={tree.path}
                          href={`/${tree.path}`}
                          className="flex items-center justify-between p-2 hover:bg-white rounded transition text-sm group cursor-pointer"
                        >
                          <span className="text-gray-800 group-hover:text-gray-900 truncate flex-1">
                            {tree.organism}
                          </span>
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {parseInt(tree.tipCount).toLocaleString()} seqs
                          </span>
                        </a>
                      ))}
                      {viralUsherSearch && filteredViralUsherTrees.length === 0 && (
                        <p className="text-sm text-gray-500 p-2 italic">No matching organisms found</p>
                      )}
                    </div>
                    {!viralUsherSearch && viralUsherTrees.length > 8 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                        <span className="text-xs text-gray-500">
                          Search above to see all {viralUsherTrees.length} organisms
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-center pt-5">
                <a
                  href="//docs.taxonium.org"
                  className="text-gray-500 hover:underline"
                >
                  <HiOutlineBookOpen className="w-6 h-4 opacity-80 mr-2 inline-block" />
                  Read the Taxonium documentation
                </a>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
}

export default MainApp;
