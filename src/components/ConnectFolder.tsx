'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useStorage } from '@/contexts/StorageContext';

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
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            padding: '24px',
            textAlign: 'center',
        }}>

            {/* 1. Logo */}
            <div style={{ position: 'relative', width: '200px', height: '60px', marginBottom: '8px' }}>
                <Image
                    src={resolvedTheme === 'dark' ? "/header-logo-dark.png" : "/header-logo.png"}
                    alt="Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>

            {/* 2. Message */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '480px',
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                }}>
                    Collect snippets. Stitch your story.
                </h1>

                <p style={{
                    fontSize: '1rem',
                    color: 'hsl(var(--muted))',
                    lineHeight: '1.6'
                }}>
                    Begin by creating a workspace. Simply select a local folder to safely store your research and notes.
                </p>
            </div>

            {/* 3. Action */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '320px' }}>
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    style={{
                        padding: '14px 28px',
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)', // Slightly rounder for primary button
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: isConnecting ? 'wait' : 'pointer',
                        opacity: isConnecting ? 0.8 : 1,
                        transition: 'all 0.2s ease',
                        width: '100%',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                    onMouseEnter={(e) => !isConnecting && (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => !isConnecting && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    {isConnecting ? 'Creating Workspace...' : 'Create My Workspace'}
                </button>

                {/* 4. Reassurance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                    <i className="ri-shield-check-line" style={{ color: 'hsl(var(--muted))' }} />
                    <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted))' }}>
                        100% Local. Your data stays safe with you.
                    </span>
                </div>
            </div>

            {/* 5. Fallbacks (Subtle) */}
            <div style={{ marginTop: '24px', opacity: 0.6 }}>
                {!isSupported && (
                    <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '8px' }}>
                        Browser not fully supported.
                        <button onClick={connectInternal} style={{ textDecoration: 'underline', marginLeft: '4px' }}>
                            Try Internal Storage
                        </button>
                    </p>
                )}
                {isSupported && (
                    <button
                        onClick={connectInternal}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--muted))',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                    >
                        Use Browser Storage (Demo)
                    </button>
                )}
            </div>
        </div>
    );
}
