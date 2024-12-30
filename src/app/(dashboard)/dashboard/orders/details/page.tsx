import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from '@/lib/axiosInstance';

interface Product {
    id: string;
    name: string;
}

interface OrderItem {
    id: string;
    product: Product;
    quantity: number;
    unitPrice: number;
}

interface Supplier {
    id: string;
    name: string;
}

interface Order {
    id: string;
    orderNumber: string;
    supplier: Supplier;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    expectedDeliveryDate: string;
    items: OrderItem[];
    totalValue: number;
}

interface PurchaseOrderDetailsProps {
    orderId: string;
}

const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({ orderId }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: order, isLoading, error } = useQuery<Order, Error>(['order', orderId], async () => {
        const response = await axiosInstance.get<{ data: Order }>(`/purchase-orders/${orderId}`);
        return response.data.data;
    });

    const updateStatusMutation = useMutation<void, Error, Order['status']>(
        (status) => axiosInstance.patch(`/purchase-orders/${orderId}/status`, { status }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['order', orderId]);
                toast({
                    title: "Status Updated",
                    description: "The order status has been successfully updated.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error updating the order status.",
                    variant: "destructive",
                });
            },
        }
    );

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching purchase order details</div>;
    if (!order) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <h3 className="font-semibold">Order Number</h3>
                        <p>{order.orderNumber}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Supplier</h3>
                        <p>{order.supplier.name}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold">Status</h3>
                        <Select
                            defaultValue={order.status}
                            onValueChange={(value: Order['status']) => updateStatusMutation.mutate(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="ORDERED">Ordered</SelectItem>
                                <SelectItem value="RECEIVED">Received</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <h3 className="font-semibold">Expected Delivery Date</h3>
                        <p>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.product.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell>${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-4 text-right">
                    <h3 className="font-semibold">Total Order Value</h3>
                    <p className="text-xl">${order.totalValue.toFixed(2)}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PurchaseOrderDetails;
