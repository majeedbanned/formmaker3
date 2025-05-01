// src/app/page.tsx
"use client";

import { useState } from "react";

interface ScanResult {
  qRCodeData: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string; // e.g. "upload/corrects/2285137680.jpg"
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
          imagePath: "/input.jpg", // your test image in /public
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
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Exam Sheet Scanner</h1>

      <button
        onClick={runScan}
        disabled={loading}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Scanning…" : "Run Scanner"}
      </button>

      {error && <p className="mt-4 text-red-600">Error: {error}</p>}

      {result && (
        <section className="mt-6 space-y-6">
          <div>
            <h2 className="text-xl font-medium">Result JSON</h2>
            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-medium">Corrected Image</h2>
            <img
              src={
                result.correctedImageUrl.startsWith("/")
                  ? result.correctedImageUrl
                  : `/${result.correctedImageUrl}`
              }
              alt="Corrected Answer Sheet"
              className="mt-2 w-full h-auto rounded shadow"
            />
          </div>
        </section>
      )}
    </main>
  );
}
