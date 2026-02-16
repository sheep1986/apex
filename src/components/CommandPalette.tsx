import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  path: string;
  section: 'actions' | 'recent';
}

const QUICK_ACTIONS: CommandItem[] = [
  { id: 'create-campaign', label: 'Create Campaign', path: '/campaigns/new', section: 'actions' },
  { id: 'new-assistant', label: 'New Assistant', path: '/assistants/new', section: 'actions' },
  { id: 'view-all-calls', label: 'View All Calls', path: '/all-calls', section: 'actions' },
  { id: 'sales-pipeline', label: 'Sales Pipeline', path: '/pipeline', section: 'actions' },
  { id: 'go-to-settings', label: 'Go to Settings', path: '/settings', section: 'actions' },
];

const RECENT_PAGES_KEY = 'trinity-labs-recent-pages';

function getRecentPages(): CommandItem[] {
  try {
    const stored = localStorage.getItem(RECENT_PAGES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: { label: string; path: string }, i: number) => ({
      id: `recent-${i}`,
      label: item.label,
      path: item.path,
      section: 'recent' as const,
    }));
  } catch {
    return [];
  }
}

function fuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;
  let qi = 0;
  for (let ti = 0; ti < lowerText.length && qi < lowerQuery.length; ti++) {
    if (lowerText[ti] === lowerQuery[qi]) qi++;
  }
  return qi === lowerQuery.length;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay so the DOM is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const recentPages = useMemo(() => (isOpen ? getRecentPages() : []), [isOpen]);

  const allItems = useMemo(() => [...QUICK_ACTIONS, ...recentPages], [recentPages]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems.filter((item) => fuzzyMatch(query, item.label));
  }, [query, allItems]);

  const actionItems = useMemo(
    () => filteredItems.filter((i) => i.section === 'actions'),
    [filteredItems]
  );
  const recentItems = useMemo(
    () => filteredItems.filter((i) => i.section === 'recent'),
    [filteredItems]
  );

  const flatItems = useMemo(() => [...actionItems, ...recentItems], [actionItems, recentItems]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setIsOpen(false);
      navigate(item.path);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        }
        return;
      }
    },
    [flatItems, selectedIndex, handleSelect]
  );

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close on clicking overlay
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        setIsOpen(false);
      }
    },
    []
  );

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh]"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          <kbd className="hidden rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No results found.</div>
          )}

          {/* Quick Actions */}
          {actionItems.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Quick Actions</div>
              {actionItems.map((item) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      selectedIndex === idx
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    )}
                  >
                    <Command className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-gray-600" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Recent Pages */}
          {recentItems.length > 0 && (
            <div className={actionItems.length > 0 ? 'mt-2' : ''}>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Recent Pages</div>
              {recentItems.map((item) => {
                const idx = flatIndex++;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      selectedIndex === idx
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    )}
                  >
                    <Search className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className="h-3 w-3 shrink-0 text-gray-600" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-gray-800 px-4 py-2 text-[11px] text-gray-600">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 font-mono text-[10px]">
              &uarr;&darr;
            </kbd>{' '}
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 font-mono text-[10px]">
              &crarr;
            </kbd>{' '}
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 font-mono text-[10px]">
              esc
            </kbd>{' '}
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
