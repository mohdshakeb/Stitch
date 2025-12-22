'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import DraggableStickyItem from './DraggableStickyItem';

// Reuse category theme for stickies (matches ConnectFolder)
const CATEGORY_THEME = {
    social: { bg: 'var(--cat-social-bg)', text: 'var(--cat-social-text)' },
    article: { bg: 'var(--cat-article-bg)', text: 'var(--cat-article-text)' },
    academic: { bg: 'var(--cat-academic-bg)', text: 'var(--cat-academic-text)' },
};

// Simplified mock data
const MOCK_STICKIES = [
    {
        id: 'mobile-1',
        text: "If you are on a Tablet, please rotate your device to Landscape.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.social
    },
    {
        id: 'mobile-2',
        text: "Stitch needs a little more space to breathe.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.article
    },
    {
        id: 'mobile-3',
        text: "Open on Desktop for the full experience.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.academic
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 20 }
    }
};

// Fixed visual arrangement for the "pile" (No random calculations)
const STICKY_LAYOUT = [
    { x: 20, y: 10, rotate: -12, delay: 0.1 },  // Left
    { x: 100, y: 10, rotate: 12, delay: 0.2 },  // Right
    { x: 60, y: 35, rotate: -3, delay: 0.3 }    // Center overlap
];

export default function MobileRestricted() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Z-Index State
    const [zIndices, setZIndices] = useState<number[]>(MOCK_STICKIES.map((_, i) => i + 40));
    const [topZIndex, setTopZIndex] = useState(MOCK_STICKIES.length + 40);

    const handleDragStart = (index: number) => {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);
        setZIndices(prev => {
            const next = [...prev];
            next[index] = newZ;
            return next;
        });
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Visibility Logic: 
    // - Flex by default (Mobile)
    // - Hidden on lg (Desktop > 1024px)
    // - This effectively restricts Portrait Phones, Landscape Phones, and Portrait Tablets.
    // - Landscape Tablets (typically > 1024px width) will be hidden (Allowed).
    const visibilityClasses = "flex lg:hidden";

    return (
        <div className={`fixed inset-0 z-[9999] bg-background text-foreground flex-col items-center justify-center p-6 overflow-hidden ${visibilityClasses}`}>

            {/* Main Wrapper: Vertical on Portrait, Horizontal on Landscape */}
            <div className="flex flex-col landscape:flex-row items-center justify-center gap-[140px] landscape:gap-32 px-10">

                {/* 1. Content (Top / Left) */}
                <div className="relative z-30 text-center landscape:text-left max-w-md">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="flex flex-col items-center landscape:items-start gap-8"
                    >
                        {/* Logo */}
                        <motion.div variants={itemVariants} className="relative w-[180px] h-[50px]">
                            <Image
                                src={resolvedTheme === 'dark' ? "/logo-dark.png" : "/logo.png"}
                                alt="Logo"
                                fill
                                sizes="180px"
                                className="object-contain landscape:object-left"
                                priority
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4">
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-[300px] mx-auto landscape:mx-0">
                                Stitch is designed for desktop. Please rotate your device or switch to a larger display.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>

                {/* 2. Draggable Stickies (Bottom / Right) */}
                <div className="relative w-[300px] h-[200px] flex-shrink-0">
                    {MOCK_STICKIES.map((item, index) => {
                        const layout = STICKY_LAYOUT[index];
                        return (
                            <DraggableStickyItem
                                key={item.id}
                                item={item}
                                initialX={layout.x}
                                initialY={layout.y}
                                initialRotate={layout.rotate}
                                zIndex={zIndices[index]}
                                onDragStart={() => handleDragStart(index)}
                                topZIndex={topZIndex}
                                delay={layout.delay}
                                scale={0.9} // Large Scale
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
