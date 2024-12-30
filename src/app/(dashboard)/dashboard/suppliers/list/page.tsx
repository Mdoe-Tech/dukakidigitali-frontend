'use client'
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axiosInstance from '@/lib/axiosInstance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/custom/LoadingSpinner";
import { SearchIcon } from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
}

const SupplierTable: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');

    const { data, isLoading, error } = useQuery(['suppliers', page, pageSize, search], async () => {
        const response = await axiosInstance.get('/suppliers')
        console.log(response.data);
        return response.data.data;
    });

    if (isLoading) return <LoadingSpinner />;
    if (error) return <div>An error occurred: {error instanceof Error ? error.message : 'Unknown error'}</div>;

    const suppliers = data?.content || [];
    const totalPages = data?.totalPages || 1;

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Search suppliers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                />
                <Button onClick={() => setPage(1)}>
                    <SearchIcon className="mr-2 h-4 w-4" /> Search
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {suppliers.map((supplier: Supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell>{supplier.name}</TableCell>
                            <TableCell>{supplier.contactPerson}</TableCell>
                            <TableCell>{supplier.email}</TableCell>
                            <TableCell>{supplier.phone}</TableCell>
                            <TableCell>{supplier.address}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious onClick={() => setPage(page > 1 ? page - 1 : 1)} />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                            <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1}>
                                {i + 1}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext onClick={() => setPage(page < totalPages ? page + 1 : totalPages)} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default SupplierTable;
