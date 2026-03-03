"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';

const VIRAL_USHER_API = process.env.NEXT_PUBLIC_VIRAL_USHER_API || '';
const VIRAL_USHER_BASE_URL = 'https://angiehinrichs.github.io/viral_usher_trees/trees';

export default function PlacePage() {
  const [viralUsherTrees, setViralUsherTrees] = useState<any[]>([]);
  const [viralUsherTotal, setViralUsherTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [selectedTreeDetails, setSelectedTreeDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch viral-usher trees from backend API (debounced)
  const fetchTrees = async (query: string) => {
    if (!VIRAL_USHER_API) return;
    setIsLoading(true);
    try {
      const url = query
        ? `${VIRAL_USHER_API}/api/viral-usher-trees?q=${encodeURIComponent(query)}&limit=50`
        : `${VIRAL_USHER_API}/api/viral-usher-trees?limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setViralUsherTrees(data.trees || []);
      setViralUsherTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching trees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load + debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchTrees(searchQuery);
    }, searchQuery ? 300 : 0);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Fetch per-tree config when selection changes
  useEffect(() => {
    setSelectedTreeDetails(null);
    if (!selectedTree || !VIRAL_USHER_API) return;

    const tree = viralUsherTrees.find(t => t.tree_name === selectedTree);
    if (!tree) return;

    setIsLoadingDetails(true);
    fetch(`${VIRAL_USHER_API}/api/viral-usher-trees/${tree.tree_name}`)
      .then(r => r.json())
      .then(data => setSelectedTreeDetails(data))
      .catch(e => console.error('Error fetching tree details:', e))
      .finally(() => setIsLoadingDetails(false));
  }, [selectedTree]);

  // Build the URL for the selected tree
  const buildPlaceUrl = () => {
    if (!selectedTree || !selectedTreeDetails) return '#';

    const { tree_name, taxonomy_id, ref_gbff_url, ref_fasta_url } = selectedTreeDetails;
    const params = new URLSearchParams();

    if (taxonomy_id) {
      params.append('mode', 'genbank');
      params.append('taxonomyId', taxonomy_id);
    } else {
      params.append('mode', 'no_genbank');
    }

    params.append('startingTreeUrl', `${VIRAL_USHER_BASE_URL}/${tree_name}/optimized.pb.gz`);
    if (ref_gbff_url) params.append('refGbffUrl', ref_gbff_url);
    if (ref_fasta_url) params.append('refFastaUrl', ref_fasta_url);
    params.append('metadataUrl', `${VIRAL_USHER_BASE_URL}/${tree_name}/metadata.tsv.gz`);

    return `/build?${params.toString()}`;
  };

  const selectedTreeData = selectedTree ? viralUsherTrees.find(t => t.tree_name === selectedTree) : null;
  const canProceed = selectedTree && selectedTreeDetails && !isLoadingDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-gray-200 transition">
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white text-xl font-medium">Place Sequences on Existing Tree</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600 mb-6">
            Select a pre-built viral phylogenetic tree to place your sequences on. Your sequences will be added to the existing tree using UShER.
          </p>

          {!VIRAL_USHER_API && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6 text-sm text-yellow-800">
              Viral UShER backend is not configured. Please set NEXT_PUBLIC_VIRAL_USHER_API.
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organisms (e.g., Zika, Ebola, Dengue, Mpox...)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
            />
          </div>

          {/* Tree List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading trees...</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {viralUsherTrees.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No matching organisms found' : 'No trees available'}
                </div>
              ) : (
                viralUsherTrees.map((tree: any) => (
                  <div
                    key={tree.tree_name}
                    onClick={() => setSelectedTree(tree.tree_name)}
                    className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition ${
                      selectedTree === tree.tree_name
                        ? 'bg-gray-100 border-l-4 border-l-gray-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img src="/assets/usher.png" alt="" className="w-6 h-6 rounded flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {tree.organism}
                          {tree.serotype && ` [${tree.serotype}]`}
                          {tree.segment && ` (seg. ${tree.segment})`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tree.accession}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                      {parseInt(tree.tip_count).toLocaleString()} sequences
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viralUsherTotal > 50 && !searchQuery && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing first 50 of {viralUsherTotal} trees. Search to narrow results.
            </p>
          )}

          {/* Selected Tree Info */}
          {selectedTreeData && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-1">
                Selected: {selectedTreeData.organism}
                {selectedTreeData.serotype && ` [${selectedTreeData.serotype}]`}
                {selectedTreeData.segment && ` (segment ${selectedTreeData.segment})`}
              </h3>
              <p className="text-sm text-gray-600">
                {parseInt(selectedTreeData.tip_count).toLocaleString()} sequences · {selectedTreeData.accession}
              </p>
              {isLoadingDetails && (
                <p className="text-xs text-gray-500 mt-1">Loading reference files...</p>
              )}
            </div>
          )}

          {/* Next Button */}
          <div className="mt-6 flex justify-end">
            <a
              href={buildPlaceUrl()}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                canProceed
                  ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
              }`}
              onClick={(e) => !canProceed && e.preventDefault()}
              aria-disabled={!canProceed}
            >
              Next: Add Your Sequences
              <FaArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
