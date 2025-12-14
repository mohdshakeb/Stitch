import React from 'react';
import Header from '@/components/Header';

interface StitchLayoutProps {
    children: React.ReactNode;
}

export default function StitchLayout({ children }: StitchLayoutProps) {
    return (
        <main className="h-screen overflow-hidden flex justify-center bg-background">
            <Header />
            <div className="flex w-fit max-w-full px-6 gap-6 justify-center min-w-[1200px]">
                {children}
            </div>
        </main>
    );
}
