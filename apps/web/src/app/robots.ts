import { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/lire/', '/admin/'] }],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/sitemap.xml`,
  };
}
