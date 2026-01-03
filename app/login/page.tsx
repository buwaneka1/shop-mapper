
import LoginForm from '@/components/LoginForm';

import AnimatedBackground from '@/components/AnimatedBackground';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
    const territories = await prisma.territory.findMany();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative p-4">
            <AnimatedBackground />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 ring-1 ring-slate-200">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 ring-8 ring-blue-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shop Mapper</h1>
                        <h2 className="text-lg text-slate-600 font-medium mt-1">Chamalka Distributors</h2>
                    </div>

                    <LoginForm territories={territories} />
                </div>

                <div className="text-center space-y-2">
                    <p className="text-xs text-slate-500 bg-white/50 backdrop-blur inline-block px-3 py-1 rounded-full border border-white/30">
                        Designed & Developed by <span className="font-semibold text-slate-700">Buwaneka Kalansuriya</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
