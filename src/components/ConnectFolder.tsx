'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useStorage } from '@/contexts/StorageContext';
import { RiShieldCheckLine } from '@remixicon/react';
import { motion } from 'framer-motion';
import FolderConnectIcon from './FolderConnectIcon';
import DraggableStickyItem from './DraggableStickyItem';


// Consistent Category Colors (Using CSS Variables for Light/Dark mode support)
const CATEGORY_THEME = {
    social: { bg: 'var(--cat-social-bg)', text: 'var(--cat-social-text)' },
    article: { bg: 'var(--cat-article-bg)', text: 'var(--cat-article-text)' },
    academic: { bg: 'var(--cat-academic-bg)', text: 'var(--cat-academic-text)' },
    ai: { bg: 'var(--cat-ai-bg)', text: 'var(--cat-ai-text)' },
    other: { bg: 'var(--cat-other-bg)', text: 'var(--cat-other-text)' }
};

// Mock data with segmented story
const MOCK_STICKIES = [
    {
        id: 'mock-1',
        text: "A place where ideas come together. Gently, naturally, piece by piece.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.social
    },
    {
        id: 'mock-2',
        text: "Stitch meaning out of what already moved you.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.article
    },
    {
        id: 'mock-3',
        text: "Stitch isn’t about capturing everything. It’s about connecting the right things.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.academic
    },
    {
        id: 'mock-4',
        text: "Make your ideas learn to belong to each other.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.ai
    },
    {
        id: 'mock-5',
        text: "Stitch is the gathering place where your scattered fragments finally meet.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.other
    },
    {
        id: 'mock-6',
        text: "This isn’t about capturing everything. It’s about capturing the right things.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.social
    },
    {
        id: 'mock-7',
        text: "Connect your thoughts thoughtfully, intuitively, and at your own pace.",
        url: "",
        createdAt: new Date().toISOString(),
        title: "",
        theme: CATEGORY_THEME.article
    },
    {
        id: 'mock-8',
        text: "Ideas behave differently here. Here, they learn to belong to each other.",
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
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
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

export default function ConnectFolder() {
    const { connect, connectInternal, isConnecting } = useStorage();
    const { resolvedTheme } = useTheme();
    const [isSupported, setIsSupported] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [positions, setPositions] = useState<{ x: number; y: number; rotate: number; delay: number }[]>([]);

    // Z-Index State Management
    // Start at 40 to ensure they are above the center content (z-30)
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
        if (typeof window !== 'undefined' && !('showDirectoryPicker' in window)) {
            setIsSupported(false);
        }

        // --- Position Generation (Polar Distribution) ---
        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;

        // Config
        const cardSize = 180;

        // Radius Calculation based on screen size
        // We want them to circle the center content.
        // Base distance from center. 
        // Min distance needs to clear the center zone (approx 300px radius ideally)
        // Distribute items avoiding Top (270) and Bottom (90) zones
        // Split into Left Sector (135-225) and Right Sector (315-45)

        // Fix radius to be outside center but on screen
        const minDimension = Math.min(width, height);
        const minRadius = minDimension * 0.42;
        const maxRadius = minDimension * 0.85;

        const generatedPositions: { x: number; y: number; rotate: number; delay: number }[] = [];

        for (let i = 0; i < MOCK_STICKIES.length; i++) {
            let targetAngleDeg;

            // First 4 items on Right Side (-45 to 45)
            // Next 4 items on Left Side (135 to 225)
            if (i < 4) {
                // Right Sector: Spread between 315 (-45) and 45. 
                // Steps: -40, -15, 15, 40
                const step = 90 / 4;
                const start = 315 + (step / 2);
                targetAngleDeg = start + (i * step);
            } else {
                // Left Sector: Spread between 135 and 225.
                const step = 90 / 4;
                const start = 135 + (step / 2);
                targetAngleDeg = start + ((i - 4) * step);
            }

            // Add some randomness to angle (+/- 5 deg)
            const angleJitter = (Math.random() * 10 - 5);
            const finalAngleRad = (targetAngleDeg + angleJitter) * (Math.PI / 180);

            // Random radius
            const radius = minRadius + Math.random() * (maxRadius - minRadius);

            // Calculate Position
            let x = centerX + Math.cos(finalAngleRad) * radius - (cardSize / 2);
            let y = centerY + Math.sin(finalAngleRad) * radius - (cardSize / 2);

            // Clamp to screen bounds (with padding)
            const padding = 16;
            x = Math.max(padding, Math.min(width - cardSize - padding, x));
            y = Math.max(padding, Math.min(height - cardSize - padding, y));

            // Tilt
            // Alternate tilt direction to prevent bunching of same angles
            const sign = i % 2 === 0 ? 1 : -1;
            const magnitude = Math.random() * 10 + 5; // 5 to 15 degrees
            const rotate = sign * magnitude;

            // Random delay between 0.5s and 1.5s
            const delay = 0.5 + Math.random();

            generatedPositions.push({ x, y, rotate, delay });
        }

        setPositions(generatedPositions);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative h-screen w-full overflow-hidden bg-background text-foreground">

            {/* 1. Draggable Sticky Notes Layer */}
            {positions.map((pos, index) => (
                <DraggableStickyItem
                    key={MOCK_STICKIES[index].id}
                    item={MOCK_STICKIES[index]}
                    initialX={pos.x}
                    initialY={pos.y}
                    initialRotate={pos.rotate}
                    zIndex={zIndices[index]}
                    onDragStart={() => handleDragStart(index)}
                    topZIndex={topZIndex}
                    delay={pos.delay}
                />
            ))}

            {/* 2. Center Content Layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="pointer-events-auto flex flex-col items-center justify-center gap-2 p-4 text-center max-w-[600px]"
                >

                    {/* Logo - Reduced Size */}
                    <motion.div variants={itemVariants} className="relative w-[200px] h-[48px] mb-1">
                        <Image
                            src={resolvedTheme === 'dark' ? "/logo-dark.png" : "/logo.png"}
                            alt="Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
                        <p className="text-xl text-muted font-regular leading-relaxed max-w-[450px]">
                            Where Writing stops being a blank-page battle. It becomes an act of assembly.
                        </p>
                    </motion.div>

                    {/* Action */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 w-full mt-20">
                        <div className="flex flex-col items-center gap-4 group cursor-pointer">
                            <FolderConnectIcon onClick={connect} isConnecting={isConnecting} />

                            <span className="text-foreground font-semibold text-md tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                                {isConnecting ? 'Opening Folder...' : 'OPEN WORKSPACE'}
                            </span>
                        </div>

                        {isSupported && (
                            <button
                                onClick={connectInternal}
                                className="bg-transparent border-none text-muted text-md cursor-pointer hover:text-foreground transition-colors opacity-60 hover:opacity-100"
                            >
                                Demo with Browser Storage
                            </button>
                        )}

                        {!isSupported && (
                            <p className="text-red-500 text-xs mt-2 opacity-80">
                                Browser not fully supported.
                                <button onClick={connectInternal} className="underline ml-1 cursor-pointer hover:text-foreground">
                                    Try Internal Storage
                                </button>
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}



