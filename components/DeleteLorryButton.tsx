'use client';

import { deleteLorry } from '@/app/actions';
import { useActionState } from 'react';

// Using simple form submission for now as per project pattern
export default function DeleteLorryButton({ id }: { id: number }) {
    return (
        <form action={deleteLorry} onSubmit={(e) => {
            if (!confirm('Are you sure you want to delete this lorry? This might fail if it has assigned routes.')) {
                e.preventDefault();
            }
        }}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="text-red-600 hover:text-red-900 text-xs font-semibold">
                Delete
            </button>
        </form>
    );
}
