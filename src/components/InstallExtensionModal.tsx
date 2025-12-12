'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface InstallExtensionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstallExtensionModal({ isOpen, onClose }: InstallExtensionModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const handleDownload = () => {
        // Trigger download
        const link = document.createElement('a');
        link.href = '/highlight-extension.zip';
        link.download = 'highlight-extension.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Close modal after brief delay
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    isolation: 'isolate', // Create new stacking context
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'hsl(var(--background) / 0.8)',
                            backdropFilter: 'blur(8px)',
                            zIndex: -1, // Behind content
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        style={{
                            backgroundColor: 'hsl(var(--card))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid hsl(var(--border))',
                            width: '90%',
                            maxWidth: '600px', // Wider easier to view video
                            padding: '32px',
                            boxShadow: 'var(--shadow-xl)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'hsl(var(--muted))',
                                fontSize: '1.25rem',
                            }}
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Install Highlight Extension</h2>
                            <p style={{ color: 'hsl(var(--muted))', lineHeight: '1.5' }}>
                                Follow these steps to enable the helper extension.
                            </p>
                        </div>

                        {/* Video Container */}
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            backgroundColor: 'hsl(var(--muted) / 0.1)',
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            border: '1px solid hsl(var(--border))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {/* Placeholder or Real Video */}
                            <video
                                src="/install-tutorial.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    // Fallback if video missing
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = 'Video Tutorial Placeholder\n(Add install-tutorial.mp4 to public/)';
                                }}
                            />
                        </div>

                        {/* Steps List */}
                        <ol style={{
                            margin: 0,
                            paddingLeft: '24px',
                            color: 'hsl(var(--foreground))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '0.95rem'
                        }}>
                            <li>Unzip the downloaded <strong>highlight-extension.zip</strong> file.</li>
                            <li>Open Chrome and go to <code>chrome://extensions</code></li>
                            <li>Toggle <strong>Developer mode</strong> (top right).</li>
                            <li>Drag and drop the unzipped folder into the window.</li>
                        </ol>

                        {/* Actions */}
                        <button
                            onClick={handleDownload}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'hsl(var(--foreground))',
                                color: 'hsl(var(--background))',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '8px',
                                transition: 'transform 0.1s ease',
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <i className="ri-download-2-line"></i>
                            Download Extension
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
