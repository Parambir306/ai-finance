import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
    console.log("========== TESTING EMAIL API ==========");
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("RESEND_API_KEY value:", process.env.RESEND_API_KEY);

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        console.log("Attempting to send test email...");

        // Send a simple test email
        const data = await resend.emails.send({
            from: "Finance App <onboarding@resend.dev>",
            to: "delivered@resend.dev", // Resend's test inbox
            subject: "Test Email from Finance App",
            html: "<h1>Test Email</h1><p>If you receive this, email sending is working!</p>",
        });

        console.log("✅ Email sent successfully:", data);

        return NextResponse.json({
            success: true,
            message: "Email sent successfully!",
            data,
        });
    } catch (error) {
        console.error("❌ Email sending failed:");
        console.error("Error message:", error.message);
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
        console.error("Full error:", error);

        return NextResponse.json({
            success: false,
            error: error.message,
            errorName: error.name,
            details: JSON.stringify(error, null, 2),
        }, { status: 500 });
    }
}
