// Nhận ảnh chụp đồng hồ điện/nước, dùng Claude Vision để đọc số.
// Không tự lưu vào MeterReading — chỉ trả kết quả để người dùng xác nhận trước.

import { NextRequest, NextResponse } from "next/server";
import { isAllowedMediaType, readMeterFromImage } from "@/lib/vision";

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Body phải là multipart/form-data" }, { status: 400 });
  }

  const image = formData.get("image");
  const meterType = formData.get("meterType");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh (field 'image')" }, { status: 400 });
  }
  if (meterType !== "electric" && meterType !== "water") {
    return NextResponse.json(
      { error: "Trường 'meterType' phải là 'electric' hoặc 'water'" },
      { status: 400 }
    );
  }
  if (!isAllowedMediaType(image.type)) {
    return NextResponse.json(
      { error: `Định dạng ảnh không hỗ trợ: ${image.type}. Chỉ nhận jpeg/png/gif/webp.` },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await image.arrayBuffer());
  const base64Data = bytes.toString("base64");

  let result;
  try {
    result = await readMeterFromImage(base64Data, image.type, meterType);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi gọi Claude Vision";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({
    ...result,
    needsReview: result.confidence === "low" || result.reading == null,
  });
}
