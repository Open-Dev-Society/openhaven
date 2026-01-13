/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { getToken } from '@/lib/auth';
import { dispatchVoteUpdate } from '@/lib/events';
import { useSocket } from '@/context/SocketContext';
import ShareModal from '@/components/ShareModal';
import { API_URL } from '@/lib/config';
import { Eye, ThumbsUp, ThumbsDown, Bookmark, Share2, MessageSquare } from 'lucide-react';

interface SnippetCardProps {
    id: string;
    slug: string;
    title: string;
    description?: string;
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

export default function SnippetCard({
    id,
    slug,
    title,
    description,
    language,
    tags,
    author,
    upvotes,
    downvotes,
    viewCount,
}: SnippetCardProps) {
    const [votes, setVotes] = useState({ upvotes, downvotes });
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Refs to track local user interaction. 
    // If user interacts before server data loads, we respect local state and ignore server "initial" state.
    const hasVotedRef = useRef(false);
    const hasSavedRef = useRef(false);

    const [origin, setOrigin] = useState('');

    const { socket } = useSocket();

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    // Real-time vote updates
    useEffect(() => {
        if (!socket) return;

        const handleVoteUpdate = (data: any) => {
            if (data.id === id) {
                setVotes({
                    upvotes: data.upvotes,
                    downvotes: data.downvotes
                });
                // Also update local score if it's currently displayed differently?
                // Actually the score is derived from votes state.
            }
        };

        socket.on('snippet:vote_update', handleVoteUpdate);

        return () => {
            socket.off('snippet:vote_update', handleVoteUpdate);
        };
    }, [socket, id]);

    // Fetch initial vote status and saved status
    useEffect(() => {
        const token = getToken();
        if (!token) return;

        // Fetch vote status
        const fetchVoteStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/snippets/${id}/vote`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!hasVotedRef.current) {
                        setUserVote(data.data.vote);
                    }
                }
            } catch (e) {
                // Ignore error (user might not have voted)
            }
        };

        const fetchSavedStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/saved/${id}/check`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!hasSavedRef.current) {
                        setIsSaved(data.data.saved);
                    }
                }
            } catch (e) { console.error(e); }
        };

        fetchVoteStatus();
        fetchSavedStatus();
    }, [id]);

    const handleVote = async (type: 'upvote' | 'downvote') => {
        const token = getToken();
        if (!token) {
            alert('Please login to vote');
            return;
        }

        if (!token) {
            alert('Please login to vote');
            return;
        }

        hasVotedRef.current = true;

        // Optimistic update
        const previousVote = userVote;
        const previousVotes = { ...votes };

        let newVotes = { ...votes };
        let newType: 'upvote' | 'downvote' | null = type;

        if (userVote === type) {
            // Toggle off
            newType = null;
            newVotes[type === 'upvote' ? 'upvotes' : 'downvotes']--;
        } else {
            // Switch or new vote
            if (userVote) {
                newVotes[userVote === 'upvote' ? 'upvotes' : 'downvotes']--;
            }
            newVotes[type === 'upvote' ? 'upvotes' : 'downvotes']++;
        }

        setUserVote(newType);
        setVotes(newVotes);

        // Dispatch new score
        const newScore = newVotes.upvotes - newVotes.downvotes;
        dispatchVoteUpdate(id, newScore);

        try {
            // Explicitly handle "Remove Vote" vs "Up/Down Vote"
            // If newType is null, we are removing.
            // If newType is set, we are upvoting/downvoting.

            if (!newType) {
                await fetch(`${API_URL}/snippets/${id}/vote`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } else {
                const endpoint = newType;
                await fetch(`${API_URL}/snippets/${id}/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (err) {
            // Revert
            setUserVote(previousVote);
            setVotes(previousVotes);
        }
    };

    const handleSave = async () => {
        const token = getToken();
        if (!token) {
            alert('Please login to save snippets');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);
        hasSavedRef.current = true;
        setIsSaved(!isSaved); // Optimistic

        try {
            const endpoint = isSaved ? 'unsave' : 'save';
            // If saving, we POST to /saved/:id
            // If unsaving, we DELETE /saved/:id
            const method = isSaved ? 'DELETE' : 'POST';

            // Adjust API call logic
            const res = await fetch(`${API_URL}/saved/${id}`, {
                method,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                setIsSaved(isSaved); // Revert
            }
        } catch (e) {
            setIsSaved(isSaved); // Revert
        } finally {
            setIsSaving(false);
        }
    };

    const score = votes.upvotes - votes.downvotes;

    return (
        <div className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl hover:border-teal-500/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden relative">

            {/* Header with Language Badge */}
            <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wide border border-teal-100 dark:border-teal-500/20">
                        {language}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {viewCount}
                        </span>
                    </div>
                </div>

                <Link href={`/snippet/${slug || id}`}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {title}
                    </h3>
                </Link>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {tags.slice(0, 3).map(tag => (
                            <Link
                                key={tag}
                                href={`/feed?q=${encodeURIComponent(tag)}`}
                                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                onClick={(e) => e.stopPropagation()} // Prevent card click
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="px-5 py-3 flex items-center gap-4 border-t border-slate-100 dark:border-white/5 text-sm text-slate-500 mt-auto bg-slate-50/50 dark:bg-white/[0.02]">
                {/* Votes */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleVote('upvote'); }}
                        className={`p-1 rounded transition-colors ${userVote === 'upvote' ? 'text-teal-600' : 'hover:text-teal-600'}`}
                    >
                        <ThumbsUp size={16} fill={userVote === 'upvote' ? "currentColor" : "none"} />
                    </button>
                    <span className={`font-bold min-w-[20px] text-center ${userVote === 'upvote' ? 'text-teal-600' : userVote === 'downvote' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {score}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleVote('downvote'); }}
                        className={`p-1 rounded transition-colors ${userVote === 'downvote' ? 'text-red-500' : 'hover:text-red-500'}`}
                    >
                        <ThumbsDown size={16} fill={userVote === 'downvote' ? "currentColor" : "none"} />
                    </button>
                </div>

                {/* Author */}
                <Link href={`/user/${author?.username}`} className="flex items-center gap-2 hover:text-teal-500 transition-colors ml-2">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {author?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium">{author?.username}</span>
                </Link>

                {/* Actions Group */}
                <div className="ml-auto flex items-center gap-2">
                    {/* Share Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShareModalOpen(true); }}
                        className="p-1 hover:text-teal-500 transition-colors"
                        title="Share"
                    >
                        <Share2 size={16} />
                    </button>

                    {/* Save button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                        disabled={isSaving}
                        className={`p-1 transition-colors ${isSaved ? 'text-teal-500' : 'hover:text-teal-500'}`}
                        title={isSaved ? 'Unsave' : 'Save'}
                    >
                        <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title={title}
                url={`${origin}/snippet/${slug || id}`}
            />
        </div>
    );
}
