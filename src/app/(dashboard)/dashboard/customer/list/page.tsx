'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Search,
    Users,
    User,
    Mail,
    Phone,
    MapPin,
    Eye,
    Loader2,
    AlertCircle,
    X
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import axiosInstance from '@/lib/axiosInstance'

interface Customer {
    id: string
    name: string
    email: string
    phoneNumber: string
    address: string
}

interface CustomerListResponse {
    content: Customer[]
    total: number
}

// If you don't have a useDebounce hook, here's the implementation
function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export default function CustomerList() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const debouncedSearch = useDebounce(search, 500)

    const { data, isLoading, error } = useQuery<CustomerListResponse>(
        ['customers', page, debouncedSearch],
        async () => {
            const params = new URLSearchParams({
                page: String(page - 1), // Assuming backend uses 0-based indexing
                size: '10',
                ...(debouncedSearch && { search: debouncedSearch })
            })
            const response = await axiosInstance.get(`/customers?${params.toString()}`)
            return response.data.data
        },
        {
            keepPreviousData: true
        }
    )

    // Reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const totalPages = Math.ceil((data?.total || 0) / 10)

    const displayedCustomers = useMemo(() => {
        return data?.content || []
    }, [data?.content])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading customers...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to fetch customers. Please try again later.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <Card className="shadow-md">
            <CardHeader className="border-b border-border/10">
                <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">Customer List</CardTitle>
                        <CardDescription>Manage and view your customers</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="flex justify-between mb-6">
                    <div className="relative max-w-sm flex-1 mr-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9 bg-background"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="font-semibold">
                                    <div className="flex items-center space-x-2">
                                        <User size={16} className="text-primary" />
                                        <span>Name</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <div className="flex items-center space-x-2">
                                        <Mail size={16} className="text-primary" />
                                        <span>Email</span>
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold">
                                    <div className="flex items-center space-x-2">
                                        <Phone size={16} className="text-primary" />
                                        <span>Phone</span>
                                    </div>
                                </TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Search className="h-8 w-8 mb-2" />
                                            <p>No customers found</p>
                                            {search && (
                                                <p className="text-sm">
                                                    Try adjusting your search term
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedCustomers.map((customer) => (
                                    <TableRow
                                        key={customer.id}
                                        className="hover:bg-muted/50 transition-colors"
                                    >
                                        <TableCell className="font-medium">{customer.name}</TableCell>
                                        <TableCell>{customer.email}</TableCell>
                                        <TableCell>{customer.phoneNumber}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="hover:bg-primary/10 hover:text-primary"
                                                        onClick={() => setSelectedCustomer(customer)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center space-x-2">
                                                            <User className="h-5 w-5 text-primary" />
                                                            <span>Customer Details</span>
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center space-x-3 text-sm">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-muted-foreground">Name</p>
                                                                <p className="font-medium">{selectedCustomer?.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-sm">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-muted-foreground">Email</p>
                                                                <p className="font-medium">{selectedCustomer?.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-sm">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-muted-foreground">Phone</p>
                                                                <p className="font-medium">{selectedCustomer?.phoneNumber}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-3 text-sm">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-muted-foreground">Address</p>
                                                                <p className="font-medium">{selectedCustomer?.address}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {displayedCustomers.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            isActive={page === index + 1}
                                            onClick={() => setPage(index + 1)}
                                            className={page === index + 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                        className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
