import Dashboard from '@/components/Dashboard';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  // Middleware should handle this, but double check
  if (!session) {
    redirect('/login');
  }

  const { role, lorryId, username } = session.user;
  const { territoryId } = session;

  // Unified Data Fetching
  // Filter by Territory AND (if Rep) specific Lorry
  const lorryWhere = {
    territoryId: territoryId,
    ...(role === 'REP' && lorryId ? { id: lorryId } : {})
  };

  const lorries = await prisma.lorry.findMany({
    where: lorryWhere,
    include: {
      routes: true
    }
  });

  // Fetch shops based on visible lorries
  const visibleLorryIds = lorries.map(l => l.id);
  const shops = await prisma.shop.findMany({
    where: {
      route: {
        lorryId: { in: visibleLorryIds }
      }
    }
  });

  // For backward compatibility with Dashboard props (if needed) or just pass lorries
  // We'll update Dashboard to use 'lorries' primarily for navigation
  const allRoutes = lorries.flatMap(l => l.routes);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <header className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center z-10 relative">
        <h1 className="text-2xl font-bold">Chamalka Distributors - Shop Mapper</h1>
        {role === 'ADMIN' && (
          <div className="space-x-4 text-sm font-semibold">
            <Link href="/admin/users" className="hover:text-blue-200">Users</Link>
            <Link href="/admin/logistics" className="hover:text-blue-200">Logistics</Link>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden relative">
        <Dashboard
          routes={allRoutes}
          shops={shops}
          userRole={role}
          username={username}
          lorries={lorries}
        />
      </div>
    </main>
  );
}
