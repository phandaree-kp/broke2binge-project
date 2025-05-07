import { sql } from "@/lib/db"
import { Progress } from "@/components/ui/progress"

async function getTopGenres() {
  const genres = await sql`
    SELECT g.name, COUNT(tg.title_id) as count
    FROM genre g
    JOIN title_genre tg ON g.genre_id = tg.genre_id
    JOIN title t ON tg.title_id = t.title_id
    WHERE t.is_deleted = false
    GROUP BY g.name
    ORDER BY count DESC
    LIMIT 5
  `

  // Get the maximum count for percentage calculation
  const maxCount = Math.max(...genres.map((g) => g.count))

  return genres.map((genre) => ({
    ...genre,
    percentage: Math.round((genre.count / maxCount) * 100),
  }))
}

export async function TopGenres() {
  const genres = await getTopGenres()

  return (
    <div className="space-y-4">
      {genres.map((genre, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{genre.name}</span>
            <span className="text-sm text-muted-foreground">{genre.count} titles</span>
          </div>
          <Progress value={genre.percentage} className="h-2" />
        </div>
      ))}
    </div>
  )
}
