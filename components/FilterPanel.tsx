'use client';

import { useState } from 'react';
import { SearchFilters } from '@/lib/types';

const JURISDICTION_TYPES = ['Federal', 'State', 'County'] as const;

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
] as const;

interface FilterPanelProps {
  onFilter: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export default function FilterPanel({ onFilter, initialFilters }: FilterPanelProps) {
  const [jurisdictions, setJurisdictions] = useState<string[]>(
    initialFilters?.jurisdiction_type ? initialFilters.jurisdiction_type.split(',') : []
  );
  const [state, setState] = useState(initialFilters?.state || '');
  const [dateFrom, setDateFrom] = useState(initialFilters?.date_from || '');
  const [dateTo, setDateTo] = useState(initialFilters?.date_to || '');

  const handleJurisdictionToggle = (jur: string) => {
    setJurisdictions((prev) =>
      prev.includes(jur) ? prev.filter((j) => j !== jur) : [...prev, jur]
    );
  };

  const handleApply = () => {
    const filters: SearchFilters = {};
    if (jurisdictions.length > 0) {
      filters.jurisdiction_type = jurisdictions.join(',');
    }
    if (state) filters.state = state;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    onFilter(filters);
  };

  const handleClear = () => {
    setJurisdictions([]);
    setState('');
    setDateFrom('');
    setDateTo('');
    onFilter({});
  };

  return (
    <aside className="bg-white border border-slate-200 rounded-lg p-5 space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Filters</h3>

      {/* Jurisdiction Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Jurisdiction
        </label>
        <div className="space-y-2">
          {JURISDICTION_TYPES.map((jur) => (
            <label key={jur} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={jurisdictions.includes(jur)}
                onChange={() => handleJurisdictionToggle(jur)}
                className="h-4 w-4 rounded border-slate-300 text-sunshine-500 focus:ring-sunshine-400"
              />
              <span className="text-sm text-slate-700">{jur}</span>
            </label>
          ))}
        </div>
      </div>

      {/* State Dropdown */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          State
        </label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Date Range
        </label>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="flex-1 bg-sunshine-500 hover:bg-sunshine-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleClear}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Clear
        </button>
      </div>
    </aside>
  );
}
