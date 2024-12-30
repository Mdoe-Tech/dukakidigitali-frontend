'use client';

import React, {useState, useCallback, useMemo} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {useToast} from "@/hooks/use-toast";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import axiosInstance from '@/lib/axiosInstance';
import {Edit, PackageOpen, DollarSign, Tag, Truck, Box, Loader2, HandCoins} from 'lucide-react';

import ProductStockManagement from '../ProductStockManagement';

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    price: number;
    supplierId: string;
    supplier?: Supplier | null;
    category: string;
    initialQuantity?: number;
    initialUnitCost?: number;
}

interface Supplier {
    id: string;
    name: string;
}

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be a positive number"),
    supplierId: z.string().min(1, "Supplier is required"),
    category: z.string().min(1, "Category is required"),
    initialQuantity: z.number().min(0).optional(),
    initialUnitCost: z.number().min(0).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const formatTZS = (value: number): string => {
    return new Intl.NumberFormat('en-TZ', {style: 'currency', currency: 'TZS'}).format(value);
};

const Products: React.FC = () => {
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const {toast} = useToast();
    const queryClient = useQueryClient();

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            supplierId: '',
            category: '',
            initialQuantity: 0,
            initialUnitCost: 0,
        },
    });

    const {data: products, isLoading: productsLoading, error: productsError} = useQuery<Product[], Error>(
        ['products'],
        async () => {
            const response = await axiosInstance.get('/products');
            return response.data.data.content;
        },
        {
            suspense: false,
            staleTime: 0,
            cacheTime: 5 * 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        }
    );

    const {data: suppliers, isLoading: suppliersLoading, error: suppliersError} = useQuery<Supplier[], Error>(
        ['suppliers'],
        async () => {
            const response = await axiosInstance.get('/suppliers');
            return response.data.data.content;
        },
        {
            suspense: false,
            staleTime: 0,
            cacheTime: 5 * 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: true,
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        }
    );

    const enrichedProducts = useMemo(() => {
        // Ensure both products and suppliers are available
        if (!Array.isArray(products) || !Array.isArray(suppliers)) {
            return [];
        }

        try {
            return products.map(product => ({
                ...product,
                supplier: suppliers.find(supplier => supplier.id === product.supplierId) || null,
            }));
        } catch (error) {
            console.error('Error enriching products:', error);
            return [];
        }
    }, [products, suppliers]);

    const isInitialLoading = productsLoading || suppliersLoading;

    const productMutation = useMutation<void, Error, ProductFormData>(
        async (productData) => {
            if (selectedProduct) {
                await axiosInstance.put(`/products/${selectedProduct.id}`, productData);
            } else {
                await axiosInstance.post('/products', productData);
            }
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['products']);
                setIsDialogOpen(false);
                form.reset();
                toast({
                    title: `Product ${selectedProduct ? 'Updated' : 'Created'} Successfully`,
                    description: `The product has been ${selectedProduct ? 'updated' : 'created'}.`,
                });
            },
        }
    );

    const handleSubmit = useCallback((data: ProductFormData) => {
        productMutation.mutate(data);
    }, [productMutation]);

    const handleEdit = useCallback((product: Product) => {
        setSelectedProduct(product);
        form.reset({
            name: product.name,
            description: product.description,
            price: product.price,
            supplierId: product.supplierId,
            category: product.category,
        });
        setIsDialogOpen(true);
    }, [form]);

    const handleStockManagement = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsStockDialogOpen(true);
    }, []);

    const filteredProducts = useMemo(() => {
        if (!enrichedProducts) return [];
        return enrichedProducts.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [enrichedProducts, search]);

    // Loading state component
    const LoadingState = () => (
        <TableRow>
            <TableCell colSpan={6} className="h-96">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                    <p className="text-muted-foreground">Loading products...</p>
                </div>
            </TableCell>
        </TableRow>
    );

    const ErrorState = ({ error }: { error: Error }) => (
        <TableRow>
            <TableCell colSpan={6} className="h-96">
                <div className="flex flex-col items-center justify-center space-y-4 text-destructive">
                    <p className="font-medium">Error loading products</p>
                    <p className="text-sm">{error.message}</p>
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries(['products'])}
                        className="mt-4"
                    >
                        Retry
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between mb-4">
                        <Input
                            placeholder="Search products"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                            disabled={isInitialLoading}
                        />
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => {
                                        setSelectedProduct(null);
                                        form.reset();
                                    }}
                                    disabled={isInitialLoading}
                                >
                                    Add Product
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="w-full max-w-[750px] p-6">
                                <DialogHeader>
                                    <DialogTitle>
                                        {selectedProduct ? 'Edit Product' : 'Add New Product'}
                                    </DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmit)}
                                          className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="supplierId"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Supplier</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a supplier"/>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {suppliers?.map((supplier:any) => (
                                                                <SelectItem key={supplier.id} value={supplier.id}>
                                                                    {supplier.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="initialQuantity"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Initial Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="initialUnitCost"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Initial Unit Cost</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({field}) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="w-full"/>
                                                    </FormControl>
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="md:col-span-2 flex justify-center">
                                            <Button type="submit">
                                                {selectedProduct ? 'Update' : 'Add'} Product
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-secondary hover:bg-secondary">
                                <TableHead className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <PackageOpen size={16}/>
                                        <span>Name</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <HandCoins size={16}/>
                                        <span>Price</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <Box size={16}/>
                                        <span>Stock</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <Truck size={16}/>
                                        <span>Supplier</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-medium">
                                    <div className="flex items-center space-x-2">
                                        <Tag size={16}/>
                                        <span>Category</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-medium">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isInitialLoading ? (
                                <LoadingState />
                            ) : productsError ? (
                                <ErrorState error={productsError} />
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <p className="text-muted-foreground">No products found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id}
                                              className="hover:bg-secondary/50 transition-colors duration-150">
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{formatTZS(product.price)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleStockManagement(product)}
                                                className="text-primary border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors duration-150"
                                            >
                                                <Box className="mr-2" size={16}/>
                                                Manage Stock
                                            </Button>
                                        </TableCell>
                                        <TableCell>{product.supplier?.name || 'N/A'}</TableCell>
                                        <TableCell><span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{product.category}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button
                                                    onClick={() => handleEdit(product)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-8 w-8 p-0"
                                                >
                                                    <Edit size={16}/>
                                                </Button>
                                                <Button
                                                    onClick={() => handleStockManagement(product)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full h-8 w-8 p-0"
                                                >
                                                    <Box size={16}/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table> </CardContent>
            </Card>

            <ProductStockManagement
                isOpen={isStockDialogOpen}
                onOpenChange={setIsStockDialogOpen}
                selectedProduct={selectedProduct}
            />
        </div>
    );
};

export default Products;
