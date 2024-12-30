'use client'

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
    Calendar as CalendarIcon,
    Users,
    Package,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import axiosInstance from "@/lib/axiosInstance";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { formatTZS } from "@/app/(dashboard)/dashboard/pos/types";

// Define types for your data structures
type PurchaseOrder = {
    id: string;
    orderNumber: string;
    supplierName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    totalAmount: number;
    expectedDeliveryDate: string;
};

type StatusTotals = {
    [key: string]: number;
};

const PurchaseOrderDashboard = () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const queryClient = useQueryClient();

    // Fetch purchase orders data
    const { data: purchaseOrders, isLoading: isLoadingOrders, error: ordersError } = useQuery<{ data: { content: PurchaseOrder[] } }, Error>(
        'purchaseOrders',
        () => axiosInstance.get('/purchase-orders').then(res => res.data),
        {
            onError: (error) => {
                console.error('Error fetching purchase orders:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch purchase orders. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    // Fetch status totals
    const { data: statusTotals, isLoading: isLoadingTotals, error: totalsError } = useQuery<{ data: StatusTotals }, Error>(
        'statusTotals',
        () => axiosInstance.get('/purchase-orders/report/total-by-status').then(res => res.data),
        {
            onError: (error) => {
                console.error('Error fetching status totals:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch status totals. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    // Mutation for updating purchase order status
    const updateStatusMutation = useMutation(
        ({ id, newStatus }: { id: string; newStatus: PurchaseOrder['status'] }) =>
            axiosInstance.patch(`/purchase-orders/${id}/status?newStatus=${newStatus}`),
        {
            onSuccess: (data, variables) => {
                console.log('Status updated successfully:', data);
                queryClient.invalidateQueries('purchaseOrders');
                queryClient.invalidateQueries('statusTotals');
                toast({
                    title: "Status Updated",
                    description: `Order status updated to ${variables.newStatus}`,
                });
            },
            onError: (error: Error) => {
                console.error('Error updating status:', error);
                toast({
                    title: "Error",
                    description: `Failed to update status: ${error.message}`,
                    variant: "destructive",
                });
            },
        }
    );

    const getStatusColor = (status: PurchaseOrder['status']) => {
        const colors: { [key in PurchaseOrder['status']]: string } = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            COMPLETED: 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const handleStatusUpdate = (id: string, newStatus: PurchaseOrder['status']) => {
        console.log('Updating status:', id, newStatus);
        updateStatusMutation.mutate({ id, newStatus });
    };

    if (ordersError || totalsError) {
        return <div>Error loading dashboard data. Please try again later.</div>;
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Purchase Orders Dashboard</h1>
                <div className="flex gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                Date Range
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-auto p-0" align="end">
                            <DatePickerWithRange date={dateRange} setDate={setDateRange}/>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                <h3 className="text-2xl font-bold">{isLoadingOrders ? 'Loading...' : purchaseOrders?.data.content.length || 0}</h3>
                            </div>
                            <Package className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                                <h3 className="text-2xl font-bold">
                                    {isLoadingOrders ? 'Loading...' : purchaseOrders?.data.content.filter(po => po.status === 'PENDING').length || 0}
                                </h3>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
                                <h3 className="text-2xl font-bold">
                                    {isLoadingOrders ? 'Loading...' : new Set(purchaseOrders?.data.content.map(po => po.supplierName)).size || 0}
                                </h3>
                            </div>
                            <Users className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Orders by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {isLoadingTotals ? (
                                <p>Loading chart data...</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(statusTotals?.data || {}).map(([status, total]) => ({
                                        status,
                                        total: parseFloat(total.toString())
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="status" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left p-4">Order Number</th>
                                <th className="text-left p-4">Supplier</th>
                                <th className="text-left p-4">Status</th>
                                <th className="text-left p-4">Total Amount</th>
                                <th className="text-left p-4">Expected Delivery</th>
                            </tr>
                            </thead>
                            <tbody>
                            {isLoadingOrders ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-4">Loading orders...</td>
                                </tr>
                            ) : (
                                purchaseOrders?.data.content.slice(0, 5).map((order) => (
                                    <tr key={order.id} className="border-b">
                                        <td className="p-4">{order.orderNumber}</td>
                                        <td className="p-4">{order.supplierName}</td>
                                        <td className="p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className={`flex items-center gap-2 ${getStatusColor(order.status)}`}
                                                    >
                                                        {order.status}
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].map((status) => (
                                                        <DropdownMenuItem
                                                            key={status}
                                                            onClick={() => handleStatusUpdate(order.id, status as PurchaseOrder['status'])}
                                                        >
                                                            {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="p-4">{formatTZS(order.totalAmount)}</td>
                                        <td className="p-4">{format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PurchaseOrderDashboard;
