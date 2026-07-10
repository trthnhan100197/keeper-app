// Nhận văn bản đã chuyển từ giọng nói (client-side Web Speech API), dùng Claude để tách
// thành danh sách các phòng + số điện/nước tương ứng. Có thể chứa nhiều phòng trong 1 lần nói.
// Không tự lưu — chỉ trả kết quả để người dùng xác nhận trước (giọng nói luôn cần review).

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type VoiceEntry = {
  roomText: string | null;
  electricReading: number | null;
  waterReading: number | null;
  confidence: "high" | "low";
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Server chưa cấu hình ANTHROPIC_API_KEY" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.transcript !== "string" || !body.transcript.trim()) {
    return NextResponse.json(
      { error: "Thiếu trường 'transcript' (văn bản đã chuyển từ giọng nói)" },
      { status: 400 }
    );
  }

  const anthropic = new Anthropic();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content:
            `Đây là văn bản đã chuyển từ giọng nói tiếng Việt (có thể có lỗi nhận diện): "${body.transcript}"\n\n` +
            `Người dùng có thể đọc số điện/nước cho NHIỀU phòng liên tiếp trong 1 lần nói. Tách ra từng phòng ` +
            `được nhắc tới kèm số điện và/hoặc số nước tương ứng (nếu có nhắc tới). "roomText" là tên/số phòng ` +
            `nghe được, chuyển về dạng số nếu nghe rõ (vd "phòng một trăm lẻ một" → "101"), giữ nguyên văn bản ` +
            `gốc nếu không chắc là số gì. Nếu không chắc chắn về giá trị nào (số hoặc tên phòng), đặt confidence ` +
            `là "low" cho phòng đó.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              entries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    roomText: { anyOf: [{ type: "string" }, { type: "null" }] },
                    electricReading: { anyOf: [{ type: "integer" }, { type: "null" }] },
                    waterReading: { anyOf: [{ type: "integer" }, { type: "null" }] },
                    confidence: { type: "string", enum: ["high", "low"] },
                  },
                  required: ["roomText", "electricReading", "waterReading", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["entries"],
            additionalProperties: false,
          },
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi gọi Claude";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "Claude từ chối xử lý nội dung này" }, { status: 502 });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Không nhận được phản hồi từ Claude" }, { status: 502 });
  }

  let parsed: { entries: VoiceEntry[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    return NextResponse.json(
      { error: "Không parse được kết quả từ Claude", raw: textBlock.text },
      { status: 502 }
    );
  }

  return NextResponse.json({
    entries: parsed.entries.map((e) => ({ ...e, needsReview: true })), // giọng nói luôn cần người dùng xác nhận
  });
}
