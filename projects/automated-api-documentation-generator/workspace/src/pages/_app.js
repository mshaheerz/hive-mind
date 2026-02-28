/**
 * @fileoverview Custom App component to inject global styles and initialise Tailwind.
 * This file ensures every page has access to Tailwind utilities.
 */

import '../styles/globals.css';
import { useEffect } from 'react';

/**
 * Root component wrapper for all Next.js pages.
 *
 * @param {object} props - Component props.
 * @param {React.ComponentType} props.Component - Active page component.
 * @param {object} props.pageProps - Props for the page.
 * @returns {JSX.Element}
 */
export default function MyApp({ Component, pageProps }) {
  // Scroll to top on route changes – simple UX improvement.
  useEffect(() => {
    const handleRouteChange = () => window.scrollTo(0, 0);
    // In a full implementation you could subscribe to router events here.
    return () => {};
  }, []);

  return <Component {...pageProps} />;
}
