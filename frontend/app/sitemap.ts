import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://savitri.ai';
  const now = new Date();
  
  const pages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/for-farmers', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/for-partners', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/story', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/how-it-works', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/dashboard', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/dashboard/irrigation', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/dashboard/crop-health', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/dashboard/climate', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/dashboard/impact', priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  return pages.map((p) => ({
    url: `${base}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
