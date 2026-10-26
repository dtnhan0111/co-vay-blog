import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Font nạp qua <link> (hỗ trợ tiếng Việt): Cormorant Garamond cho tiêu đề, Be Vietnam Pro cho nội dung.
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap&subset=vietnamese";

export const metadata: Metadata = {
  title: { default: "Go Đà Nẵng — Kỳ quán số của người chơi cờ Vây", template: "%s · Go Đà Nẵng" },
  description:
    "Sổ kỳ quán cờ Vây Đà Nẵng: mỗi ván được hai người cùng xác nhận. Nhiều năm sau nhìn lại, vẫn biết mình đã gặp ai, thắng ai, thua ai.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='12' cy='13' r='10' fill='%23111'/><circle cx='20' cy='19' r='10' fill='%23f8f8f8' stroke='%238b5e3c' stroke-width='1.2'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5E7C6" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1510" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body className="board-bg">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
