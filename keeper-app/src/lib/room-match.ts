// Khớp tên phòng nghe được từ giọng nói với danh sách phòng thực tế.
// Chỉ tự động khớp khi chắc chắn (đúng 1 phòng có cùng dãy số, hoặc khớp thêm theo tên nhà) —
// nếu không rõ ràng, trả về null để người dùng tự chọn qua dropdown.

type RoomOption = { id: string; no: string; propertyName: string };

function extractDigits(text: string): string {
  return (text.match(/\d+/g) || []).join("");
}

export function matchRoomIdFromText(text: string | null, rooms: RoomOption[]): string | null {
  if (!text) return null;
  const targetDigits = extractDigits(text);
  if (!targetDigits) return null;

  const digitMatches = rooms.filter((r) => extractDigits(r.no) === targetDigits);
  if (digitMatches.length === 1) return digitMatches[0].id;
  if (digitMatches.length > 1) {
    const normalizedText = text.toLowerCase();
    const withProperty = digitMatches.find((r) => normalizedText.includes(r.propertyName.toLowerCase()));
    if (withProperty) return withProperty.id;
  }
  return null;
}
