'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Plus, RefreshCw, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from "@/lib/axiosInstance";
import {
    Sale,
    Customer,
    Product,
    SaleItem,
    saleSchema,
    formatTZS,
    debounce,
    PaginatedResponse
} from '../types';
import { z } from "zod";

type SaleFormValues = z.infer<typeof saleSchema>;

const SalesTable: React.FC = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);

    const saleForm = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            customerId: '',
            items: [{ productId: '', quantity: 1, price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: saleForm.control,
        name: "items"
    });

    // Queries
    const { data: salesData, isLoading: isSalesLoading } = useQuery<PaginatedResponse<Sale>>(
        ['sales', page, pageSize, searchTerm],
        async () => {
            const response = await axiosInstance.get<PaginatedResponse<Sale>>('/sales', {
                params: {
                    page,
                    size: pageSize,
                    search: searchTerm
                }
            });
            return response.data;
        }
    );

    const { data: customersData } = useQuery<PaginatedResponse<Customer>>(
        'customers',
        async () => {
            const response = await axiosInstance.get<PaginatedResponse<Customer>>('/customers');
            return response.data;
        }
    );

    const { data: productsData } = useQuery<PaginatedResponse<Product>>(
        'products',
        async () => {
            const response = await axiosInstance.get<PaginatedResponse<Product>>('/products');
            return response.data;
        }
    );

    const createSaleMutation = useMutation<Sale, Error, SaleFormValues>(
        async (data: SaleFormValues) => {
            const response = await axiosInstance.post<Sale>('/sales', data);
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('sales');
                setIsNewSaleDialogOpen(false);
                saleForm.reset();
                toast({
                    title: "Success",
                    description: "Sale created successfully",
                    variant: "default"
                });
            },
            onError: (error: Error) => {
                toast({
                    title: "Error",
                    description: error.message || "Failed to create sale",
                    variant: "destructive"
                });
            }
        }
    );

    const deleteSaleMutation = useMutation<void, Error, string>(
        async (id) => {
            await axiosInstance.delete(`/sales/${id}`);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('sales');
                toast({
                    title: "Success",
                    description: "Sale deleted successfully"
                });
            },
            onError: (error) => {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete sale",
                    variant: "destructive"
                });
            }
        }
    );

    // Event Handlers
    const handleSearchDebounced = useCallback(
        debounce((value: string) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    const handleCreateSale = async (data: SaleFormValues) => {
        await createSaleMutation.mutateAsync(data);
    };

    const handleDeleteSale = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            await deleteSaleMutation.mutateAsync(id);
        }
    };

    // Helper function to find product price
    const getProductPrice = (productId: string): number => {
        const product = productsData?.data.content.find((p: { id: string; }) => p.id === productId);
        return product?.price || 0;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Sales List</span>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search sales..."
                                onChange={(e) => handleSearchDebounced(e.target.value)}
                                className="w-64"
                            />
                            <Button onClick={() => setIsNewSaleDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Sale
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isSalesLoading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesData?.data.content.map((sale: any) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.transactionNumber}</TableCell>
                                        <TableCell>{sale.customerId}</TableCell>
                                        <TableCell>{format(new Date(sale.saleDate), 'PPP')}</TableCell>
                                        <TableCell>{formatTZS(sale.totalAmount)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                                {sale.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {/* Handle edit */}}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteSale(sale.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => setPageSize(parseInt(value))}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 50].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-600">
                                Showing {salesData?.data.content.length} of {salesData?.data.total} results
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={!salesData?.data.hasPrevious}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm">
                                Page {page + 1} of {Math.ceil((salesData?.data.total || 0) / pageSize)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={!salesData?.data.hasNext}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Sale</DialogTitle>
                    </DialogHeader>
                    <Form {...saleForm}>
                        <form onSubmit={saleForm.handleSubmit(handleCreateSale)} className="space-y-4">
                            <FormField
                                control={saleForm.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customersData?.data.content.map((customer: any) => (
                                                        <SelectItem key={customer.id} value={customer.id}>
                                                            {customer.name} ({customer.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {fields.map((field, index) => (
                                <div key={field.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">Item {index + 1}</h4>
                                        {index > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <FormField
                                        control={saleForm.control}
                                        name={`items.${index}.productId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            // Update price when product changes
                                                            saleForm.setValue(
                                                                `items.${index}.price`,
                                                                getProductPrice(value)
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {productsData?.data.content.map((product: any) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    {product.name} - {formatTZS(product.price)} ({product.stock} in stock)
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={saleForm.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(e) => {
                                                            const value = Math.max(1, parseInt(e.target.value));
                                                            field.onChange(value);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={saleForm.control}
                                        name={`items.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        disabled
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ productId: '', quantity: 1, price: 0 })}
                            >
                                Add Item
                            </Button>

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm">
                                    Total Items: {fields.length}
                                </div>
                                <div className="text-lg font-semibold">
                                    Total: {formatTZS(
                                    fields.reduce((sum, _, index) => {
                                        const quantity = saleForm.watch(`items.${index}.quantity`) || 0;
                                        const price = saleForm.watch(`items.${index}.price`) || 0;
                                        return sum + (quantity * price);
                                    }, 0)
                                )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsNewSaleDialogOpen(false);
                                        saleForm.reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createSaleMutation.isLoading || fields.length === 0}
                                >
                                    {createSaleMutation.isLoading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Sale'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SalesTable;
