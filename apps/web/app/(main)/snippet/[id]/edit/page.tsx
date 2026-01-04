'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import CreateSnippetForm from '@/components/CreateSnippetForm';

export default function EditSnippetPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [snippet, setSnippet] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSnippet = async () => {
            try {
                const res = await fetch(`${API_URL}/snippets/${params.id}`);
                if (!res.ok) throw new Error('Failed to fetch snippet');
                const data = await res.json();
                setSnippet({
                    title: data.data.title,
                    description: data.data.description,
                    code: data.data.code,
                    language: data.data.language,
                    tags: data.data.tags?.join(', ') || ''
                });
            } catch (err) {
                setError('Failed to load snippet');
            } finally {
                setLoading(false);
            }
        };

        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }

        fetchSnippet();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 w-1/3 rounded"></div>
                    <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Edit Snippet</h1>
            <div className="max-w-3xl mx-auto">
                <CreateSnippetForm
                    initialData={snippet}
                    isEdit={true}
                    snippetId={params.id}
                />
            </div>
        </div>
    );
}
