import PullRequestCard from './PullRequestCard';
import { fetchPullRequests } from '../actions/fetchPullRequests';
import { Github } from 'lucide-react';

/**
 * Server component that fetches PR data and renders a list.
 * @param {{ session: any }} props
 */
export default async function Dashboard({ session }) {
  // Repositories to monitor – in a real app this would be configurable.
  const repos = [
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'facebook', repo: 'react' },
    { owner: 'vercel', repo: 'turbo' },
    { owner: 'prisma', repo: 'prisma' },
    { owner: 'nextauthjs', repo: 'next-auth' },
  ];

  const prs = await fetchPullRequests(repos, session.accessToken);

  return (
    <main className="p-6">
      <header className="mb-6 flex items-center">
        <Github className="mr-2 h-6 w-6" />
        <h1 className="text-2xl font-bold">Open Pull Requests</h1>
      </header>

      {prs.length === 0 ? (
        <p>No open pull requests found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prs.map((pr) => (
            <PullRequestCard key={pr.id} pr={pr} token={session.accessToken} />
          ))}
        </div>
      )}
    </main>
  );
}
