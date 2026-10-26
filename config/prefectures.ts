// Prefecture registry. Adding a prefecture = add an entry here + a theme in
// app/themes.css + art in components/art/<theme>.tsx + seed rows (PRD §7.3).
// Municipality names are real places; all data attached to them (rent, employers)
// is fictional sample data.

export type Lang = "vi" | "ja" | "en";
export type I18nText = Record<Lang, string>;

export type ThemeKey = "kochi" | "tokyo" | "osaka" | "hokkaido";

export interface Municipality {
  id: string;
  name: I18nText;
}

export interface LandmarkStamp {
  /** Which worker feature this stamp is earned in. */
  feature: "tedori" | "assistant" | "community" | "swap";
  name: I18nText;
}

export interface Prefecture {
  code: string; // e.g. "39_kochi" (JIS code + slug)
  theme: ThemeKey;
  seeded: boolean; // has sample employers/listings
  name: I18nText;
  kanji: string; // big vertical title on posters
  /** Short line in the local dialect / local flavour, always shown with a translation. */
  greeting: { local: string; translation: I18nText };
  tagline: I18nText;
  /** Station-number prefix for the line-map navigation. Decorative only. */
  lineCode: string;
  lineName: I18nText;
  municipalities: Municipality[];
  stamps: LandmarkStamp[];
  /** Things the region is known for, used in posters and empty states. */
  motifs: I18nText[];
}

export const PREFECTURES: Record<string, Prefecture> = {
  "39_kochi": {
    code: "39_kochi",
    theme: "kochi",
    seeded: true,
    name: { vi: "Kōchi", ja: "高知県", en: "Kochi" },
    kanji: "高知",
    greeting: {
      local: "よう来たね。ここは土佐ぜよ",
      translation: {
        vi: "Chào mừng — đây là Tosa đó!",
        ja: "（土佐弁）ようこそ。ここは土佐だよ",
        en: "Tosa dialect: welcome — this is Tosa!",
      },
    },
    tagline: {
      vi: "Biển Kuroshio, yuzu và những người ở lại",
      ja: "黒潮と柚子と、ここに残る人たち",
      en: "Kuroshio sea, yuzu, and the people who stay",
    },
    lineCode: "TS",
    lineName: { vi: "Tuyến Tosa", ja: "土佐ライン", en: "Tosa Line" },
    municipalities: [
      { id: "kochi_city", name: { vi: "TP. Kōchi", ja: "高知市", en: "Kochi City" } },
      { id: "nankoku", name: { vi: "Nankoku", ja: "南国市", en: "Nankoku" } },
      { id: "kami", name: { vi: "Kami", ja: "香美市", en: "Kami" } },
      { id: "aki", name: { vi: "Aki", ja: "安芸市", en: "Aki" } },
      { id: "muroto", name: { vi: "Muroto", ja: "室戸市", en: "Muroto" } },
      { id: "susaki", name: { vi: "Susaki", ja: "須崎市", en: "Susaki" } },
      { id: "shimanto", name: { vi: "Shimanto", ja: "四万十市", en: "Shimanto" } },
      { id: "tosashimizu", name: { vi: "Tosashimizu", ja: "土佐清水市", en: "Tosashimizu" } },
    ],
    stamps: [
      { feature: "tedori", name: { vi: "Cầu Harimaya", ja: "はりまや橋", en: "Harimaya Bridge" } },
      { feature: "assistant", name: { vi: "Thành Kōchi", ja: "高知城", en: "Kochi Castle" } },
      { feature: "community", name: { vi: "Yosakoi", ja: "よさこい鳴子", en: "Yosakoi naruko" } },
      { feature: "swap", name: { vi: "Cầu chìm Shimanto", ja: "四万十の沈下橋", en: "Shimanto sinking bridge" } },
    ],
    motifs: [
      { vi: "Cá ngừ nướng rơm (katsuo tataki)", ja: "カツオのたたき", en: "Seared bonito (katsuo tataki)" },
      { vi: "Bãi Katsurahama", ja: "桂浜", en: "Katsurahama beach" },
      { vi: "Chợ Chủ nhật", ja: "日曜市", en: "Sunday Market" },
      { vi: "Yuzu", ja: "ゆず", en: "Yuzu citrus" },
    ],
  },
  "13_tokyo": {
    code: "13_tokyo",
    theme: "tokyo",
    seeded: true,
    name: { vi: "Tokyo", ja: "東京都", en: "Tokyo" },
    kanji: "東京",
    greeting: {
      local: "いらっしゃい、東京へ",
      translation: {
        vi: "Chào mừng đến Tokyo",
        ja: "ようこそ東京へ",
        en: "Welcome to Tokyo",
      },
    },
    tagline: {
      vi: "Lương cao hơn — nhưng còn lại bao nhiêu?",
      ja: "給料は高い。でも、いくら残る？",
      en: "Higher wages — but how much is left?",
    },
    lineCode: "JY",
    lineName: { vi: "Vòng Yamanote", ja: "山手ループ", en: "Yamanote Loop" },
    municipalities: [
      { id: "shinjuku", name: { vi: "Shinjuku", ja: "新宿区", en: "Shinjuku" } },
      { id: "edogawa", name: { vi: "Edogawa", ja: "江戸川区", en: "Edogawa" } },
      { id: "adachi", name: { vi: "Adachi", ja: "足立区", en: "Adachi" } },
      { id: "ota", name: { vi: "Ōta", ja: "大田区", en: "Ota" } },
      { id: "hachioji", name: { vi: "Hachiōji", ja: "八王子市", en: "Hachioji" } },
    ],
    stamps: [
      { feature: "tedori", name: { vi: "Tháp Tokyo", ja: "東京タワー", en: "Tokyo Tower" } },
      { feature: "assistant", name: { vi: "Cổng Kaminarimon", ja: "雷門", en: "Kaminarimon" } },
      { feature: "community", name: { vi: "Ngã tư Shibuya", ja: "渋谷スクランブル", en: "Shibuya Scramble" } },
      { feature: "swap", name: { vi: "Tuyến Yamanote", ja: "山手線", en: "Yamanote Line" } },
    ],
    motifs: [
      { vi: "Tháp Tokyo", ja: "東京タワー", en: "Tokyo Tower" },
      { vi: "Skytree", ja: "スカイツリー", en: "Skytree" },
      { vi: "Asakusa", ja: "浅草", en: "Asakusa" },
      { vi: "Núi Phú Sĩ nhìn từ xa", ja: "遠くの富士山", en: "Fuji on a clear day" },
    ],
  },
  "27_osaka": {
    code: "27_osaka",
    theme: "osaka",
    seeded: false,
    name: { vi: "Ōsaka", ja: "大阪府", en: "Osaka" },
    kanji: "大阪",
    greeting: {
      local: "まいど！よう来はったなあ",
      translation: {
        vi: "(Tiếng Osaka) Chào nha! Mừng bạn đã đến",
        ja: "（大阪弁）こんにちは！よく来てくれましたね",
        en: "Osaka dialect: hey there — glad you made it!",
      },
    },
    tagline: {
      vi: "Bếp của Nhật Bản — đèn neon và takoyaki",
      ja: "天下の台所、ネオンとたこ焼き",
      en: "Japan's kitchen — neon and takoyaki",
    },
    lineCode: "OL",
    lineName: { vi: "Vòng Ōsaka", ja: "大阪ループ", en: "Osaka Loop" },
    municipalities: [
      { id: "osaka_city", name: { vi: "TP. Ōsaka", ja: "大阪市", en: "Osaka City" } },
      { id: "sakai", name: { vi: "Sakai", ja: "堺市", en: "Sakai" } },
      { id: "higashiosaka", name: { vi: "Higashiōsaka", ja: "東大阪市", en: "Higashiosaka" } },
      { id: "toyonaka", name: { vi: "Toyonaka", ja: "豊中市", en: "Toyonaka" } },
      { id: "izumisano", name: { vi: "Izumisano", ja: "泉佐野市", en: "Izumisano" } },
    ],
    stamps: [
      { feature: "tedori", name: { vi: "Tháp Tsūtenkaku", ja: "通天閣", en: "Tsutenkaku" } },
      { feature: "assistant", name: { vi: "Thành Ōsaka", ja: "大阪城", en: "Osaka Castle" } },
      { feature: "community", name: { vi: "Takoyaki", ja: "たこ焼き", en: "Takoyaki" } },
      { feature: "swap", name: { vi: "Cầu Ebisu", ja: "戎橋", en: "Ebisu Bridge" } },
    ],
    motifs: [
      { vi: "Takoyaki & okonomiyaki", ja: "たこ焼き・お好み焼き", en: "Takoyaki & okonomiyaki" },
      { vi: "Kênh Dōtonbori", ja: "道頓堀", en: "Dotonbori canal" },
      { vi: "Thành Ōsaka", ja: "大阪城", en: "Osaka Castle" },
      { vi: "Người Ōsaka thân thiện, hay đùa", ja: "ノリのいい大阪人", en: "Friendly, joking locals" },
    ],
  },
  "01_hokkaido": {
    code: "01_hokkaido",
    theme: "hokkaido",
    seeded: false,
    name: { vi: "Hokkaidō", ja: "北海道", en: "Hokkaido" },
    kanji: "北海道",
    greeting: {
      local: "なまら寒いっしょ。でも人はあったかいよ",
      translation: {
        vi: "(Tiếng Hokkaidō) Lạnh ghê ha. Nhưng người ở đây ấm áp lắm",
        ja: "（北海道弁）すごく寒いでしょう。でも人は温かいよ",
        en: "Hokkaido dialect: freezing, right? But people here are warm",
      },
    },
    tagline: {
      vi: "Tuyết, oải hương và những cánh đồng rộng",
      ja: "雪とラベンダーと、広い大地",
      en: "Snow, lavender and wide-open land",
    },
    lineCode: "HK",
    lineName: { vi: "Tuyến Hokkaidō", ja: "北の大地ライン", en: "Northland Line" },
    municipalities: [
      { id: "sapporo", name: { vi: "Sapporo", ja: "札幌市", en: "Sapporo" } },
      { id: "asahikawa", name: { vi: "Asahikawa", ja: "旭川市", en: "Asahikawa" } },
      { id: "hakodate", name: { vi: "Hakodate", ja: "函館市", en: "Hakodate" } },
      { id: "otaru", name: { vi: "Otaru", ja: "小樽市", en: "Otaru" } },
      { id: "obihiro", name: { vi: "Obihiro", ja: "帯広市", en: "Obihiro" } },
      { id: "furano", name: { vi: "Furano", ja: "富良野市", en: "Furano" } },
    ],
    stamps: [
      { feature: "tedori", name: { vi: "Tháp đồng hồ Sapporo", ja: "札幌時計台", en: "Sapporo Clock Tower" } },
      { feature: "assistant", name: { vi: "Kênh Otaru", ja: "小樽運河", en: "Otaru Canal" } },
      { feature: "community", name: { vi: "Oải hương Furano", ja: "富良野ラベンダー", en: "Furano lavender" } },
      { feature: "swap", name: { vi: "Núi Yōtei", ja: "羊蹄山", en: "Mt. Yotei" } },
    ],
    motifs: [
      { vi: "Hải sản & kani", ja: "海鮮・かに", en: "Seafood & crab" },
      { vi: "Lễ hội tuyết Sapporo", ja: "さっぽろ雪まつり", en: "Sapporo Snow Festival" },
      { vi: "Sữa & bơ", ja: "牛乳・バター", en: "Milk & butter" },
      { vi: "Sếu đầu đỏ", ja: "タンチョウ", en: "Red-crowned crane" },
    ],
  },
};

export const PREFECTURE_CODES = Object.keys(PREFECTURES);
export const DEFAULT_PREFECTURE = "39_kochi";

export function getPrefecture(code: string | null | undefined): Prefecture {
  return PREFECTURES[code ?? ""] ?? PREFECTURES[DEFAULT_PREFECTURE];
}

export function municipalityName(prefCode: string, id: string | null | undefined, lang: Lang): string {
  if (!id) return "";
  const m = getPrefecture(prefCode).municipalities.find((x) => x.id === id);
  return m ? m.name[lang] : id;
}

export const INDUSTRIES = [
  "accommodation",
  "agriculture",
  "fishery",
  "food_manufacturing",
  "forestry",
  "nursing_care",
  "construction",
  "food_service",
  "other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const RESIDENCE_STATUSES = ["ikusei", "titp", "ssw", "other"] as const;
export type ResidenceStatus = (typeof RESIDENCE_STATUSES)[number];

export const LANGS: Lang[] = ["vi", "ja", "en"];
