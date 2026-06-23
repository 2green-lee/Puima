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

// ---------------------------------------------------------
// Naver Smart Store & Magic Link Automation Structure
// ---------------------------------------------------------
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendKakaoAlimtalk(contact: string, link: string) {
  console.log(`[Notification] 📨 알림톡 발송 (Solapi/Bizgo): ${contact}`);
  console.log(`링크: ${link}`);
  // TODO: Insert Solapi or Bizgo SDK/API call here
}

async function sendMagicLinkEmail(email: string, link: string) {
  console.log(`[Notification] 📧 이메일 발송 (SendGrid): ${email}`);
  console.log(`링크: ${link}`);
  // TODO: Insert SendGrid API call here
}

async function pollNaverOrders() {
  const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
  const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
  
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.log("[Naver API] ⚠️ 네이버 API 키가 없습니다. 주문 조회를 건너뜁니다.");
    return;
  }

  try {
    console.log("[Naver API] 🔄 네이버 스마트스토어 신규 결제완료 주문 조회 중...");
    
    // 1. 네이버 API 토큰 발급 및 변경된 상품 주문 내역 조회 (API 호출 구현부)
    // const orders = await fetchNaverOrders(NAVER_CLIENT_ID, NAVER_CLIENT_SECRET);
    
    // 임시 목업 데이터 (Mock Data)
    const mockOrders = [
      /*
      {
        orderId: "N123456789",
        productId: "NAVER_PROD_001", // 네이버 상품 ID
        buyerName: "홍길동",
        buyerPhone: "010-1234-5678",
        buyerEmail: "test@example.com"
      }
      */
    ];

    for (const order of mockOrders) {
      // 2. 해당 네이버 상품 ID와 매칭되는 우리 시스템의 강의(video/post) 조회
      const { data: post } = await supabase
        .from('posts')
        .select('id')
        .eq('naver_product_id', order.productId)
        .single();

      if (!post) continue; // 매칭되는 강의가 없으면 패스

      // 3. 이미 매직 링크가 발송되었는지 중복 체크
      const { data: existingLink } = await supabase
        .from('magic_links')
        .select('id')
        .eq('order_id', order.orderId)
        .single();

      if (existingLink) continue; // 이미 발송됨

      // 4. 매직 링크 토큰 생성 (UUID) 및 DB 저장 (유효기간 7일)
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from('magic_links').insert({
        id: token,
        order_id: order.orderId,
        post_id: post.id,
        expires_at: expiresAt.toISOString(),
        buyer_contact: order.buyerPhone || order.buyerEmail
      });

      // 5. 발송용 매직 링크 URL 생성
      const APP_URL = process.env.APP_URL || "http://localhost:3001";
      const magicLinkUrl = `${APP_URL}/claim-course?token=${token}`;

      // 6. 알림톡 및 이메일 동시 발송
      if (order.buyerPhone) await sendKakaoAlimtalk(order.buyerPhone, magicLinkUrl);
      if (order.buyerEmail) await sendMagicLinkEmail(order.buyerEmail, magicLinkUrl);
    }
  } catch (error) {
    console.error("[Naver API] ❌ 주문 조회 중 오류 발생:", error);
  }
}

// 1분(60000ms)마다 네이버 주문 조회 실행
setInterval(pollNaverOrders, 60 * 1000);
// ---------------------------------------------------------

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

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
