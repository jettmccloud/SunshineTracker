'use client';

import { useState, useRef, useEffect } from 'react';

interface ExportButtonProps {
  params: Record<string, string>;
  label?: string;
}

export default function ExportButton({ params, label }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // If format is pre-set (report, foia), render a direct button instead of dropdown
  const isDirectDownload = params.format && params.format !== 'csv' && params.format !== 'json';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: string) => {
    setExporting(true);
    setOpen(false);

    try {
      const token = localStorage.getItem('sunshine_token');
      const queryString = new URLSearchParams({ ...params, format }).toString();

      const res = await fetch(`/api/export?${queryString}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'report' || format === 'foia' ? 'txt' : format;
      a.download = `sunshine-${format}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Direct download button for report/foia
  if (isDirectDownload) {
    return (
      <button
        onClick={() => handleExport(params.format)}
        disabled={exporting}
        className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:cursor-wait text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {label || 'Download'}
          </>
        )}
      </button>
    );
  }

  // Dropdown for csv/json
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:cursor-wait text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {label || 'Export'}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-md shadow-lg z-10">
          <button
            onClick={() => handleExport('csv')}
            className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-sunshine-50 hover:text-sunshine-800 transition-colors rounded-t-md"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-sunshine-50 hover:text-sunshine-800 transition-colors rounded-b-md"
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}
