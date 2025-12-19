import React from 'react';
import { motion } from 'framer-motion';

interface FolderConnectIconProps {
    onClick: () => void;
    isConnecting: boolean;
}

export default function FolderConnectIcon({ onClick, isConnecting }: FolderConnectIconProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={isConnecting}
            className="relative w-[120px] h-[110px] group border-none bg-transparent cursor-pointer p-0"
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
        >
            {/* Back Plate (Deep Spruce -> Primary) */}
            <div className="absolute inset-0 bg-primary rounded-xl shadow-2xl" />

            {/* Papers Layer */}
            <div className="absolute inset-x-4 top-[-10px] bottom-4">
                {/* Paper 1 (Back) */}
                <motion.div
                    variants={{ hover: { y: -15, rotate: -3 } }}
                    className="absolute inset-0 bg-white rounded-lg shadow-sm origin-bottom-left"
                    style={{ y: -5, rotate: -2, opacity: 0.8 }}
                />

                {/* Paper 2 (Middle) */}
                <motion.div
                    variants={{ hover: { y: -25, rotate: 2 } }}
                    className="absolute inset-0 bg-white rounded-lg shadow-md origin-bottom-right flex flex-col gap-2 p-3 items-start"
                    style={{ y: -12, rotate: 1 }}
                >
                    {/* Fake Text Lines */}
                    <div className="w-3/4 h-1.5 bg-gray-200 rounded-full" />
                    <div className="w-1/2 h-1.5 bg-gray-200 rounded-full" />
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2" />
                    <div className="w-2/3 h-1.5 bg-gray-200 rounded-full" />
                </motion.div>
            </div>

            {/* Front Glass Plate */}
            <div
                className="absolute inset-x-0 bottom-0 h-[70%] rounded-xl z-20 overflow-hidden bg-gradient-to-b from-white/40 to-white/10 dark:from-black/30 dark:to-transparent backdrop-blur-[8px] border-t border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                style={{
                    transform: 'perspective(200px) rotateX(-10deg) scaleX(1.05)', // Stronger perspective + scaleX to flare top corners out
                    transformOrigin: 'bottom'
                }}
            >
                {/* Glass sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 dark:opacity-20" />
            </div>

            {/* Loading Spinner Overlay */}
            {isConnecting && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                </div>
            )}
        </motion.button>
    );
}
