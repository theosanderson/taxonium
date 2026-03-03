"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import { CgListTree } from 'react-icons/cg';
import { getViralUsherPath } from '../../lib/viralUsherPath';

const VIRAL_USHER_API = process.env.NEXT_PUBLIC_VIRAL_USHER_API || '';
const VIRAL_USHER_BASE_URL = 'https://angiehinrichs.github.io/viral_usher_trees/trees';

export default function BrowsePage() {
  const [treeConfig, setTreeConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Viral-usher section state
  const [viralUsherItems, setViralUsherItems] = useState<any[]>([]);
  const [viralUsherTotal, setViralUsherTotal] = useState(0);
  const [viralUsherOffset, setViralUsherOffset] = useState(0);
  const [isLoadingVU, setIsLoadingVU] = useState(false);
  const vuDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch tree configurations from API
  useEffect(() => {
    async function fetchTrees() {
      try {
        const CACHE_KEY = 'taxonium_trees_cache';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // Check localStorage for cached data
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          if (age < CACHE_DURATION) {
            setTreeConfig(data);
            setIsLoading(false);
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
        setIsLoading(false);
      }
    }
    fetchTrees();
  }, []);

  // Fetch viral-usher trees from backend API (debounced on search, immediate on clear/load-more)
  const fetchViralUsher = async (query: string, offset: number, append: boolean) => {
    if (!VIRAL_USHER_API) return;
    setIsLoadingVU(true);
    try {
      const url = query
        ? `${VIRAL_USHER_API}/api/viral-usher-trees?q=${encodeURIComponent(query)}&limit=50&offset=${offset}`
        : `${VIRAL_USHER_API}/api/viral-usher-trees?limit=50&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();
      setViralUsherItems(prev => append ? [...prev, ...(data.trees || [])] : (data.trees || []));
      setViralUsherTotal(data.total || 0);
      setViralUsherOffset(offset + (data.trees?.length || 0));
    } catch (e) {
      console.error('Error fetching viral usher trees:', e);
    } finally {
      setIsLoadingVU(false);
    }
  };

  // Initial load + search-driven fetch for viral-usher
  useEffect(() => {
    if (!VIRAL_USHER_API) return;

    if (vuDebounceRef.current) clearTimeout(vuDebounceRef.current);

    const doFetch = () => {
      setViralUsherOffset(0);
      fetchViralUsher(searchQuery, 0, false);
    };

    if (searchQuery) {
      vuDebounceRef.current = setTimeout(doFetch, 300);
    } else {
      doFetch();
    }

    return () => {
      if (vuDebounceRef.current) clearTimeout(vuDebounceRef.current);
    };
  }, [searchQuery]);

  // Extract categories from static tree paths
  const getCategory = (path: string) => {
    const parts = path.split('/');
    return parts[0] || 'other';
  };

  // Get unique categories from static trees
  const staticCategories = Array.from(new Set(
    Object.keys(treeConfig).map(getCategory)
  )).sort();
  const categories = ['all', ...staticCategories, ...(VIRAL_USHER_API ? ['viral-usher'] : [])];

  // Filter static trees based on search and category
  const filteredTrees = Object.entries(treeConfig)
    .filter(([path, config]) => {
      const matchesSearch = searchQuery === '' ||
        path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'all' ||
        getCategory(path) === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB));

  const showStaticTrees = categoryFilter !== 'viral-usher';
  const showViralUsher = VIRAL_USHER_API && (categoryFilter === 'all' || categoryFilter === 'viral-usher');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="from-gray-500 to-gray-600 bg-gradient-to-bl shadow-md flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white hover:text-gray-200 transition">
            <FaArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white text-xl font-medium flex items-center gap-2">
            <CgListTree className="w-6 h-6" />
            Browse Trees
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trees by name, path, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {isLoading ? (
              'Loading trees...'
            ) : (
              <>
                {showStaticTrees && `${filteredTrees.length} static trees`}
                {showStaticTrees && showViralUsher && ' · '}
                {showViralUsher && `${viralUsherTotal} viral UShER trees`}
              </>
            )}
          </div>
        </div>

        {/* Static Tree Grid */}
        {showStaticTrees && (
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredTrees.length === 0 ? (
            categoryFilter !== 'viral-usher' && (
              <div className="text-center py-12 text-gray-500">
                No static trees found matching your criteria.
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredTrees.map(([path, config]) => (
                <Link
                  key={path}
                  href={`/${path}`}
                  className="block border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <div className="flex items-start gap-3">
                    {config.icon && (
                      <img
                        src={config.icon}
                        className="w-10 h-10 rounded border border-gray-300 flex-shrink-0"
                        alt={config.title || path}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {config.title || path}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 font-mono truncate">
                        {path}
                      </p>
                      {config.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {config.description}
                        </p>
                      )}
                      {config.maintainerMessage && (
                        <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">
                          {config.maintainerMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Viral UShER Trees Section */}
        {showViralUsher && (
          <div className={showStaticTrees && filteredTrees.length > 0 ? "mt-4" : ""}>
            <div className="flex items-center gap-2 mb-4">
              <img src="/assets/usher.png" alt="UShER" className="w-6 h-6 rounded" />
              <h2 className="text-lg font-medium text-gray-900">Viral UShER Trees</h2>
              {viralUsherTotal > 0 && (
                <span className="text-sm text-gray-500">({viralUsherTotal} organisms)</span>
              )}
            </div>

            {isLoadingVU && viralUsherItems.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            ) : viralUsherItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No viral UShER trees found matching your search.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {viralUsherItems.map((tree: any) => {
                    const path = getViralUsherPath(tree.organism, tree.accession);
                    let displayTitle = tree.organism;
                    if (tree.segment) displayTitle += ` (segment ${tree.segment})`;
                    if (tree.serotype) displayTitle += ` [${tree.serotype}]`;
                    displayTitle += ` - ${tree.accession}`;
                    return (
                      <Link
                        key={tree.tree_name}
                        href={`/${path}`}
                        className="block border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src="/assets/usher.png"
                            className="w-10 h-10 rounded border border-gray-300 flex-shrink-0"
                            alt={displayTitle}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                              {displayTitle}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 font-mono truncate">
                              {path}
                            </p>
                            <p className="text-xs text-gray-600">
                              {parseInt(tree.tip_count).toLocaleString()} sequences
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Load More */}
                {viralUsherOffset < viralUsherTotal && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => fetchViralUsher(searchQuery, viralUsherOffset, true)}
                      disabled={isLoadingVU}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      {isLoadingVU ? 'Loading...' : `Load more (${viralUsherTotal - viralUsherOffset} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
