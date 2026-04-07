"""
rechunk.py
----------
Merges tiny fragmented chunks from the same source into coherent paragraphs.
Then rebuilds data/knowledge_base.json with better chunks + custom FAQ.

Target chunk size: ~400 characters (roughly 2-4 sentences).
Overlap: last sentence of previous chunk prepended to next chunk.

Usage:
    cd scripts && python rechunk.py
"""

import json
from pathlib import Path
from collections import defaultdict

INPUT_KB   = Path(__file__).parent / "knowledge_base.json"   # original (scraper + forms)
FAQ_FILE   = Path(__file__).parent / "faq.json"              # custom FAQ dataset
OUTPUT_KB  = Path(__file__).parent.parent / "data" / "knowledge_base.json"

TARGET_CHUNK_CHARS = 400   # target size for merged chunks
MIN_CHUNK_CHARS    = 60    # drop chunks shorter than this


def merge_fragments(fragments: list[str], target: int = TARGET_CHUNK_CHARS) -> list[str]:
    """
    Merge a list of text fragments into larger, coherent chunks.
    Uses a simple greedy approach: keep appending until target size reached.
    """
    chunks: list[str] = []
    current = ""

    for frag in fragments:
        frag = frag.strip()
        if not frag:
            continue

        # If adding this fragment would exceed the target, save current and start new
        if current and len(current) + len(frag) + 1 > target:
            chunks.append(current.strip())
            # Overlap: carry the last sentence of the previous chunk
            last_sentence = current.strip().rsplit(".", 1)
            current = (last_sentence[-1].strip() + " " if len(last_sentence) > 1 else "") + frag
        else:
            current = (current + " " + frag).strip() if current else frag

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if len(c) >= MIN_CHUNK_CHARS]


def rechunk_kb(raw_kb: list[dict]) -> list[dict]:
    """Group by source URL, merge tiny fragments, return new KB entries."""

    # Group fragments by source URL
    by_url: dict[str, dict] = defaultdict(lambda: {"title": "", "fragments": []})
    for entry in raw_kb:
        by_url[entry["url"]]["title"] = entry["title"]
        by_url[entry["url"]]["fragments"].append(entry["text"])

    new_entries: list[dict] = []
    for url, data in by_url.items():
        merged = merge_fragments(data["fragments"])
        source_id = url.replace("https://", "").replace("http://", "").replace("/", "_")
        for i, chunk in enumerate(merged):
            new_entries.append({
                "id":    f"{source_id}_{i}",
                "url":   url,
                "title": data["title"],
                "text":  chunk,
            })

    return new_entries


def load_faq(faq_path: Path) -> list[dict]:
    """Load custom FAQ and format as KB entries."""
    if not faq_path.exists():
        print(f"  [WARN] {faq_path} not found — skipping FAQ.")
        return []

    with open(faq_path, encoding="utf-8") as f:
        faqs: list[dict] = json.load(f)

    entries = []
    for i, item in enumerate(faqs):
        q = item.get("question", "").strip()
        a = item.get("answer", "").strip()
        if not q or not a:
            continue
        entries.append({
            "id":    f"faq_{i}",
            "url":   "https://sp-ie.metu.edu.tr/en",
            "title": "FAQ – METU-IE Summer Practice",
            "text":  f"Q: {q}\nA: {a}",
        })
    return entries


def main():
    print("Loading original knowledge base …")
    with open(INPUT_KB, encoding="utf-8") as f:
        raw_kb: list[dict] = json.load(f)
    print(f"  Original entries : {len(raw_kb)}")

    print("Re-chunking …")
    rechunked = rechunk_kb(raw_kb)
    print(f"  Re-chunked entries : {len(rechunked)}")

    print("Loading FAQ …")
    faq_entries = load_faq(FAQ_FILE)
    print(f"  FAQ entries : {len(faq_entries)}")

    final_kb = rechunked + faq_entries
    print(f"  Total entries : {len(final_kb)}")

    OUTPUT_KB.parent.mkdir(exist_ok=True)
    with open(OUTPUT_KB, "w", encoding="utf-8") as f:
        json.dump(final_kb, f, ensure_ascii=False, indent=2)

    print(f"\nSaved to {OUTPUT_KB}")


if __name__ == "__main__":
    main()
