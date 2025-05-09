"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createGenre(formData: FormData) {
  try {
    const name = formData.get("name") as string

    await sql`
      INSERT INTO genre (name)
      VALUES (${name})
    `

    revalidatePath("/genres")
    redirect("/genres")
    return { success: true }
  } catch (error) {
    console.error("Error creating genre:", error)
    return { success: false, error: "Failed to create genre" }
  }
}

export async function updateGenre(genreId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string

    await sql`
      UPDATE genre
      SET name = ${name}
      WHERE genre_id = ${genreId}
    `

    revalidatePath("/genres")
    redirect("/genres")
    return { success: true }
  } catch (error) {
    console.error("Error updating genre:", error)
    return { success: false, error: "Failed to update genre" }
  }
}

export async function deleteGenre(genreId: string) {
  try {
    // First delete associations
    await sql`
      DELETE FROM title_genre
      WHERE genre_id = ${genreId}
    `

    // Then delete the genre
    await sql`
      DELETE FROM genre
      WHERE genre_id = ${genreId}
    `

    revalidatePath("/genres")
    return { success: true }
  } catch (error) {
    console.error("Error deleting genre:", error)
    return { success: false, error: "Failed to delete genre" }
  }
}
