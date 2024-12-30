// types.ts

import * as z from 'zod';

export interface Customer {
    id: string;
    name: string;
    email: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
}

export interface SaleItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface Sale {
    id: string;
    transactionNumber: string;
    customerId: string;
    customer: Customer;
    items: SaleItem[];
    totalAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    saleDate: string;
}

export interface RecentActivity {
    id: string;
    type: 'SALE' | 'REFUND' | 'INVENTORY';
    description: string;
    timestamp: string;
}

export const saleItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive().int(),
    price: z.number().positive()
});

export const saleSchema = z.object({
    customerId: z.string().uuid(),
    items: z.array(saleItemSchema).min(1)
});

export type PaginatedResponse<T> = {
    data: {
        content: T[];
        total: number;
        hasNext: boolean;
        hasPrevious: boolean;
    }
};

export const formatTZS = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
    }).format(amount);
};

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
