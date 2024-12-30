'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from '@/lib/axiosInstance';

interface Product {
    id: string;
    name: string;
}

interface ProductStock {
    productId: string;
    productName: string;
    currentQuantity: number;
    lots: Array<{
        batchNumber: string;
        quantity: number;
        unitCost: number;
        expirationDate: string;
    }>;
}

const stockMovementSchema = z.object({
    quantity: z.number().min(1, "Quantity must be greater than 0"),
    unitCost: z.number().min(0, "Unit cost must be a positive number"),
    reason: z.string().min(1, "Reason is required"),
});

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

const formatTZS = (value: number): string => {
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(value);
};

interface ProductStockManagementProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedProduct: Product | null;
}

const ProductStockManagement: React.FC<ProductStockManagementProps> = ({
                                                                           isOpen,
                                                                           onOpenChange,
                                                                           selectedProduct,
                                                                       }) => {
    const [selectedTab, setSelectedTab] = useState<'add' | 'remove'>('add');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const stockForm = useForm<StockMovementFormData>({
        resolver: zodResolver(stockMovementSchema),
        defaultValues: {
            quantity: 0,
            unitCost: 0,
            reason: '',
        },
    });

    const { data: productStock, refetch: refetchStock } = useQuery<ProductStock>(
        ['product-stock', selectedProduct?.id],
        async () => {
            if (!selectedProduct?.id) return null;
            const response = await axiosInstance.get(`/products/${selectedProduct.id}/stock`);
            return response.data.data;
        },
        {
            enabled: !!selectedProduct?.id,
        }
    );

    const stockMutation = useMutation<void, Error, StockMovementFormData>(
        async (stockData) => {
            if (!selectedProduct?.id) return;
            const endpoint = selectedTab === 'add' ? 'add' : 'remove';
            await axiosInstance.post(
                `/products/${selectedProduct.id}/stock/${endpoint}`,
                stockData
            );
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['product-stock']);
                onOpenChange(false);
                stockForm.reset();
                toast({
                    title: "Stock Updated",
                    description: `Stock has been ${selectedTab === 'add' ? 'added to' : 'removed from'} the product.`,
                });
            },
        }
    );

    const handleStockSubmit = (data: StockMovementFormData) => {
        stockMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[750px] p-6">
                <DialogHeader>
                    <DialogTitle>Manage Stock - {selectedProduct?.name}</DialogTitle>
                </DialogHeader>
                <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'add' | 'remove')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="add">Add Stock</TabsTrigger>
                        <TabsTrigger value="remove">Remove Stock</TabsTrigger>
                    </TabsList>
                    <TabsContent value="add">
                        <Form {...stockForm}>
                            <form onSubmit={stockForm.handleSubmit(handleStockSubmit)} className="space-y-4">
                                <FormField
                                    control={stockForm.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value))
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={stockForm.control}
                                    name="unitCost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Cost</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value))
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={stockForm.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">
                                    Add Stock
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="remove">
                        <Form {...stockForm}>
                            <form onSubmit={stockForm.handleSubmit(handleStockSubmit)} className="space-y-4">
                                <FormField
                                    control={stockForm.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value))
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={stockForm.control}
                                    name="reason"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reason</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" variant="destructive" className="w-full">
                                    Remove Stock
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>

                {/* Current Stock Information */}
                {productStock && (
                    <div className="mt-6 space-y-4">
                        <h3 className="font-semibold">Current Stock Information</h3>
                        <div className="space-y-2">
                            <p>Current Quantity: {productStock.currentQuantity}</p>
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Stock Lots:</h4>
                                <div className="max-h-40 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Batch</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Unit Cost</TableHead>
                                                <TableHead>Expiry</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productStock.lots.map((lot) => (
                                                <TableRow key={lot.batchNumber}>
                                                    <TableCell>{lot.batchNumber}</TableCell>
                                                    <TableCell>{lot.quantity}</TableCell>
                                                    <TableCell>{formatTZS(lot.unitCost)}</TableCell>
                                                    <TableCell>
                                                        {new Date(lot.expirationDate).toLocaleDateString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProductStockManagement;
