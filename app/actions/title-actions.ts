"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createTitle(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const originId = formData.get("originId") as string
    const originalReleaseDate = formData.get("originalReleaseDate") as string
    const isOriginal = formData.get("isOriginal") === "true"
    const seasonCount = type === "Series" ? Number.parseInt(formData.get("seasonCount") as string) : null
    const episodeCount = type === "Series" ? Number.parseInt(formData.get("episodeCount") as string) : null
    const selectedGenres = JSON.parse(formData.get("selectedGenres") as string)

    // Insert the title
    const result = await sql`
      INSERT INTO title (
        name, 
        type, 
        origin_id, 
        original_release_date, 
        is_original, 
        season_count, 
        episode_count, 
        is_deleted
      )
      VALUES (
        ${name}, 
        ${type}, 
        ${originId}, 
        ${originalReleaseDate}, 
        ${isOriginal}, 
        ${seasonCount}, 
        ${episodeCount}, 
        false
      )
      RETURNING title_id
    `

    const titleId = result[0].title_id

    // Insert genre associations
    if (selectedGenres && selectedGenres.length > 0) {
      for (const genreId of selectedGenres) {
        await sql`
          INSERT INTO title_genre (title_id, genre_id)
          VALUES (${titleId}, ${genreId})
        `
      }
    }

    revalidatePath("/titles")
    return { success: true, titleId }
  } catch (error) {
    console.error("Error creating title:", error)
    return { success: false, error: "Failed to create title" }
  }
}

export async function updateTitle(titleId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const originId = formData.get("originId") as string
    const originalReleaseDate = formData.get("originalReleaseDate") as string
    const isOriginal = formData.get("isOriginal") === "true"
    const seasonCount = type === "Series" ? Number.parseInt(formData.get("seasonCount") as string) : null
    const episodeCount = type === "Series" ? Number.parseInt(formData.get("episodeCount") as string) : null
    const selectedGenres = JSON.parse(formData.get("selectedGenres") as string)

    // Update the title
    await sql`
      UPDATE title
      SET 
        name = ${name}, 
        type = ${type}, 
        origin_id = ${originId}, 
        original_release_date = ${originalReleaseDate}, 
        is_original = ${isOriginal}, 
        season_count = ${seasonCount}, 
        episode_count = ${episodeCount}
      WHERE title_id = ${titleId}
    `

    // Delete existing genre associations
    await sql`
      DELETE FROM title_genre
      WHERE title_id = ${titleId}
    `

    // Insert new genre associations
    if (selectedGenres && selectedGenres.length > 0) {
      for (const genreId of selectedGenres) {
        await sql`
          INSERT INTO title_genre (title_id, genre_id)
          VALUES (${titleId}, ${genreId})
        `
      }
    }

    revalidatePath(`/titles/${titleId}`)
    revalidatePath("/titles")
    return { success: true }
  } catch (error) {
    console.error("Error updating title:", error)
    return { success: false, error: "Failed to update title" }
  }
}

export async function toggleTitleStatus(titleId: string, isDeleted: boolean) {
  try {
    await sql`
      UPDATE title
      SET 
        is_deleted = ${!isDeleted}
      WHERE title_id = ${titleId}
    `

    revalidatePath(`/titles/${titleId}`)
    revalidatePath("/titles")
    return { success: true }
  } catch (error) {
    console.error("Error toggling title status:", error)
    return { success: false, error: "Failed to update title status" }
  }
}
