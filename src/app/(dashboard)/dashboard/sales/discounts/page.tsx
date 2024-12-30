'use client'

import React from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from 'react-query';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import  axiosInstance from '@/lib/axiosInstance';

interface Discount {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    startDate: string;
    endDate: string;
    usageCount: number;
}

const discountSchema = z.object({
    code: z.string().min(1, "Code is required"),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().min(0, "Value must be non-negative"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

type DiscountFormValues = z.infer<typeof discountSchema>;

const Discounts: React.FC = () => {
    const [selectedDiscount, setSelectedDiscount] = React.useState<Discount | null>(null);
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const form = useForm<DiscountFormValues>({
        resolver: zodResolver(discountSchema),
        defaultValues: {
            code: "",
            type: "percentage",
            value: 0,
            startDate: "",
            endDate: "",
        },
    });

    const { data: discounts, isLoading, error, refetch } = useQuery<Discount[]>('discounts', async () => {
        const response = await axiosInstance.get('/discounts');
        return response.data;
    });

    const discountMutation = useMutation(
        (discountData: DiscountFormValues) =>
            selectedDiscount
                ? axiosInstance.put(`/discounts/${selectedDiscount.id}`, discountData)
                : axiosInstance.post('/discounts', discountData),
        {
            onSuccess: () => {
                toast({
                    title: selectedDiscount ? "Discount Updated" : "Discount Created",
                    description: `The discount has been successfully ${selectedDiscount ? 'updated' : 'created'}.`,
                });
                refetch();
                setSelectedDiscount(null);
                setIsDialogOpen(false);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedDiscount ? 'updating' : 'creating'} the discount. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<DiscountFormValues> = (data) => {
        discountMutation.mutate(data);
    };

    const handleEdit = (discount: Discount) => {
        setSelectedDiscount(discount);
        form.reset({
            code: discount.code,
            type: discount.type,
            value: discount.value,
            startDate: discount.startDate,
            endDate: discount.endDate,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/discounts/${id}`);
            toast({
                title: "Discount Deleted",
                description: "The discount has been successfully deleted.",
            });
            refetch();
        } catch (error) {
            toast({
                title: "Error",
                description: "There was an error deleting the discount. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching discounts</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Discounts</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4" onClick={() => {
                            setSelectedDiscount(null);
                            form.reset();
                        }}>Create New Discount</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedDiscount ? 'Edit Discount' : 'Create New Discount'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Code</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select discount type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Value</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>End Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{selectedDiscount ? 'Update' : 'Create'} Discount</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Usage Count</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {discounts?.map((discount) => (
                            <TableRow key={discount.id}>
                                <TableCell>{discount.code}</TableCell>
                                <TableCell>{discount.type}</TableCell>
                                <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}</TableCell>
                                <TableCell>{new Date(discount.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(discount.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>{discount.usageCount}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleEdit(discount)} className="mr-2">Edit</Button>
                                    <Button variant="destructive" onClick={() => handleDelete(discount.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Discounts;
