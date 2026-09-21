import type { Metadata } from "next";
import "./globals.css";
import { getSession } from './lib/session';
import { AuthProvider } from './components/AuthProvider';
import { Analytics } from '@vercel/analytics/next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mathslove.com';

export const metadata: Metadata = {
  title: "MathsLove | Accurate Math IQ Assessment for Kids",
  description: "Discover your child's mathematical intelligence with our scientifically designed Math IQ test. Calibrated for Grades 4-8, receive a detailed score and AI-powered analysis of cognitive strengths.",
  keywords: ["Math IQ test", "Child math assessment", "Mathematical intelligence", "Online math test for kids", "AI math analysis", "Math skills evaluation"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "MathsLove",
    "url": baseUrl,
    "logo": `${baseUrl}/icon.png`,
    "description": "A scientifically designed Math IQ assessment platform providing AI-powered analysis of mathematical intelligence.",
  };

  // Fetch session on the server
  const session = await getSession();
  const serializableSession = session ? { userId: session.userId } : null;

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider initialSession={serializableSession}>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
