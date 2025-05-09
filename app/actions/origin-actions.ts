"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createOrigin(formData: FormData) {
  try {
    const country = formData.get("country") as string
    const language = formData.get("language") as string

    await sql`
      INSERT INTO origin (country, language)
      VALUES (${country}, ${language})
    `

    revalidatePath("/origins")
    redirect("/origins")
    return { success: true }
  } catch (error) {
    console.error("Error creating origin:", error)
    return { success: false, error: "Failed to create origin" }
  }
}

export async function updateOrigin(originId: string, formData: FormData) {
  try {
    const country = formData.get("country") as string
    const language = formData.get("language") as string

    await sql`
      UPDATE origin
      SET country = ${country}, language = ${language}
      WHERE origin_id = ${originId}
    `

    revalidatePath("/origins")
    redirect("/origins")
    return { success: true }
  } catch (error) {
    console.error("Error updating origin:", error)
    return { success: false, error: "Failed to update origin" }
  }
}

export async function deleteOrigin(originId: string) {
  try {
    // Check if origin is in use
    const titles = await sql`
      SELECT COUNT(*) as count
      FROM title
      WHERE origin_id = ${originId}
    `

    if (titles[0].count > 0) {
      return { success: false, error: "Cannot delete origin that is in use by titles" }
    }

    // Delete the origin
    await sql`
      DELETE FROM origin
      WHERE origin_id = ${originId}
    `

    revalidatePath("/origins")
    return { success: true }
  } catch (error) {
    console.error("Error deleting origin:", error)
    return { success: false, error: "Failed to delete origin" }
  }
}
