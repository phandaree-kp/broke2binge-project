import { sql } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

async function getRecentTitles() {
  // This query combines original titles (sorted by release date) and licensed titles (sorted by license start date)
  const titles = await sql`
    WITH combined_titles AS (
      -- Original titles with release date
      SELECT 
        t.title_id, 
        t.name, 
        t.type, 
        t.original_release_date, 
        t.is_original,
        t.is_deleted,
        o.country, 
        o.language,
        t.original_release_date AS sort_date
      FROM title t
      JOIN origin o ON t.origin_id = o.origin_id
      WHERE t.is_original = true
      
      UNION ALL
      
      -- Licensed titles with license start date
      SELECT 
        t.title_id, 
        t.name, 
        t.type, 
        t.original_release_date, 
        t.is_original,
        t.is_deleted,
        o.country, 
        o.language,
        l.start_date AS sort_date
      FROM title t
      JOIN origin o ON t.origin_id = o.origin_id
      JOIN license l ON t.title_id = l.title_id
      WHERE t.is_original = false
    )
    
    SELECT 
      ct.title_id, 
      ct.name, 
      ct.type, 
      ct.original_release_date, 
      ct.is_original,
      ct.is_deleted,
      ct.country, 
      ct.language,
      ct.sort_date,
      ARRAY_AGG(DISTINCT g.name) as genres,
      (SELECT SUM(views) FROM viewcount WHERE title_id = ct.title_id) as total_views
    FROM combined_titles ct
    LEFT JOIN title_genre tg ON ct.title_id = tg.title_id
    LEFT JOIN genre g ON tg.genre_id = g.genre_id
    GROUP BY 
      ct.title_id, 
      ct.name, 
      ct.type, 
      ct.original_release_date, 
      ct.is_original,
      ct.is_deleted,
      ct.country, 
      ct.language,
      ct.sort_date
    ORDER BY ct.sort_date DESC
    LIMIT 10
  `

  return titles
}

export async function RecentTitles() {
  const titles = await getRecentTitles()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Release Date</TableHead>
          <TableHead>Origin</TableHead>
          <TableHead>Genres</TableHead>
          <TableHead>Views</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {titles.map((title) => (
          <TableRow key={title.title_id}>
            <TableCell className="font-medium">{title.name}</TableCell>
            <TableCell>{title.type}</TableCell>
            <TableCell>{new Date(title.original_release_date).toLocaleDateString()}</TableCell>
            <TableCell>
              {title.country} ({title.language})
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {title.genres.slice(0, 2).map((genre: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {genre}
                  </Badge>
                ))}
                {title.genres.length > 2 && <Badge variant="outline">+{title.genres.length - 2}</Badge>}
              </div>
            </TableCell>
            <TableCell>{title.total_views ? Number(title.total_views).toLocaleString() : "0"}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge variant={title.is_original ? "default" : "secondary"}>
                  {title.is_original ? "Original" : "Licensed"}
                </Badge>
                {title.is_deleted && <Badge variant="destructive">Deleted</Badge>}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/titles/${title.title_id}`} className="text-primary hover:underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
