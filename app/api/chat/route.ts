// Author: emrk-dev
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a helpful virtual assistant for METU (Middle East Technical University) Industrial Engineering Summer Practice (Staj) program.

Your knowledge comes exclusively from the official METU-IE Summer Practice website (sp-ie.metu.edu.tr) and official department documents (IE300/IE400 manuals, application forms, and related guidelines).

Rules:
1. Answer ONLY questions related to METU-IE Summer Practice (IE300, IE400, application procedures, required documents, deadlines, SGK insurance, evaluation forms, etc.).
2. Base your answers strictly on the provided context chunks. Do not invent information.
3. If the context does not contain enough information to answer confidently, say so clearly and suggest the student visit sp-ie.metu.edu.tr or contact the department.
4. If the question is completely unrelated to METU-IE Summer Practice (e.g., general coding help, other courses, personal questions), politely decline and remind the user of your purpose.
5. Be concise, friendly, and professional. Use bullet points for lists.
6. You may respond in Turkish if the user writes in Turkish.`;

function buildPrompt(context: string, question: string): string {
  return `Context from official METU-IE Summer Practice documents:
---
${context}
---

Student question: ${question}

Answer based on the context above. If the context does not contain the answer, say so.`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Retrieve relevant chunks — more chunks = better context
    const results = search(message, 10);

    // Group chunks by source document and build rich context
    const context = results.length > 0
      ? results.map((r) => `[Source: ${r.title}]\n${r.text}`).join("\n\n")
      : "No relevant documents found.";

    // Deduplicate sources by title, keep only top 3 most relevant
    const seenTitles = new Set<string>();
    const uniqueSources = results
      .filter((r) => {
        if (seenTitles.has(r.title)) return false;
        seenTitles.add(r.title);
        return true;
      })
      .slice(0, 3)
      .map((r) => ({
        title: r.title,
        // Map local form files to the real website, keep web URLs as-is
        url: r.url.startsWith("http") ? r.url : "https://sp-ie.metu.edu.tr/en",
      }));

    // Build chat history for multi-turn
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: (history ?? []).map((msg: { role: string; text: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
    });

    const result = await chat.sendMessage(buildPrompt(context, message));
    const text = result.response.text();

    return NextResponse.json({
      answer: text,
      sources: uniqueSources,
    });
  } catch (err) {
    console.error("[chat/route]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
