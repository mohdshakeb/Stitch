'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useStorage } from '@/contexts/StorageContext';

import { useRouter } from 'next/navigation';

interface HeaderProps {
    variant?: 'default' | 'back';
}

export default function Header({ variant = 'default' }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { disconnect, exportData, isConnected } = useStorage();
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleClickOutside = (e: MouseEvent) => {
            if (showSettings && !(e.target as Element).closest('.settings-menu')) {
                setShowSettings(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showSettings]);

    if (!mounted) return null;

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 50,
            background: 'transparent',
            pointerEvents: 'none', // Allow clicking through the header area
        }}>
            {/* Logo or Back Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'auto',
            }}>
                {variant === 'back' ? (
                    <button
                        onClick={() => {
                            router.push('/');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'hsl(var(--foreground))',
                            transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Back to Home"
                    >
                        <i className="ri-arrow-left-line" style={{ fontSize: '1.5rem' }}></i>
                    </button>
                ) : (
                    <Image
                        src={theme === 'dark' ? "/header-logo-dark.png" : "/header-logo.png"}
                        alt="App Logo"
                        width={120}
                        height={40}
                        style={{ objectFit: 'contain', objectPosition: 'left' }}
                        priority
                    />
                )}
            </div>

            {/* Theme Toggle & Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}>
                {isConnected && (
                    <div className="settings-menu" style={{ position: 'relative' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSettings(!showSettings);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'hsl(var(--foreground))',
                                transition: 'background-color 0.2s ease',
                                transform: showSettings ? 'rotate(90deg)' : 'none',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Settings"
                        >
                            <i className="ri-settings-4-line" style={{ fontSize: '1.25rem' }}></i>
                        </button>

                        {showSettings && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                width: '200px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                overflow: 'hidden',
                            }}>
                                <button
                                    onClick={() => {
                                        exportData();
                                        setShowSettings(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        fontSize: '0.875rem',
                                        color: 'hsl(var(--foreground))',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <i className="ri-download-line"></i>
                                    Export Data
                                </button>
                                <div style={{ height: '1px', backgroundColor: 'hsl(var(--border))', margin: '4px 0' }} />
                                <button
                                    onClick={() => {
                                        disconnect();
                                        setShowSettings(false);
                                    }}
                                    style={{
                                        textAlign: 'left',
                                        padding: '8px 12px',
                                        fontSize: '0.875rem',
                                        color: 'hsl(var(--destructive))',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--destructive) / 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <i className="ri-folder-reduce-line"></i>
                                    Change Folder
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--foreground))',
                        transition: 'background-color 0.2s ease',
                        pointerEvents: 'auto', // Re-enable pointer events for button
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <i className="ri-sun-line" style={{ fontSize: '1rem' }}></i>
                    ) : (
                        <i className="ri-moon-line" style={{ fontSize: '1rem' }}></i>
                    )}
                </button>
            </div>
        </header>
    );
}
