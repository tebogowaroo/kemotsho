"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/shared/ui/atoms/button"
import { formatCurrency } from "@kemotsho/core/lib/utils"

interface DownloadInvoiceProps {
    order: any // Pass serialized order object
    config: any // Pass tenant config
}

export function DownloadInvoice({ order, config }: DownloadInvoiceProps) {
    const [generating, setGenerating] = useState(false)

    const handleDownload = () => {
        if (!order) return;
        setGenerating(true);

        try {
            const doc = new jsPDF();
            
            // --- Header ---
            doc.setFontSize(22);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text("INVOICE", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`#${order.orderNumber}`, 14, 25);

            // Company Info (Right)
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59); // slate-800
            const companyName = config.name || "Company Name";
            const companyWidth = doc.getTextWidth(companyName);
            doc.text(companyName, 200 - companyWidth, 20);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139); // slate-500
            let rightY = 25;
            if (config.contact?.email) {
                const text = config.contact.email;
                const w = doc.getTextWidth(text);
                doc.text(text, 200 - w, rightY);
                rightY += 5;
            }
            if (config.contact?.phone) {
                const text = config.contact.phone;
                const w = doc.getTextWidth(text);
                doc.text(text, 200 - w, rightY);
            }

            // --- Addresses ---
            const addressY = 45;
            
            // Bill To
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("BILL TO", 14, addressY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59); // slate-800
            
            const shipping = order.shippingAddress;
            let currentY = addressY + 6;
            
            doc.text(`${shipping.firstName} ${shipping.lastName}`, 14, currentY);
            currentY += 5;
            doc.text(shipping.line1, 14, currentY);
            currentY += 5;
            if (shipping.line2) {
                doc.text(shipping.line2, 14, currentY);
                currentY += 5;
            }
            doc.text(`${shipping.city}, ${shipping.postalCode}`, 14, currentY);
            currentY += 5;
            doc.text(shipping.country, 14, currentY);

            // Meta Data (Right Side)
            const metaX = 130;
            let metaY = addressY;
            
            const addMetaRow = (label: string, value: string) => {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(label, metaX, metaY);
                
                doc.setTextColor(30, 41, 59);
                const valWidth = doc.getTextWidth(value);
                doc.text(value, 200 - valWidth, metaY);
                metaY += 6;
            }

            addMetaRow("Invoice Date:", new Date(order.createdAt).toLocaleDateString());
            addMetaRow("Status:", order.status.toUpperCase().replace("_", " "));
            addMetaRow("Payment:", order.paymentMethod.toUpperCase().replace("_", " "));

            // --- Items Table ---
            const headers = [["Description", "Qty", "Price", "Total"]];
            const rows = order.items.map((item: any) => [
                item.title + (item.sku ? `\nSKU: ${item.sku}` : ""),
                item.quantity,
                formatCurrency(item.priceAtPurchase),
                formatCurrency(item.total)
            ]);

            autoTable(doc, {
                startY: Math.max(currentY, metaY) + 10,
                head: headers,
                body: rows,
                theme: 'plain',
                headStyles: { 
                    fillColor: [255, 255, 255], 
                    textColor: [15, 23, 42], 
                    fontStyle: 'bold',
                    lineWidth: { bottom: 0.5 },
                    lineColor: [30, 41, 59] 
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    textColor: [51, 65, 85]
                },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right' },
                    3: { halign: 'right', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                }
            });

            // --- Totals ---
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const totalX = 140;
            const valX = 200;
            let currentTotalY = finalY;

            const addTotalRow = (label: string, value: number, isTotal = false) => {
                doc.setFont("helvetica", isTotal ? "bold" : "normal");
                doc.setFontSize(isTotal ? 11 : 9);
                doc.setTextColor(isTotal ? 15 : 100, isTotal ? 23 : 116, isTotal ? 42 : 139);
                
                doc.text(label, totalX, currentTotalY);
                
                const valStr = formatCurrency(value);
                const w = doc.getTextWidth(valStr);
                doc.text(valStr, valX - w, currentTotalY);
                currentTotalY += (isTotal ? 8 : 6);
            }

            addTotalRow("Subtotal", order.subtotal);
            addTotalRow("Shipping", order.shippingCost);
            if (order.tax > 0) {
                // Determine if tax is inclusive or exclusive based on totals
                // Inclusive: Total == Subtotal + Shipping (Tax is inside Subtotal)
                // Exclusive: Total == Subtotal + Shipping + Tax
                const calculatedTotal = order.subtotal + order.shippingCost + order.tax;
                // If diff is negligible, it's exclusive (Tax added on top)
                const isExclusive = Math.abs(calculatedTotal - order.total) < 0.05;
                
                const label = config.tax?.label || "VAT";
                const displayLabel = isExclusive ? label : `${label} (incl.)`;

                addTotalRow(displayLabel, order.tax);
            }
            
            // Total Line
            doc.setDrawColor(203, 213, 225);
            doc.line(totalX, currentTotalY - 2, 200, currentTotalY - 2);
            currentTotalY += 4;
            addTotalRow("Total", order.total, true);

            // --- Footer ---
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("Thank you for your business!", 105, 280, { align: "center" });

            doc.save(`Invoice_${order.orderNumber}.pdf`);

        } catch (error) {
            console.error(error);
            alert("Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    }

    return (
        <Button 
            onClick={handleDownload}
            disabled={generating}
        >
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
        </Button>
    )
}
