import { NextResponse } from "next/server";
import { Resend } from "resend";
import EmailTemplate from "@/emails/template.jsx";

export async function GET() {
    console.log("========== TESTING EMAIL TO rita2194@gmail.com ==========");

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        // Test data for budget alert
        const testData = {
            percentageUsed: 85.5,
            budgetAmount: 10000,
            totalExpenses: 8550,
            accountName: "Default Account",
        };

        console.log("Sending budget alert email to rita2194@gmail.com");

        const result = await resend.emails.send({
            from: "Finance App <onboarding@resend.dev>",
            to: "sachdevparambirsingh@gmail.com", // Resend account owner email
            subject: "Budget Alert Test - Finance App",
            react: EmailTemplate({
                userName: "Rita",
                type: "budget-alert",
                data: testData,
            }),
        });

        console.log("Full Resend response:", JSON.stringify(result, null, 2));

        // Check if there's an error in the response
        if (result.error) {
            console.error("❌ Resend returned error:", result.error);
            return NextResponse.json({
                success: false,
                error: result.error.message || result.error,
                errorDetails: result.error,
            }, { status: 500 });
        }

        // Check if data exists
        if (!result.data) {
            console.error("❌ No data in response:", result);
            return NextResponse.json({
                success: false,
                error: "No data returned from Resend",
                fullResponse: result,
            }, { status: 500 });
        }

        console.log("✅ Email sent successfully to rita2194@gmail.com:", result.data);

        return NextResponse.json({
            success: true,
            message: "Budget alert email sent to sachdevparambirsingh@gmail.com! Check that inbox (and spam folder).",
            emailId: result.data.id,
            sentTo: "sachdevparambirsingh@gmail.com",
        });
    } catch (error) {
        console.error("❌ Failed to send email:");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);

        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
