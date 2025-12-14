import {
    RiArrowLeftLine,
    RiArrowDownSLine,
    RiFolder2Line,
    RiCheckLine,
    RiAddLine,
    RiSunLine,
    RiMoonLine
} from '@remixicon/react';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStorage } from '@/contexts/StorageContext';
import { useToast } from '@/contexts/ToastContext';

import { useRouter } from 'next/navigation';

interface HeaderProps {
    variant?: 'default' | 'back';
    actions?: React.ReactNode;
}

export default function Header({ variant = 'default', actions }: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { workspaces, activeWorkspaceId, createWorkspace, switchWorkspace, disconnect, removeWorkspace, isConnected } = useStorage();

    const [showWorkspaces, setShowWorkspaces] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { showToast } = useToast();

    // Moved handleSwitchWorkspace outside of useEffect
    const handleSwitchWorkspace = async (id: string) => {
        const success = await switchWorkspace(id);
        if (!success) {
            // Workspace likely deleted or moved. Offer to remove.
            showToast('Workspace not found', {
                type: 'error',
                description: 'The folder seems to be moved or deleted.',
                action: {
                    label: 'Remove',
                    onClick: () => removeWorkspace(id)
                }
            });
        }
    };

    useEffect(() => {
        setMounted(true);

        // handleSwitchWorkspace is now outside, so this part is removed from useEffect
        const handleClickOutside = (e: MouseEvent) => {
            if (showWorkspaces && !(e.target as Element).closest('.workspace-selector')) {
                setShowWorkspaces(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showWorkspaces]);

    if (!mounted) return null;

    return (
        <header className="fixed top-0 left-0 right-0 h-[60px] flex items-center justify-between px-6 z-50 bg-transparent pointer-events-none">
            <div className="flex items-center pointer-events-auto">
                {variant === 'back' ? (
                    <button
                        onClick={() => {
                            router.push('/');
                        }}
                        className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center text-foreground transition-colors duration-200 hover:bg-muted/10"
                        title="Back to Home"
                    >
                        <RiArrowLeftLine size={24} />
                    </button>
                ) : (
                    <Image
                        src={theme === 'dark' ? "/logo-dark.png" : "/logo.png"}
                        alt="App Logo"
                        width={120}
                        height={40}
                        className="object-contain object-left"
                        priority
                    />
                )}
            </div>

            {/* Theme Toggle & Settings */}
            <div className="flex items-center gap-2 pointer-events-auto">
                {variant === 'default' && isConnected && (
                    <div className="workspace-selector relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowWorkspaces(!showWorkspaces);
                            }}
                            className="bg-transparent border border-transparent cursor-pointer py-1.5 px-3 rounded-md flex items-center gap-2 text-foreground transition-all duration-200 text-sm font-medium hover:bg-muted/10 hover:border-border/50"
                        >
                            <span className="max-w-[150px] truncate">
                                {workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Select Workspace'}
                            </span>
                            <RiArrowDownSLine
                                className={`transition-transform duration-200 ${showWorkspaces ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>

                        {showWorkspaces && (
                            <div className="absolute top-full right-0 mt-2 bg-background border border-border rounded-lg shadow-lg w-[240px] flex flex-col p-1 z-[60]">
                                <div className="px-3 py-2 text-xs text-muted font-semibold uppercase tracking-wider">
                                    Your Workspaces
                                </div>
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => {
                                            handleSwitchWorkspace(ws.id);
                                            setShowWorkspaces(false);
                                        }}
                                        className={`text-left px-3 py-2 text-sm text-foreground bg-transparent border-none cursor-pointer rounded flex items-center gap-2 w-full hover:bg-muted/10 ${ws.id === activeWorkspaceId ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <RiFolder2Line size={16} className="opacity-70" />
                                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{ws.name}</span>
                                        {ws.id === activeWorkspaceId && <RiCheckLine size={16} className="text-primary" />}
                                    </button>
                                ))}

                                <div className="h-px bg-border my-1" />

                                <button
                                    onClick={() => {
                                        createWorkspace();
                                        setShowWorkspaces(false);
                                    }}
                                    className="text-left px-3 py-2 text-sm text-primary bg-transparent border-none cursor-pointer rounded flex items-center gap-2 w-full hover:bg-muted/10"
                                >
                                    <RiAddLine size={16} />
                                    Create New Workspace
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {actions}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center text-foreground transition-colors duration-200 pointer-events-auto hover:bg-muted/10"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <RiSunLine size={16} />
                    ) : (
                        <RiMoonLine size={16} />
                    )}
                </button>
            </div>
        </header>
    );
}
