import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "JSON Translation Studio",
  description: "Edit, search, and export your JSON locale files with ease",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Browser extensions (Google Tag Assistant, Grammarly, dark-mode extensions, etc.)
      // mutate <html> attributes before React hydrates, causing a hydration mismatch
      // warning. React docs recommend suppressing it at the root element.
      // See: https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors
      suppressHydrationWarning
    >
      <body className="min-h-full bg-zinc-50">
        {children}
      </body>
    </html>
  );
}
