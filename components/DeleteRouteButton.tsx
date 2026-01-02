'use client';

import { deleteRoute } from '@/app/actions';

export default function DeleteRouteButton({ id }: { id: number }) {
    return (
        <form action={deleteRoute} onSubmit={(e) => {
            if (!confirm('Are you sure you want to delete this route? This might fail if it has assigned shops.')) {
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
