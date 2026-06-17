import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  'Streaming',
  'Subscription',
  'Housing',
  'Vehicle',
  'Utilities',
  'Internet & Phone',
  'Home Appliances',
  'Insurance',
  'Debt / Installment',
  'Other',
]

async function main() {
  // Dev seed: reset everything first so re-running is safe.
  await prisma.payment.deleteMany()
  await prisma.recurringExpense.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.workspace.deleteMany()

  const workspace = await prisma.workspace.create({
    data: { name: 'บ้านเรา', inviteCode: 'PAYMORY1' },
  })

  // Two demo members. Login password for both: "paymory"
  const passwordHash = await bcrypt.hash('paymory', 10)
  const me = await prisma.user.create({
    data: { email: 'me@paymory.local', displayName: 'Me', passwordHash, workspaceId: workspace.id },
  })
  const partner = await prisma.user.create({
    data: { email: 'partner@paymory.local', displayName: 'Partner', passwordHash, workspaceId: workspace.id },
  })

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((name) => ({ name, workspaceId: workspace.id })),
  })
  const categories = await prisma.category.findMany({ where: { workspaceId: workspace.id } })
  const cat = (name: string) => categories.find((c) => c.name === name)!.id

  await prisma.recurringExpense.createMany({
    data: [
      {
        workspaceId: workspace.id, name: 'YouTube Premium', amount: 239, categoryId: cat('Streaming'),
        billingCycle: 'MONTHLY', dueDay: 5, ownerType: 'SHARED', payerType: 'SPLIT', splitPercent: 50,
        paymentMethod: 'CREDIT_CARD',
      },
      {
        workspaceId: workspace.id, name: 'Hostinger', amount: 299, categoryId: cat('Subscription'),
        billingCycle: 'MONTHLY', dueDay: 12, ownerType: 'PERSONAL', ownerUserId: me.id,
        payerType: 'PERSONAL', payerUserId: me.id, paymentMethod: 'CREDIT_CARD',
      },
      {
        workspaceId: workspace.id, name: 'Condo Rent', amount: 12000, categoryId: cat('Housing'),
        billingCycle: 'MONTHLY', dueDay: 1, ownerType: 'SHARED', payerType: 'SPLIT', splitPercent: 50,
        paymentMethod: 'BANK_TRANSFER',
      },
      {
        workspaceId: workspace.id, name: 'Motorcycle Payment', amount: 3500, categoryId: cat('Vehicle'),
        billingCycle: 'MONTHLY', dueDay: 28, ownerType: 'PERSONAL', ownerUserId: me.id,
        payerType: 'PERSONAL', payerUserId: me.id, paymentMethod: 'AUTO_DEBIT',
      },
      {
        workspaceId: workspace.id, name: 'Coway Water Filter', amount: 750, categoryId: cat('Home Appliances'),
        billingCycle: 'MONTHLY', dueDay: 15, ownerType: 'SHARED', payerType: 'SPLIT', splitPercent: 50,
        paymentMethod: 'AUTO_DEBIT',
      },
    ],
  })

  console.log('Seed complete:')
  console.log(`  workspace : ${workspace.name} (invite code: ${workspace.inviteCode})`)
  console.log(`  members   : ${me.displayName}, ${partner.displayName}  (password: paymory)`)
  console.log(`  categories: ${categories.length},  expenses: 5`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
