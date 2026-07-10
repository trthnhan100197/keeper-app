// Dùng chung cho mọi route đọc chỉ số đồng hồ bằng Claude Vision.
// Dùng Haiku thay vì Opus: tác vụ chỉ đọc 1 dãy số trên mặt đồng hồ, không cần model mạnh,
// giúp tiết kiệm chi phí đáng kể khi gọi nhiều lần (nhiều phòng/tháng).

import Anthropic from "@anthropic-ai/sdk";

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

export function isAllowedMediaType(type: string): type is AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(type);
}

export type MeterVisionResult = {
  reading: number | null;
  confidence: "high" | "low";
  reason: string | null;
};

export async function readMeterFromImage(
  base64Data: string,
  mediaType: AllowedMediaType,
  meterType: "electric" | "water"
): Promise<MeterVisionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Server chưa cấu hình ANTHROPIC_API_KEY");
  }

  const anthropic = new Anthropic();
  const meterLabel = meterType === "electric" ? "đồng hồ điện" : "đồng hồ nước";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          {
            type: "text",
            text:
              `Đọc chỉ số hiện tại trên ${meterLabel} trong ảnh này. Chỉ lấy phần số nguyên hiển thị ` +
              `trên mặt đồng hồ (bỏ qua phần thập phân màu đỏ nếu có). Nếu ảnh mờ, bị che, hoặc không ` +
              `chắc chắn đọc đúng, đặt confidence là "low" và giải thích ngắn gọn trong "reason".`,
          },
        ],
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            reading: { anyOf: [{ type: "integer" }, { type: "null" }] },
            confidence: { type: "string", enum: ["high", "low"] },
            reason: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
          required: ["reading", "confidence", "reason"],
          additionalProperties: false,
        },
      },
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude từ chối xử lý ảnh này");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Không nhận được phản hồi từ Claude");
  }

  try {
    return JSON.parse(textBlock.text);
  } catch {
    throw new Error("Không parse được kết quả từ Claude");
  }
}
