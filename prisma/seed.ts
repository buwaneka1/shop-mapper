import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    // Create Territories
    const territoriesData = [
        { name: 'Habaraduwa' },
        { name: 'Galle' },
    ]

    const territories = []
    for (const t of territoriesData) {
        const territory = await prisma.territory.upsert({
            where: { name: t.name },
            update: {},
            create: t
        })
        territories.push(territory)
    }

    const habaraduwa = territories.find(t => t.name === 'Habaraduwa')!
    const galle = territories.find(t => t.name === 'Galle')!

    // Create Lorries assigned to territories
    const lorriesData = [
        { name: 'Lorry 1', territoryId: habaraduwa.id },
        { name: 'Lorry 2', territoryId: habaraduwa.id },
        { name: 'Lorry 3', territoryId: habaraduwa.id },
        { name: 'Lorry 4', territoryId: galle.id },
        { name: 'Lorry 5', territoryId: galle.id },
    ]

    for (const l of lorriesData) {
        await prisma.lorry.upsert({
            where: { id: parseInt(l.name.split(' ')[1]) || 0 },
            update: { territoryId: l.territoryId },
            create: l
        })
    }

    // Refetch lorries
    const lorries = await prisma.lorry.findMany()

    // Admin
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password,
            role: 'ADMIN'
        }
    })

    // Viewer
    await prisma.user.upsert({
        where: { username: 'viewer' },
        update: {},
        create: {
            username: 'viewer',
            password,
            role: 'VIEWER'
        }
    })

    // Reps
    // Ensure we have enough lorries
    if (lorries.length >= 5) {
        const reps = [
            { username: 'rep1', lorryId: 1 },
            { username: 'rep2', lorryId: 2 },
            { username: 'rep3', lorryId: 3 },
            { username: 'rep4', lorryId: 4 },
            { username: 'rep5', lorryId: 5 },
        ]

        for (const r of reps) {
            // Find the lorry by ID (assuming IDs match 1-5 from creation order/names)
            // safer to find by name logic if needed, but ID upsert above used parsed name
            await prisma.user.upsert({
                where: { username: r.username },
                update: { lorryId: r.lorryId },
                create: {
                    username: r.username,
                    password,
                    role: 'REP',
                    lorryId: r.lorryId
                }
            })
        }
    }

    console.log('Seeding completed: admin/admin, rep1/rep1, etc.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
