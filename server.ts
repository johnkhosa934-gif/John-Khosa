import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to get GoogleGenAI instance safely
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Generate FB Caption (200 - 400 words)
app.post("/api/generate-caption", async (req, res) => {
  try {
    const { prompt, tone = "Engaging", language = "English" } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required and must be non-empty." });
    }

    if (prompt.length > 3000) {
      return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 3000 characters." });
    }

    const cleanPrompt = prompt.replace(/[^\w\s.,!?'"\-\/]/gi, "").trim() || prompt.trim();
    const cleanTone = String(tone).slice(0, 50);
    const cleanLang = String(language).slice(0, 50);

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured.",
      });
    }

    const systemInstruction = `You are a world-class Facebook content manager and viral copywriter.
Your job is to generate a comprehensive, highly engaging Facebook post caption based on the user's prompt.

CRITICAL REQUIREMENTS:
1. WORD COUNT: The caption MUST BE BETWEEN 200 AND 400 WORDS LONG. Do NOT make it shorter than 200 words. Do NOT exceed 400 words.
2. STRUCTURE:
   - Hook: An attention-grabbing first line (with appropriate emoji).
   - Body: 2-4 structured paragraphs detailing story, practical insights, value, or context.
   - Key Takeaways or Highlights: Bullet points if appropriate.
   - Call to Action (CTA): Encouraging comments, shares, tagging friends, or saving.
   - Hashtags: 5-8 relevant, trending Facebook hashtags at the end.
3. TONE & STYLE: ${cleanTone} tone.
4. LANGUAGE: Written in ${cleanLang}. If Roman Urdu is selected, write in natural, engaging Roman Urdu (Urdu written in Latin script).
5. Output ONLY the post caption. Do not include meta instructions or word counts in the final text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Write a 200-400 word Facebook caption for this prompt/topic: "${cleanPrompt}"`,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const captionText = response.text || "";
    const wordCount = captionText.trim().split(/\s+/).filter(Boolean).length;

    res.json({
      caption: captionText,
      wordCount,
      prompt,
    });
  } catch (error: any) {
    console.error("Error generating caption:", error);
    res.status(500).json({
      error: error.message || "Failed to generate Facebook caption.",
    });
  }
});

// 2. Generate Image
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1", style = "Photorealistic" } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required and must be non-empty." });
    }

    if (prompt.length > 3000) {
      return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 3000 characters." });
    }

    const cleanPromptStr = prompt.replace(/[^\w\s.,!?'"\-\/]/gi, "").trim() || prompt.trim();
    const cleanStyle = String(style).slice(0, 50);
    const validRatios = ["1:1", "4:3", "16:9", "3:4", "9:16"];
    const safeAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const enhancedPrompt = `${cleanPromptStr}, ${cleanStyle} style, high resolution, detailed lighting, vibrant color, 8k quality`;

    const ai = getGenAI();
    let imageUrl = "";
    let source = "gemini";

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: enhancedPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: safeAspectRatio as any,
            },
          },
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
              const base64Data = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              imageUrl = `data:${mimeType};base64,${base64Data}`;
              break;
            }
          }
        }
      } catch (geminiImgError: any) {
        console.warn("Gemini image generation error, falling back to Pollinations AI:", geminiImgError?.message);
      }
    }

    // Fallback if Gemini image generation is unavailable or failed
    if (!imageUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const cleanPrompt = encodeURIComponent(enhancedPrompt.slice(0, 200));
      imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
      source = "pollinations-fallback";
    }

    res.json({
      imageUrl,
      source,
      prompt,
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    res.status(500).json({
      error: error.message || "Failed to generate image.",
    });
  }
});

// 3. Generate Bulk Prompts from Niche/Topic
app.post("/api/generate-batch-prompts", async (req, res) => {
  try {
    const { nicheTopic, count = 5 } = req.body;

    if (!nicheTopic || typeof nicheTopic !== "string" || nicheTopic.trim().length === 0) {
      return res.status(400).json({ error: "Niche topic is required" });
    }

    if (nicheTopic.length > 500) {
      return res.status(400).json({ error: "Niche topic exceeds maximum length of 500 characters." });
    }

    const cleanTopic = nicheTopic.replace(/[^\w\s.,!?'"\-\/]/gi, "").trim() || nicheTopic.trim();
    const safeCount = Math.min(Math.max(Number(count) || 5, 1), 20);

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate ${safeCount} distinct, creative, and highly descriptive image & post prompts for the niche/topic: "${cleanTopic}".
Return a JSON array of strings. Each item should be a complete image generation prompt that would make a compelling Facebook post.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text?.trim() || "[]";
    const prompts: string[] = JSON.parse(jsonText);

    res.json({ prompts });
  } catch (error: any) {
    console.error("Error generating batch prompts:", error);
    res.status(500).json({
      error: error.message || "Failed to generate batch prompts.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
