import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template.jsx";

export async function GET() {
    try {
        console.log('\n🔍 EMAIL DEBUG - Starting diagnostics...\n');

        // 1. Check users
        const users = await db.user.findMany({
            include: {
                accounts: true,
                budgets: true,
            },
        });

        console.log(`📊 Found ${users.length} users`);

        if (users.length === 0) {
            return Response.json({
                error: 'No users found in database',
                suggestion: 'Please sign up first'
            }, { status: 404 });
        }

        // 2. Check budgets
        const budgets = await db.budget.findMany({
            include: {
                user: {
                    include: {
                        accounts: {
                            where: { isDefault: true }
                        }
                    }
                }
            }
        });

        console.log(`📊 Found ${budgets.length} budgets`);

        const diagnostics = {
            users: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                accountCount: u.accounts.length,
                budgetCount: u.budgets.length,
            })),
            budgets: budgets.map(b => ({
                id: b.id,
                userId: b.userId,
                userName: b.user.name,
                userEmail: b.user.email,
                amount: Number(b.amount),
                hasDefaultAccount: b.user.accounts.length > 0,
            })),
            resendKeyExists: !!process.env.RESEND_API_KEY,
            resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 10),
        };

        // 3. Try to send a test email to the first user
        if (users.length > 0) {
            const testUser = users[0];
            console.log(`\n📧 Attempting to send test email to ${testUser.email}...`);

            const emailResult = await sendEmail({
                to: testUser.email,
                subject: 'Test Budget Alert from Finance App',
                react: EmailTemplate({
                    userName: testUser.name,
                    type: 'budget-alert',
                    data: {
                        percentageUsed: 85.5,
                        budgetAmount: 5000,
                        totalExpenses: 4275,
                        accountName: 'Main Account',
                    },
                }),
            });

            console.log('Email send result:', emailResult);

            diagnostics.testEmail = {
                sent: emailResult.success,
                to: testUser.email,
                error: emailResult.error || null,
                data: emailResult.data || null,
            };
        }

        return Response.json({
            success: true,
            message: 'Email diagnostics completed',
            diagnostics,
        });

    } catch (error) {
        console.error('❌ Error in email diagnostics:', error);
        return Response.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
