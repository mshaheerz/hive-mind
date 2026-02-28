/**
 * @fileoverview Documentation page.
 * Renders the OpenAPI specification using Redoc.
 */

import { RedocStandalone } from '@redoc/react';
import { useEffect, useState } from 'react';

const SPEC_ENDPOINT = '/api/openapi';

/**
 * Docs component – fetches the spec URL and renders Redoc.
 *
 * @returns {JSX.Element}
 */
export default function Docs() {
  const [specUrl, setSpecUrl] = useState(null);
  const [error, setError] = useState(null);

  // Initialise the spec URL once the component mounts.
  useEffect(() => {
    setSpecUrl(SPEC_ENDPOINT);
  }, []);

  if (error) {
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-semibold">Failed to load documentation</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!specUrl) {
    return (
      <div className="p-8">
        <p>Loading documentation...</p>
      </div>
    );
  }

  return (
    <RedocStandalone specUrl={specUrl} />
  );
}
