"use server"

import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export async function getTokenServerAction() {
    const cookieStore = await cookies()
    const req = new NextRequest("http://localhost", {
        headers: { cookie: cookieStore.toString() },
    })

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.accessToken) {
        throw new Error("No hay token de autenticación disponible")
    }

    return token.accessToken as string
}
