'use client'

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import axiosInstance from '@/lib/axiosInstance';
import {formatTZS} from "@/app/(dashboard)/dashboard/pos/types";

interface PurchaseOrder {
    id: string;
    orderNumber: string;
    supplierName: string;
    totalAmount: number;
    status: string;
    expectedDeliveryDate: string;
}

interface PurchaseOrderResponse {
    content: PurchaseOrder[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

const PurchaseOrderList: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');

    const { data, isLoading, error } = useQuery<PurchaseOrderResponse, Error>(
        ['purchaseOrders', page, pageSize, search, status],
        async () => {
            const response = await axiosInstance.get('/purchase-orders')
            return response.data.data;
        }
    );

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching purchase orders: {error.message}</div>;
    if (!data) return null;

    const totalPages = data.totalPages;

    const renderPaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => setPage(i)} isActive={page === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink onClick={() => setPage(1)} isActive={page === 1}>
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (page > 3) {
                items.push(<PaginationEllipsis key="ellipsis-start" />);
            }

            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => setPage(i)} isActive={page === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            if (page < totalPages - 2) {
                items.push(<PaginationEllipsis key="ellipsis-end" />);
            }

            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink onClick={() => setPage(totalPages)} isActive={page === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex space-x-4 mb-4">
                    <Input
                        placeholder="Search orders..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="ORDERED">Ordered</SelectItem>
                            <SelectItem value="RECEIVED">Received</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expected Delivery</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.content.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.orderNumber}</TableCell>
                                <TableCell>{order.supplierName}</TableCell>
                                <TableCell>{formatTZS(order.totalAmount)}</TableCell>
                                <TableCell>{order.status}</TableCell>
                                <TableCell>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm">View</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setPage((prev) => Math.max(1, prev - 1))} />
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                            <PaginationNext onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardContent>
        </Card>
    );
};

export default PurchaseOrderList;
