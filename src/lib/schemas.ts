'use client'

import * as z from "zod";

export const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    category: z.string().min(1, "Category is required"),
    price: z.number().min(0, "Price must be non-negative"),
    description: z.string().optional(),
});

export const inventoryItemSchema = z.object({
    id: z.string().optional(),
    productId: z.string().uuid(),
    quantity: z.number().int().min(0),
    location: z.string().min(1, "Location is required"),
});

export const supplierSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const purchaseOrderSchema = z.object({
    id: z.string().optional(),
    supplierId: z.string().uuid(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
    })),
    expectedDeliveryDate: z.date(),
});

export const saleSchema = z.object({
    id: z.string().optional(),
    customerId: z.string().uuid().optional(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
    })),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;
export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
export type SaleFormValues = z.infer<typeof saleSchema>;
