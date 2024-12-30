'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/layouts/SideBar'
import { Menu } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layouts/Header"
import { Body } from "@/components/layouts/Body"
import { UserNav } from "@/components/custom/UserNav"
import ThemeSwitch from "@/components/custom/ThemeSwitch"
import { LayoutContext } from './LayoutContext'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const Navbar: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16 lg:hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mr-2 lg:hidden"
                        onClick={onToggleSidebar}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="text-xl font-semibold">Dukani</span>
                </div>
            </div>
        </nav>
    )
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardLayout({
                                            children,
                                        }: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const divRef = React.useRef<HTMLDivElement>(null)
    const [offset, setOffset] = React.useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    const [fixed] = React.useState(false)
    const { user, loading, isAuthenticated, logout } = useAuth();
    const [greeting, setGreeting] = React.useState(getGreeting())

    React.useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    React.useEffect(() => {
        const div = divRef.current
        if (!div) return

        const onScroll = () => setOffset(div.scrollTop)
        div.addEventListener('scroll', onScroll, { passive: true })
        return () => div.removeEventListener('scroll', onScroll)
    }, [])

    React.useEffect(() => {
        const timer = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <LayoutContext.Provider value={{ offset, fixed, isSidebarOpen, setIsSidebarOpen }}>
            <div className="flex h-screen overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <Header>
                        <div className="w-full flex justify-between items-center">
                            <div className="text-lg font-semibold italic capitalize">
                                {user ? `${greeting}, ${user.name}!` : greeting}
                            </div>
                            <div className="flex items-center space-x-4">
                                <ThemeSwitch/>
                                {user && (
                                    <UserNav
                                        user={user}
                                        onLogout={logout}
                                    />
                                )}
                            </div>
                        </div>
                    </Header>
                    <div
                        ref={divRef}
                        data-layout='layout'
                        className={cn(
                            'flex-1 overflow-auto',
                            fixed && 'flex flex-col'
                        )}
                    >
                        <Body>{children}</Body>
                    </div>
                </div>
            </div>
        </LayoutContext.Provider>
    )
}
