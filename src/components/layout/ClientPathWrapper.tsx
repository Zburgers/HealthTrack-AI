'use client';

import { usePathname } from 'next/navigation';
import CommonFooter from '@/components/layout/CommonFooter';
import { useEffect, useState } from 'react';

export default function ClientPathWrapper() {
  const pathname = usePathname();
  const [hasCustomLandingFooter, setHasCustomLandingFooter] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      const found = !!document.getElementById('custom-landing-footer');
      setHasCustomLandingFooter(found);
      if (found) {
        console.log('Custom landing footer detected, suppressing CommonFooter');
      }
    } else {
      setHasCustomLandingFooter(false);
    }
  }, [pathname]);

  const publicPaths = [
    '/about',
    '/privacy-policy',
    '/terms-of-service',
    '/contact-us',
    '/citations',
  ];

  // Only show the footer on public/static pages (never on landing page)
  const showFooter = publicPaths.includes(pathname);

  return showFooter ? <CommonFooter /> : null;
}
