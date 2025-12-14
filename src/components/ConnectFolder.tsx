'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useStorage } from '@/contexts/StorageContext';
import { RiShieldCheckLine } from '@remixicon/react';

export default function ConnectFolder() {
    const { connect, connectInternal, isConnecting } = useStorage();
    const { theme, resolvedTheme } = useTheme();
    const [isSupported, setIsSupported] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
            setIsSupported(false);
        }
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-8 bg-background text-foreground p-6 text-center">

            {/* 1. Logo */}
            <div className="relative w-[200px] h-[60px] mb-2">
                <Image
                    src={resolvedTheme === 'dark' ? "/header-logo-dark.png" : "/header-logo.png"}
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* 2. Message */}
            <div className="flex flex-col items-center gap-3 max-w-[480px]">
                <h1 className="text-3xl font-semibold leading-tight tracking-tight">
                    Collect snippets. Stitch your story.
                </h1>

                <p className="text-base text-muted leading-relaxed">
                    Begin by creating a workspace. Simply select a local folder to safely store your research and notes.
                </p>
            </div>

            {/* 3. Action */}
            <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full px-7 py-3.5 bg-primary text-primary-foreground border-none rounded-lg text-base font-medium cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-px disabled:opacity-80 disabled:cursor-wait disabled:hover:translate-y-0"
                >
                    {isConnecting ? 'Creating Workspace...' : 'Create My Workspace'}
                </button>

                {/* 4. Reassurance */}
                <div className="flex items-center gap-1.5 opacity-80">
                    <RiShieldCheckLine className="text-muted" />
                    <span className="text-sm text-muted">
                        100% Local. Your data stays safe with you.
                    </span>
                </div>
            </div>

            {/* 5. Fallbacks (Subtle) */}
            <div className="mt-6 opacity-60">
                {!isSupported && (
                    <p className="text-red-500 text-xs mb-2">
                        Browser not fully supported.
                        <button onClick={connectInternal} className="underline ml-1 cursor-pointer">
                            Try Internal Storage
                        </button>
                    </p>
                )}
                {isSupported && (
                    <button
                        onClick={connectInternal}
                        className="bg-transparent border-none text-muted text-xs cursor-pointer underline hover:text-foreground"
                    >
                        Use Browser Storage (Demo)
                    </button>
                )}
            </div>
        </div>
    );
}
