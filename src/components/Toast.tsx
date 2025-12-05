'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToastProps {
    id: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onUndo?: () => void;
    onClose: (id: string) => void;
}

export default function Toast({
    id,
    message,
    type = 'info',
    duration = 4000,
    onUndo,
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
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            layout
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
        ${type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                        'bg-white border-gray-200 text-gray-800'}
      `}
            style={{
                minWidth: '320px',
                maxWidth: '400px',
                pointerEvents: 'auto',
            }}
        >
            <div className="flex-1 text-sm font-medium">{message}</div>

            {onUndo && (
                <button
                    onClick={onUndo}
                    className="px-3 py-1 text-xs font-semibold bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                >
                    Undo
                </button>
            )}

            <button
                onClick={() => onClose(id)}
                className="p-1 rounded-full hover:bg-black/5 transition-colors"
            >
                <i className="ri-close-line text-lg opacity-50 hover:opacity-100" />
            </button>
        </motion.div>
    );
}
