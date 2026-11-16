import { Download, Upload } from 'lucide-react';

interface TopNavProps {
  hasResults: boolean;
  onExportHtml: () => void;
  onOpenImport: () => void;
  onNavigate: (sectionId: string) => void;
}

export function TopNav({
  hasResults,
  onExportHtml,
  onOpenImport,
  onNavigate,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 h-12 md:h-16 bg-white/90 dark:bg-[#0B1117]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('top');
          }}
          className="font-display text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Playtime Ledger
        </a>

        {/* Zone 2: 4 concise single-line nav links (desktop) */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          <a
            href="#lookup"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('lookup');
            }}
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Calculator
          </a>
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('overview');
            }}
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#library"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('library');
            }}
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Library
          </a>
          <a
            href="#identifiers"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('identifiers');
            }}
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            ID Converter
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          {hasResults ? (
            <button
              type="button"
              onClick={onExportHtml}
              className="inline-flex items-center gap-2 min-h-[36px] md:min-h-[40px] px-3 md:px-4 py-1.5 md:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1117]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Export HTML</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 min-h-[36px] md:min-h-[40px] px-3 md:px-4 py-1.5 md:py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Import JSON</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
