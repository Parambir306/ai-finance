// Test script to manually trigger budget alert email
import { db } from './lib/prisma.js';
import { sendEmail } from './actions/send-email.js';
import EmailTemplate from './emails/template.jsx';

async function testBudgetAlert() {
    console.log('🔍 Checking for budgets and users...\n');

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
        console.log('❌ No budgets found. Create a budget first!');
        return;
    }

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
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        console.log(`   Total Expenses: $${totalExpenses}`);
        console.log(`   Percentage Used: ${percentageUsed.toFixed(1)}%`);

        // Trigger email if over 80% (or force send for testing)
        if (percentageUsed >= 80 || true) { // Force send for testing
            console.log(`\n📧 Sending budget alert email to ${budget.user.email}...`);

            const emailResult = await sendEmail({
                to: budget.user.email,
                subject: `Budget Alert for ${defaultAccount.name}`,
                react: EmailTemplate({
                    userName: budget.user.name,
                    type: 'budget-alert',
                    data: {
                        percentageUsed: Number(percentageUsed),
                        budgetAmount: Number(budgetAmount),
                        totalExpenses: Number(totalExpenses),
                        accountName: defaultAccount.name,
                    },
                }),
            });

            console.log('Email Result:', emailResult);

            if (emailResult.success) {
                console.log('✅ Budget alert email sent successfully!');

                // Update last alert sent
                await db.budget.update({
                    where: { id: budget.id },
                    data: { lastAlertSent: new Date() },
                });
            } else {
                console.log('❌ Email failed:', emailResult.error);
            }
        } else {
            console.log(`ℹ️ No alert needed (${percentageUsed.toFixed(1)}% used)`);
        }
    }

    console.log('\n✨ Test complete!');
    await db.$disconnect();
}

testBudgetAlert().catch(console.error);
