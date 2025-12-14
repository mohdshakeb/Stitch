'use client';

import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

export function PwaLifecycle() {
    const { showToast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Check if a SW is already waiting
            if ((window as any).workbox) { // next-pwa exposes workbox on window
                const wb = (window as any).workbox;

                wb.addEventListener('waiting', () => {
                    showToast('A new version is available!', 'info', 'Refresh', () => {
                        wb.addEventListener('controlling', () => {
                            window.location.reload();
                        });
                        wb.messageSkipWaiting();
                    });
                });
            }
        }
    }, [showToast]);

    return null;
}
