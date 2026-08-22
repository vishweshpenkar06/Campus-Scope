import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const [colleges, trends, seats, insights, deadlines, cutoffs] = await Promise.all([
    p.college.count(),
    p.capRoundTrend.count(),
    p.seatMatrix.count(),
    p.campusInsight.count(),
    p.admissionDeadline.count(),
    p.cutoff.count(),
  ])
  console.log(JSON.stringify({ colleges, trends, seats, insights, deadlines, cutoffs }))
}

main().finally(() => p.$disconnect())
