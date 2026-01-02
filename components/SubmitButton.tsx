'use client';

import { useFormStatus } from 'react-dom';
import Spinner from './Spinner';

interface SubmitButtonProps {
    children: React.ReactNode;
    className?: string;
    loadingText?: string;
}

export default function SubmitButton({ children, className, loadingText }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
            {pending && <Spinner />}
            {pending && loadingText ? loadingText : children}
        </button>
    );
}
