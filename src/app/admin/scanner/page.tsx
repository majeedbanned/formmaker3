"use client";

import { useState } from "react";

interface ScanResult {
  qRCodeData: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string;
}

export default function Home() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath: "/input.jpg", // place your test image in /public/
          answers: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
        }),
      });

      if (!res.ok) {
        const err = (await res.json()).error || res.statusText;
        throw new Error(err);
      }

      const data = (await res.json()) as ScanResult;
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-4">
      <button
        onClick={runScan}
        className="px-4 py-2 bg-green-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Scanning…" : "Run Scanner"}
      </button>

      {error && <p className="mt-4 text-red-600">Error: {error}</p>}

      {result && (
        <pre className="mt-4 p-3 bg-gray-100 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
