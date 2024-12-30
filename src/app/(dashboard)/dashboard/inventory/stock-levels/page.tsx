'use client'

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axiosInstance from '@/lib/axiosInstance';

interface StockLevel {
    id: number;
    currentStock: number;
    minimumStock: number;
    product: {
        name: string;
    };
}

const stockLevelSchema = z.object({
    currentStock: z.number().min(0, "Current stock must be a non-negative number"),
    minimumStock: z.number().min(0, "Minimum stock must be a non-negative number"),
});

type StockLevelFormData = z.infer<typeof stockLevelSchema>;

const StockLevels: React.FC = () => {
    const [selectedStock, setSelectedStock] = React.useState<StockLevel | null>(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<StockLevelFormData>({
        resolver: zodResolver(stockLevelSchema),
        defaultValues: {
            currentStock: 0,
            minimumStock: 0,
        },
    });

    const { data: stockLevels, isLoading, error } = useQuery<StockLevel[], Error>(['stockLevels'], async () => {
        const response = await axiosInstance.get('/inventory/stock-levels');
        return response.data;
    });

    const updateStockMutation = useMutation<void, Error, Partial<StockLevel>>(
        (stockData) => axiosInstance.put(`/inventory/stock-levels/${stockData.id}`, stockData),
        {
            onSuccess: () => {
                toast({
                    title: "Stock Updated",
                    description: "The stock level has been successfully updated.",
                });
                queryClient.invalidateQueries(['stockLevels']);
                setSelectedStock(null);
                setIsDialogOpen(false);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error updating the stock level. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const handleSubmit = (data: StockLevelFormData) => {
        if (selectedStock) {
            updateStockMutation.mutate({ ...data, id: selectedStock.id });
        }
    };

    const handleUpdateClick = (stock: StockLevel) => {
        setSelectedStock(stock);
        form.reset({
            currentStock: stock.currentStock,
            minimumStock: stock.minimumStock,
        });
        setIsDialogOpen(true);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching stock levels</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>Minimum Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stockLevels?.map((stock) => (
                            <TableRow key={stock.id}>
                                <TableCell>{stock.product.name}</TableCell>
                                <TableCell>{stock.currentStock}</TableCell>
                                <TableCell>{stock.minimumStock}</TableCell>
                                <TableCell>
                                    {stock.currentStock <= stock.minimumStock ? (
                                        <Alert variant="destructive">
                                            <AlertTitle>Low Stock</AlertTitle>
                                            <AlertDescription>Stock level is below the minimum threshold.</AlertDescription>
                                        </Alert>
                                    ) : 'In Stock'}
                                </TableCell>
                                <TableCell>
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button onClick={() => handleUpdateClick(stock)}>Update Stock</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Update Stock Level</DialogTitle>
                                            </DialogHeader>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="currentStock"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Current Stock</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="minimumStock"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Minimum Stock</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} type="number" onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button type="submit">Update Stock</Button>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default StockLevels;
