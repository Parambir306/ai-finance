import { NextResponse } from "next/server";
import { Resend } from "resend";
import EmailTemplate from "@/emails/template.jsx";

export async function GET() {
    console.log("========== TESTING BUDGET ALERT EMAIL ==========");

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // Test data for budget alert
        const testData = {
            percentageUsed: 85.5,
            budgetAmount: 10000,
            totalExpenses: 8550,
            accountName: "Default Account",
        };

        console.log("Sending budget alert with test data:", testData);

        const data = await resend.emails.send({
            from: "Finance App <onboarding@resend.dev>",
            to: "delivered@resend.dev", // Resend's test inbox
            subject: "Test Budget Alert",
            react: EmailTemplate({
                userName: "Test User",
                type: "budget-alert",
                data: testData,
            }),
        });

        console.log("✅ Budget alert email sent successfully:", data);

        return NextResponse.json({
            success: true,
            message: "Budget alert email sent successfully!",
            data,
            testData,
        });
    } catch (error) {
        console.error("❌ Budget alert email failed:");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        return NextResponse.json({
            success: false,
            error: error.message,
            errorName: error.name,
            stack: error.stack,
        }, { status: 500 });
    }
}
