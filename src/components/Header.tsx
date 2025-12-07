'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
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
    const { disconnect, exportData, isConnected, workspaces, activeWorkspaceId, createWorkspace, switchWorkspace } = useStorage();
    const [showSettings, setShowSettings] = useState(false);
    const [showWorkspaces, setShowWorkspaces] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                                width: '220px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                overflow: 'visible', // Allow nested menu
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
                                        width: '100%',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)';
                                        setShowWorkspaces(false);
                                    }}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <i className="ri-download-line"></i>
                                    Export Data
                                </button>

                                <div style={{ height: '1px', backgroundColor: 'hsl(var(--border))', margin: '4px 0' }} />

                                {/* Switch Workspace Item */}
                                <div
                                    style={{ position: 'relative' }}
                                    onMouseEnter={() => {
                                        if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                        setShowWorkspaces(true);
                                    }}
                                    onMouseLeave={() => {
                                        timeoutRef.current = setTimeout(() => {
                                            setShowWorkspaces(false);
                                        }, 300); // 300ms grace period
                                    }}
                                >
                                    <button
                                        style={{
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            fontSize: '0.875rem',
                                            color: 'hsl(var(--foreground))',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'default',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '8px',
                                            width: '100%',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="ri-folder-2-line"></i>
                                            Switch Workspace
                                        </div>
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>

                                    {/* Nested Workspaces Menu */}
                                    {showWorkspaces && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                right: '100%',
                                                marginRight: '4px',
                                                paddingRight: '8px', // Visual gap via padding (part of click area)
                                                width: '210px',
                                                zIndex: 60,
                                                display: 'flex', // Wrapper for the menu box
                                            }}
                                            onMouseEnter={() => {
                                                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                                            }}
                                            onMouseLeave={() => {
                                                timeoutRef.current = setTimeout(() => {
                                                    setShowWorkspaces(false);
                                                }, 300);
                                            }}
                                        >
                                            <div style={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: '4px',
                                                width: '100%',
                                            }}>
                                                {workspaces.map((ws) => (
                                                    <button
                                                        key={ws.id}
                                                        onClick={() => {
                                                            switchWorkspace(ws.id);
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
                                                            width: '100%',
                                                            opacity: ws.id === activeWorkspaceId ? 1 : 0.7,
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                                                        {ws.id === activeWorkspaceId && <i className="ri-check-line" style={{ color: 'hsl(var(--primary))' }}></i>}
                                                    </button>
                                                ))}

                                                {workspaces.length > 0 && <div style={{ height: '1px', backgroundColor: 'hsl(var(--border))', margin: '4px 0' }} />}

                                                <button
                                                    onClick={() => {
                                                        createWorkspace();
                                                        setShowSettings(false);
                                                    }}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: '8px 12px',
                                                        fontSize: '0.875rem',
                                                        color: 'hsl(var(--primary))',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        width: '100%',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.1)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <i className="ri-add-line"></i>
                                                    Create New
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
