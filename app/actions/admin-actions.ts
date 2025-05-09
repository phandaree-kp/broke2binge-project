"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as crypto from "crypto"

// Function to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function createAdmin(formData: FormData) {
  try {
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const password = formData.get("password") as string
    const isDeleted = false

    // Hash the password
    const passwordHash = hashPassword(password)

    // Check if the admin table has a password_hash column
    const tableInfo = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'admin' AND column_name = 'password_hash'
    `

    if (tableInfo.length > 0) {
      // If password_hash column exists, include it in the query
      await sql`
        INSERT INTO admin (username, email, password_hash, role, created_date, is_deleted)
        VALUES (${username}, ${email}, ${passwordHash}, ${role}, CURRENT_TIMESTAMP, ${isDeleted})
      `
    } else {
      // If password_hash column doesn't exist, try to create it
      try {
        await sql`
          ALTER TABLE admin ADD COLUMN password_hash TEXT
        `

        // Now insert with the password_hash
        await sql`
          INSERT INTO admin (username, email, password_hash, role, created_date, is_deleted)
          VALUES (${username}, ${email}, ${passwordHash}, ${role}, CURRENT_TIMESTAMP, ${isDeleted})
        `
      } catch (error) {
        console.error("Error adding password_hash column:", error)

        // Fall back to inserting without password_hash
        await sql`
          INSERT INTO admin (username, email, role, created_date, is_deleted)
          VALUES (${username}, ${email}, ${role}, CURRENT_TIMESTAMP, ${isDeleted})
        `
      }
    }

    revalidatePath("/admins")
    redirect("/admins")
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

    // Check if the admin table has a password_hash column
    const tableInfo = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'admin' AND column_name = 'password_hash'
    `

    if (tableInfo.length > 0 && password) {
      // If password_hash column exists and password is provided, update it too
      const passwordHash = hashPassword(password)
      await sql`
        UPDATE admin
        SET username = ${username}, email = ${email}, role = ${role}, password_hash = ${passwordHash}
        WHERE admin_id = ${adminId}
      `
    } else {
      // Otherwise, update without password_hash
      await sql`
        UPDATE admin
        SET username = ${username}, email = ${email}, role = ${role}
        WHERE admin_id = ${adminId}
      `
    }

    revalidatePath(`/admins/${adminId}`)
    revalidatePath("/admins")
    redirect("/admins")
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
