import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure Gemini API works securely on server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
} else {
  console.warn("⚠️ GEMINI_API_KEY environment variable is not defined on the server.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for secure translation
  app.post("/api/translate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.json({ translated: "" });
      }

      if (!aiClient) {
        console.error("AI service is uninitialized. Missing GEMINI_API_KEY.");
        return res.status(500).json({ error: "AI translation client is not configured on the server." });
      }

      const trimmedText = text.trim();

      // Call Gemini 2.5 Flash for translating text
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a professional Korean-to-English translator for PUIMA (a premium dessert/baking academy).
Translate the following Korean text into professional, natural, engaging, and friendly English.
Return ONLY the translated English text. No introductory remarks, no explanations, no wrapping in quotes, no markdown headers. Direct translation only.

Text to translate:
${trimmedText}`
              }
            ]
          }
        ]
      });

      const translated = response.text?.trim() || trimmedText;
      return res.json({ translated });
    } catch (error: any) {
      console.error("Error in server translation API:", error);
      return res.status(500).json({ error: error.message || "Failed to translate text" });
    }
  });

  // Serve static assets in production, or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PUIMA full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
