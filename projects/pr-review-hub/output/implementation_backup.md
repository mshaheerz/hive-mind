**File: `package.json`**
```json
{
  "name": "pr-review-hub",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "echo \"No tests defined\" && exit 0",
    "lint": "next lint"
  },
  "dependencies": {
    "@octokit/rest": "^20.0.2",
    "@prisma/client": "^5.12.0",
    "autoprefixer": "^10.4.15",
    "lucide-react": "^0.363.0",
    "next": "15.0.0-canary.13",
    "next-auth": "^4.24.7",
    "react": "19.0.0-rc-0b6b3e5b9-20240301",
    "react-dom": "19.0.0-rc-0b6b3e5b9-20240301",
    "tailwindcss": "^3.4.1"
  },
  "devDependencies": {
    "eslint": "9.5.0",
    "eslint-config-next": "15.0.0-canary.13",
    "postcss": "^8.4.31"
  }
}
```

**File: `next.config.js`**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable server actions (available in Next.js 15 canary)
    serverActions: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

**File: `tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**File: `postcss.config.js`**
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**File: `app/layout.js`**
```js
import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = /** @type {Metadata} */ ({
  title: 'PR Review Hub',
  description: 'Aggregate GitHub pull requests across repositories',
});

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**File: `app/page.js`**
```js
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
```

**File: `app/components/Dashboard.js`**
```js
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
```

**File: `app/components/PullRequestCard.js`**
```js
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import CommentForm from './CommentForm';

/**
 * @typedef {Object} PR
 * @property {number} id
 * @property {string} title
 * @property {string} html_url
 * @property {string} user_login
 * @property {string} user_avatar_url
 * @property {string} created_at
 * @property {string} body
 */

/**
 * Client component that shows a PR and allows commenting.
 * @param {{ pr: PR, token: string }} props
 */
export default function PullRequestCard({ pr, token }) {
  const [showComment, setShowComment] = useState(false);

  return (
    <div className="rounded border p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <img
          src={pr.user_avatar_url}
          alt={pr.user_login}
          className="h-8 w-8 rounded-full"
        />
        <div>
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            {pr.title}
          </a>
          <p className="text-sm text-gray-500">
            #{pr.id} opened by {pr.user_login}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-3">{pr.body}</p>

      <button
        onClick={() => setShowComment(!showComment)}
        className="mt-3 text-sm text-indigo-600 hover:underline"
      >
        {showComment ? 'Cancel' : 'Add Comment'}
      </button>

      {showComment && (
        <div className="mt-2 rounded border p-2">
          <CommentForm
            prNumber={pr.id}
            repoOwner={pr.base?.repo?.owner?.login || ''}
            repoName={pr.base?.repo?.name || ''}
            token={token}
            onSuccess={() => setShowComment(false)}