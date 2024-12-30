'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import {LayoutContext} from "@/app/(dashboard)/LayoutContext";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    sticky?: boolean
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
    ({ className, sticky, ...props }, ref) => {
        // Check if Layout.Header is used within Layout
        const contextVal = React.useContext(LayoutContext)
        if (contextVal === null) {
            throw new Error(
                `Layout.Header must be used within Layout.`
            )
        }

        return (
            <div
                ref={ref}
                data-layout='header'
                className={cn(
                    `z-10 flex h-[var(--header-height)] items-center gap-4 bg-background p-4 md:px-8`,
                    contextVal.offset > 10 && sticky ? 'shadow' : 'shadow-none',
                    contextVal.fixed && 'flex-none',
                    sticky && 'sticky top-0',
                    className
                )}
                {...props}
            />
        )
    }
)
Header.displayName = 'Header'
