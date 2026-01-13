'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SnippetCard from '@/components/SnippetCard';
import { API_URL } from '@/lib/config';

interface Snippet {
    id: string;
    slug: string;
    title: string;
    description: string;
    language: string;
    tags: string[];
    author: {
        username: string;
        avatarUrl?: string;
    };
    upvotes: number;
    downvotes: number;
    viewCount: number;
}

const SORT_OPTIONS = [
    { value: 'best', label: 'Best' },
    { value: 'hot', label: 'Hot' },
    { value: 'new', label: 'New' },
];

function FeedContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'best';
    const currentQuery = searchParams.get('q') || '';

    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchSnippets = async (pageNum: number, sort: string, query: string, append = false) => {
        if (pageNum === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            let url;
            if (query) {
                // Use search endpoint
                url = `${API_URL}/search?q=${encodeURIComponent(query)}&page=${pageNum}&limit=12&sort=${sort}`;
            } else {
                // Use popular endpoint
                url = `${API_URL}/popular?sort=${sort}&page=${pageNum}&limit=12`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'success') {
                // Normalize data structure: search returns 'results', popular returns 'snippets'
                const newSnippets = data.data.snippets || data.data.results || [];

                if (append) {
                    setSnippets((prev) => [...prev, ...newSnippets]);
                } else {
                    setSnippets(newSnippets);
                }

                // Pagination logic may differ slightly
                if (data.data.pagination) {
                    setHasMore(pageNum < data.data.pagination.pages);
                } else if (data.data.total !== undefined) {
                    // Search endpoint total
                    setHasMore(snippets.length + newSnippets.length < data.data.total);
                } else {
                    setHasMore(newSnippets.length === 12);
                }
            }
        } catch (err) {
            console.error('Failed to fetch snippets', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setPage(1);
        setSnippets([]);
        fetchSnippets(1, currentSort, currentQuery);
    }, [currentSort, currentQuery]);

    const handleSortChange = (sort: string) => {
        const queryParams = new URLSearchParams();
        queryParams.set('sort', sort);
        if (currentQuery) queryParams.set('q', currentQuery);
        router.push(`/feed?${queryParams.toString()}`);
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSnippets(nextPage, currentSort, currentQuery, true);
    };

    return (
        <div className="space-y-6">
            {/* Feed Header / Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                    {currentQuery ? `Results for "${currentQuery}"` : 'Your Feed'}
                </h1>

                <div className="glass-panel p-1 rounded-xl flex gap-1 shadow-sm">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleSortChange(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${currentSort === opt.value
                                ? 'text-teal-600 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                        >
                            {currentSort === opt.value && (
                                <span className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm -z-10 animate-in fade-in zoom-in duration-200" />
                            )}
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-700 h-64 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {snippets.map((snippet: Snippet) => (
                        <div key={snippet.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                            <SnippetCard {...snippet} />
                        </div>
                    ))}
                    {snippets.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500">
                                {currentQuery
                                    ? `No snippets found for "${currentQuery}".`
                                    : currentSort === 'hot'
                                        ? 'No trending snippets this week.'
                                        : 'No snippets found in feed.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {hasMore && snippets.length > 0 && (
                <div className="text-center pt-4">
                    <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function FeedPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-64 animate-pulse"></div>
                ))}
            </div>
        }>
            <FeedContent />
        </Suspense>
    );
}
