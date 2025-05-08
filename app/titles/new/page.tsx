import { sql } from "@/lib/db"
import { TitleForm } from "@/components/title-form"

export const dynamic = "force-dynamic"

async function getAllGenres() {
  const genres = await sql`
    SELECT genre_id, name
    FROM genre
    ORDER BY name
  `

  return genres
}

async function getAllOrigins() {
  const origins = await sql`
    SELECT origin_id, country, language
    FROM origin
    ORDER BY origin_id
  `

  return origins
}

async function getAllTypes() {
  const types = await sql`
    SELECT DISTINCT type
    FROM title
    ORDER BY type
  `

  return types
}

export default async function NewTitlePage() {
  const allGenres = await getAllGenres()
  const allOrigins = await getAllOrigins()
  const allTypes = await getAllTypes()

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New Title</h1>
      <TitleForm allGenres={allGenres} allOrigins={allOrigins} allTypes={allTypes} isEditing={false} />
    </div>
  )
}
