/**
 * billing.ts
 * Logic tính tiền điện / nước cho app quản lý nhà cho thuê.
 * Dữ liệu bậc thang KHÔNG hardcode trong hàm — luôn truyền vào qua `config`,
 * để khi Nhà nước đổi biểu giá, chỉ cần cập nhật bản ghi BillingConfig
 * trong DB (qua trang admin), không cần sửa code.
 */

export type ElectricTierInput = {
  tierOrder: number;
  fromKwh: number;
  toKwh: number | null; // null = không giới hạn (bậc cuối)
  unitPrice: number; // đ/kWh, chưa VAT
};

export type BillingConfigInput = {
  useTiers: boolean; // true = tính lũy tiến theo bậc thang nhà nước
  flatUnitPrice?: number | null; // đ/kWh cố định, dùng khi useTiers = false
  vatPercent: number; // ví dụ 8
  tiers?: ElectricTierInput[]; // bắt buộc nếu useTiers = true
};

export type ElectricBillResult = {
  consumptionKwh: number;
  subtotalBeforeVat: number;
  vatAmount: number;
  total: number;
  breakdown: { tierOrder: number; kwhUsed: number; unitPrice: number; amount: number }[];
};

/**
 * Tính lượng điện/nước tiêu thụ = số mới - số cũ.
 * Ném lỗi nếu số mới < số cũ (nhập sai / quên cập nhật).
 */
export function calculateConsumption(oldReading: number, newReading: number): number {
  const consumption = newReading - oldReading;
  if (consumption < 0) {
    throw new Error(
      `Số mới (${newReading}) nhỏ hơn số cũ (${oldReading}). Kiểm tra lại dữ liệu nhập.`
    );
  }
  return consumption;
}

/**
 * Tính tiền điện.
 * - Nếu config.useTiers = false: dùng flatUnitPrice cố định x sản lượng
 *   (dùng cho phòng trọ dùng chung công tơ, thường áp bậc 3 ~2.380đ/kWh
 *   theo quy định hiện hành khi chủ nhà không tách công tơ riêng).
 * - Nếu config.useTiers = true: tính lũy tiến theo từng bậc trong config.tiers.
 * VAT được cộng vào sau khi tính xong phần điện năng (mặc định 8%,
 * áp dụng đến 31/12/2026 theo nghị quyết giảm thuế VAT hiện hành).
 */
export function calculateElectricityBill(
  kwhConsumed: number,
  config: BillingConfigInput
): ElectricBillResult {
  if (kwhConsumed < 0) {
    throw new Error("Sản lượng điện tiêu thụ không thể âm.");
  }

  let subtotal = 0;
  const breakdown: ElectricBillResult["breakdown"] = [];

  if (!config.useTiers) {
    if (!config.flatUnitPrice) {
      throw new Error("Thiếu flatUnitPrice khi useTiers = false.");
    }
    subtotal = kwhConsumed * config.flatUnitPrice;
    breakdown.push({
      tierOrder: 1,
      kwhUsed: kwhConsumed,
      unitPrice: config.flatUnitPrice,
      amount: subtotal,
    });
  } else {
    if (!config.tiers || config.tiers.length === 0) {
      throw new Error("Thiếu bảng bậc thang (tiers) khi useTiers = true.");
    }
    const sortedTiers = [...config.tiers].sort((a, b) => a.tierOrder - b.tierOrder);
    let remaining = kwhConsumed;

    for (const tier of sortedTiers) {
      if (remaining <= 0) break;
      const tierCapacity =
        tier.toKwh === null ? remaining : tier.toKwh - tier.fromKwh + 1;
      const kwhInThisTier = Math.min(remaining, tierCapacity);
      const amount = kwhInThisTier * tier.unitPrice;

      subtotal += amount;
      breakdown.push({
        tierOrder: tier.tierOrder,
        kwhUsed: kwhInThisTier,
        unitPrice: tier.unitPrice,
        amount,
      });
      remaining -= kwhInThisTier;
    }
  }

  const vatAmount = Math.round(subtotal * (config.vatPercent / 100));
  const total = subtotal + vatAmount;

  return {
    consumptionKwh: kwhConsumed,
    subtotalBeforeVat: Math.round(subtotal),
    vatAmount,
    total,
    breakdown,
  };
}

/**
 * Tính tiền nước - đơn giản, giá cố định theo khối (m3).
 */
export function calculateWaterBill(m3Consumed: number, unitPrice: number): number {
  if (m3Consumed < 0) throw new Error("Sản lượng nước tiêu thụ không thể âm.");
  return m3Consumed * unitPrice;
}

/**
 * Biểu giá điện sinh hoạt 5 bậc hiện hành (QĐ 14/2025/QĐ-TTg, hiệu lực 29/05/2025).
 * Dùng làm dữ liệu SEED ban đầu — KHÔNG hardcode dùng trực tiếp trong logic tính,
 * hãy insert vào bảng BillingConfig/ElectricTier rồi quản lý qua trang admin,
 * vì giá có thể điều chỉnh 3 tháng/lần theo Nghị định 72/2025/NĐ-CP.
 */
export const SEED_TIERS_2026: ElectricTierInput[] = [
  { tierOrder: 1, fromKwh: 0, toKwh: 100, unitPrice: 1984 },
  { tierOrder: 2, fromKwh: 101, toKwh: 200, unitPrice: 2050 },
  { tierOrder: 3, fromKwh: 201, toKwh: 300, unitPrice: 2380 },
  { tierOrder: 4, fromKwh: 301, toKwh: 700, unitPrice: 2998 },
  { tierOrder: 5, fromKwh: 701, toKwh: null, unitPrice: 3967 },
];

/**
 * Mức giá cố định thường dùng cho phòng trọ dùng chung công tơ
 * (không tách công tơ riêng, không đăng ký hợp đồng điện với EVN cho từng phòng).
 * Tham khảo bậc 3 hiện hành ~2.380đ/kWh — CẦN xác nhận lại với quy định
 * tại địa phương / hợp đồng mua điện thực tế trước khi dùng chính thức.
 */
export const DEFAULT_FLAT_RATE_FOR_RENTAL_ROOM = 2380;
