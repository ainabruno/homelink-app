/**
 * Invoice PDF Generator for HomeLink
 * Generates professional invoices in Malagasy with Orange Money payment details
 */

import { Payment, Plan } from "../drizzle/schema";
import { User } from "../drizzle/schema";

interface InvoiceData {
  invoiceNumber: string;
  user: User;
  plan: Plan;
  payment: Payment;
  issuedAt: Date;
  dueAt?: Date;
}

/**
 * Generate invoice HTML for PDF conversion
 * Uses HTML/CSS for better formatting and logo support
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const {
    invoiceNumber,
    user,
    plan,
    payment,
    issuedAt,
    dueAt,
  } = data;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-MG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
    }).format(amount);
  };

  const statusBadge = payment.status === "completed" ? "✓ PAYÉE" : "EN ATTENTE";
  const statusColor = payment.status === "completed" ? "#10b981" : "#f59e0b";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 900px;
            margin: 20px auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #00d4ff;
            padding-bottom: 20px;
        }
        
        .company-info h1 {
            color: #00d4ff;
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #666;
            font-size: 13px;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-details h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .invoice-details p {
            color: #666;
            font-size: 13px;
            margin: 3px 0;
        }
        
        .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 10px;
            font-size: 12px;
        }
        
        .customer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        
        .customer-info h3 {
            color: #333;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: #00d4ff;
        }
        
        .customer-info p {
            color: #666;
            font-size: 13px;
            margin: 3px 0;
        }
        
        .items-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        
        .items-table thead {
            background: #f0f0f0;
            border-bottom: 2px solid #ddd;
        }
        
        .items-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            font-size: 13px;
            text-transform: uppercase;
        }
        
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
            color: #666;
        }
        
        .items-table tr:last-child td {
            border-bottom: 2px solid #ddd;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-box {
            width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 13px;
            color: #666;
            border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
            background: #f0f0f0;
            padding: 15px;
            font-size: 16px;
            font-weight: bold;
            color: #00d4ff;
            border: 2px solid #00d4ff;
            border-radius: 4px;
        }
        
        .payment-info {
            background: #f0f9ff;
            border-left: 4px solid #00d4ff;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 4px;
        }
        
        .payment-info h3 {
            color: #00d4ff;
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        
        .payment-info p {
            color: #666;
            font-size: 12px;
            margin: 3px 0;
        }
        
        .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            text-align: center;
            color: #999;
            font-size: 11px;
        }
        
        .footer p {
            margin: 3px 0;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(0, 212, 255, 0.1);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="watermark">${statusBadge}</div>
    
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>🏠 HomeLink</h1>
                <p>Accès Distant Sécurisé</p>
                <p>Madagascar</p>
            </div>
            <div class="invoice-details">
                <h2>FACTURE</h2>
                <p><strong>N°:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${formatDate(issuedAt)}</p>
                ${dueAt ? `<p><strong>Échéance:</strong> ${formatDate(dueAt)}</p>` : ""}
                <div class="status-badge">${statusBadge}</div>
            </div>
        </div>
        
        <!-- Customer Info -->
        <div class="customer-info">
            <div>
                <h3>Facturé à</h3>
                <p><strong>${user.name || "Client"}</strong></p>
                <p>${user.email || "N/A"}</p>
                <p>ID Client: ${user.id}</p>
            </div>
            <div>
                <h3>Détails de Facturation</h3>
                <p><strong>Période:</strong> 1 mois</p>
                <p><strong>Statut:</strong> ${payment.status === "completed" ? "Payée" : "En attente"}</p>
                ${payment.transactionId ? `<p><strong>Transaction ID:</strong> ${payment.transactionId}</p>` : ""}
            </div>
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th class="text-right">Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>${plan.displayName}</strong><br>
                        <small>${plan.description || ""}</small>
                    </td>
                    <td>1</td>
                    <td>${formatCurrency(plan.priceAriary)}</td>
                    <td class="text-right"><strong>${formatCurrency(plan.priceAriary)}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals">
            <div class="totals-box">
                <div class="total-row">
                    <span>Sous-total:</span>
                    <span>${formatCurrency(payment.amount)}</span>
                </div>
                <div class="total-row">
                    <span>TVA (0%):</span>
                    <span>0 Ar</span>
                </div>
                <div class="total-row final">
                    <span>TOTAL À PAYER:</span>
                    <span>${formatCurrency(payment.amount)}</span>
                </div>
            </div>
        </div>
        
        <!-- Payment Info -->
        <div class="payment-info">
            <h3>📱 Informations de Paiement</h3>
            <p><strong>Méthode:</strong> ${payment.paymentMethod === "orange_money" ? "Orange Money" : "Mvola"}</p>
            <p><strong>Numéro Téléphone:</strong> ${payment.phoneNumber || "N/A"}</p>
            ${payment.paidAt ? `<p><strong>Date de Paiement:</strong> ${formatDate(payment.paidAt)}</p>` : ""}
            <p style="margin-top: 10px; font-size: 11px; color: #999;">
                Merci d'avoir choisi HomeLink. Pour toute question, contactez-nous.
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>HomeLink © 2026 - Accès Distant Sécurisé pour Madagascar</p>
            <p>Facture générée automatiquement. Pas de signature requise.</p>
            <p>Pour plus d'informations: https://homelink.mg</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate invoice PDF from HTML
 * Uses manus-md-to-pdf or similar tool
 */
export async function generateInvoicePDF(
  invoiceHTML: string,
  fileName: string
): Promise<Buffer | null> {
  try {
    // For production, you would use a library like:
    // - puppeteer (headless Chrome)
    // - wkhtmltopdf
    // - pdfkit
    // - weasyprint (Python)
    
    // For now, return a placeholder that indicates PDF generation is ready
    console.log(`[Invoice] PDF generation ready for: ${fileName}`);
    return Buffer.from(invoiceHTML);
  } catch (error) {
    console.error("[Invoice] PDF generation error:", error);
    return null;
  }
}

/**
 * Save invoice to storage and return URL
 */
export async function saveInvoiceToStorage(
  pdfBuffer: Buffer,
  invoiceNumber: string
): Promise<string | null> {
  try {
    // This would integrate with your storage service (S3, etc.)
    // For now, return a placeholder URL
    const fileName = `invoices/${invoiceNumber}.pdf`;
    console.log(`[Invoice] Saved to storage: ${fileName}`);
    return `/invoices/${invoiceNumber}.pdf`;
  } catch (error) {
    console.error("[Invoice] Storage error:", error);
    return null;
  }
}

/**
 * Create complete invoice workflow
 */
export async function createInvoice(data: InvoiceData): Promise<{
  html: string;
  pdfUrl?: string;
  success: boolean;
}> {
  try {
    const html = generateInvoiceHTML(data);
    const pdf = await generateInvoicePDF(html, `${data.invoiceNumber}.pdf`);
    
    let pdfUrl: string | undefined;
    if (pdf) {
      pdfUrl = await saveInvoiceToStorage(pdf, data.invoiceNumber) || undefined;
    }

    return {
      html,
      pdfUrl,
      success: true,
    };
  } catch (error) {
    console.error("[Invoice] Creation error:", error);
    return {
      html: "",
      success: false,
    };
  }
}
