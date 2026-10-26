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
   language), Zen Kaku Gothic New for Japanese, IBM Plex Mono for numbers,
   codes and receipts.
4. **Every number about money is mono + tabular** and labelled Estimate/概算.
5. **Local words, translated.** Dialect greetings (Tosa-ben) always come with
   a translation.
6. Accessibility: AA contrast checked per theme, 44px targets, icon + text on
   every primary action, `prefers-reduced-motion` respected.

## Themes
| | Kochi 高知 | Tokyo 東京 |
|---|---|---|
| Ink | Kuroshio indigo `#142f3a` | Night navy `#171a2e` |
| Spot | Yosakoi vermilion `#b93a1c` | Tokyo Tower orange `#b63e0b` |
| Spot 2 | Yuzu `#e8b21c` | Yamanote green `#5e9c2f` |
| Pattern | 青海波 seigaiha waves | 市松 ichimatsu checks |
| Poster | Katsurahama pines + torii, Kochi Castle, leaping katsuo | Tokyo Tower, Skytree, Fuji, Yamanote train, scramble crossing |
| Stamps | はりまや橋 · 高知城 · よさこい鳴子 · 四万十の沈下橋 | 東京タワー · 雷門 · 渋谷スクランブル · 山手線 |
| Line | TS · 土佐ライン | JY · 山手ループ |
