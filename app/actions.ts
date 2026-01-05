'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { writeFile } from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt, getSession, updateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function loginAction(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const territoryId = parseInt(formData.get('territoryId') as string)

    if (!username || !password || isNaN(territoryId)) {
        return // invalid input
    }

    // Explicitly include Lorry relation to access territoryId
    const user = await prisma.user.findUnique({
        where: { username },
        include: { lorry: true }
    })

    if (!user || !(await bcrypt.compare(password, user.password))) {
        // Simple error handling: redirect back? 
        // ideally return error state but for simplicity now:
        return
    }

    // Role-based Territory access check
    if (user.role === 'REP') {
        if (!user.lorry || user.lorry.territoryId !== territoryId) {
            // Access denied: Rep can only login to their lorry's territory
            return
        }
    } else {
        // ADMIN or VIEWER can access any territory
        // Optionally verify if territoryId exists in DB, but constraint checks usually sufficient
        const territory = await prisma.territory.findUnique({ where: { id: territoryId } })
        if (!territory) return
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    // Add territoryId to session
    const session = await encrypt({
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            lorryId: user.lorryId
        },
        territoryId, // Global session territory context
        expires
    })

    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true })

    redirect('/')
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    redirect('/login')
}

export async function createUser(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can create users')
    }

    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string
    const lorryId = formData.get('lorryId') ? parseInt(formData.get('lorryId') as string) : null

    if (!username || !password || !role) {
        throw new Error('Missing required fields')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
                lorryId
            }
        })
        revalidatePath('/admin/users')
    } catch (e) {
        console.error("Failed to create user", e)
        throw new Error("Failed to create user (Username might be taken)")
    }
}

export async function deleteUser(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can delete users')
    }

    const userId = parseInt(formData.get('userId') as string)

    // Prevent deleting self
    if (session.user.id === userId) {
        throw new Error("Cannot delete yourself")
    }

    try {
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath('/admin/users')
    } catch (e) {
        console.error("Failed to delete user", e)
        throw new Error("Failed to delete user")
    }
}

export async function deleteShop(shopId: number) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can delete shops')
    }

    try {
        await prisma.shop.delete({ where: { id: shopId } })
        revalidatePath('/')
    } catch (e) {
        console.error("Failed to delete shop", e)
        throw new Error("Failed to delete shop")
    }
}

export async function addShop(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'REP')) {
        throw new Error('Unauthorized')
    }

    const name = formData.get('name') as string
    const ownerName = formData.get('ownerName') as string
    const contactNumber = formData.get('contactNumber') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const avgBillValue = parseFloat(formData.get('avgBillValue') as string || '0')
    const routeId = parseInt(formData.get('routeId') as string)
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)

    // New Fields
    const paymentStatus = formData.get('paymentStatus') as 'ON_TIME' | 'DELAYED' | 'EXTREMELY_DELAYED'
    const creditPeriodRaw = formData.get('creditPeriod')
    const creditPeriod = creditPeriodRaw ? parseInt(creditPeriodRaw as string) : null

    // Check if location is valid
    if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Invalid Location")
    }

    const image = formData.get('image') as File
    let imageUrl = null

    if (image && image.size > 0) {
        try {
            const arrayBuffer = await image.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const result: any = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    folder: "shop-mapper",
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }).end(buffer);
            });

            if (result && result.secure_url) {
                imageUrl = result.secure_url;
            }
        } catch (fileError) {
            console.error("Cloudinary upload failed:", fileError);
            // Continue without image
        }
    }

    try {
        await prisma.shop.create({
            data: {
                name,
                ownerName,
                contactNumber,
                paymentMethod,
                creditPeriod,       // New
                paymentStatus,      // New
                avgBillValue,
                routeId,
                latitude,
                longitude,
                imageUrl
            }
        })

        revalidatePath('/')
    } catch (error) {
        console.error('Failed to create shop:', error)
        throw new Error('Failed to create shop')
    }
}

export async function updateShop(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'REP')) {
        throw new Error('Unauthorized: Only Admins and Reps can update shops')
    }

    const id = parseInt(formData.get('id') as string)
    if (isNaN(id)) throw new Error('Invalid Shop ID')

    const name = formData.get('name') as string
    const ownerName = formData.get('ownerName') as string
    const contactNumber = formData.get('contactNumber') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const avgBillValue = parseFloat(formData.get('avgBillValue') as string || '0')
    const routeId = parseInt(formData.get('routeId') as string)
    const latitude = parseFloat(formData.get('latitude') as string)
    const longitude = parseFloat(formData.get('longitude') as string)
    const paymentStatus = formData.get('paymentStatus') as 'ON_TIME' | 'DELAYED' | 'EXTREMELY_DELAYED'
    const creditPeriodRaw = formData.get('creditPeriod') as string
    const creditPeriod = creditPeriodRaw ? parseInt(creditPeriodRaw) : null

    const image = formData.get('image') as File
    let imageUrl = undefined // Undefined means "do not update" in Prisma

    if (image && image.size > 0) {
        try {
            const arrayBuffer = await image.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const result: any = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    folder: "shop-mapper",
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }).end(buffer);
            });

            if (result && result.secure_url) {
                imageUrl = result.secure_url;
            }
        } catch (fileError) {
            console.error("Cloudinary upload failed:", fileError);
        }
    }

    try {
        await prisma.shop.update({
            where: { id },
            data: {
                name,
                ownerName,
                contactNumber,
                paymentMethod,
                creditPeriod,
                paymentStatus,
                avgBillValue,
                routeId,
                latitude,
                longitude,
                ...(imageUrl !== undefined && { imageUrl }) // Only update if new image
            }
        })

        revalidatePath('/')
    } catch (error) {
        console.error('Failed to update shop:', error)
        throw new Error('Failed to update shop')
    }
}

// --- Logistics Management ---

export async function createLorry(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can create lorries')
    }

    const name = formData.get('name') as string
    const territoryId = parseInt(formData.get('territoryId') as string)

    if (!name || isNaN(territoryId)) {
        throw new Error('Missing required fields')
    }

    try {
        await prisma.lorry.create({
            data: {
                name,
                territoryId
            }
        })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to create lorry", e)
        throw new Error("Failed to create lorry")
    }
}

export async function deleteLorry(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can delete lorries')
    }

    const id = parseInt(formData.get('id') as string)

    try {
        // Optional: Handle constraints manually if relations don't cascade
        // For now, attempting delete. If it fails due to FK, simplistic error.

        // Unassign users first (optional relation)
        await prisma.user.updateMany({
            where: { lorryId: id },
            data: { lorryId: null }
        })

        // Delete routes? Or let DB fail?
        // Route needs Lorry. So we probably have to delete routes.
        // And Routes have Shops.
        // This is destructive. Let's just try delete and see if it fails.
        // Ideally we ask for confirmation "This will delete all routes/shops".
        // For this task, I will just try to delete the Lorry.

        await prisma.lorry.delete({ where: { id } })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to delete lorry", e)
        throw new Error("Failed to delete lorry (Ensure no routes are assigned)")
    }
}

export async function updateLorry(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can update lorries')
    }

    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const territoryId = parseInt(formData.get('territoryId') as string)

    if (!name || isNaN(territoryId) || isNaN(id)) {
        throw new Error('Missing required fields')
    }

    try {
        await prisma.lorry.update({
            where: { id },
            data: {
                name,
                territoryId
            }
        })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to update lorry", e)
        throw new Error("Failed to update lorry")
    }
}

export async function createRoute(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can create routes')
    }

    const name = formData.get('name') as string
    const lorryId = parseInt(formData.get('lorryId') as string)

    if (!name || isNaN(lorryId)) {
        throw new Error('Missing required fields')
    }

    try {
        await prisma.route.create({
            data: {
                name,
                lorryId
            }
        })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to create route", e)
        throw new Error("Failed to create route")
    }
}

export async function updateRoute(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can update routes')
    }

    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const lorryId = parseInt(formData.get('lorryId') as string)

    if (!name || isNaN(lorryId) || isNaN(id)) {
        throw new Error('Missing required fields')
    }

    try {
        await prisma.route.update({
            where: { id },
            data: {
                name,
                lorryId
            }
        })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to update route", e)
        throw new Error("Failed to update route")
    }
}

export async function deleteRoute(formData: FormData) {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    if (!sessionToken) throw new Error('Unauthorized')

    const session = await decrypt(sessionToken)
    if (!session || session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can delete routes')
    }

    const id = parseInt(formData.get('id') as string)

    try {
        await prisma.route.delete({ where: { id } })
        revalidatePath('/admin/logistics')
    } catch (e) {
        console.error("Failed to delete route", e)
        throw new Error("Failed to delete route (Ensure no shops are assigned)")
    }
}
