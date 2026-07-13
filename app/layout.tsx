import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathsLove - Love Maths. Think Better. | Math IQ Assessment",
  description: "Take a scientifically designed Math IQ test with MathsLove. Select your grade level, answer 10 challenging questions, and receive a detailed IQ score with AI-powered analysis. Love Maths. Think Better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
