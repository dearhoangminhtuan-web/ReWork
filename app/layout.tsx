import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getMe } from "@/lib/data/me";
import { getPrefecture } from "@/config/prefectures";
import { InkDefs } from "@/components/art";
import { DemoBar } from "@/components/demo-bar";
import { env } from "@/lib/env";
import "./globals.css";

// Dela Gothic One is self-hosted as two small subsets (app/globals.css, scripts/subset-fonts.py).
const bvp = Be_Vietnam_Pro({
  weight: ["400", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-bvp",
  display: "swap",
});
// Japanese body text uses the OS font (Hiragino / Noto Sans JP): a web CJK font
// adds ~90 kB of render-blocking @font-face CSS on every page (Lighthouse).
const plex = IBM_Plex_Mono({ weight: ["400", "600"], subsets: ["latin", "vietnamese"], variable: "--font-plex", display: "swap", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "ReWork", template: "%s · ReWork" },
    description: t("description"),
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
    appleWebApp: { capable: true, title: "ReWork", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ecdd",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const me = await getMe().catch(() => null);
  // Theme follows the user's prefecture; before onboarding, the last picked one.
  const store = await cookies();
  const prefCode = me?.profile.prefectureCode ?? store.get("rw_pref")?.value;
  const theme = getPrefecture(prefCode).theme;

  return (
    <html lang={locale} data-theme={theme} className={`${bvp.variable} ${plex.variable}`}>
      <head>
        <link rel="preload" href="/fonts/dela-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh">
        <InkDefs />
        <NextIntlClientProvider messages={messages} locale={locale}>
          {env.demoMode ? <DemoBar role={me?.profile.role ?? null} userId={me?.userId ?? null} /> : null}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
