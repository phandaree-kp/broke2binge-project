import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart } from "@/components/charts"
import { ThumbsUp, ListPlus, BarChart3, PieChart } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

async function getViewsData() {
  const viewsData = await sql`
    SELECT date, SUM(views) as total_views
    FROM viewcount
    GROUP BY date
    ORDER BY date
    LIMIT 30
  `

  return viewsData
}

async function getInteractionData() {
  const interactionData = await sql`
    SELECT date, SUM(likes) as total_likes, SUM(list_adds) as total_list_adds
    FROM interactionstats
    GROUP BY date
    ORDER BY date
    LIMIT 30
  `

  return interactionData
}

async function getTopTitles() {
  const topTitles = await sql`
    SELECT t.name, SUM(v.views) as total_views
    FROM title t
    JOIN viewcount v ON t.title_id = v.title_id
    GROUP BY t.name
    ORDER BY total_views DESC
    LIMIT 10
  `

  return topTitles
}

async function getTopGenres() {
  const topGenres = await sql`
    SELECT g.name, SUM(v.views) as total_views
    FROM genre g
    JOIN title_genre tg ON g.genre_id = tg.genre_id
    JOIN title t ON tg.title_id = t.title_id
    JOIN viewcount v ON t.title_id = v.title_id
    GROUP BY g.name
    ORDER BY total_views DESC
    LIMIT 10
  `

  return topGenres
}

async function getTopTypes() {
  const topTypes = await sql`
    SELECT t.type, SUM(v.views) as total_views
    FROM title t
    JOIN viewcount v ON t.title_id = v.title_id
    GROUP BY t.type
    ORDER BY total_views DESC
  `

  return topTypes
}

export default async function AnalyticsPage() {
  const viewsData = await getViewsData()
  const interactionData = await getInteractionData()
  const topTitles = await getTopTitles()
  const topGenres = await getTopGenres()
  const topTypes = await getTopTypes()

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
      </div>

      <Tabs defaultValue="views">
        <TabsList>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="popular">Popular Content</TabsTrigger>
        </TabsList>
        <TabsContent value="views" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>Total views across all titles in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <LineChart data={viewsData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="interactions" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Likes Over Time</CardTitle>
                  <CardDescription>Total likes in the last 30 days</CardDescription>
                </div>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <LineChart
                  data={interactionData.map((item) => ({
                    date: item.date,
                    total_views: Number(item.total_likes),
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>List Adds Over Time</CardTitle>
                  <CardDescription>Total list additions in the last 30 days</CardDescription>
                </div>
                <ListPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <LineChart
                  data={interactionData.map((item) => ({
                    date: item.date,
                    total_views: Number(item.total_list_adds),
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="popular" className="pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Popular Titles</CardTitle>
                  <CardDescription>Most viewed content</CardDescription>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart
                  data={topTitles.map((item) => ({
                    name: item.name,
                    count: Number(item.total_views),
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Popular Genres</CardTitle>
                  <CardDescription>Most viewed genres</CardDescription>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart
                  data={topGenres.map((item) => ({
                    name: item.name,
                    count: Number(item.total_views),
                  }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Popular Types</CardTitle>
                  <CardDescription>Most viewed content types</CardDescription>
                </div>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart
                  data={topTypes.map((item) => ({
                    name: item.type,
                    count: Number(item.total_views),
                  }))}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
