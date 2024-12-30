'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Menu, User, ChevronDown, CircleDot } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { sidebarLinks } from "@/config/sidebarLinks"
import { SidebarLink } from "@/types/dashboard"
import {useAuth} from "@/hooks/useAuth";

const STORAGE_KEY = 'sidebar-state'

const SidebarLinkItem = React.memo(({
                                        link,
                                        isExpanded,
                                        isActive,
                                        onClick,
                                        isLinkExpanded
                                    }: {
    link: SidebarLink
    isExpanded: boolean
    isActive: boolean
    onClick: () => void
    isLinkExpanded: boolean
}) => {
    const Icon = link.icon

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <motion.button
                    onClick={onClick}
                    className={cn(
                        "w-full flex items-center justify-between py-3.5 px-5 rounded-lg transition-all duration-200 hover:scale-[1.02]",
                        isActive
                            ? "bg-primary/90 text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                    )}
                >
                    <div className="flex items-center space-x-4">
                        <Icon className={cn(
                            "h-5 w-5 transition-transform",
                            isActive && "scale-110"
                        )} />
                        {isExpanded && (
                            <span className="text-sm font-medium tracking-wide">
                                {link.label}
                            </span>
                        )}
                    </div>
                    {isExpanded && link.subLinks && (
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform duration-300",
                                isLinkExpanded ? "rotate-180" : ""
                            )}
                        />
                    )}
                </motion.button>
            </TooltipTrigger>
            {!isExpanded && (
                <TooltipContent side="right" sideOffset={10}>
                    {link.label}
                </TooltipContent>
            )}
        </Tooltip>
    )
})

const NavigationSection = React.memo(({ isExpanded }: { isExpanded: boolean }) => {
    const pathname = usePathname()
    const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set())

    useEffect(() => {
        const initialExpandedLinks = new Set<string>()
        sidebarLinks.forEach(link => {
            if (link.subLinks) {
                initialExpandedLinks.add(link.href)
            }
        })
        setExpandedLinks(initialExpandedLinks)
    }, [])

    const toggleExpand = useCallback((href: string) => {
        setExpandedLinks(prev => {
            const next: any = new Set(prev)
            if (next.has(href)) {
                next.delete(href)
            } else {
                next.add(href)
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
            return next
        })
    }, [])

    const isLinkActive = useCallback((link: SidebarLink) => {
        if (link.subLinks) {
            return link.subLinks.some(sub => pathname.startsWith(sub.href))
        }
        return pathname === link.href
    }, [pathname])

    return (
        <TooltipProvider>
            <div className="space-y-3">
                {sidebarLinks.map(link => (
                    <div key={link.href} className="group">
                        {link.subLinks ? (
                            <SidebarLinkItem
                                link={link}
                                isExpanded={isExpanded}
                                isActive={isLinkActive(link)}
                                onClick={() => toggleExpand(link.href)}
                                isLinkExpanded={expandedLinks.has(link.href)}
                            />
                        ) : (
                            <Link href={link.href} prefetch>
                                <SidebarLinkItem
                                    link={link}
                                    isExpanded={isExpanded}
                                    isActive={isLinkActive(link)}
                                    onClick={() => {}}
                                    isLinkExpanded={false}
                                />
                            </Link>
                        )}

                        <AnimatePresence>
                            {isExpanded && expandedLinks.has(link.href) && link.subLinks && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="ml-8 mt-2 space-y-1"
                                >
                                    {link.subLinks.map(subLink => (
                                        <Link key={subLink.href} href={subLink.href} prefetch>
                                            <motion.button
                                                whileHover={{ x: 4 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                    "w-full text-left py-3 px-4 rounded-md transition-all duration-200",
                                                    "flex items-center group/item",
                                                    pathname.startsWith(subLink.href)
                                                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                                                )}
                                            >
                                                <CircleDot className={cn(
                                                    "h-3 w-3 mr-3 transition-opacity",
                                                    pathname.startsWith(subLink.href)
                                                        ? "opacity-100"
                                                        : "opacity-40 group-hover/item:opacity-60"
                                                )} />
                                                <span className="text-sm">{subLink.label}</span>
                                            </motion.button>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </TooltipProvider>
    )
})

const SidebarContent = React.memo(({
                                       isExpanded,
                                       setIsExpanded,
                                       onClose,
                                       isMobile
                                   }: {
    isExpanded: boolean
    setIsExpanded: (value: boolean) => void
    onClose: () => void
    isMobile: boolean
}) => {
    const { user } = useAuth();

    useEffect(() => {
        localStorage.setItem('sidebar-expanded', String(isExpanded))
    }, [isExpanded])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <motion.div
                        initial={false}
                        animate={{ opacity: isExpanded ? 1 : 0 }}
                        className={cn("flex items-center space-x-3", !isExpanded && "hidden")}
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
                            <span className="text-primary-foreground text-sm font-bold">DK</span>
                        </div>
                        <span className="text-foreground text-lg font-semibold tracking-tight">Dukani</span>
                    </motion.div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 transition-transform hover:scale-105"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
                <NavigationSection isExpanded={isExpanded} />
            </div>

            <div className="flex-shrink-0 p-5 border-t border-border">
                <div className={cn("flex items-center", isExpanded ? "justify-between" : "justify-center")}>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
                                <User className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                        </div>
                        {isExpanded && (
                            <div className="flex flex-col">
                                <span className="text-foreground text-sm font-semibold">{user ? user.name : " "}</span>
                                <span className="text-muted-foreground text-xs">{user?.role}</span>
                            </div>
                        )}
                    </div>
                    {isMobile && isExpanded && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5"
                            onClick={onClose}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
})

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-expanded')
            return saved ? saved === 'true' : true
        }
        return true
    })

    return (
        <>
            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;     
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <motion.aside
                initial={{ x: -280 }}
                animate={{ x: isOpen ? 0 : -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 z-50 h-screen md:hidden w-[280px]"
            >
                <div className="relative h-full bg-background/95 backdrop-blur-xl shadow-xl rounded-r-xl border-r border-border/50">
                    <div className="absolute inset-0 opacity-20 rounded-r-xl" />
                    <div className="relative h-full">
                        <SidebarContent
                            isExpanded={true}
                            setIsExpanded={setIsExpanded}
                            onClose={onClose}
                            isMobile={true}
                        />
                    </div>
                </div>
            </motion.aside>

            <motion.aside
                initial={false}
                animate={{ width: isExpanded ? 280 : 80 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden md:block relative h-screen"
            >
                <div className="relative h-full bg-background/95 backdrop-blur-xl shadow-xl rounded-r-xl border-r border-border/50">
                    <div className="absolute inset-0 opacity-20 rounded-r-xl" />
                    <div className="relative h-full">
                        <SidebarContent
                            isExpanded={isExpanded}
                            setIsExpanded={setIsExpanded}
                            onClose={onClose}
                            isMobile={false}
                        />
                    </div>
                </div>
            </motion.aside>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}
        </>
    )
}

export default React.memo(Sidebar)
