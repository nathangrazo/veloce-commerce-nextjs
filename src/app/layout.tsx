import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/Toaster";
import { AppProviders } from "@/contexts/AppProviders";
import { CartDrawer } from "@/features/cart/CartDrawer";
import { PRODUCTS_CATALOG } from "@/server/data/products";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Veloce Commerce — Architectural Objects & Modern Storefront",
    template: "%s | Veloce Commerce",
  },
  description:
    "Full-stack Next.js App Router e-commerce app demonstrating split React Context API state management, queued optimistic cart updates, HMAC-signed sessions, and automated testing.",
};

/**
 * Applies the stored dark/light class before first paint so dark mode does not flash on reload.
 */
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var raw = window.localStorage.getItem("veloce:theme");
    var mode = raw ? JSON.parse(raw) : "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <AppProviders initialProducts={PRODUCTS_CATALOG}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
