'use client'

import React, {useState, useCallback} from 'react';
import {useQuery} from 'react-query';
import {format} from 'date-fns';
import {ChevronDown, ChevronUp, Download, Filter, RefreshCw} from 'lucide-react';
import {useToast} from "@/hooks/use-toast";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {DatePickerWithRange} from "@/components/DateRangePicker";
import {Badge} from "@/components/ui/badge";
import axiosInstance from "@/lib/axiosInstance";

// Type definitions
interface Sale {
    id: string;
    transactionNumber: string;
    customerName: string;
    customerId: string;
    saleDate: string;
    totalAmount: number;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    items: SaleItem[];
}

interface SaleItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    unitPrice: number;
}

interface Customer {
    id: string;
    name: string;
}

interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

interface FilterState {
    dateRange: { from: Date | null; to: Date | null; };
    status: string;
    customerId: string;
    minAmount: string;
    maxAmount: string;
}

// Utility functions
const formatTZS = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {style: 'currency', currency: 'TZS'}).format(amount);
};

const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>): void => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
};

// Components
interface SaleDetailsProps {
    sale: Sale;
}

const SaleDetails: React.FC<SaleDetailsProps> = ({sale}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Customer Details</h3>
                    <div className="mt-2 space-y-1">
                        <p className="font-medium">{sale.customerName}</p>
                        <p className="text-sm text-gray-600">{sale.customerId}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500">Sale Information</h3>
                    <div className="mt-2 space-y-1">
                        <p className="font-medium">Transaction #{sale.transactionNumber}</p>
                        <p className="text-sm text-gray-600">
                            {format(new Date(sale.saleDate), 'PPP')}
                        </p>
                        <Badge variant={
                            sale.status === 'COMPLETED' ? 'default' :
                                sale.status === 'PENDING' ? 'secondary' : 'destructive'
                        }>
                            {sale.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sale.items.map((item: SaleItem) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.productName}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatTZS(item.unitPrice)}</TableCell>
                                <TableCell className="text-right">
                                    {formatTZS(item.totalPrice)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">
                                Total Amount
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                {formatTZS(sale.totalAmount)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const SalesHistory: React.FC = () => {
    const {toast} = useToast();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<FilterState>({
        dateRange: {from: null, to: null},
        status: 'all',
        customerId: 'all',
        minAmount: '',
        maxAmount: '',
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'saleDate',
        direction: 'desc' as 'asc' | 'desc'
    });

    const getApiParams = () => ({
        page,
        size: pageSize,
        search: searchTerm,
        fromDate: filters.dateRange.from?.toISOString(),
        toDate: filters.dateRange.to?.toISOString(),
        status: filters.status === 'all' ? undefined : filters.status,
        customerId: filters.customerId === 'all' ? undefined : filters.customerId,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
    });

    // Queries
    const {data: salesData, isLoading} = useQuery<PaginatedResponse<Sale>>(
        ['sales-history', page, pageSize, searchTerm, filters, sortConfig],
        async () => {
            const response = await axiosInstance.get('/sales/history', {
                params: getApiParams()
            });
            return response.data;
        }
    );

    const {data: customersData} = useQuery<PaginatedResponse<Customer>>(
        'customers',
        async () => {
            const response = await axiosInstance.get('/customers');
            return response.data.data || [];
        }
    );

    // HandlersF
    const handleSearchDebounced = useCallback(
        debounce((value: string) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleExport = async () => {
        try {
            const response = await axiosInstance.get('/sales/export', {
                responseType: 'blob',
                params: {
                    ...filters,
                    fromDate: filters.dateRange.from?.toISOString(),
                    toDate: filters.dateRange.to?.toISOString(),
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales-history-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to export sales history",
                variant: "destructive"
            });
        }
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>;
    };

    return (
        <Card className="max-w-[1200px] mx-auto">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Sales History</CardTitle>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search transactions..."
                            onChange={(e) => handleSearchDebounced(e.target.value)}
                            className="w-64"
                        />
                        <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                            <Filter className="w-4 h-4 mr-2"/>
                            Filters
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2"/>
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin"/>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('transactionNumber')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Transaction ID
                                                {getSortIcon('transactionNumber')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('customerName')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Customer
                                                {getSortIcon('customerName')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('saleDate')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Date
                                                {getSortIcon('saleDate')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('totalAmount')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Amount
                                                {getSortIcon('totalAmount')}
                                            </div>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesData?.content.map((sale: Sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{sale.transactionNumber}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{sale.customerName}</div>
                                                    <div className="text-sm text-gray-500">{sale.customerId}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(sale.saleDate), 'PPP')}</TableCell>
                                            <TableCell>{formatTZS(sale.totalAmount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    sale.status === 'COMPLETED' ? 'default' :
                                                        sale.status === 'PENDING' ? 'secondary' : 'destructive'
                                                }>
                                                    {sale.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedSale(sale)}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(value) => setPageSize(parseInt(value))}
                                >
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue/>
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
                                    Showing {salesData?.numberOfElements} of {salesData?.totalElements} results
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={salesData?.first}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {salesData ? salesData.number + 1 : 0} of {salesData?.totalPages || 0}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={salesData?.last}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            {/* Filter Sheet */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-4">
                        <DatePickerWithRange
                            className="w-full"
                            date={{
                                from: filters.dateRange.from ?? undefined,
                                to: filters.dateRange.to ?? undefined
                            }}
                            setDate={(newDateRange) =>
                                setFilters(prev => ({
                                    ...prev,
                                    dateRange: {
                                        from: newDateRange?.from ?? null,
                                        to: newDateRange?.to ?? null
                                    }
                                }))
                            }
                        />
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({...filters, status: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.customerId}
                            onValueChange={(value) => setFilters({...filters, customerId: value})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                {customersData?.content?.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            placeholder="Min Amount"
                            type="number"
                            value={filters.minAmount}
                            onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                        />
                        <Input
                            placeholder="Max Amount"
                            type="number"
                            value={filters.maxAmount}
                            onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                        />
                        <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Sale Details Sheet */}
            {selectedSale && (
                <Sheet open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Sale Details</SheetTitle>
                        </SheetHeader>
                        <SaleDetails sale={selectedSale}/>
                    </SheetContent>
                </Sheet>
            )}
        </Card>
    );
};

export default SalesHistory;
