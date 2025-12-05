'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

interface HeaderProps {
    variant?: 'default' | 'back';
}

export default function Header({ variant = 'default' }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

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

            {/* Theme Toggle */}
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
        </header>
    );
}
