import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { TitleForm } from "@/components/title-form"

export const dynamic = "force_dynamic"

async function getTitle(id: string) {
  const titles = await sql`
    SELECT t.title_id, t.name, t.type, t.original_release_date, t.is_original, 
           t.season_count, t.episode_count, t.is_deleted,
           o.country, o.language, o.origin_id
    FROM title t
    JOIN origin o ON t.origin_id = o.origin_id
    WHERE t.title_id = ${id}
  `

  if (titles.length === 0) {
    return null
  }

  return titles[0]
}

async function getTitleGenres(id: string) {
  const genres = await sql`
    SELECT g.genre_id, g.name
    FROM genre g
    JOIN title_genre tg ON g.genre_id = tg.genre_id
    WHERE tg.title_id = ${id}
    ORDER BY g.name
  `

  return genres
}

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

export default async function EditTitlePage({ params }: { params: { id: string } }) {
  const title = await getTitle(params.id)

  if (!title) {
    notFound()
  }

  const titleGenres = await getTitleGenres(params.id)
  const allGenres = await getAllGenres()
  const allOrigins = await getAllOrigins()
  const allTypes = await getAllTypes()

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Edit Title</h1>
      <TitleForm
        title={title}
        titleGenres={titleGenres}
        allGenres={allGenres}
        allOrigins={allOrigins}
        allTypes={allTypes}
        isEditing={true}
      />
    </div>
  )
}
