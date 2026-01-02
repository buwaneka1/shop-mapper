'use client';

import { deleteRoute } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import Spinner from './Spinner';

function DeleteButtonContent() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="text-red-600 hover:text-red-900 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
        >
            {pending && <Spinner className="h-3 w-3" />}
            {pending ? 'Deleting...' : 'Delete'}
        </button>
    );
}

export default function DeleteRouteButton({ id }: { id: number }) {
    return (
        <form action={deleteRoute} onSubmit={(e) => {
            if (!confirm('Are you sure you want to delete this route? This might fail if it has assigned shops.')) {
                e.preventDefault();
            }
        }}>
            <input type="hidden" name="id" value={id} />
            <DeleteButtonContent />
        </form>
    );
}
