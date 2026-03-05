'use client';

import { useState } from 'react';

const CATEGORIES = [
  { label: 'FOIA', value: 'foia' },
  { label: 'Sunshine Laws', value: 'sunshine' },
  { label: 'Missing Data', value: 'missing_data' },
  { label: 'Access Denied', value: 'access_denied' },
] as const;

interface SearchBarProps {
  onSearch: (query: string, category?: string) => void;
  initialQuery?: string;
  initialCategory?: string;
}

export default function SearchBar({ onSearch, initialQuery = '', initialCategory }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim(), selectedCategory);
  };

  const handleCategoryClick = (categoryValue: string) => {
    const newCategory = selectedCategory === categoryValue ? undefined : categoryValue;
    setSelectedCategory(newCategory);
    // Always fire search when a category is selected, even without text query
    onSearch(query.trim(), newCategory);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sunshine law cases, FOIA requests, court opinions..."
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400 text-slate-800 placeholder-slate-400"
          />
        </div>
        <button
          type="submit"
          className="bg-sunshine-500 hover:bg-sunshine-600 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Quick-filter category buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => handleCategoryClick(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-sunshine-500 text-white'
                : 'bg-sunshine-100 text-sunshine-800 hover:bg-sunshine-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
