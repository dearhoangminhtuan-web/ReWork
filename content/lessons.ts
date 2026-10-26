// Fallback "Japanese for my job" lessons (FR-024), used when the AI is
// unavailable. Hand-written sample content; labelled "Sample lesson" in the UI.
import type { I18nText } from "@/config/prefectures";
import type { Lang } from "@/config/prefectures";
import type { Lesson } from "@/lib/llm/schemas";

type P = { ja: string; reading: string; meaning: I18nText; when: I18nText };
type Q = { question: I18nText; options: [string, string, string]; answer_index: number };

const L: Record<string, { phrases: P[]; quiz: Q[] }> = {
  accommodation: {
    phrases: [
      { ja: "いらっしゃいませ", reading: "irasshaimase", meaning: { vi: "Xin chào quý khách", ja: "ようこそ", en: "Welcome" }, when: { vi: "Khi khách đến", ja: "お客様が来たとき", en: "When a guest arrives" } },
      { ja: "お部屋にご案内します", reading: "oheya ni goannai shimasu", meaning: { vi: "Tôi xin dẫn quý khách lên phòng", ja: "部屋まで案内します", en: "I'll show you to your room" }, when: { vi: "Khi dẫn khách", ja: "案内するとき", en: "Guiding a guest" } },
      { ja: "少々お待ちください", reading: "shōshō omachi kudasai", meaning: { vi: "Xin vui lòng đợi một chút", ja: "少し待ってください", en: "Please wait a moment" }, when: { vi: "Khi cần đi hỏi / kiểm tra", ja: "確認しに行くとき", en: "When you need to check something" } },
      { ja: "清掃が終わりました", reading: "seisō ga owarimashita", meaning: { vi: "Tôi đã dọn xong", ja: "掃除が終わった", en: "I've finished cleaning" }, when: { vi: "Báo cáo với cấp trên", ja: "上司に報告するとき", en: "Reporting to your supervisor" } },
      { ja: "タオルが足りません", reading: "taoru ga tarimasen", meaning: { vi: "Không đủ khăn", ja: "タオルが足りない", en: "We're short of towels" }, when: { vi: "Khi thiếu đồ", ja: "物が足りないとき", en: "When supplies run out" } },
    ],
    quiz: [
      { question: { vi: "Khách vừa đến. Bạn nói gì?", ja: "お客様が来ました。何と言いますか？", en: "A guest arrives. What do you say?" }, options: ["いらっしゃいませ", "お疲れさまです", "失礼します"], answer_index: 0 },
      { question: { vi: "「少々お待ちください」nghĩa là?", ja: "「少々お待ちください」の意味は？", en: "What does 「少々お待ちください」 mean?" }, options: ["Please wait a moment", "Thank you", "Excuse me"], answer_index: 0 },
      { question: { vi: "Báo đã dọn xong phòng:", ja: "掃除が終わったと報告：", en: "Report you finished cleaning:" }, options: ["タオルが足りません", "清掃が終わりました", "いらっしゃいませ"], answer_index: 1 },
    ],
  },
  agriculture: {
    phrases: [
      { ja: "収穫します", reading: "shūkaku shimasu", meaning: { vi: "Thu hoạch", ja: "収穫する", en: "We harvest" }, when: { vi: "Khi bắt đầu thu hoạch", ja: "作業を始めるとき", en: "Starting the harvest" } },
      { ja: "これは出荷できますか", reading: "kore wa shukka dekimasu ka", meaning: { vi: "Cái này xuất hàng được không?", ja: "これを出荷していいか", en: "Can this be shipped?" }, when: { vi: "Khi phân loại", ja: "選別のとき", en: "While sorting" } },
      { ja: "ハウスの温度が高いです", reading: "hausu no ondo ga takai desu", meaning: { vi: "Nhà kính đang nóng quá", ja: "ハウスが暑い", en: "The greenhouse is too hot" }, when: { vi: "Báo tình trạng", ja: "状況を伝えるとき", en: "Reporting conditions" } },
      { ja: "休憩してもいいですか", reading: "kyūkei shite mo ii desu ka", meaning: { vi: "Tôi nghỉ một chút được không?", ja: "休んでいいか", en: "May I take a break?" }, when: { vi: "Khi mệt hoặc nóng", ja: "疲れた・暑いとき", en: "When tired or hot" } },
      { ja: "もう一度教えてください", reading: "mō ichido oshiete kudasai", meaning: { vi: "Xin chỉ lại một lần nữa", ja: "もう一回教えて", en: "Please show me once more" }, when: { vi: "Khi chưa hiểu", ja: "わからないとき", en: "When you don't understand" } },
    ],
    quiz: [
      { question: { vi: "Muốn nghỉ một chút, bạn nói:", ja: "休みたいとき：", en: "You want a short break:" }, options: ["休憩してもいいですか", "収穫します", "出荷します"], answer_index: 0 },
      { question: { vi: "「温度が高い」nghĩa là?", ja: "「温度が高い」の意味は？", en: "「温度が高い」 means?" }, options: ["It's cold", "It's hot", "It's raining"], answer_index: 1 },
      { question: { vi: "Chưa hiểu cách làm:", ja: "やり方がわからない：", en: "You didn't understand:" }, options: ["もう一度教えてください", "いらっしゃいませ", "お先に失礼します"], answer_index: 0 },
    ],
  },
  fishery: {
    phrases: [
      { ja: "網を上げます", reading: "ami o agemasu", meaning: { vi: "Kéo lưới lên", ja: "網を引き上げる", en: "Hauling up the net" }, when: { vi: "Khi kéo lưới", ja: "網を上げるとき", en: "When hauling the net" } },
      { ja: "危ない！", reading: "abunai!", meaning: { vi: "Nguy hiểm!", ja: "危険だ", en: "Watch out!" }, when: { vi: "Cảnh báo ngay", ja: "すぐに注意するとき", en: "Warn someone immediately" } },
      { ja: "ライフジャケットを着てください", reading: "raifu jaketto o kite kudasai", meaning: { vi: "Hãy mặc áo phao", ja: "救命胴衣を着て", en: "Please wear a life jacket" }, when: { vi: "Trước khi ra khơi", ja: "出航前", en: "Before going out" } },
      { ja: "氷を入れます", reading: "kōri o iremasu", meaning: { vi: "Cho đá vào", ja: "氷を入れる", en: "Adding ice" }, when: { vi: "Bảo quản cá", ja: "魚を冷やすとき", en: "Keeping fish fresh" } },
      { ja: "気分が悪いです", reading: "kibun ga warui desu", meaning: { vi: "Tôi thấy không khỏe", ja: "体調が悪い", en: "I feel sick" }, when: { vi: "Say sóng, mệt", ja: "船酔いなど", en: "Seasick or unwell" } },
    ],
    quiz: [
      { question: { vi: "Thấy nguy hiểm, bạn hét:", ja: "危険を見たら：", en: "You see danger. Shout:" }, options: ["危ない！", "氷を入れます", "網を上げます"], answer_index: 0 },
      { question: { vi: "「気分が悪いです」nghĩa là?", ja: "「気分が悪いです」の意味は？", en: "「気分が悪いです」 means?" }, options: ["I'm hungry", "I feel sick", "I'm happy"], answer_index: 1 },
      { question: { vi: "Trước khi ra khơi phải mặc:", ja: "出航前に着るのは：", en: "Before going out, wear a:" }, options: ["ライフジャケット", "タオル", "長靴"], answer_index: 0 },
    ],
  },
  food_manufacturing: {
    phrases: [
      { ja: "手を洗いました", reading: "te o araimashita", meaning: { vi: "Tôi đã rửa tay", ja: "手を洗った", en: "I've washed my hands" }, when: { vi: "Trước khi vào xưởng", ja: "作業前", en: "Before entering the line" } },
      { ja: "異物が入っています", reading: "ibutsu ga haitte imasu", meaning: { vi: "Có dị vật lẫn vào", ja: "異物がある", en: "There's something foreign in it" }, when: { vi: "Khi kiểm hàng", ja: "検品のとき", en: "During inspection" } },
      { ja: "ラインを止めてください", reading: "rain o tomete kudasai", meaning: { vi: "Xin dừng dây chuyền", ja: "ラインを止めて", en: "Please stop the line" }, when: { vi: "Khi có sự cố", ja: "トラブルのとき", en: "When something goes wrong" } },
      { ja: "賞味期限を確認します", reading: "shōmi kigen o kakunin shimasu", meaning: { vi: "Kiểm tra hạn sử dụng", ja: "期限を確認する", en: "Checking the best-before date" }, when: { vi: "Khi đóng gói", ja: "包装のとき", en: "When packing" } },
      { ja: "お先に失礼します", reading: "osaki ni shitsurei shimasu", meaning: { vi: "Tôi xin phép về trước", ja: "先に帰ります", en: "I'm leaving now (politely)" }, when: { vi: "Khi tan ca", ja: "帰るとき", en: "Leaving at the end of a shift" } },
    ],
    quiz: [
      { question: { vi: "Có sự cố trên dây chuyền:", ja: "ラインでトラブル：", en: "Problem on the line:" }, options: ["ラインを止めてください", "手を洗いました", "お先に失礼します"], answer_index: 0 },
      { question: { vi: "「異物」nghĩa là?", ja: "「異物」の意味は？", en: "「異物」 means?" }, options: ["Foreign object", "Expiry date", "Hand soap"], answer_index: 0 },
      { question: { vi: "Tan ca, bạn nói:", ja: "帰るとき：", en: "Leaving work, you say:" }, options: ["いらっしゃいませ", "お先に失礼します", "危ない！"], answer_index: 1 },
    ],
  },
};

export function sampleLesson(industry: string | null, lang: Lang): Lesson {
  const l = L[industry ?? ""] ?? L.food_manufacturing;
  return {
    phrases: l.phrases.map((p) => ({ ja: p.ja, reading: p.reading, meaning: p.meaning[lang], when: p.when[lang] })),
    quiz: l.quiz.map((q) => ({ question: q.question[lang], options: q.options, answer_index: q.answer_index })),
  };
}
