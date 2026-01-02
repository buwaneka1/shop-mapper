'use client';

import { deleteUser } from '@/app/actions';
import { useState } from 'react';

export default function DeleteUserButton({ userId }: { userId: number }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        const confirmed = window.confirm("Are you sure you want to delete this user? This action cannot be undone.");

        if (confirmed) {
            setIsDeleting(true);
            const formData = new FormData();
            formData.append('userId', userId.toString());

            try {
                await deleteUser(formData);
                // Action revalidates path, so page effectively reloads/updates
            } catch (error) {
                alert("Failed to delete user");
                console.error(error);
                setIsDeleting(false);
            }
        }
    };

    return (
        <form onSubmit={handleDelete} className="inline-block">
            <button
                type="submit"
                disabled={isDeleting}
                className={`text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 border border-red-200 rounded hover:bg-red-50 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
        </form>
    );
}
