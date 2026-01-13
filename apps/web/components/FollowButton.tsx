'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface FollowButtonProps {
    username: string;
    initialIsFollowing?: boolean; // Optional initial state
    onToggle?: (isFollowing: boolean) => void;
    className?: string;
}

export default function FollowButton({ username, initialIsFollowing, onToggle, className = '' }: FollowButtonProps) {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false); // To prevent flashing if we check status

    // If initialIsFollowing is explicitly provided, we trust it.
    // Otherwise, or if we want to confirm, we check. 
    // For now, if provided, we skip check to save bandwidth. 
    // EXCEPT if it's undefined, we MUST check.

    useEffect(() => {
        const checkStatus = async () => {
            const token = getToken();
            if (!token) {
                setChecked(true);
                return;
            }

            if (initialIsFollowing !== undefined) {
                setIsFollowing(initialIsFollowing);
                setChecked(true);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/${username}/is-following`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setIsFollowing(data.data.isFollowing);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setChecked(true);
            }
        };

        checkStatus();
    }, [username, initialIsFollowing]);

    const handleFollow = async () => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        if (loading) return;
        setLoading(true);

        // Optimistic update
        const newState = !isFollowing;
        setIsFollowing(newState);
        if (onToggle) onToggle(newState);

        try {
            const res = await fetch(`${API_URL}/users/${username}/follow`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Action failed');
            }
        } catch (err) {
            // Revert
            setIsFollowing(!newState);
            if (onToggle) onToggle(!newState);
            alert('Failed to follow/unfollow user');
        } finally {
            setLoading(false);
        }
    };

    if (!checked && initialIsFollowing === undefined) {
        return (
            <div className={`h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse ${className}`} />
        );
    }

    return (
        <button
            onClick={handleFollow}
            disabled={loading}
            className={`
                group relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden
                ${isFollowing
                    ? 'bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:from-teal-400 hover:to-emerald-400 border border-transparent'
                }
                ${className}
            `}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isFollowing ? (
                <>
                    <span className="group-hover:hidden flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Following
                    </span>
                    <span className="hidden group-hover:flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Unfollow
                    </span>
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Follow
                </>
            )}
        </button>
    );
}
