'use client'

import React, {useState} from 'react';
import {useQuery} from 'react-query';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
    Package, TrendingUp, AlertTriangle, DollarSign, CalendarIcon, Download
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import axiosInstance from '@/lib/axiosInstance';
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {DatePickerWithRange} from "@/components/DateRangePicker";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DateRange} from "react-day-picker";
import {addDays} from "date-fns";

// Define interfaces for API responses
interface APIResponse<T> {
    apiVersion: string;
    data: T;
    errors: null | any;
    message: string;
    metadata: {
        request_id: string;
    };
    method: string;
    path: string;
    status: string;
    timestamp: string;
    userId: string;
}

interface InventoryItem {
    createdAt: string;
    id: string;
    location: string;
    name: string;
    productId: string;
    quantity: number;
    updatedAt: string;
}

interface InventoryData {
    content: InventoryItem[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: {
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        unpaged: boolean;
    };
    size: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    totalElements: number;
    totalPages: number;
}

interface SalesTrendItem {
    month: string;
    product_name: string;
    total_quantity: number;
}

interface ABCAnalysis {
    [productName: string]: string;
}

interface StockMovement {
    createdAt: string;
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
    type: 'INFLOW' | 'OUTFLOW';
    unitCost: number;
}

interface StockMovementsData {
    content: StockMovement[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: {
        offset: number;
        pageNumber: number;
        pageSize: number;
        paged: boolean;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        unpaged: boolean;
    };
    size: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    totalElements: number;
    totalPages: number;
}

const InventoryDashboard: React.FC = () => {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [movementType, setMovementType] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
    const [currentPage, setCurrentPage] = useState<number>(0);

    const {data: inventoryResponse} = useQuery<APIResponse<InventoryData>>('inventory', async () => {
        const response = await axiosInstance.get('/inventory');
        return response.data;
    });

    const {data: lowStockResponse} = useQuery<APIResponse<InventoryItem[]>>('lowStock', async () => {
        const response = await axiosInstance.get('/inventory/low-stock');
        return response.data;
    });

    const {data: salesTrendResponse} = useQuery<APIResponse<SalesTrendItem[]>>('salesTrend', async () => {
        const response = await axiosInstance.get('/inventory/reports/sales-trend');
        return response.data;
    });

    const {data: abcAnalysisResponse} = useQuery<APIResponse<ABCAnalysis>>('abcAnalysis', async () => {
        const response = await axiosInstance.get('/inventory/reports/abc-analysis');
        return response.data;
    });

    const {
        data: stockMovementsResponse,
        isLoading: isLoadingStockMovements
    } = useQuery<any>(
        ['stockMovements', movementType, dateRange, currentPage],
        async () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                size: '10',
                sort: 'createdAt,desc'
            });
            if (movementType !== "ALL") params.append('type', movementType);
            if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

            const response = await axiosInstance.get(`/stock-movements?${params}`);
            return response.data;
        }
    );

    const transformedABCData = abcAnalysisResponse?.data
        ? Object.entries(abcAnalysisResponse.data).map(([name, category]) => ({
            name,
            value: category === 'A' ? 3 : category === 'B' ? 2 : 1
        }))
        : [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode): React.ReactNode => (
        <Card>
            <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );

    const transformedSalesTrend = salesTrendResponse?.data.map(item => ({
        date: new Date(item.month).toLocaleDateString('en-US', {month: 'short'}),
        sales: item.total_quantity
    })) || [];

    const totalQuantity = inventoryResponse?.data.content.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const totalSales = transformedSalesTrend.reduce((sum, item) => sum + item.sales, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
                <div className="flex gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                Date Range
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DatePickerWithRange date={dateRange} setDate={setDateRange}/>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button>
                        <Download className="mr-2 h-4 w-4"/>
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderMetricCard(
                    "Total Products",
                    inventoryResponse?.data.content.length || 0,
                    <Package className="h-6 w-6 text-primary"/>
                )}
                {renderMetricCard(
                    "Low Stock Items",
                    lowStockResponse?.data.length || 0,
                    <AlertTriangle className="h-6 w-6 text-primary"/>
                )}
                {renderMetricCard(
                    "Total Quantity",
                    totalQuantity,
                    <TrendingUp className="h-6 w-6 text-primary"/>
                )}
                {renderMetricCard(
                    "Total Sales",
                    totalSales,
                    <DollarSign className="h-6 w-6 text-primary"/>
                )}
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="movements">Stock Movements</TabsTrigger>
                    <TabsTrigger value="analysis">ABC Analysis</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Sales Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Trend</CardTitle>
                                <CardDescription>Monthly sales quantity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={transformedSalesTrend}>
                                        <CartesianGrid strokeDasharray="3 3"/>
                                        <XAxis dataKey="date"/>
                                        <YAxis/>
                                        <Tooltip/>
                                        <Line type="monotone" dataKey="sales" stroke="#8884d8"/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Low Stock Alert */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Low Stock Alert</CardTitle>
                                <CardDescription>Items below threshold</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {lowStockResponse?.data.slice(0, 5).map((item) => (
                                        <div key={item.id}
                                             className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-gray-500">Location: {item.location}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-red-500">{item.quantity} units</p>
                                                <p className="text-sm text-gray-500">Reorder needed</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Inventory</CardTitle>
                            <CardDescription>All products and their quantities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventoryResponse?.data.content.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{item.location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stock Movements Tab */}
                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Movements</CardTitle>
                            <CardDescription>Recent stock movements with filtering options</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <Select value={movementType}
                                        onValueChange={(value: 'ALL' | 'INFLOW' | 'OUTFLOW') => setMovementType(value)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Movement Type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Types</SelectItem>
                                        <SelectItem value="INFLOW">Inflow</SelectItem>
                                        <SelectItem value="OUTFLOW">Outflow</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStockMovements ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : (
                                        stockMovementsResponse?.content.map((movement: any) => (
                                            <TableRow key={movement.id}>
                                                <TableCell>{movement.productName}</TableCell>
                                                <TableCell>{movement.quantity}</TableCell>
                                                <TableCell>{movement.type}</TableCell>
                                                <TableCell>{movement.reason}</TableCell>
                                                <TableCell>{new Date(movement.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex justify-between items-center mt-4">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <span>Page {currentPage + 1} of {stockMovementsResponse?.totalPages}</span>
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min((stockMovementsResponse?.totalPages || 1) - 1, prev + 1))}
                                    disabled={currentPage === (stockMovementsResponse?.totalPages || 1) - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABC Analysis Tab */}
                <TabsContent value="analysis">
                    <Card>
                        <CardHeader>
                            <CardTitle>ABC Analysis</CardTitle>
                            <CardDescription>Inventory categorization</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={transformedABCData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {transformedABCData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 flex justify-center">
                                {['A', 'B', 'C'].map((category, index) => (
                                    <div key={category} className="flex items-center mx-4">
                                        <div className="w-4 h-4 mr-2" style={{backgroundColor: COLORS[index]}}></div>
                                        <span>Category {category}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8">
                                <h4 className="text-lg font-semibold mb-4">Category Breakdown</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Percentage of Items</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>A</TableCell>
                                            <TableCell>High-value items</TableCell>
                                            <TableCell>{((transformedABCData.filter(item => item.value === 3).length / transformedABCData.length) * 100).toFixed(2)}%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>B</TableCell>
                                            <TableCell>Medium-value items</TableCell>
                                            <TableCell>{((transformedABCData.filter(item => item.value === 2).length / transformedABCData.length) * 100).toFixed(2)}%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>C</TableCell>
                                            <TableCell>Low-value items</TableCell>
                                            <TableCell>{((transformedABCData.filter(item => item.value === 1).length / transformedABCData.length) * 100).toFixed(2)}%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InventoryDashboard;
