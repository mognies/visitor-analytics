import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visitor Analytics Console",
  description: "Customer interest analytics based on page visit duration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
