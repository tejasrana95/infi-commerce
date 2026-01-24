import { Customer } from '../types';

export const mockCustomers: Customer[] = [
    {
        id: 'cust_1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-0101',
        totalOrders: 12,
        totalSpent: 450.50
    },
    {
        id: 'cust_2',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-0102',
        totalOrders: 5,
        totalSpent: 120.00
    },
    {
        id: 'cust_3',
        name: 'Alice Johnson',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0103',
        totalOrders: 8,
        totalSpent: 890.00
    },
    {
        id: 'cust_4',
        name: 'Bob Brown',
        firstName: 'Bob',
        lastName: 'Brown',
        phone: '555-0104',
        totalOrders: 2,
        totalSpent: 45.00
    },
    {
        id: 'cust_5',
        name: 'Charlie Davis',
        firstName: 'Charlie',
        lastName: 'Davis',
        email: 'charlie@example.com',
        phone: '555-0105',
        totalOrders: 20,
        totalSpent: 1200.00
    }
];
