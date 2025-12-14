'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { RiDownload2Line, RiShieldCheckLine } from '@remixicon/react';

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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center isolate">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 w-full h-full bg-background/80 backdrop-blur-sm -z-10"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className="bg-card rounded-lg border border-border w-[90%] max-w-[600px] p-8 shadow-xl relative flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-muted text-xl hover:text-foreground transition-colors"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">Install Highlight Extension</h2>
                            <p className="text-muted leading-relaxed flex items-center">
                                <RiShieldCheckLine size={16} className="text-muted mr-1" />
                                Follow these steps to enable the helper extension.
                            </p>
                        </div>

                        {/* Video Container */}
                        <div className="w-full aspect-video bg-muted/10 rounded-md overflow-hidden border border-border flex items-center justify-center">
                            {/* Placeholder or Real Video */}
                            <video
                                src="/install-tutorial.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if video missing
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = 'Video Tutorial Placeholder\n(Add install-tutorial.mp4 to public/)';
                                }}
                            />
                        </div>

                        {/* Steps List */}
                        <ol className="m-0 pl-6 text-foreground flex flex-col gap-2 text-[0.95rem] list-decimal">
                            <li>Unzip the downloaded <strong>highlight-extension.zip</strong> file.</li>
                            <li>Open Chrome and go to <code>chrome://extensions</code></li>
                            <li>Toggle <strong>Developer mode</strong> (top right).</li>
                            <li>Drag and drop the unzipped folder into the window.</li>
                        </ol>

                        {/* Actions */}
                        <button
                            onClick={handleDownload}
                            className="w-full p-3 bg-foreground text-background border-none rounded-md text-base font-medium cursor-pointer flex items-center justify-center gap-2 mt-2 transition-transform duration-100 active:scale-[0.98]"
                        >
                            <RiDownload2Line size={20} />
                            Download Extension
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
