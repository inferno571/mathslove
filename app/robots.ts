import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mathslove.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/test', '/results', '/collect-info', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
