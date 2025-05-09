"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLicense(formData: FormData) {
  try {
    const titleId = formData.get("titleId") as string
    const providerId = formData.get("providerId") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const isActive = true
    const isDeleted = false

    await sql`
      INSERT INTO license (title_id, provider_id, start_date, end_date, is_active, is_deleted)
      VALUES (${titleId}, ${providerId}, ${startDate}, ${endDate}, ${isActive}, ${isDeleted})
    `

    revalidatePath("/licenses")
    revalidatePath(`/titles/${titleId}`)
    redirect("/licenses")
    return { success: true }
  } catch (error) {
    console.error("Error creating license:", error)
    return { success: false, error: "Failed to create license" }
  }
}

export async function updateLicense(licenseId: string, formData: FormData) {
  try {
    const titleId = formData.get("titleId") as string
    const providerId = formData.get("providerId") as string
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const isActive = formData.get("isActive") === "true"

    await sql`
      UPDATE license
      SET title_id = ${titleId}, provider_id = ${providerId}, 
          start_date = ${startDate}, end_date = ${endDate}, is_active = ${isActive}
      WHERE license_id = ${licenseId}
    `

    revalidatePath(`/licenses/${licenseId}`)
    revalidatePath("/licenses")
    revalidatePath(`/titles/${titleId}`)
    redirect("/licenses")
    return { success: true }
  } catch (error) {
    console.error("Error updating license:", error)
    return { success: false, error: "Failed to update license" }
  }
}

export async function toggleLicenseStatus(licenseId: string, isDeleted: boolean) {
  try {
    await sql`
      UPDATE license
      SET is_deleted = ${!isDeleted}
      WHERE license_id = ${licenseId}
    `

    revalidatePath(`/licenses/${licenseId}`)
    revalidatePath("/licenses")
    return { success: true }
  } catch (error) {
    console.error("Error toggling license status:", error)
    return { success: false, error: "Failed to update license status" }
  }
}
