'use client'

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axiosInstance from '@/lib/axiosInstance';

const supplierSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    contactPerson: z.string().min(1, "Contact person is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().optional(),
    performanceRating: z.number().min(0).max(5).optional(),
});

type Supplier = z.infer<typeof supplierSchema>;

const Suppliers: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);

    const form = useForm<Supplier>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
        },
    });

    const { data: suppliers, isLoading, error } = useQuery<Supplier[]>('suppliers', async () => {
        const response = await axiosInstance.get('/suppliers');
        return response.data;
    });

    const supplierMutation = useMutation(
        (supplierData: Partial<Supplier>) =>
            supplierData.id
                ? axiosInstance.put(`/suppliers/${supplierData.id}`, supplierData)
                : axiosInstance.post('/suppliers', supplierData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('suppliers');
                toast({
                    title: selectedSupplier ? "Supplier Updated" : "Supplier Added",
                    description: `The supplier has been successfully ${selectedSupplier ? 'updated' : 'added'}.`,
                });
                setIsDialogOpen(false);
                setSelectedSupplier(null);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedSupplier ? 'updating' : 'adding'} the supplier. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<Supplier> = (data) => {
        supplierMutation.mutate(data);
    };

    React.useEffect(() => {
        if (selectedSupplier) {
            form.reset(selectedSupplier);
        }
    }, [selectedSupplier, form]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching suppliers</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4" onClick={() => setSelectedSupplier(null)}>Add New Supplier</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{selectedSupplier ? 'Update' : 'Add'} Supplier</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers?.map((supplier) => (
                            <TableRow key={supplier.id}>
                                <TableCell>{supplier.name}</TableCell>
                                <TableCell>{supplier.contactPerson}</TableCell>
                                <TableCell>{supplier.email}</TableCell>
                                <TableCell>{supplier.phone}</TableCell>
                                <TableCell>{supplier.performanceRating}/5</TableCell>
                                <TableCell>
                                    <Button onClick={() => {
                                        setSelectedSupplier(supplier);
                                        setIsDialogOpen(true);
                                    }} className="mr-2">Edit</Button>
                                    <Button variant="outline" onClick={() => {
                                    }}>View Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Suppliers;
