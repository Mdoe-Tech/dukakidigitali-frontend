'use client'
import React from 'react'

interface LayoutContextType {
    offset: number
    fixed: boolean
    isSidebarOpen: boolean
    setIsSidebarOpen: (isOpen: boolean) => void
}

export const LayoutContext = React.createContext<LayoutContextType | null>(null)
