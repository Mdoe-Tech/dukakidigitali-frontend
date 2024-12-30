'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '../ui/dropdown-menu'
import { Button } from "@/components/custom/Button"
import { User, Settings, Lock, LogOut, Shield } from 'lucide-react'

interface AuthUser {
    id: number;
    name: string;
    email: string;
    imageUrl: string | null;
    role: string;
    phoneNumber: string | null;
    authorities: Array<{ authority: string }>;
    enabled: boolean;
}

interface UserNavProps {
    user: AuthUser;
    onLogout: () => Promise<void>;
}

export function UserNav({ user, onLogout }: UserNavProps) {
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault()
        try {
            setIsLoggingOut(true)
            await onLogout()
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const isAdmin = user.authorities.some(auth => auth.authority === 'ADMIN')

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full bg-primary p-0 hover:bg-primary/90"
                    disabled={isLoggingOut}
                >
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary-foreground">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-primary text-primary-foreground"
                align="end"
                forceMount
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-primary-foreground/70">{user.email}</p>
                        {user.phoneNumber && (
                            <p className="text-xs leading-none text-primary-foreground/70">{user.phoneNumber}</p>
                        )}
                        {isAdmin && (
                            <div className="flex items-center mt-1">
                                <Shield className="h-3 w-3 text-yellow-400 mr-1" />
                                <span className="text-xs text-yellow-400">Administrator</span>
                            </div>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-primary-foreground/20" />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="hover:bg-primary-foreground/10 focus:bg-primary-foreground/20">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-primary-foreground/10 focus:bg-primary-foreground/20">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-primary-foreground/10 focus:bg-primary-foreground/20">
                        <Lock className="mr-2 h-4 w-4" />
                        <span>Change Password</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-primary-foreground/20" />

                <DropdownMenuItem
                    className="hover:bg-primary-foreground/10 focus:bg-primary-foreground/20"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
