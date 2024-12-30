import { LucideIcon } from 'lucide-react';

export interface SidebarLink {
    label: string;
    href: string;
    icon: LucideIcon;
    subLinks?: SubLink[];
}

export interface SubLink {
    label: string;
    href: string;
}
