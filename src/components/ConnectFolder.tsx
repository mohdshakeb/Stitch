'use client';

import React, { useEffect, useState } from 'react';
import { useStorage } from '@/contexts/StorageContext';

export default function ConnectFolder() {
    const { connect, connectInternal, isConnecting } = useStorage();
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
            setIsSupported(false);
        }
    }, []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            padding: '20px',
            textAlign: 'center',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '400px',
                textAlign: 'center',
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Welcome to Highlight</h1>

                <p style={{ color: 'hsl(var(--muted))', lineHeight: '1.5' }}>
                    Select a folder to save notes/highlights
                </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: 'hsl(var(--foreground))',
                        color: 'hsl(var(--background))',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: isConnecting ? 'wait' : 'pointer',
                        opacity: isConnecting ? 0.7 : 1,
                        transition: 'transform 0.1s ease',
                        width: '100%',
                    }}
                    onMouseDown={(e) => !isConnecting && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !isConnecting && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isConnecting ? 'Connecting...' : 'Open Library Folder'}
                </button>

                <button
                    onClick={connectInternal}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'hsl(var(--muted))',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                    }}
                >
                    Use Internal Storage (Browser Only)
                </button>

                {!isSupported && (
                    <p style={{ color: 'hsl(var(--muted))', fontSize: '0.8rem', marginTop: '8px' }}>
                        Note: Your browser reports that File System Access is not supported. You can try anyway.
                    </p>
                )}
            </div>
        </div>
    );
}
