import { Order, Customer } from '../types';

export const mockOrders: Order[] = [
    {
        id: 'order_1',
        orderNumber: 'ORD-88234',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        status: 'completed',
        customer: {
            id: 'cust_1',
            name: 'John Smith',
            email: 'john@example.com',
            phone: '+1 234-567-8901',
            totalOrders: 5,
            totalSpent: 450.00
        },
        items: [
            {
                productId: 'prod_1',
                name: 'Wireless Headphones',
                sku: 'WH-001',
                price: 99.99,
                quantity: 1,
                image: 'https://placehold.co/300x300?text=Headphones'
            },
            {
                productId: 'prod_3',
                name: 'Fresh Apples (1kg)',
                sku: 'AP-001',
                price: 2.50,
                quantity: 2,
                image: 'https://placehold.co/300x300?text=Apples'
            }
        ],
        subtotal: 104.99,
        tax: 10.50,
        total: 115.49,
        paymentMethod: 'card'
    },
    {
        id: 'order_2',
        orderNumber: 'ORD-88233',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        status: 'completed',
        customer: null, // Walk-in customer
        items: [
            {
                productId: 'prod_7',
                name: 'Lego Set',
                sku: 'LG-001',
                price: 59.99,
                quantity: 1,
                image: 'https://placehold.co/300x300?text=Lego'
            }
        ],
        subtotal: 59.99,
        tax: 6.00,
        total: 65.99,
        paymentMethod: 'cash',
        cashReceived: 70.00,
        change: 4.01
    },
    {
        id: 'order_3',
        orderNumber: 'ORD-88232',
        date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        status: 'completed',
        customer: {
            id: 'cust_2',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            phone: '+1 234-567-8902',
            totalOrders: 12,
            totalSpent: 1250.00
        },
        items: [
            {
                productId: 'prod_2',
                variantId: 'var_2_1',
                name: 'Cotton T-Shirt',
                sku: 'TS-001-R-M',
                price: 14.99,
                quantity: 3,
                image: 'https://placehold.co/300x300?text=T-Shirt',
                attributes: { Color: 'Red', Size: 'M' }
            },
            {
                productId: 'prod_5',
                variantId: 'var_5_2',
                name: 'Jeans',
                sku: 'JN-001-32',
                price: 49.99,
                quantity: 1,
                image: 'https://placehold.co/300x300?text=Jeans',
                attributes: { Size: '32' }
            }
        ],
        subtotal: 94.96,
        tax: 9.50,
        total: 104.46,
        paymentMethod: 'upi'
    },
    {
        id: 'order_4',
        orderNumber: 'ORD-88231',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        status: 'refunded',
        customer: {
            id: 'cust_3',
            name: 'Mike Davis',
            email: 'mike@example.com',
            phone: '+1 234-567-8903',
            totalOrders: 3,
            totalSpent: 150.00
        },
        items: [
            {
                productId: 'prod_6',
                name: 'Coffee Maker',
                sku: 'CM-001',
                price: 39.99,
                quantity: 1,
                image: 'https://placehold.co/300x300?text=Coffee'
            }
        ],
        subtotal: 39.99,
        tax: 4.00,
        total: 43.99,
        paymentMethod: 'card',
        notes: 'Customer requested refund - defective product'
    },
    {
        id: 'order_5',
        orderNumber: 'ORD-88230',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        status: 'completed',
        customer: null,
        items: [
            {
                productId: 'prod_8',
                name: 'Novel Book',
                sku: 'BK-001',
                price: 12.99,
                quantity: 2,
                image: 'https://placehold.co/300x300?text=Book'
            },
            {
                productId: 'prod_3',
                name: 'Fresh Apples (1kg)',
                sku: 'AP-001',
                price: 2.50,
                quantity: 5,
                image: 'https://placehold.co/300x300?text=Apples'
            }
        ],
        subtotal: 38.48,
        tax: 3.85,
        total: 42.33,
        paymentMethod: 'cash',
        cashReceived: 50.00,
        change: 7.67
    },
    {
        id: 'order_6',
        orderNumber: 'ORD-88229',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        status: 'completed',
        customer: {
            id: 'cust_4',
            name: 'Emily White',
            email: 'emily@example.com',
            phone: '+1 234-567-8904',
            totalOrders: 8,
            totalSpent: 680.00
        },
        items: [
            {
                productId: 'prod_4',
                name: 'Smart Watch',
                sku: 'SW-001',
                price: 199.99,
                quantity: 1,
                image: 'https://placehold.co/300x300?text=Watch'
            }
        ],
        subtotal: 199.99,
        tax: 20.00,
        total: 219.99,
        paymentMethod: 'card'
    }
];
