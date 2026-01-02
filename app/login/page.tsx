import { PrismaClient } from '@prisma/client';
import LoginForm from '@/components/LoginForm';

import AnimatedBackground from '@/components/AnimatedBackground';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export default async function LoginPage() {
    const territories = await prisma.territory.findMany();

    return (
        <div className="flex items-center justify-center min-h-screen relative">
            <AnimatedBackground />
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Shop Mapper</h1>
                <LoginForm territories={territories} />
            </div>
        </div>
    );
}
