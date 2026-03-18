"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/shared/ui/atoms/button"
import { Option } from "effect"

interface DownloadPackingSlipProps {
    order: any
    config: any
}

function safeString(val: any): string {
    if (!val) return "";
    if (typeof val === 'object' && val !== null && "_tag" in val && val._tag === "Some") return val.value || ""; // Re-implement Option check simply for client side serialized objects
    if (typeof val === 'object' && val !== null && "value" in val) return val.value || "";
    return String(val);
}

export function DownloadPackingSlip({ order, config }: DownloadPackingSlipProps) {
    const [generating, setGenerating] = useState(false)

    const handleDownload = () => {
        if (!order) return;
        setGenerating(true);

        try {
            const doc = new jsPDF();
            
            // --- Header ---
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42); 
            doc.text("PACKING SLIP", 14, 20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); 
            doc.text(`#${order.orderNumber}`, 14, 26);

            // Company Info
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            const companyName = config.name || "Waroo Store";
            const companyWidth = doc.getTextWidth(companyName);
            doc.text(companyName, 200 - companyWidth, 20);

            // --- Details Grid ---
            const topY = 40;
            
            // Ship To
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text("SHIP TO", 14, topY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            
            const shipping = order.shippingAddress;
            let addrY = topY + 6;
            
            doc.setFont("helvetica", "bold");
            doc.text(`${shipping.firstName} ${shipping.lastName}`, 14, addrY);
            doc.setFont("helvetica", "normal");
            addrY += 5;
            doc.text(shipping.line1, 14, addrY);
            addrY += 5;
            doc.text(`${shipping.city}, ${shipping.postalCode}`, 14, addrY);
            addrY += 5;
            doc.text(shipping.country, 14, addrY);

            // Order Components
            const metaX = 130;
            let metaY = topY;

            const addMeta = (label: string, value: string) => {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.text(label, metaX, metaY);
                
                doc.setTextColor(30, 41, 59);
                doc.setFont("helvetica", "bold");
                const w = doc.getTextWidth(value);
                doc.text(value, 200 - w, metaY);
                metaY += 6;
            }

            addMeta("Date:", new Date(order.createdAt).toLocaleDateString());
            addMeta("Ship Method:", "Standard"); // Placeholder
            addMeta("Total Items:", String(order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)));

            // --- Table ---
            const headers = [["SKU", "Item Description", "Qty", "Check"]];
            const rows = order.items.map((item: any) => {
                const sku = safeString(item.sku) || "N/A";
                let desc = item.title;
                const variantName = safeString(item.variantName);
                if (variantName) desc += `\nVariant: ${variantName}`;
                
                return [
                    sku,
                    desc,
                    item.quantity,
                    "[   ]"
                ]
            });

            autoTable(doc, {
                startY: Math.max(addrY, metaY) + 15,
                head: headers,
                body: rows,
                theme: 'plain',
                headStyles: { 
                    fillColor: [255, 255, 255], 
                    textColor: [15, 23, 42], 
                    fontStyle: 'bold',
                    lineWidth: { bottom: 1 },
                    lineColor: [15, 23, 42]
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                    textColor: [51, 65, 85],
                    valign: 'middle'
                },
                columnStyles: {
                    0: { fontStyle: 'bold', font: "courier" },
                    2: { halign: 'center', fontStyle: 'bold', fontSize: 12 },
                    3: { halign: 'center', font: "courier" }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                }
            });

            // --- Footer ---
            const footerY = (doc as any).lastAutoTable.finalY + 20;

            // Notes Box
            doc.setFillColor(248, 250, 252);
            doc.rect(14, footerY, 100, 25, "F");
            
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("NOTES", 18, footerY + 5);
            doc.setTextColor(51, 65, 85);
            doc.text("Please verify all items against this slip.", 18, footerY + 12);
            doc.text("Inspect for damage before packing.", 18, footerY + 17);

            // Signature Line
            const lineX = 140;
            doc.setDrawColor(30, 41, 59);
            doc.line(lineX, footerY + 20, 200, footerY + 20);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("PACKED BY", lineX, footerY + 24);

            doc.save(`PackingSlip_${order.orderNumber}.pdf`);

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
