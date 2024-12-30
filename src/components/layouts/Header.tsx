'use client'

import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    sticky?: boolean;
}

export function Header({ className, sticky, ...props }: HeaderProps) {
    return (
        <div
            data-layout='header'
            className={cn(
                `z-10 flex h-[var(--header-height)] items-center gap-4 bg-background p-4 md:px-8`,
                sticky && 'sticky top-0',
                className
            )}
            {...props}
        />
    );
}
