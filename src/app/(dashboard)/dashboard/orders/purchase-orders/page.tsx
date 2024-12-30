'use client'

import React from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from '@/lib/axiosInstance';

interface Supplier {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
}

interface PurchaseOrderItem {
    product: Product;
    quantity: number;
}

interface PurchaseOrder {
    id: string;
    supplier: Supplier;
    expectedDeliveryDate: string;
    items: PurchaseOrderItem[];
}

const purchaseOrderSchema = z.object({
    supplierName: z.string().min(1, "Supplier is required"),
    expectedDeliveryDate: z.string().min(1, "Expected delivery date is required"),
    expectedDeliveryTime: z.string().min(1, "Expected delivery time is required"),
    items: z.array(z.object({
        productId: z.string().min(1, "Product is required"),
        unitPrice:z.number().min(1, "Quantity must be at least 100"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
    })).min(1, "At least one item is required"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
    orderId?: string;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ orderId }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderSchema),
        defaultValues: {
            supplierName: '',
            expectedDeliveryDate: '',
            expectedDeliveryTime: '00:00',
            items: [{ productId: '', unitPrice:100, quantity: 1 }],
        },
    });


    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const { data: suppliers, isLoading: isSuppliersLoading, error: suppliersError } = useQuery<Supplier[]>(
        'suppliers',
        async () => {
            const response = await axiosInstance.get('/suppliers');
            console.log("Suppliers API response:", response.data);
            if (!response.data.data || !Array.isArray(response.data.data.content)) {
                throw new Error('Invalid suppliers data structure');
            }
            return response.data.data.content;
        },
        {
            retry: 3,
            onError: (error) => {
                console.error("Error fetching suppliers:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch suppliers. Please try again later.",
                    variant: "destructive",
                });
            }
        }
    );

    const { data: products, isLoading: isProductsLoading, error: productsError } = useQuery<Product[]>(
        'products',
        async () => {
            const response = await axiosInstance.get('/products');
            console.log("Products API response:", response.data);
            if (!response.data.data || !Array.isArray(response.data.data.content)) {
                throw new Error('Invalid products data structure');
            }
            return response.data.data.content;
        },
        {
            retry: 3,
            onError: (error) => {
                console.error("Error fetching products:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch products. Please try again later.",
                    variant: "destructive",
                });
            }
        }
    );

    const { data: order, isLoading: isOrderLoading } = useQuery<PurchaseOrder | null>(
        ['order', orderId],
        async () => {
            if (!orderId) return null;
            const response = await axiosInstance.get(`/purchase-orders/${orderId}`);
            return response.data.data;
        },
        {
            enabled: !!orderId,
            onSuccess: (data) => {
                if (data) {
                    // Split the datetime into date and time
                    const dateTime = new Date(data.expectedDeliveryDate);
                    const date = dateTime.toISOString().split('T')[0];
                    const time = dateTime.toTimeString().slice(0, 5);

                    form.reset({
                        supplierName: data.supplier.id,
                        expectedDeliveryDate: date,
                        expectedDeliveryTime: time,
                        items: data.items.map(item => ({
                            productId: item.product.id,
                            quantity: item.quantity,
                        })),
                    });
                }
            },
        }
    );

    const mutation = useMutation<void, unknown, PurchaseOrderFormValues>(
        (data) => {
            const combinedDateTime = `${data.expectedDeliveryDate}T${data.expectedDeliveryTime}:00`;
            const formattedData = {
                ...data,
                expectedDeliveryDate: combinedDateTime,
            };
            console.log(formattedData)
            delete (formattedData as any).expectedDeliveryTime;

            return orderId
                ? axiosInstance.put(`/purchase-orders/${orderId}`, formattedData)
                : axiosInstance.post('/purchase-orders', formattedData);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('purchaseOrders');
                toast({
                    title: orderId ? "Order Updated" : "Order Created",
                    description: `The purchase order has been successfully ${orderId ? 'updated' : 'created'}.`,
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${orderId ? 'updating' : 'creating'} the purchase order.`,
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<PurchaseOrderFormValues> = (data) => {
        mutation.mutate(data);
    };

    if (isOrderLoading || isSuppliersLoading || isProductsLoading) {
        return <p>Loading...</p>;
    }

    if (suppliersError || productsError) {
        return <p>Error loading data. Please refresh the page.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{orderId ? 'Edit Purchase Order' : 'Create Purchase Order'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="supplierName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a supplier" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {suppliers && suppliers.length > 0 ? (
                                                suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.name}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-suppliers" disabled>
                                                    No suppliers available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="expectedDeliveryDate"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Expected Delivery Date</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="expectedDeliveryTime"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Expected Delivery Time</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="time" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex space-x-4">
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>Product</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products && products.length > 0 ? (
                                                        products.map((product) => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-products" disabled>
                                                            No products available
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Price</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" onClick={() => remove(index)} className="mt-8">Remove</Button>
                            </div>
                        ))}
                        <div className="flex space-x-4">
                            <Button type="button" onClick={() => append({productId: '', unitPrice:100,quantity: 1})}>Add Item</Button>
                            <Button type="submit">{orderId ? 'Update' : 'Create'} Order</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default PurchaseOrderForm;
