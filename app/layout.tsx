import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";
import styles from "./layout.module.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display",
  display: "swap",
});

const text = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trestle: plans for the thing you are hosting",
  description:
    "Write a short brief and get a budget that adds up, dated milestones, vendors to book, and ideas for a wedding, birthday, or community event.",
  applicationName: "Trestle",
  openGraph: {
    title: "Trestle: plans for the thing you are hosting",
    description:
      "A brief in, a plan out: budget, timeline, vendors, and ideas for weddings, birthdays, and community events.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e3" },
    { media: "(prefers-color-scheme: dark)", color: "#161c19" },
  ],
};

const themeScript = `(function(){try{var stored=localStorage.getItem("trestle.theme");var theme=stored==="dark"||stored==="light"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",theme);}catch(error){document.documentElement.setAttribute("data-theme","light");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <a className={styles.skip} href="#main">
          Skip to content
        </a>
        <header className={styles.masthead} data-print="hide">
          <div className={styles.mastheadInner}>
            <a className={styles.wordmark} href="#main">
              Trestle
            </a>
            <div className={styles.mastheadSide}>
              <nav className={styles.nav} aria-label="Sections">
                <a href="#brief">Brief</a>
                <a href="#plan">Plan</a>
                <a href="#saved">Saved</a>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main id="main" className={styles.main}>
          {children}
        </main>

        <footer className={styles.footer} data-print="hide">
          <div className={styles.footerInner}>
            <p>
              Trestle keeps plans in this browser. The brief goes to Gemini only when this deployment has a key.
            </p>
            <details className={styles.privacy}>
              <summary>What leaves the browser</summary>
              <p>
                The brief you type is posted to this app&apos;s own server. If a Gemini API key is configured, the brief
                and your notes go to Google&apos;s Gemini API so it can write the wording. Budget arithmetic, dates, and
                advice are computed on the server and are not sent anywhere. No analytics, cookies, or accounts are
                used.
              </p>
            </details>
          </div>
        </footer>
      </body>
    </html>
  );
}
