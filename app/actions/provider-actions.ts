"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProvider(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string
    const isDeleted = false

    await sql`
      INSERT INTO contentprovider (name, email, phone, address, is_deleted)
      VALUES (${name}, ${email}, ${phone}, ${address}, ${isDeleted})
    `

    revalidatePath("/providers")
    redirect("/providers")
    return { success: true }
  } catch (error) {
    console.error("Error creating provider:", error)
    return { success: false, error: "Failed to create provider" }
  }
}

export async function updateProvider(providerId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const address = formData.get("address") as string

    await sql`
      UPDATE contentprovider
      SET name = ${name}, email = ${email}, phone = ${phone}, address = ${address}
      WHERE provider_id = ${providerId}
    `

    revalidatePath(`/providers/${providerId}`)
    revalidatePath("/providers")
    redirect("/providers")
    return { success: true }
  } catch (error) {
    console.error("Error updating provider:", error)
    return { success: false, error: "Failed to update provider" }
  }
}

export async function toggleProviderStatus(providerId: string, isDeleted: boolean) {
  try {
    await sql`
      UPDATE contentprovider
      SET is_deleted = ${!isDeleted}
      WHERE provider_id = ${providerId}
    `

    revalidatePath(`/providers/${providerId}`)
    revalidatePath("/providers")
    return { success: true }
  } catch (error) {
    console.error("Error toggling provider status:", error)
    return { success: false, error: "Failed to update provider status" }
  }
}
