'use client';

import React from 'react';
import { ReceiptData } from '@/types/receipt';
import { format } from 'date-fns';

interface ReceiptProps {
    data: ReceiptData;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
    return (
        <div ref={ref} className="receipt-container bg-white" style={{ width: '80mm', padding: '10mm', fontFamily: 'monospace' }}>
            {/* Header */}
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold mb-1">{data.storeName}</h1>
                <p className="text-xs">{data.storeAddress}</p>
                <p className="text-xs">{data.storePhone}</p>
                {data.storeEmail && <p className="text-xs">{data.storeEmail}</p>}
            </div>

            {/* Custom Header Message */}
            {data.receiptHeader && (
                <div className="text-center text-xs mb-4 border-t border-b border-dashed py-2">
                    {data.receiptHeader}
                </div>
            )}

            {/* Order Info */}
            <div className="border-t border-b border-dashed py-2 mb-3 text-xs">
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-bold">{data.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(new Date(data.date), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                {data.cashierName && (
                    <div className="flex justify-between">
                        <span>Cashier:</span>
                        <span>{data.cashierName}</span>
                    </div>
                )}
                {data.customerName && (
                    <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{data.customerName}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="mb-3">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-1">Item</th>
                            <th className="text-center py-1">Qty</th>
                            <th className="text-right py-1">Price</th>
                            <th className="text-right py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr>
                                    <td className="py-1" colSpan={4}>
                                        <div className="font-semibold">{item.name}</div>
                                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                                            <div className="text-[10px] text-gray-600">
                                                {Object.entries(item.attributes).map(([key, value]) => (
                                                    <span key={key} className="mr-2">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-gray-500">SKU: {item.sku}</div>
                                    </td>
                                </tr>
                                <tr className="border-b border-dotted">
                                    <td></td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">${item.price.toFixed(2)}</td>
                                    <td className="text-right font-semibold">${item.total.toFixed(2)}</td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-t border-dashed pt-2 mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span>Subtotal:</span>
                    <span>${data.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                    <span>Tax:</span>
                    <span>${data.tax.toFixed(2)}</span>
                </div>
                {data.roundOffAmount !== undefined && data.roundOffAmount !== 0 && (
                    <div className="flex justify-between text-xs mb-1">
                        <span>Round Off:</span>
                        <span>{data.roundOffAmount > 0 ? '+' : ''}{data.roundOffAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-dashed pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span>${data.total.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Info */}
            <div className="border-t border-dashed pt-2 mb-3 text-xs">
                <div className="flex justify-between mb-1">
                    <span>Payment Method:</span>
                    <span className="uppercase font-semibold">{data.paymentMethod}</span>
                </div>
                {data.paymentMethod === 'cash' && data.cashReceived && (
                    <>
                        <div className="flex justify-between">
                            <span>Cash Received:</span>
                            <span>${data.cashReceived.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Change:</span>
                            <span>${(data.change || 0).toFixed(2)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Footer Message */}
            {data.receiptFooter && (
                <div className="text-center text-xs border-t border-dashed pt-3 mb-2">
                    {data.receiptFooter}
                </div>
            )}

            {/* Standard Footer */}
            <div className="text-center text-xs mt-4 pt-2 border-t">
                <p className="mb-1">Thank you for your purchase!</p>
                <p className="text-[10px] text-gray-500">
                    This receipt is computer generated and valid without signature
                </p>
            </div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
