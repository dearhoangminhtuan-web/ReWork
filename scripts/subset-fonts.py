# Rebuild the self-hosted Dela Gothic One subsets in public/fonts.
#   pip install fonttools brotli
#   curl -A curl -o Dela.ttf "$(curl -sA curl 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One' | grep -o 'https://[^)]*')"
#   python3 scripts/subset-fonts.py Dela.ttf
# Why: next/font emits ~124 @font-face rules for this CJK font (~32 kB of
# render-blocking CSS). Two subsets with unicode-range keep CSS tiny; the
# Japanese file only downloads on pages that show Japanese. Kanji not in the
# subset fall back to the OS Japanese font. Re-run after adding UI strings.
# Font licence: SIL Open Font License 1.1.
import glob, subprocess, sys

src = sys.argv[1]
text = ""
for f in ["messages/ja.json", "config/prefectures.ts"] + glob.glob("components/**/*.tsx", recursive=True) + glob.glob("app/**/*.tsx", recursive=True):
    text += open(f, encoding="utf-8").read()
kanji = "".join(sorted({c for c in text if "一" <= c <= "鿿" or "㐀" <= c <= "䶿"}))
open("/tmp/rework-kanji.txt", "w", encoding="utf-8").write(kanji)
common = ["--flavor=woff2", "--layout-features=*"]
subprocess.run(["pyftsubset", src, "--unicodes=U+0020-007E,U+00A0-017F,U+01A0-01B0,U+0300-0323,U+1EA0-1EF9,U+2000-206F,U+20AB,U+2190-2193,U+25B2,U+25BC", "--output-file=public/fonts/dela-latin.woff2", *common], check=True)
subprocess.run(["pyftsubset", src, "--unicodes=U+3000-303F,U+3040-309F,U+30A0-30FF,U+FF01-FF5E", "--text-file=/tmp/rework-kanji.txt", "--output-file=public/fonts/dela-ja.woff2", *common], check=True)
print(f"subset done: {len(kanji)} kanji")
