import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mathslove.com';

export const metadata: Metadata = {
  title: "MathsLove - Love Maths. Think Better. | Math IQ Assessment",
  description: "Take a scientifically designed Math IQ test with MathsLove. Select your grade level, answer 10 challenging questions, and receive a detailed IQ score with AI-powered analysis. Love Maths. Think Better.",
  openGraph: {
    title: "MathsLove | Math IQ Assessment",
    description: "Take a scientifically designed Math IQ test and discover your child's mathematical intelligence. Get detailed AI-powered analysis today.",
    url: baseUrl,
    siteName: "MathsLove",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MathsLove Math IQ Test",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MathsLove | Math IQ Assessment",
    description: "Discover your true Math IQ with our scientifically designed assessment. Love Maths. Think Better.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: baseUrl,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MathsLove",
    "url": baseUrl,
    "logo": `${baseUrl}/favicon.ico`,
    "description": "A scientifically designed Math IQ assessment platform providing AI-powered analysis of mathematical intelligence.",
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
