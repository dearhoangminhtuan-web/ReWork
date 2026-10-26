import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Dela_Gothic_One, IBM_Plex_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getMe } from "@/lib/data/me";
import { getPrefecture } from "@/config/prefectures";
import { InkDefs } from "@/components/art";
import { DemoBar } from "@/components/demo-bar";
import { env } from "@/lib/env";
import "./globals.css";

const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin", "vietnamese"], variable: "--font-dela", display: "swap" });
const bvp = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-bvp",
  display: "swap",
});
const zen = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-zen", display: "swap", preload: false });
const plex = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin", "vietnamese"], variable: "--font-plex", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "ReWork", template: "%s · ReWork" },
    description: t("description"),
    manifest: "/manifest.webmanifest",
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
    <html lang={locale} data-theme={theme} className={`${dela.variable} ${bvp.variable} ${zen.variable} ${plex.variable}`}>
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
