import Head from 'next/head';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Redoc from 'redoc';

export default function Home() {
  const [apiDocs, setApiDocs] = useState(null);

  useEffect(() => {
    async function fetchApiDocs() {
      try {
        const response = await axios.get('/api/docs');
        setApiDocs(response.data);
      } catch (error) {
        console.error('Error fetching API documentation:', error);
      }
    }

    fetchApiDocs();
  }, []);

  return (
    <div>
      <Head>
        <title>API Documentation</title>
        <meta name="description" content="Generated API documentation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-4">
        {apiDocs ? (
          <Redoc spec={apiDocs} />
        ) : (
          <p>Loading API Documentation...</p>
        )}
      </main>
    </div>
  );
}
