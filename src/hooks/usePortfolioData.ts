import { useState, useEffect } from 'react';

/**
 * A custom hook to fetch and manage the main portfolio data.
 * @returns An object containing the loaded data and a loading status.
 */
export const usePortfolioData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch initial portfolio data on component mount.
   */
  useEffect(() => {
    fetch('/portfolio-data.json')
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load portfolio data:', error);
        setLoading(false);
      });
  }, []); // Empty dependency array ensures this runs only once

  return { data, loading };
};