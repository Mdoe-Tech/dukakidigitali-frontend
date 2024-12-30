'use client'

import React from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil, Eye, UserPlus, Mail, Phone, MapPin, Star, Building } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { Badge } from "@/components/ui/badge";

interface Supplier {
    id: number;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    performanceRating: number;
}

const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const queryClient = new QueryClient();

const Suppliers: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
    const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
    const { toast } = useToast();

    const form = useForm<SupplierFormData>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
        },
    });

    const { data: suppliers, isLoading } = useQuery<Supplier[]>('suppliers',
        async () => {
            const response = await axiosInstance.get('/suppliers');
            return response.data.data.content;
        },
        {
            refetchOnWindowFocus: false,
        }
    );

    const supplierMutation = useMutation(
        (supplierData: SupplierFormData) =>
            selectedSupplier
                ? axiosInstance.put(`/suppliers/${selectedSupplier.id}`, supplierData)
                : axiosInstance.post('/suppliers', supplierData),
        {
            onSuccess: () => {
                toast({
                    title: selectedSupplier ? "Supplier Updated" : "Supplier Added",
                    description: `The supplier has been successfully ${selectedSupplier ? 'updated' : 'added'}.`,
                });
                queryClient.invalidateQueries('suppliers');
                setSelectedSupplier(null);
                setIsDialogOpen(false);
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

    const onSubmit = (data: SupplierFormData) => {
        supplierMutation.mutate(data);
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'bg-green-500';
        if (rating >= 3) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    React.useEffect(() => {
        if (selectedSupplier) {
            form.reset({
                name: selectedSupplier.name,
                contactPerson: selectedSupplier.contactPerson,
                email: selectedSupplier.email,
                phone: selectedSupplier.phone,
                address: selectedSupplier.address,
            });
        } else {
            form.reset();
        }
    }, [selectedSupplier, form]);

    if (isLoading) return (
        <Card className="w-full h-96 flex items-center justify-center">
            <CardContent>Loading suppliers...</CardContent>
        </Card>
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold">Suppliers Management</CardTitle>
                        <CardDescription>Manage your company's suppliers and their information</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-primary"
                                onClick={() => setSelectedSupplier(null)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add New Supplier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
                                <DialogDescription>
                                    {selectedSupplier
                                        ? 'Update the supplier information in the form below'
                                        : 'Fill in the supplier information in the form below'}
                                </DialogDescription>
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
                                    <Button
                                        type="submit"
                                        className="w-full bg-primary"
                                    >
                                        {selectedSupplier ? 'Update' : 'Add'} Supplier
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold">Company</TableHead>
                                <TableHead className="font-semibold">Contact Details</TableHead>
                                <TableHead className="font-semibold">Performance</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers?.map((supplier) => (
                                <TableRow key={supplier.id} className="hover:bg-slate-50">
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Building className="w-5 h-5 text-slate-500" />
                                            <div>
                                                <div className="font-medium">{supplier.name}</div>
                                                <div className="text-sm text-slate-500">{supplier.contactPerson}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm">
                                                <Mail className="w-4 h-4 mr-2 text-slate-500" />
                                                {supplier.email}
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Phone className="w-4 h-4 mr-2 text-slate-500" />
                                                {supplier.phone}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${getRatingColor(supplier.performanceRating)} text-white`}
                                        >
                                            <Star className="w-3 h-3 mr-1 inline" />
                                            {supplier.performanceRating}/5
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedSupplier(supplier);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedSupplier(supplier)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Supplier Details</DialogTitle>
                                                    </DialogHeader>
                                                    {selectedSupplier && (
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <h3 className="font-medium">Company Information</h3>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-slate-500">Company Name</span>
                                                                        <p>{selectedSupplier.name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-500">Contact Person</span>
                                                                        <p>{selectedSupplier.contactPerson}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="font-medium">Contact Details</h3>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-slate-500">Email</span>
                                                                        <p>{selectedSupplier.email}</p>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-slate-500">Phone</span>
                                                                        <p>{selectedSupplier.phone}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="font-medium">Address</h3>
                                                                <p className="text-sm">{selectedSupplier.address || 'No address provided'}</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <h3 className="font-medium">Performance</h3>
                                                                <Badge
                                                                    className={`${getRatingColor(selectedSupplier.performanceRating)} text-white`}
                                                                >
                                                                    <Star className="w-3 h-3 mr-1 inline" />
                                                                    {selectedSupplier.performanceRating}/5
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default function SupplierWrapper() {
    return (
        <QueryClientProvider client={queryClient}>
            <Suppliers />
        </QueryClientProvider>
    );
}
