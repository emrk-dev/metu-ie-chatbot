/**
 * lib/search.ts
 * BM25-style keyword search over the knowledge base.
 * Loaded once at module level (cached between requests in Next.js).
 */

import kb from "@/data/knowledge_base.json";

interface KBEntry {
  id: string;
  url: string;
  title: string;
  text: string;
}

const entries = kb as KBEntry[];

// ── Tokenisation ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","shall","can","need",
  "that","this","these","those","it","its","we","you","i","he","she","they",
  "their","our","your","my","his","her","who","which","what","when","where",
  "how","why","not","no","if","so","as","by","from","about","into","than",
  "also","such","all","any","each","more","most","other","some","then",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9çğışöüÇĞİŞÖÜ\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// ── IDF pre-computation ───────────────────────────────────────────────────────

const N = entries.length;
const df: Map<string, number> = new Map();

const tokenizedEntries: string[][] = entries.map((e) => {
  const tokens = tokenize(e.title + " " + e.text);
  const unique = new Set(tokens);
  unique.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  return tokens;
});

function idf(term: string): number {
  const docFreq = df.get(term) ?? 0;
  if (docFreq === 0) return 0;
  return Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
}

// ── BM25 scoring ─────────────────────────────────────────────────────────────

const K1 = 1.5;
const B  = 0.75;
const avgDL = tokenizedEntries.reduce((s, t) => s + t.length, 0) / N;

function bm25Score(docTokens: string[], queryTerms: string[]): number {
  const dl = docTokens.length;
  const tf: Map<string, number> = new Map();
  docTokens.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));

  let score = 0;
  for (const term of queryTerms) {
    const termFreq = tf.get(term) ?? 0;
    if (termFreq === 0) continue;
    const termIdf = idf(term);
    const numerator   = termFreq * (K1 + 1);
    const denominator = termFreq + K1 * (1 - B + B * (dl / avgDL));
    score += termIdf * (numerator / denominator);
  }
  return score;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  text: string;
  score: number;
}

export function search(query: string, topK = 6): SearchResult[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored = entries.map((entry, i) => ({
    ...entry,
    score: bm25Score(tokenizedEntries[i], queryTerms),
  }));

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
