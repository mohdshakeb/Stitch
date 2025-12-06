import React from 'react';
import Header from '@/components/Header';

interface StitchLayoutProps {
    children: React.ReactNode;
}

export default function StitchLayout({ children }: StitchLayoutProps) {
    return (
        <main style={{
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'hsl(var(--background))',
        }}>
            <Header />
            <div style={{
                display: 'flex',
                width: 'fit-content', // Only take up needed space
                maxWidth: '100%',
                padding: '0 24px', // Requested 24px padding
                gap: '24px', // Reduced gap
                justifyContent: 'center',
                minWidth: '1200px', // Prevent layout shift below 1200px
            }}>
                {children}
            </div>
        </main>
    );
}
