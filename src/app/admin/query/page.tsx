"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { javascript } from "@codemirror/lang-javascript";

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((mod) => mod.default),
  { ssr: false }
);

interface QueryResult {
  success: boolean;
  results: Record<string, unknown>[];
  count: number;
  executionTime: number;
  explain?: Record<string, unknown>;
  error?: string;
}

export default function MongoDBQueryPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState<string>(
    '{\n  "collection": "students",\n  "operation": "find",\n  "query": {}\n}'
  );
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("results");

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse the query string to JSON
      const queryObj = JSON.parse(query);

      // Execute the query
      const response = await fetch("/api/mongodb/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryObj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unknown error occurred");
      }

      setResults(data);
      toast({
        title: "Query executed successfully",
        description: `Found ${data.count} documents in ${data.executionTime}ms`,
        variant: "default",
      });

      // Switch to results tab
      setActiveTab("results");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Error executing query",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const explainQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parse the query string to JSON
      const queryObj = JSON.parse(query);

      // Add explain parameter
      queryObj.explain = "executionStats";

      // Execute the query with explain
      const response = await fetch("/api/mongodb/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryObj),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unknown error occurred");
      }

      setResults(data);
      toast({
        title: "Query explained successfully",
        description: `Execution stats available`,
        variant: "default",
      });

      // Switch to explain tab
      setActiveTab("explain");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({
        title: "Error explaining query",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">MongoDB Query Tool</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4 col-span-1">
          <h2 className="text-xl font-semibold mb-2">Query Editor</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter a JSON object with collection, operation (find/aggregate), and
            query fields.
          </p>

          <div className="mb-4 border rounded-md overflow-hidden">
            <CodeMirror
              value={query}
              height="300px"
              extensions={[javascript({ jsx: false })]}
              onChange={(value: string) => setQuery(value)}
              theme="dark"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={executeQuery} disabled={loading}>
              {loading ? "Executing..." : "Execute Query"}
            </Button>
            <Button onClick={explainQuery} disabled={loading} variant="outline">
              Explain Query
            </Button>
          </div>
        </Card>

        <Card className="p-4 col-span-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="explain">Explain</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <h2 className="text-xl font-semibold mb-2">Query Results</h2>
              {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              {results && (
                <div>
                  <div className="mb-4 text-sm">
                    <p>
                      Found {results.count} documents in {results.executionTime}
                      ms
                    </p>
                  </div>

                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                    {JSON.stringify(results.results, null, 2)}
                  </pre>
                </div>
              )}

              {!results && !error && (
                <p className="text-gray-500">No query executed yet.</p>
              )}
            </TabsContent>

            <TabsContent value="explain">
              <h2 className="text-xl font-semibold mb-2">Execution Plan</h2>
              {results?.explain ? (
                <pre className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {JSON.stringify(results.explain, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">
                  No execution plan available. Use &quot;Explain Query&quot; to
                  see execution statistics.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
