import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart } from "@/components/charts"
import Link from "next/link"
import { ArrowLeft, Edit, Trash, Plus, RefreshCw } from "lucide-react"
import { toggleTitleStatus } from "@/app/actions/title-actions"

export const revalidate = 3600 // Revalidate every hour

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

async function getTitleLicenses(id: string) {
  const licenses = await sql`
    SELECT l.license_id, l.start_date, l.end_date, l.is_active,
           cp.name as provider_name, cp.provider_id
    FROM license l
    JOIN contentprovider cp ON l.provider_id = cp.provider_id
    WHERE l.title_id = ${id}
    ORDER BY l.end_date DESC
  `

  return licenses
}

async function getTitleStats(id: string) {
  const viewStats = await sql`
    SELECT date, views
    FROM viewcount
    WHERE title_id = ${id}
    ORDER BY date
    LIMIT 30
  `

  const interactionStats = await sql`
    SELECT date, likes, list_adds
    FROM interactionstats
    WHERE title_id = ${id}
    ORDER BY date
    LIMIT 30
  `

  return {
    viewStats,
    interactionStats,
  }
}

export default async function TitlePage({ params }: { params: { id: string } }) {
  const title = await getTitle(params.id)

  if (!title) {
    notFound()
  }

  const genres = await getTitleGenres(params.id)
  const licenses = await getTitleLicenses(params.id)
  const stats = await getTitleStats(params.id)

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/titles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{title.name}</h1>
        <Badge variant={title.is_original ? "default" : "secondary"} className="ml-2">
          {title.is_original ? "Original" : "Licensed"}
        </Badge>
        {title.is_deleted && <Badge variant="destructive">Deleted</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Title Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd>{title.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Release Date</dt>
                <dd>{new Date(title.original_release_date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Origin</dt>
                <dd>
                  {title.country} ({title.language})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                <dd>{title.title_id}</dd>
              </div>
              {title.type !== "Movie" && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Seasons</dt>
                    <dd>{title.season_count || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Episodes</dt>
                    <dd>{title.episode_count || 0}</dd>
                  </div>
                </>
              )}
            </dl>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge key={genre.genre_id} variant="outline">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button asChild>
                <Link href={`/titles/${title.title_id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <form
                action={async () => {
                  "use server"
                  await toggleTitleStatus(title.title_id.toString(), title.is_deleted)
                }}
              >
                <Button variant={title.is_deleted ? "default" : "destructive"} type="submit">
                  {title.is_deleted ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Restore
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenses</CardTitle>
            <CardDescription>Content licensing agreements</CardDescription>
          </CardHeader>
          <CardContent>
            {licenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.license_id}>
                      <TableCell>
                        <Link href={`/providers/${license.provider_id}`} className="hover:underline">
                          {license.provider_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(license.start_date).toLocaleDateString()} -{" "}
                        {new Date(license.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {license.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No licenses found for this title</div>
            )}
            <div className="mt-4">
              <Button asChild>
                <Link href={`/licenses/new?title=${title.title_id}`}>
                  <Plus className="mr-2 h-4 w-4" /> Add License
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="views" className="mt-6">
        <TabsList>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>
        <TabsContent value="views" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>View Statistics</CardTitle>
              <CardDescription>View count over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {stats.viewStats.length > 0 ? (
                <LineChart
                  data={stats.viewStats.map((item) => ({
                    date: item.date,
                    total_views: item.views,
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No view data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="interactions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Interactions</CardTitle>
              <CardDescription>Likes and list additions over time</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Likes</h3>
                {stats.interactionStats.length > 0 ? (
                  <LineChart
                    data={stats.interactionStats.map((item) => ({
                      date: item.date,
                      total_views: Number(item.likes), // Changed from total_views to likes
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No like data available
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">List Additions</h3>
                {stats.interactionStats.length > 0 ? (
                  <LineChart
                    data={stats.interactionStats.map((item) => ({
                      date: item.date,
                      total_views: Number(item.list_adds), // Changed from total_views to list_adds
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No list addition data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
