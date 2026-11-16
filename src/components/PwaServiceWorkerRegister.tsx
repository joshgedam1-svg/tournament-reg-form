'use client';

import { useEffect } from 'react';

export default function PwaServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker silently without any install banners or prompts
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {});
    }
  }, []);

  return null;
}


