"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createAdmin(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string // Add password
    const role = formData.get("role") as string
    const isDeleted = false

    await sql`
      INSERT INTO admin (username, email, password, role, created_date, is_deleted)
      VALUES (${username}, ${email}, ${password}, ${role}, NOW(), ${isDeleted})
    `

    revalidatePath("/admins")
    return { success: true }
  } catch (error) {
    console.error("Error creating admin:", error)
    return { success: false, error: "Failed to create admin" }
  }
}

export async function updateAdmin(adminId: string, formData: FormData) {
  try {
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const password = formData.get("password") as string

    // If password is provided, update it too
    if (password) {
      await sql`
        UPDATE admin
        SET username = ${username}, email = ${email}, role = ${role}, password = ${password}
        WHERE admin_id = ${adminId}
      `
    } else {
      await sql`
        UPDATE admin
        SET username = ${username}, email = ${email}, role = ${role}
        WHERE admin_id = ${adminId}
      `
    }

    revalidatePath(`/admins/${adminId}`)
    revalidatePath("/admins")
    return { success: true }
  } catch (error) {
    console.error("Error updating admin:", error)
    return { success: false, error: "Failed to update admin" }
  }
}

export async function toggleAdminStatus(adminId: string, isDeleted: boolean) {
  try {
    await sql`
      UPDATE admin
      SET is_deleted = ${!isDeleted}
      WHERE admin_id = ${adminId}
    `

    revalidatePath(`/admins/${adminId}`)
    revalidatePath("/admins")
    return { success: true }
  } catch (error) {
    console.error("Error toggling admin status:", error)
    return { success: false, error: "Failed to update admin status" }
  }
}
