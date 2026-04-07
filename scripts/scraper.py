"""
scraper.py
----------
Scrapes the METU-IE Summer Practice website and saves content as knowledge_base.json.
Run once before starting the chatbot.

Usage:
    cd scripts && python scraper.py
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse

BASE_URL = "https://sp-ie.metu.edu.tr/en"
DOMAIN   = "sp-ie.metu.edu.tr"

SKIP_EXTENSIONS = [".xls", ".xlsx", ".pdf", ".doc", ".docx", ".zip", ".png", ".jpg"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; METU-IE-Chatbot/1.0)"
}


def get_all_links(soup: BeautifulSoup, current_url: str) -> list[str]:
    """Returns all internal links found on the page."""
    links = []
    for tag in soup.find_all("a", href=True):
        href = tag["href"]
        full_url = urljoin(current_url, href)
        parsed = urlparse(full_url)

        # Only same domain, /en paths, no files
        if parsed.netloc != DOMAIN:
            continue
        if not parsed.path.startswith("/en"):
            continue
        if any(parsed.path.endswith(ext) for ext in SKIP_EXTENSIONS):
            continue

        clean = full_url.split("#")[0].rstrip("/")
        if clean not in links:
            links.append(clean)
    return links


def scrape_page(url: str) -> dict | None:
    """Scrapes a single page. Returns None if failed or not useful."""

    # Skip non-HTML files
    if any(url.endswith(ext) for ext in SKIP_EXTENSIONS):
        return None

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] {url}: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Page title
    title = ""
    if soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)
    elif soup.title:
        title = soup.title.get_text(strip=True)

    # Main content: try multiple selectors
    main = (
        soup.find("main")
        or soup.find("article")
        or soup.find(class_=["content", "main-content", "page-content"])
        or soup.find("body")
    )

    # Safety check
    if main is None:
        print(f"  [SKIP] No content found: {url}")
        return None

    # Remove noise elements
    for tag in main.find_all(["nav", "footer", "script", "style", "header"]):
        tag.decompose()

    # Collect text blocks
    chunks = []
    for elem in main.find_all(["h1", "h2", "h3", "h4", "p", "li", "td", "th"]):
        text = elem.get_text(separator=" ", strip=True)
        if len(text) > 30:      # Skip very short lines
            chunks.append(text)

    if not chunks:
        print(f"  [SKIP] Empty content: {url}")
        return None

    return {
        "url":       url,
        "title":     title,
        "chunks":    chunks,
        "full_text": "\n".join(chunks),
    }


def crawl(start_url: str = BASE_URL, delay: float = 1.0) -> list[dict]:
    """Crawls the entire site using BFS."""
    visited = set()
    queue   = [start_url]
    pages   = []

    while queue:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        print(f"Scraping: {url}")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
        except requests.RequestException as e:
            print(f"  [SKIP] {e}")
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        page_data = scrape_page(url)
        if page_data:
            pages.append(page_data)

        # Add new links to queue
        for link in get_all_links(soup, url):
            if link not in visited:
                queue.append(link)

        time.sleep(delay)

    return pages


def build_knowledge_base(pages: list[dict]) -> list[dict]:
    """Splits each page into chunks and adds metadata."""
    kb = []
    for page in pages:
        for i, chunk in enumerate(page["chunks"]):
            kb.append({
                "id":    f"{urlparse(page['url']).path}_{i}",
                "url":   page["url"],
                "title": page["title"],
                "text":  chunk,
            })
    return kb


def main():
    print("=" * 60)
    print("METU-IE Summer Practice Website Scraper")
    print("=" * 60)

    pages = crawl(BASE_URL, delay=1.0)
    print(f"\n✓ Scraped {len(pages)} pages.")

    kb = build_knowledge_base(pages)
    print(f"✓ Created {len(kb)} chunks.")

    with open("knowledge_base.json", "w", encoding="utf-8") as f:
        json.dump(kb, f, ensure_ascii=False, indent=2)

    print("✓ knowledge_base.json saved.")
    print("Next: python app.py")


if __name__ == "__main__":
    main()