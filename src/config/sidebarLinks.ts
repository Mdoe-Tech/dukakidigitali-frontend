import {
    Home,
    ShoppingCart,
    Users,
    Package,
    Truck,
    Clipboard,
} from 'lucide-react';
import { SidebarLink } from '@/types/dashboard';

export const sidebarLinks: SidebarLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    {
        label: 'POS',
        href: '/dashboard/pos',
        icon: ShoppingCart,
        subLinks: [
            { label: 'Dashboard', href: '/dashboard/pos/dashboard' },
            { label: 'New Sale', href: '/dashboard/pos/new-sale' },
            { label: 'Sale History', href: '/dashboard/pos/sale-history' },
            { label: 'Report', href: '/dashboard/pos/report' },
        ]
    },
    {
        label: 'Inventory',
        href: '/dashboard/inventory',
        icon: Package,
        subLinks: [
            { label: 'Products', href: '/dashboard/inventory/products' },
            { label: 'Inventory', href: '/dashboard/inventory/inventory' },
        ]
    },
    {
        label: 'Customers',
        href: '/dashboard/customer',
        icon: Users,
        subLinks: [
            { label: 'Customer', href: '/dashboard/customer/new' },
            { label: 'Customer List', href: '/dashboard/customer/list' },
        ]
    },
    {
        label: 'Orders',
        href: '/dashboard/orders',
        icon: Clipboard,
        subLinks: [
            { label: 'Purchase Orders', href: '/dashboard/orders/purchase-orders' },
            { label: 'Orders List', href: '/dashboard/orders/list' },
            { label: 'Orders Dashboard', href: '/dashboard/orders/dashboard' },
        ]
    },
    {
        label: 'Suppliers',
        href: '/dashboard/suppliers',
        icon: Truck,
        subLinks: [
            { label: 'Supplier', href: '/dashboard/suppliers/new' },
            { label: 'Supplier List', href: '/dashboard/suppliers/list' },
        ]
    },
];
