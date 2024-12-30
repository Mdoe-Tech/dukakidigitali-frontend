'use client'

import React, {useState} from 'react';
import {useQuery} from 'react-query';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Download, Calendar as CalendarIcon, LineChart, Users, Package, TrendingUp, AlertTriangle} from 'lucide-react';
import {addDays, format} from 'date-fns';
import * as XLSX from 'xlsx';
import 'jspdf-autotable';
import axiosInstance from "@/lib/axiosInstance";
import {toast} from "@/hooks/use-toast";
import {DatePickerWithRange} from "@/components/DateRangePicker";
import {DateRange} from "react-day-picker";

// Types for all DTOs
interface DailySalesDTO {
    date: string;
    dailyRevenue: number;
    orderCount: number;
    itemsSold: number;
}

interface TopCustomerDTO {
    customerId: string;
    customerName: string;
    customerEmail: string;
    totalSpent: number;
    totalOrders: number;
    lastPurchaseDate: string;
    averageOrderValue: number;
    customerTier: string;
}

interface CustomerInsightsDTO {
    totalCustomers: number;
    topCustomers: TopCustomerDTO[];
}

interface ProductPerformanceDTO {
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
    cogs: number;
}

interface MonthlyTrendDTO {
    month: string;
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
}

interface SalesTrendsDTO {
    monthlyTrends: MonthlyTrendDTO[];
}

type StockAlertSeverity = 'LOW' | 'CRITICAL' | 'STOCKOUT';

interface StockAlert {
    productId: string;
    productName: string;
    currentStock: number;
    severity: StockAlertSeverity;
}

interface InventoryImpactDTO {
    stockLevelsImpact: Record<string, number>;
    lowStockProducts: StockAlert[];
}

export enum SaleStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

interface ComprehensiveSalesReportDTO {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
    dailySales: DailySalesDTO[];
    salesByStatus: Record<SaleStatus, number>;
    customerInsights: CustomerInsightsDTO;
    productPerformance: ProductPerformanceDTO[];
    salesTrends: SalesTrendsDTO;
    inventoryImpact: InventoryImpactDTO;
}

const ComprehensiveSalesReport: React.FC = () => {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    // Fetch comprehensive report with proper error typing
    const {data: reportData, isLoading} = useQuery<ComprehensiveSalesReportDTO, Error>({
        queryKey: ['comprehensive-report', dateRange],
        queryFn: async () => {
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error('Date range is required');
            }

            const response = await axiosInstance.get<{ data: ComprehensiveSalesReportDTO }>('/sales/report', {
                params: {
                    startDate: dateRange.from.toISOString(),
                    endDate: dateRange.to.toISOString(),
                },
            });
            console.log(response.data.data)
            return response.data.data;
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: `Failed to fetch report: ${error.message}`,
                variant: "destructive",
            });
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });

    const exportToExcel = (): void => {
        if (!reportData) return;

        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [{
            'Total Revenue': formatCurrency(reportData.totalRevenue),
            'Total Orders': reportData.totalOrders,
            'Total Items Sold': reportData.totalItemsSold,
            'Average Order Value': formatCurrency(reportData.averageOrderValue),
        }];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Daily Sales Sheet
        const dailySalesSheet = XLSX.utils.json_to_sheet(reportData.dailySales.map(sale => ({
            'Date': format(new Date(sale.date), 'PPP'),
            'Revenue': formatCurrency(sale.dailyRevenue),
            'Orders': sale.orderCount,
            'Items Sold': sale.itemsSold,
        })));
        XLSX.utils.book_append_sheet(wb, dailySalesSheet, 'Daily Sales');

        // Product Performance Sheet
        const productSheet = XLSX.utils.json_to_sheet(reportData.productPerformance.map(product => ({
            'Product': product.productName,
            'Units Sold': product.unitsSold,
            'Revenue': formatCurrency(product.revenue),
            'COGS': formatCurrency(product.cogs),
            'Profit': formatCurrency(product.revenue - product.cogs),
        })));
        XLSX.utils.book_append_sheet(wb, productSheet, 'Product Performance');

        XLSX.writeFile(wb, `sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS'
        }).format(amount);
    };

    const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode): React.ReactNode => (
        <Card>
            <CardContent className="flex items-center p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mr-4">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-xl font-bold">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );

    const handleDateRangeSelect = (range: DateRange | undefined): void => {
        if (range?.from && range?.to) {
            setDateRange({from: range.from, to: range.to});
        }
    };

    const getSeverityStyles = (severity: StockAlertSeverity): { containerClass: string; textClass: string } => {
        const styles = {
            CRITICAL: {
                containerClass: 'bg-red-50',
                textClass: 'bg-red-100 text-red-800'
            },
            LOW: {
                containerClass: 'bg-yellow-50',
                textClass: 'bg-yellow-100 text-yellow-800'
            },
            STOCKOUT: {
                containerClass: 'bg-red-50',
                textClass: 'bg-red-100 text-red-800'
            }
        };
        return styles[severity];
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Sales Analytics Dashboard</h1>
                    <p className="text-muted-foreground">
                        Comprehensive view of your business performance
                    </p>
                </div>

                <div className="flex gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Select date range</span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-auto p-0" align="end">
                            <DatePickerWithRange date={dateRange} setDate={setDateRange}/>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={exportToExcel} disabled={isLoading || !reportData}>
                        <Download className="mr-2 h-4 w-4"/>
                        Export Report
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <p>Loading report data...</p>
                </div>
            ) : reportData ? (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {renderMetricCard(
                            "Total Revenue",
                            formatCurrency(reportData.totalRevenue),
                            <LineChart className="h-6 w-6 text-primary"/>
                        )}
                        {renderMetricCard(
                            "Total Orders",
                            reportData.totalOrders,
                            <Package className="h-6 w-6 text-primary"/>
                        )}
                        {renderMetricCard(
                            "Average Order Value",
                            formatCurrency(reportData.averageOrderValue),
                            <TrendingUp className="h-6 w-6 text-primary"/>
                        )}
                        {renderMetricCard(
                            "Total Customers",
                            reportData.customerInsights.totalCustomers,
                            <Users className="h-6 w-6 text-primary"/>
                        )}
                    </div>

                    <Tabs defaultValue="sales">
                        <TabsList>
                            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
                            <TabsTrigger value="customers">Customer Insights</TabsTrigger>
                            <TabsTrigger value="products">Product Performance</TabsTrigger>
                            <TabsTrigger value="inventory">Inventory Alerts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sales">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Daily Sales Trend</CardTitle>
                                    <CardDescription>
                                        Revenue and order volume over time
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* TODO: Add recharts LineChart for daily sales trend */}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="customers">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Customers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {reportData.customerInsights.topCustomers.map((customer) => (
                                            <div
                                                key={customer.customerId}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{customer.customerName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customer.customerEmail}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        {formatCurrency(customer.totalSpent)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customer.totalOrders} orders
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="products">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {reportData.productPerformance.map((product) => (
                                            <div
                                                key={product.productId}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{product.productName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {product.unitsSold} units sold
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        {formatCurrency(product.revenue)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Revenue
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="inventory">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Stock Alerts</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {reportData.inventoryImpact.lowStockProducts.map((product) => {
                                            const severityStyles = getSeverityStyles(product.severity);
                                            return (
                                                <div
                                                    key={product.productId}
                                                    className={`flex items-center justify-between p-4 border rounded-lg ${severityStyles.containerClass}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle className={`h-5 w-5 ${
                                                            product.severity === 'CRITICAL'
                                                                ? 'text-red-500'
                                                                : 'text-yellow-500'
                                                        }`}/>
                                                        <div>
                                                            <p className="font-medium">{product.productName}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Current stock: {product.currentStock} units
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm ${severityStyles.textClass}`}>
                                                        {product.severity}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <div className="flex justify-center items-center h-64">
                    <p>No report data available</p>
                </div>
            )}
        </div>
    );
};

export default ComprehensiveSalesReport;
