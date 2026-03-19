
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.NEXT_PUBLIC_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendInviteEmail({ 
    to, 
    displayName, 
    inviteLink 
}: { 
    to: string; 
    displayName: string; 
    inviteLink: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Email not sent.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `Platform Admin <${FROM_EMAIL}>`,
            to: [to],
            // TODO: Ensure we're using a verified sender domain in Resend
            subject: 'Welcome - Set up your account',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    ${process.env.NEXT_PUBLIC_LOGO_URL ? `<div style="text-align: center; margin-bottom: 24px;"><img src="${process.env.NEXT_PUBLIC_LOGO_URL}" alt="Company Logo" style="max-height: 60px;" /></div>` : ''}
                    <h2>Welcome to the Platform, ${displayName}!</h2>
                    <p>An administrator has created an account for you.</p>
                    <p>Please click the link below to set your permanent password and access your account:</p>
                    <p>
                        <a href="${inviteLink}" style="background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                            Set Password & Login
                        </a>
                    </p>
                    <p style="margin-top: 24px; font-size: 14px; color: #666;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        ${inviteLink}
                    </p>
                </div>
            `
        });

        if (error) {
            console.error("Resend Email Error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (e) {
        console.error("Email Sending Exception:", e);
        return { success: false, error: e };
    }
}

export async function sendOtpEmail({ 
    to, 
    code 
}: { 
    to: string; 
    code: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. OTP not sent.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `Waroo Security <${FROM_EMAIL}>`,
            to: [to],
            subject: 'Your Login Verification Code',
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
                    <h2>Verification Code</h2>
                    <p>Use the following code to complete your login:</p>
                    <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        ${code}
                    </div>
                    <p style="color: #666; font-size: 13px;">This code will expire in 5 minutes.</p>
                    <p style="color: #999; font-size: 11px; margin-top: 30px;">If you didn't attempt to login, please ignore this email.</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend OTP Error:", error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (e) {
        console.error("Email Exception:", e);
        return { success: false, error: e };
    }
}

export interface InvoiceEmailData {
    to: string;
    patientName: string;
    practitionerName: string;
    invoiceNumber: string;
    issueDate: string;
    totalAmount: string;
    patientDue: string;
    medicalAidPaid: string;
    items: Array<{
        code: string;
        description: string;
        quantity: number;
        unitPrice: string;
        total: string;
    }>;
    notes?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Invoice email not sent.");
        return { success: false, error: "Missing API Key" };
    }

    const itemsHtml = data.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">${item.code}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.total}</td>
        </tr>
    `).join('');

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: `Waroo Medical <${FROM_EMAIL}>`,
            to: [data.to],
            subject: `Invoice #${data.invoiceNumber} from ${data.practitionerName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">INVOICE</h1>
                    
                    <div style="margin: 20px 0;">
                        <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${data.issueDate}</p>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                        <div>
                            <p style="margin: 0; font-weight: bold; color: #666;">Bill To:</p>
                            <p style="margin: 5px 0 0 0;">${data.patientName}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-weight: bold; color: #666;">Provider:</p>
                            <p style="margin: 5px 0 0 0;">${data.practitionerName}</p>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #2563eb; color: white;">
                                <th style="padding: 10px; text-align: left;">Code</th>
                                <th style="padding: 10px; text-align: left;">Description</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Unit Price</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f5f5f5; font-weight: bold;">
                                <td colspan="4" style="padding: 12px; text-align: right;">Total Amount (ZAR)</td>
                                <td style="padding: 12px; text-align: right;">${data.totalAmount}</td>
                            </tr>
                            <tr style="color: #666; font-size: 0.9em;">
                                <td colspan="4" style="padding: 8px 12px; text-align: right;">Medical Aid / Paid</td>
                                <td style="padding: 8px 12px; text-align: right;">- ${data.medicalAidPaid}</td>
                            </tr>
                            <tr style="background-color: #fef2f2; font-weight: bold; color: #dc2626; font-size: 1.1em;">
                                <td colspan="4" style="padding: 12px; text-align: right;">Patient Due</td>
                                <td style="padding: 12px; text-align: right;">${data.patientDue}</td>
                            </tr>
                        </tfoot>
                    </table>

                    ${data.notes ? `
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold; color: #666;">Notes:</p>
                            <p style="margin: 5px 0 0 0;">${data.notes}</p>
                        </div>
                    ` : ''}

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                        <p>Thank you for your business</p>
                        <p style="font-size: 12px; color: #999;">If you have any questions about this invoice, please contact us.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error("Resend Invoice Email Error:", error);
            return { success: false, error };
        }

        return { success: true, data: emailData };
    } catch (e) {
        console.error("Invoice Email Exception:", e);
        return { success: false, error: e };
    }
}
