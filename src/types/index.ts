// types/dashboard.ts
export interface DashboardData {
    totalSales: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    salesTrend: { date: string; sales: number }[];
    orderStatus: { name: string; value: number }[];
    topSellingProducts: { name: string; quantity: number }[];
    inventoryStatus: { name: string; value: number }[];
    salesByCategory: { category: string; sales: number }[];
    customerAcquisition: { date: string; newCustomers: number }[];
    recentOrders: {
        id: string;
        customer: string;
        total: number;
        status: string;
        date: string;
    }[];
    lowStockProducts: { id: string; name: string; sku: string; stockLevel: number }[];
}

// types/customer.ts
export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyProgram {
    id: string;
    customerId: string;
    points: number;
    tier: string;
    createdAt: string;
    updatedAt: string;
}

// types/order.ts
export interface Order {
    id: string;
    customerId: string;
    total: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
}

export interface Return {
    id: string;
    orderId: string;
    reason: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

// types/product.ts
export interface Product {
    id: string;
    name: string;
    description: string;
    sku: string;
    price: number;
    categoryId: string;
    supplierId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: string;
    updatedAt: string;
}

// types/inventory.ts
export interface Inventory {
    id: string;
    productId: string;
    quantity: number;
    location: string;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryMovement {
    id: string;
    inventoryId: string;
    type: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

export interface StockLevel {
    id: string;
    productId: string;
    currentStock: number;
    minimumStock: number;
}

// types/sales.ts
export interface Sale {
    id: string;
    customerId: string;
    total: number;
    discount: number;
    createdAt: string;
    updatedAt: string;
}

export interface SaleItem {
    id: string;
    saleId: string;
    productId: string;
    quantity: number;
    price: number;
}

export interface Discount {
    id: string;
    code: string;
    type: string;
    value: number;
    startDate: string;
    endDate: string;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
}

// types/analytics.ts
export interface SalesAnalyticsTypes {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    topSellingProducts: { name: string; quantity: number }[];
    salesByCategory: { category: string; revenue: number }[];
    dailySales: { date: string; revenue: number }[];
}

export interface InventoryAnalyticsTypes {
    totalStockValue: number;
    stockTurnoverRate: { product: string; rate: number }[];
    inventoryValueOverTime: { date: string; value: number }[];
    outOfStockItems: number;
    lowStockItems: number;
    predictedRestockingNeeds: { product: string; quantity: number; date: string }[];
}

// types/reports.ts
export interface SalesReport {
    salesData: { date: string; totalSales: number; numberOfOrders: number; averageOrderValue: number }[];
    summary: {
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
    };
}

export interface FinancialReport {
    profitAndLoss: { category: string; amount: number }[];
    balanceSheet: { category: string; amount: number }[];
    cashFlow: { category: string; amount: number }[];
}

// types/user.ts
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

// types/settings.ts
export interface Settings {
    storeName: string;
    currency: string;
    timeZone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number;
}

// types/notifications.ts
export interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    date: string;
}

export interface NotificationPreferences {
    [key: string]: {
        email: boolean;
        sms: boolean;
        inApp: boolean;
    };
}

// types/calendar.ts
export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    type: string;
}

// types/support.ts
export interface FAQ {
    question: string;
    answer: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
