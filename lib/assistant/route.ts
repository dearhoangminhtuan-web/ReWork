// Deterministic safety layer for the Life Assistant. Runs BEFORE any AI call:
// emergency words always show 119/110 first (US-E05), and when the AI is down
// the keyword classifier still routes visa/labour questions to humans (FR-023).
import type { Topic } from "@/lib/llm/schemas";

const EMERGENCY: RegExp[] = [
  // en
  /\b(injur|hurt|bleed|blood|violen|beat(ing)? me|hit me|attack|assault|fire\b|on fire|smoke|can'?t breathe|cannot breathe|not breathing|unconscious|passed out|ambulance|emergency|suicid|kill (me|my ?self))/i,
  // vi
  /(bị thương|chảy máu|đánh tôi|bị đánh|bạo lực|tấn công|cháy|hỏa hoạn|hoả hoạn|không thở được|khó thở|ngừng thở|bất tỉnh|ngất|cấp cứu|xe cứu thương|tự tử|muốn chết)/i,
  // ja
  /(けが|怪我|出血|血が|暴力|殴|蹴られ|火事|燃えて|煙|息ができ|呼吸が|意識がな|倒れ|救急|自殺|死にたい)/,
];

const RULES: { topic: Topic; re: RegExp }[] = [
  {
    topic: "labor_dispute",
    re: /(unpaid|not paid|overtime|harass|bully|passport|fired|dismiss|forced to (go home|return)|unsafe|lương chưa trả|không trả lương|nợ lương|làm thêm giờ|tăng ca|quấy rối|bắt nạt|hộ chiếu|đuổi việc|sa thải|ép về nước|未払い|残業代|ハラスメント|いじめ|パスポート|解雇|クビ|帰国させ)/i,
  },
  {
    topic: "visa_legal",
    re: /(visa|residence (card|status)|renew|transfer|change (job|employer)|immigration|thị thực|tư cách lưu trú|thẻ cư trú|gia hạn|chuyển việc|đổi công ty|xuất nhập cảnh|在留|ビザ|更新|転籍|転職|入管|育成就労|特定技能)/i,
  },
  {
    topic: "japanese_learning",
    re: /(japanese|jlpt|\bn[1-5]\b|dialect|what does .* mean|how do (i|you) say|tiếng nhật|nghĩa là|nói thế nào|học tiếng|phương ngữ|日本語|方言|意味|どういう意味|土佐弁|ぜよ|まっこと)/i,
  },
  {
    topic: "daily_life",
    re: /(garbage|trash|hospital|doctor|clinic|tax|bank|money home|rent|typhoon|earthquake|payslip|insurance|rác|bệnh viện|bác sĩ|khám|thuế|ngân hàng|gửi tiền|tiền nhà|bão|động đất|phiếu lương|bảo hiểm|ゴミ|ごみ|病院|医者|税|銀行|送金|家賃|台風|地震|給与明細|保険)/i,
  },
];

export function isEmergency(text: string): boolean {
  return EMERGENCY.some((re) => re.test(text));
}

/** Keyword fallback used when the AI classifier is unavailable. */
export function classifyByKeywords(text: string): Topic {
  if (isEmergency(text)) return "emergency";
  for (const r of RULES) if (r.re.test(text)) return r.topic;
  return "other";
}

export const needsHuman = (t: Topic) => t === "visa_legal" || t === "labor_dispute";
