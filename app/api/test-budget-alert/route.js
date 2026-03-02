import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template.jsx";

export async function GET() {
    try {
        console.log('🔍 Testing budget alert email...\n');

        // Get all budgets with user info
        const budgets = await db.budget.findMany({
            include: {
                user: {
                    include: {
                        accounts: {
                            where: {
                                isDefault: true,
                            },
                        },
                    },
                },
            },
        });

        console.log(`Found ${budgets.length} budgets\n`);

        if (budgets.length === 0) {
            return Response.json({
                error: 'No budgets found. Create a budget first!'
            }, { status: 404 });
        }

        const results = [];

        for (const budget of budgets) {
            const defaultAccount = budget.user.accounts[0];

            if (!defaultAccount) {
                console.log(`⚠️ User ${budget.user.name} has no default account`);
                continue;
            }

            console.log(`\n📊 Budget for ${budget.user.name} (${budget.user.email})`);
            console.log(`   Account: ${defaultAccount.name}`);
            console.log(`   Budget Amount: $${budget.amount}`);

            // Calculate expenses
            const startDate = new Date();
            startDate.setDate(1); // Start of current month

            const expenses = await db.transaction.aggregate({
                where: {
                    userId: budget.userId,
                    accountId: defaultAccount.id,
                    type: 'EXPENSE',
                    date: {
                        gte: startDate,
                    },
                },
                _sum: {
                    amount: true,
                },
            });

            const totalExpenses = expenses._sum.amount?.toNumber() || 0;
            const budgetAmount = Number(budget.amount);
            const percentageUsed = (totalExpenses / budgetAmount) * 100;

            console.log(`   Total Expenses: $${totalExpenses}`);
            console.log(`   Percentage Used: ${percentageUsed.toFixed(1)}%`);

            // Send email (forcing it for testing)
            console.log(`\n📧 Sending budget alert email to ${budget.user.email}...`);

            const emailResult = await sendEmail({
                to: budget.user.email,
                subject: `Budget Alert for ${defaultAccount.name}`,
                react: EmailTemplate({
                    userName: budget.user.name,
                    type: 'budget-alert',
                    data: {
                        percentageUsed: Number(percentageUsed),
                        budgetAmount: budgetAmount,
                        totalExpenses: Number(totalExpenses),
                        accountName: defaultAccount.name,
                    },
                }),
            });

            console.log('Email Result:', emailResult);

            results.push({
                user: budget.user.name,
                email: budget.user.email,
                percentageUsed: percentageUsed.toFixed(1),
                budgetAmount,
                totalExpenses,
                emailSent: emailResult.success,
                emailError: emailResult.error || null,
            });

            if (emailResult.success) {
                // Update last alert sent
                await db.budget.update({
                    where: { id: budget.id },
                    data: { lastAlertSent: new Date() },
                });
            }
        }

        return Response.json({
            success: true,
            message: 'Budget alert test completed',
            results,
        });

    } catch (error) {
        console.error('Error testing budget alert:', error);
        return Response.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
