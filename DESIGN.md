# Design: "two-ink regional print"

ReWork should feel like something a **prefecture would print**, not a SaaS
template. References that informed it:

- **Regional tourism posters** (観光ポスター) — flat shapes, two or three spot
  inks, big vertical kanji.
- **Eki stamps** (駅スタンプ) — every Japanese station has an ink stamp of a
  local landmark. Our features are "stations"; using one collects its stamp.
- **Railway line maps & station signs** (路線図・駅名標) — numbered stations
  (TS01, JY02…), the bottom nav is a line, job suggestions are station signs.
- **Tickets and receipts** (切符・レシート) — the pay comparison is two
  tickets and a torn receipt, because it *is* about money left in your hand.
- **Riso / washi texture** — paper grain, slight misregistration on art.
- **Wise's "show the real cost" pattern** — every deduction is a visible line,
  assumptions are always on screen.

## Rules
1. **One ink + two spot colours + paper per prefecture.** Tokens only:
   `--paper --paper-2 --card --ink --ink-soft --spot --spot-2 --sea`.
2. **No gradients, no glassmorphism, no blurred shadows, no rounded-2xl cards.**
   Borders are 1.5px ink. Elevation is a hard offset print shadow.
3. **Type:** Dela Gothic One for display (poster lettering; has Vietnamese and
   kana), Be Vietnam Pro for body (designed for Vietnamese, the main user
   language), the OS Japanese font (Hiragino / Noto Sans JP — a web CJK font costs ~90 kB of render-blocking CSS), IBM Plex Mono for numbers,
   codes and receipts.
4. **Every number about money is mono + tabular** and labelled Estimate/概算.
5. **Local words, translated.** Dialect greetings (Tosa-ben) always come with
   a translation.
6. Accessibility: AA contrast checked per theme, 44px targets, icon + text on
   every primary action, `prefers-reduced-motion` respected.

## Themes
Picking a prefecture re-themes the whole app instantly (onboarding sets
`data-theme` on `<html>`; afterwards it follows the profile).

| | Kochi 高知 (pilot) | Tokyo 東京 (comparison) | Osaka 大阪 (preview) | Hokkaido 北海道 (preview) |
|---|---|---|---|---|
| Ink | Kuroshio indigo `#142f3a` | Night navy `#171a2e` | Night `#1f1a2e` | Winter night `#1b2a3a` |
| Spot | Yosakoi vermilion `#b93a1c` | Tokyo Tower orange `#b63e0b` | Dotonbori neon `#a51f55` | Red brick `#a8312f` |
| Spot 2 | Yuzu `#e8b21c` | Yamanote green `#5e9c2f` | Castle verdigris `#3b9a84` | Furano lavender `#a093d4` |
| Paper | Washi `#f3ecdd` | Concrete `#eeede8` | Warm `#f2ebe3` | Snow `#edf0f2` |
| Pattern | 青海波 seigaiha | 市松 ichimatsu | 鹿の子 kanoko dots | 雪輪 snowflakes |
| Poster | Katsurahama pines + torii, Kochi Castle, leaping katsuo | Tokyo Tower, Skytree, Fuji, Yamanote train, scramble | Osaka Castle, Tsutenkaku, Dotonbori lanterns + Ebisu bridge | Sapporo Clock Tower, Mt. Yotei, lavender rows, crane |
| Stamps | はりまや橋 · 高知城 · 鳴子 · 沈下橋 | 東京タワー · 雷門 · スクランブル · 山手線 | 通天閣 · 大阪城 · たこ焼き · 戎橋 | 時計台 · 小樽運河 · ラベンダー · 羊蹄山 |
| Stamp frame | circle | rounded square | hexagon | 雪輪 snow ring |
| Greeting | Tosa-ben 〜ぜよ | standard | Osaka-ben まいど | Hokkaido-ben なまら |
| Line | TS · 土佐ライン | JY · 山手ループ | OL · 大阪ループ | HK · 北の大地ライン |

Preview prefectures have themes, minimum wage, sample rent and municipalities
but no sample employers yet, so Kenkai Swap honestly shows "no matches yet".
