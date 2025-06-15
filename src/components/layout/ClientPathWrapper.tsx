'use client';

import { usePathname } from 'next/navigation';
import CommonFooter from '@/components/layout/CommonFooter';

export default function ClientPathWrapper() {
  const pathname = usePathname();
  const publicPaths = [
    '/',
    '/about', // Added /about to public paths
    '/privacy-policy',
    '/terms-of-service',
    '/contact-us',
    '/citations',
    // Add any other public paths that should have the common footer
  ];

  const showFooter = publicPaths.includes(pathname);

  return showFooter ? <CommonFooter /> : null;
}
