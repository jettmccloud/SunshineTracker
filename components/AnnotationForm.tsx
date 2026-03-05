'use client';

import { useState } from 'react';

interface AnnotationFormProps {
  caseId: string;
  onSubmit: (note: string, tags: string[]) => void;
}

export default function AnnotationForm({ caseId, onSubmit }: AnnotationFormProps) {
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setSubmitting(true);
    try {
      onSubmit(note.trim(), tags);
      setNote('');
      setTagsInput('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Annotation</h3>

      <div className="space-y-4">
        {/* Note textarea */}
        <div>
          <label htmlFor={`note-${caseId}`} className="block text-sm font-medium text-slate-700 mb-1">
            Note
          </label>
          <textarea
            id={`note-${caseId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes about this case..."
            rows={4}
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400 resize-y"
          />
        </div>

        {/* Tags input */}
        <div>
          <label htmlFor={`tags-${caseId}`} className="block text-sm font-medium text-slate-700 mb-1">
            Tags
          </label>
          <input
            id={`tags-${caseId}`}
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., important, follow-up, key-ruling (comma-separated)"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sunshine-400 focus:border-sunshine-400"
          />
          <p className="text-xs text-slate-400 mt-1">Separate tags with commas</p>
        </div>

        {/* Preview tags */}
        {tagsInput.trim() && (
          <div className="flex flex-wrap gap-1.5">
            {tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
              .map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="bg-sunshine-100 text-sunshine-700 border border-sunshine-200 px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || !note.trim()}
          className="bg-sunshine-500 hover:bg-sunshine-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Annotation'}
        </button>
      </div>
    </form>
  );
}
