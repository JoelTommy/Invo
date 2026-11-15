import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Invoice Generator",
  description: "Make and download a clean invoice in under a minute.",
};

// Runs before paint so the theme never flashes. Reads the visitor's saved
// choice; falls back to their system preference.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("invoice-theme");
    if (saved !== "light" && saved !== "dark") {
      saved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = saved;
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}
