"use client";

import { useState, useEffect } from "react";

// Define types for API response
interface FormData {
  forms: Array<Record<string, unknown>>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function DomainDatabaseTest() {
  const [results, setResults] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    // Get the current host
    setHost(window.location.host);
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      // Make a request to the API
      const response = await fetch("/api/forms?limit=5", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Domain Database Connection Test
      </h1>

      <div className="mb-4 p-4 bg-blue-50 rounded">
        <p>
          <strong>Current Domain:</strong> {host}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          To test different domains, access this page from different host names
          in your hosts file or by using different ports.
        </p>
      </div>

      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      >
        {loading ? "Testing..." : "Test Database Connection"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Connection Results:</h2>

          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-bold mb-2">
              Found {results.forms.length} forms
            </h3>
            <p>Total Records: {results.pagination.total}</p>

            <div className="mt-4">
              <h4 className="font-bold">Form Data:</h4>
              <pre className="bg-gray-100 p-2 rounded overflow-auto mt-2 max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">How to Test Different Domains</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Edit your local hosts file to map different domains to 127.0.0.1
          </li>
          <li>Use different ports (e.g. localhost:3000, localhost:3001)</li>
          <li>Make sure each domain is configured in the database.json file</li>
          <li>Access this test page from each domain to verify connections</li>
        </ol>
      </div>
    </div>
  );
}
