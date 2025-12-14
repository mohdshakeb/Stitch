'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RiCloseLine } from '@remixicon/react';

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
            className="bg-surface border border-border min-w-[340px] max-w-[420px] pointer-events-auto shadow-lg p-5 flex flex-col gap-3 rounded-xl relative"
        >
            <button
                onClick={() => onClose(id)}
                className="absolute top-3 right-3 p-1 rounded-md bg-transparent border-none cursor-pointer text-muted flex items-center justify-center transition-colors hover:bg-black/5 hover:text-foreground"
            >
                <RiCloseLine size={20} />
            </button>

            <div className="flex flex-col gap-1 pr-6">
                <h4 className="m-0 text-sm font-semibold text-foreground leading-snug">
                    {message}
                </h4>
                {description && (
                    <p className="m-0 text-[0.85rem] text-muted leading-normal">
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div className="flex justify-start mt-1">
                    <button
                        onClick={() => {
                            action.onClick();
                            onClose(id);
                        }}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-foreground text-surface border-none cursor-pointer transition-opacity hover:opacity-90 active:opacity-100"
                    >
                        {action.label}
                    </button>
                </div>
            )}

            {!action && onUndo && (
                <div className="flex justify-start mt-1">
                    <button
                        onClick={onUndo}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-foreground text-surface border-none cursor-pointer transition-opacity hover:opacity-90 active:opacity-100"
                    >
                        Undo
                    </button>
                </div>
            )}
        </motion.div>
    );
}
