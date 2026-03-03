import Dashboard from './components/Dashboard';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

/**
 * Home page – renders the PR dashboard.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <a
          href="/api/auth/signin"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return <Dashboard session={session} />;
}
