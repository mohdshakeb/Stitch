'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useVelocity, useSpring } from 'framer-motion';
import StickyNote from './StickyNote';

// Define the shape of the item prop based on what ConnectFolder passes
// In ConnectFolder it was MOCK_STICKIES[0] which has:
// id, text, url, createdAt, title, theme: { bg, text }
interface DraggableStickyItemProps {
    item: {
        id: string;
        text: string;
        url: string;
        title: string;
        createdAt: string;
        theme: {
            bg: string;
            text: string;
        };
    };
    initialX: number;
    initialY: number;
    initialRotate: number;
    zIndex: number;
    onDragStart: () => void;
    topZIndex: number;
    scale?: number;
    delay?: number;
}

export default function DraggableStickyItem({
    item,
    initialX,
    initialY,
    initialRotate,
    zIndex,
    onDragStart,
    topZIndex,
    delay = 0,
    scale = 1
}: DraggableStickyItemProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [hasAppeared, setHasAppeared] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasAppeared(true);
        }, (delay * 1000) + 500);
        return () => clearTimeout(timer);
    }, [delay]);

    // Physics Hooks
    const x = useMotionValue(initialX);
    const y = useMotionValue(initialY);

    // --- Physics: Rotation Logic ---

    // 1. Base Rotation (Straightens when dragging)
    const rotationTarget = useMotionValue(initialRotate);
    const smoothBaseRotation = useSpring(rotationTarget, { damping: 25, stiffness: 600 });

    useEffect(() => {
        // When dragging, straighten up (0 degrees). When released, go back to random tilt.
        rotationTarget.set(isDragging ? 0 : initialRotate);
    }, [isDragging, initialRotate, rotationTarget]);

    // 2. Velocity Tilt (Adds to base rotation based on speed)
    const xVelocity = useVelocity(x);
    // Transform velocity to tilt (drag right -> lean right)
    // Range: -1000 to 1000 px/s maps to -15 to 15 degrees
    const tilt = useTransform(xVelocity, [-1000, 1000], [-15, 15]);
    const smoothTilt = useSpring(tilt, { damping: 25, stiffness: 600 });

    // 3. Combine Base + Tilt
    const rotate = useTransform(
        [smoothBaseRotation, smoothTilt],
        (latest: number[]) => latest[0] + latest[1]
    );

    return (
        <motion.div
            drag
            dragMomentum={false}
            onPointerDown={() => {
                setIsDragging(true);
                onDragStart(); // Trigger z-index update immediately
            }}
            onPointerUp={() => setIsDragging(false)}
            onDragEnd={() => setIsDragging(false)}
            style={{
                x,
                y,
                rotate,
                zIndex,
                touchAction: 'none',
                transformOrigin: 'top center' // Pivot physics from the top (glue area)
            }}
            initial={{ opacity: 0, scale: 1.15 * scale }}
            animate={{
                opacity: 1,
                zIndex: isDragging ? topZIndex + 100 : zIndex,
                scale: isDragging ? 1.05 * scale : scale
            }}
            whileHover={{ scale: isDragging ? 1.05 * scale : 1.02 * scale, cursor: 'grab' }}
            whileDrag={{ cursor: 'grabbing' }}
            transition={hasAppeared ? { duration: 0.15 } : { delay, type: "spring", damping: 20, stiffness: 300 }}
            className="absolute top-0 left-0 w-[180px] h-[180px]"
        >
            <div className="pointer-events-none w-full h-full">
                <StickyNote
                    id={item.id}
                    text={item.text}
                    url={item.url}
                    title={item.title}
                    createdAt={item.createdAt}
                    color={item.theme.bg}
                    textColor={item.theme.text}
                    // Dynamic Shadow logic: if dragging, force shadow-2xl
                    className={`w-full h-full text-xs transition-shadow duration-300 ${isDragging ? '!shadow-2xl' : '!shadow-md'}`}
                />
            </div>
        </motion.div>
    );
}
