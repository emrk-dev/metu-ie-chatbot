# METU-IE Summer Practice Chatbot

**Course:** IE 304 – Project 1
**Institution:** Middle East Technical University, Industrial Engineering Department

An intelligent chatbot that answers student questions about METU-IE Summer Practice (IE300/IE400), built with a RAG (Retrieval-Augmented Generation) pipeline powered by Google Gemini.

---

## Live Demo

> **[metu-ie-chatbot.vercel.app](https://metu-ie-chatbot.vercel.app)**

---

## Features

- Answers questions about IE300/IE400 requirements, application steps, SGK insurance, required documents, deadlines, and more
- RAG pipeline: BM25 retrieval over 600+ knowledge chunks from official SP documents
- Knowledge base built from the official [METU-IE SP website](https://sp-ie.metu.edu.tr/en) and department documents (manuals, forms, introductions)
- Custom FAQ dataset of 25 commonly asked student questions
- Politely declines out-of-scope questions
- Responds in Turkish if the user writes in Turkish
- Source citations shown below each answer
- Multi-turn conversation support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Next.js API Routes (Edge-compatible) |
| LLM | Google Gemini 3.1 Flash Lite |
| Retrieval | BM25 keyword search (custom, no vector DB) |
| Hosting | Vercel |
| Data pipeline | Python (pdfplumber, python-docx, BeautifulSoup) |

---

## Project Structure

```
metu-ie-chatbot/
├── app/                        # Next.js App Router
│   ├── api/chat/route.ts       # RAG + Gemini API endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ChatInterface.tsx       # Chat UI component
├── lib/
│   └── search.ts               # BM25 retrieval engine
├── data/
│   └── knowledge_base.json     # Processed knowledge base (608 chunks)
└── scripts/                    # Python data pipeline
    ├── forms/                  # Source documents (PDFs, .doc files)
    ├── scraper.py              # Crawls sp-ie.metu.edu.tr
    ├── ingest_forms.py         # Extracts text from forms/
    ├── rechunk.py              # Merges fragments + adds FAQ
    ├── faq.json                # Custom FAQ dataset (25 Q&A)
    └── knowledge_base.json     # Raw knowledge base (pre-rechunk)
```

---

## System Architecture

```
User Query
    │
    ▼
BM25 Search (lib/search.ts)
    │  Retrieves top-10 relevant chunks from knowledge_base.json
    ▼
Prompt Builder (app/api/chat/route.ts)
    │  Injects chunks as context + system rules
    ▼
Google Gemini 3.1 Flash Lite
    │  Generates grounded answer
    ▼
Chat UI (components/ChatInterface.tsx)
    │  Displays answer + source citations
    ▼
User
```

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.local.example .env.local
# Add your Gemini API key to .env.local

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Data Pipeline (Re-running)

Only needed if you want to refresh the knowledge base:

```bash
cd scripts

# Step 1 – Scrape the official SP website
python scraper.py

# Step 2 – Extract text from forms/ documents
python ingest_forms.py

# Step 3 – Re-chunk and merge with FAQ → writes to ../data/knowledge_base.json
python rechunk.py
```

---

## Sample Test Queries

| Query | Expected Behaviour |
|---|---|
| What are the requirements for IE 300? | Lists IE300 eligibility and requirements |
| How do I apply for SGK insurance? | Explains OCW system and steps |
| What documents do I need for IE 400? | Lists all required documents |
| Can I do my internship remotely? | Answers no, explains physical attendance rule |
| What is a project-based internship? | Explains IE400 project internship rules |
| What is 2+2=4? | Politely declines — out of scope |

---

## Knowledge Base Sources

- [METU-IE Summer Practice Website](https://sp-ie.metu.edu.tr/en) — 11 pages scraped
- IE300 Summer Practice Manual
- IE400 Manufacturing Manual
- IE400 Service Manual
- IE300/IE400 Introduction Slides (2025)
- SP Application Forms (IE300/IE400)
- Evaluation Form
- SGK Declaration Forms
- Custom FAQ dataset (25 Q&A)
