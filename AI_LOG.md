# AI Interaction Log

**Tool used:** Claude Code (Anthropic) — CLI-based AI coding assistant  
**Project:** IE 304 – Project 1, Intelligent Chatbot Application  
**Course:** METU Industrial Engineering, IE 304

---

## Overview

Claude Code was used as a coding assistant throughout the development process. All architectural decisions, data sourcing strategy, and project design were made by the group. Claude Code was used to implement the decisions and handle code-level tasks as described below.

---

## Phase 1 — Research & Architecture Design

**Who:** Group  
**What:** Before starting development, existing open-source chatbot and RAG pipeline projects on GitHub were reviewed to understand common approaches. The group evaluated options such as vector databases (Chroma, Pinecone) vs. keyword-based retrieval, and cloud LLM APIs (OpenAI, Google Gemini, Cohere).

**Decision made by group:**
- Use BM25 keyword search instead of a vector database — no infrastructure cost, sufficient for a domain-specific knowledge base
- Use Google Gemini API as the LLM — free tier available, good multilingual support for Turkish
- Deploy on Vercel with Next.js — zero-config deployment, edge-compatible API routes

---

## Phase 2 — Data Pipeline

**Who:** Group designed; Claude Code implemented  
**What:** The group identified the data sources: the official METU-IE Summer Practice website (`sp-ie.metu.edu.tr/en`) and department documents (manuals, forms, introduction slides).

**Group decisions:**
- Which pages to scrape from the SP website
- Which form documents to include
- Password-protected files were intentionally skipped during scraping to avoid errors; their content was manually added to the pipeline
- FAQ dataset content (25 Q&A pairs) was authored by the group based on commonly asked student questions

**Claude Code's role:**
- Implemented `scraper.py` — crawls the SP website, extracts text per page, saves as JSON
- Implemented `ingest_forms.py` — extracts text from PDF and `.doc` files using `pdfplumber` and `python-docx`
- Implemented `rechunk.py` — merges fragmented text chunks, integrates FAQ dataset, writes final `knowledge_base.json`

---

## Phase 3 — RAG Pipeline & Gemini Integration

**Who:** Group designed; Claude Code implemented  
**What:** The group defined the retrieval and response logic.

**Group decisions:**
- Top-10 BM25 chunk retrieval per query
- System prompt rules: answer only from provided context, respond in Turkish if user writes in Turkish, politely decline out-of-scope questions
- Show source citations below each answer

**Claude Code's role:**
- Implemented `lib/search.ts` — BM25 scoring, tokenization, IDF weighting over the knowledge base
- Implemented `app/api/chat/route.ts` — retrieves relevant chunks, builds prompt, calls Gemini API, streams response

---

## Phase 4 — Frontend & Deployment

**Who:** Group designed; Claude Code implemented  
**What:** The group decided on the UI layout and interaction model (chat interface, multi-turn conversation, source citations displayed below answers).

**Claude Code's role:**
- Implemented `components/ChatInterface.tsx` — full chat UI with message history, loading states, source citation display
- Implemented `app/page.tsx`, `app/layout.tsx` — Next.js app shell
- Configured `next.config.ts` and `tailwind.config.ts`

**Group:**
- Created GitHub repository and configured Vercel deployment
- Connected custom domain and verified live deployment at `metu-ie-chatbot.vercel.app`

---

## Summary

| Task | Responsible |
|---|---|
| Architecture & technology selection | Group |
| Data source identification | Group |
| FAQ dataset content | Group |
| Out-of-scope behavior design | Group |
| Vercel / GitHub setup | Group |
| Data pipeline implementation | Claude Code |
| BM25 retrieval engine | Claude Code |
| Gemini API integration | Claude Code |
| Frontend implementation | Claude Code |
