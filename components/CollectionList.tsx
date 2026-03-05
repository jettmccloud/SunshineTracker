'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Collection } from '@/lib/types';

interface CollectionListProps {
  collections: Collection[];
  onCreateCollection: (name: string, description: string) => void;
}

export default function CollectionList({ collections, onCreateCollection }: CollectionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      onCreateCollection(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Collections</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sunshine-500 hover:bg-sunshine-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'New Collection'}
        </button>
      </div>

      {/* Inline creation form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-sunshine-50 border border-sunshine-200 rounded-lg p-5 mb-6"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Key FOIA Cases"
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description of this collection"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="bg-sunshine-500 hover:bg-sunshine-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      )}

      {/* Collection list */}
      {collections.length > 0 ? (
        <div className="space-y-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-sunshine-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-800 truncate">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 text-right">
                  <span className="inline-block bg-sunshine-100 text-sunshine-700 px-2.5 py-1 rounded-full text-xs font-medium">
                    {collection.case_count ?? 0} {(collection.case_count ?? 0) === 1 ? 'case' : 'cases'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Created {new Date(collection.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg mb-1">No collections yet</p>
          <p className="text-sm">Create your first collection to organize cases.</p>
        </div>
      )}
    </div>
  );
}
