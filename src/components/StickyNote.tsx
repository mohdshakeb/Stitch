import React from 'react';
import { getCategoryStyles } from '@/utils/categories';

interface StickyNoteProps {
    id: string;
    text: string;
    url: string;
    title?: string | null;
    favicon?: string | null;
    createdAt: string;
    color?: string | null;
    textColor?: string | null;
    className?: string; // Allow tailwind classes
    contentClassName?: string;
}

// SVG Noise Pattern for Paper Texture
const PAPER_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`;

export default function StickyNote({
    id,
    text,
    url,
    title,
    favicon,
    createdAt,
    color,
    textColor,
    className = '',
    contentClassName = ''
}: StickyNoteProps) {

    const styles = getCategoryStyles(url);
    const bg = color || styles.color;
    const txtColor = textColor || styles.textColor;

    // Automatic detection for Urdu/Arabic script
    const isUrdu = /[\u0600-\u06FF\u0750-\u077F]/.test(text);

    return (
        <div
            className={`relative border-none rounded-sm flex flex-col justify-between ${className}`} // Removed overflow-hidden for potential future corner effects
            style={{
                backgroundColor: bg,
                color: txtColor,
                backgroundImage: PAPER_NOISE,
                backgroundBlendMode: 'overlay', // Blend texture with color
            }}
        >


            {/* Paper Thickness Effect (Rim Light) */}
            <div className="absolute inset-0 pointer-events-none rounded-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]" />
            <div className={`relative z-10 flex flex-col h-full justify-between overflow-hidden ${isUrdu ? 'p-5' : 'p-6'}`}>
                <blockquote
                    dir={isUrdu ? "rtl" : "ltr"}
                    className={`leading-relaxed m-0 mb-4 border-none p-0 line-clamp-6 text-ellipsis 
                    ${isUrdu ? 'font-urdu text-xl text-right' : 'text-sm font-heading'} 
                    ${contentClassName}`}
                    style={{ color: txtColor }}
                >
                    {text}
                </blockquote>
            </div>
        </div>
    );
}
