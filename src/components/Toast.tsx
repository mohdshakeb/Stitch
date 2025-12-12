'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToastProps {
    id: string;
    message: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onUndo?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose: (id: string) => void;
}

export default function Toast({
    id,
    message,
    description,
    type = 'info',
    duration = 4000,
    onUndo,
    action,
    onClose,
}: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            layout
            style={{
                backgroundColor: 'hsl(var(--surface))',
                borderColor: 'hsl(var(--border))',
                minWidth: '340px',
                maxWidth: '420px',
                pointerEvents: 'auto',
                boxShadow: 'var(--shadow-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '12px',
                borderWidth: '1px',
                borderStyle: 'solid',
                position: 'relative',
            }}
        >
            <button
                onClick={() => onClose(id)}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px',
                    borderRadius: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.color = 'hsl(var(--foreground))';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'hsl(var(--muted))';
                }}
            >
                <i className="ri-close-line" style={{ fontSize: '1.25rem' }} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '24px' }}>
                <h4
                    style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'hsl(var(--foreground))',
                        lineHeight: 1.4,
                    }}
                >
                    {message}
                </h4>
                {description && (
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: 'hsl(var(--muted))', // Slightly darker than standard muted for readability
                            lineHeight: 1.5,
                        }}
                    >
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                    <button
                        onClick={() => {
                            action.onClick();
                            onClose(id);
                        }}
                        style={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--foreground))',
                            color: 'hsl(var(--surface))',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        {action.label}
                    </button>
                </div>
            )}

            {!action && onUndo && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                    <button
                        onClick={onUndo}
                        style={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--foreground))',
                            color: 'hsl(var(--surface))',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Undo
                    </button>
                </div>
            )}
        </motion.div>
    );
}
