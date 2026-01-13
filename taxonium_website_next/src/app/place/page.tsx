"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';

interface TreeConfig {
  title: string;
  description: string;
  usherProtobuf?: string;
  referenceGBFF?: string;
  referenceFasta?: string;
  metadataUrl?: string;
  taxonomyId?: string;
  icon?: string;
  metadata?: {
    organism?: string;
    tipCount?: string;
    accession?: string;
  };
}

export default function PlacePage() {
  const [treeConfig, setTreeConfig] = useState<Record<string, TreeConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTree, setSelectedTree] = useState<string | null>(null);

  // Fetch tree configurations
  useEffect(() => {
    async function fetchTrees() {
      try {
        const response = await fetch('/api/trees');
        const data = await response.json();
        setTreeConfig(data);
      } catch (error) {
        console.error('Error fetching trees:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTrees();
  }, []);

  // Get viral_usher trees and filter by search
  const viralUsherTrees = Object.entries(treeConfig)
    .filter(([path]) => path.startsWith('viral-usher/'))
    .map(([path, config]) => ({
      path,
      title: config.title,
      description: config.description,
      organism: config.metadata?.organism || '',
      tipCount: config.metadata?.tipCount || '',
      accession: config.metadata?.accession || '',
      icon: config.icon,
      usherProtobuf: config.usherProtobuf,
      referenceGBFF: config.referenceGBFF,
      referenceFasta: config.referenceFasta,
      metadataUrl: config.metadataUrl,
      taxonomyId: config.taxonomyId,
    }))
    .sort((a, b) => {
      const countA = parseInt(a.tipCount) || 0;
      const countB = parseInt(b.tipCount) || 0;
      return countB - countA;
    });

  const filteredTrees = viralUsherTrees.filter(tree =>
    searchQuery === '' ||
    tree.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tree.organism.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tree.accession.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build the URL for the selected tree
  const buildPlaceUrl = () => {
    if (!selectedTree) return '#';

    const tree = viralUsherTrees.find(t => t.path === selectedTree);
    if (!tree) return '#';

    const params = new URLSearchParams();

    // Use genbank mode if we have taxonomyId
    if (tree.taxonomyId) {
      params.append('mode', 'genbank');
      params.append('taxonomyId', tree.taxonomyId);
    } else {
      params.append('mode', 'no_genbank');
    }

    if (tree.usherProtobuf) {
      params.append('startingTreeUrl', tree.usherProtobuf);
    }
    if (tree.referenceGBFF) {
      params.append('refGbffUrl', tree.referenceGBFF);
    }
    if (tree.referenceFasta) {
      params.append('refFastaUrl', tree.referenceFasta);
    }
    if (tree.metadataUrl) {
      params.append('metadataUrl', tree.metadataUrl);
    }

    return `/build?${params.toString()}`;
  };

  const selectedTreeData = selectedTree ? viralUsherTrees.find(t => t.path === selectedTree) : null;

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
              {filteredTrees.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? 'No matching organisms found' : 'No trees available'}
                </div>
              ) : (
                filteredTrees.map((tree) => (
                  <div
                    key={tree.path}
                    onClick={() => setSelectedTree(tree.path)}
                    className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition ${
                      selectedTree === tree.path
                        ? 'bg-gray-100 border-l-4 border-l-gray-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {tree.icon && (
                        <img src={tree.icon} alt="" className="w-6 h-6 rounded flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {tree.organism}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tree.accession}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
                      {parseInt(tree.tipCount).toLocaleString()} sequences
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Selected Tree Info */}
          {selectedTreeData && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-1">Selected: {selectedTreeData.organism}</h3>
              <p className="text-sm text-gray-600">{selectedTreeData.description}</p>
            </div>
          )}

          {/* Next Button */}
          <div className="mt-6 flex justify-end">
            <a
              href={buildPlaceUrl()}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                selectedTree
                  ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
              }`}
              onClick={(e) => !selectedTree && e.preventDefault()}
              aria-disabled={!selectedTree}
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
