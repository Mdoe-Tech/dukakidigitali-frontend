'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {LayoutContext} from "@/app/(dashboard)/LayoutContext";

export const Body = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    // Check if Layout.Body is used within Layout
    const contextVal = React.useContext(LayoutContext)
    if (contextVal === null) {
        throw new Error(`Layout.Body must be used within Layout.`)
    }

    return (
        <div
            ref={ref}
            data-layout='body'
            className={cn(
                'px-4 py-6 md:overflow-hidden',
                contextVal && contextVal.fixed && 'flex-1',
                className
            )}
            {...props}
        />
    )
})
Body.displayName = 'Body'
