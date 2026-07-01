import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Shortlist Assistant",
  description: "A simple car recommendation MVP for confused buyers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
