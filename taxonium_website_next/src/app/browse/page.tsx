"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';
import { CgListTree } from 'react-icons/cg';

export default function BrowsePage() {
  const [treeConfig, setTreeConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Extract categories from tree paths
  const getCategory = (path: string) => {
    const parts = path.split('/');
    return parts[0] || 'other';
  };

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(
    Object.keys(treeConfig).map(getCategory)
  )).sort()];

  // Filter trees based on search and category
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
              `Showing ${filteredTrees.length} of ${Object.keys(treeConfig).length} trees`
            )}
          </div>
        </div>

        {/* Tree Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredTrees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No trees found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrees.map(([path, config]) => (
              <Link
                key={path}
                href={`/${path}`}
                className="block border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition"
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
        )}
      </div>
    </div>
  );
}
