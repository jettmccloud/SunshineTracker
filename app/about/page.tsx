import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">About &amp; Disclaimer</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">About Sunshine Case Tracker</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Sunshine Case Tracker is a research tool built for journalists investigating government transparency. It helps reporters find, organize, and analyze court cases involving Freedom of Information Act (FOIA) requests, state sunshine laws, open records disputes, and public access litigation.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Case data is sourced from{' '}
          <a href="https://www.courtlistener.com" target="_blank" rel="noopener noreferrer" className="text-[#8E6400] hover:text-[#8E6400] underline">
            CourtListener
          </a>
          , a free legal research platform maintained by the{' '}
          <a href="https://free.law" target="_blank" rel="noopener noreferrer" className="text-[#8E6400] hover:text-[#8E6400] underline">
            Free Law Project
          </a>
          . Cases are cached locally and refreshed periodically to keep information current.
        </p>
      </div>

      <div className="bg-[#FFDB84] border border-[#FFDB84] rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-[#8E6400] mb-3">AI-Generated Summaries Disclaimer</h2>
        <p className="text-[#8E6400] leading-relaxed mb-4">
          Case summaries, key facts, flags, and other analytical features on this site are generated using artificial intelligence. These AI-generated summaries are designed to help journalists quickly understand the nature and significance of a case, but they are not a substitute for reviewing the original court filings.
        </p>
        <p className="text-[#8E6400] leading-relaxed mb-4">
          AI-generated content may contain inaccuracies, omissions, or misinterpretations of legal language. Reporters should always verify details by reviewing the official court opinions, docket entries, and related documents before publishing or relying on any information presented here.
        </p>
        <p className="text-[#8E6400] leading-relaxed font-medium">
          Do not cite Sunshine Case Tracker or its AI summaries as a primary source. Always refer to the original court documents, which are linked from each case detail page.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Data Sources &amp; Accuracy</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          All case data originates from CourtListener&apos;s database of court opinions and dockets. While we strive to keep cached data up to date through periodic refreshes, there may be a delay between when a court publishes a new opinion or update and when it appears here.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Case categorization (FOIA, Sunshine Laws, Access Denied, Missing Data) is performed automatically based on keyword matching and may not always be accurate. Cases may be miscategorized or missing from certain categories.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Contact</h2>
        <p className="text-slate-600 leading-relaxed">
          If you have questions, feedback, or notice an error, please reach out. This tool is built to support the journalism community and we welcome contributions and suggestions.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-[#8E6400] hover:text-[#8E6400] text-sm font-medium">
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
