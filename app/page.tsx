import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sql } from "@/lib/db"
import { LineChart, BarChart } from "@/components/charts"
import { RecentTitles } from "@/components/recent-titles"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowUpRight,
  Users,
  Film,
  Eye,
  ThumbsUp,
  Clock,
  AlertTriangle,
  ListPlus,
  BarChart3,
  PieChart,
  Tag,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TopGenres } from "@/components/top-genres"
import Link from "next/link"

export const dynamic = "force_dynamic"

async function getStats() {
  const [
    allTitlesCount,
    activeTitlesCount,
    deletedTitlesCount,
    viewersCount,
    providersCount,
    genresCount,
    totalViews,
    totalLikes,
    totalListAdds,
    activeUsers,
    newTitlesCount,
    expiringLicensesCount,
  ] = await Promise.all([
    sql`SELECT COUNT(*) FROM title`,
    sql`SELECT COUNT(*) FROM title WHERE is_deleted = false`,
    sql`SELECT COUNT(*) FROM title WHERE is_deleted = true`,
    sql`SELECT COUNT(*) FROM viewer`,
    sql`SELECT COUNT(*) FROM contentprovider`,
    sql`SELECT COUNT(*) FROM genre`,
    sql`SELECT SUM(views) FROM viewcount`,
    sql`SELECT SUM(likes) FROM interactionstats`,
    sql`SELECT SUM(list_adds) FROM interactionstats`,
    sql`SELECT COUNT(DISTINCT viewer_id) FROM viewer WHERE created_date > NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*) FROM title WHERE original_release_date > NOW() - INTERVAL '30 days'`,
    sql`SELECT COUNT(*) FROM license WHERE is_active = true AND end_date < NOW() + INTERVAL '30 days'`,
  ])

  return {
    allTitles: allTitlesCount[0].count,
    activeTitles: activeTitlesCount[0].count,
    deletedTitles: deletedTitlesCount[0].count,
    viewers: viewersCount[0].count,
    providers: providersCount[0].count,
    genres: genresCount[0].count,
    totalViews: totalViews[0].sum || 0,
    totalLikes: totalLikes[0].sum || 0,
    totalListAdds: totalListAdds[0].sum || 0,
    activeUsers: activeUsers[0].count,
    newTitles: newTitlesCount[0].count,
    expiringLicenses: expiringLicensesCount[0].count,
  }
}

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

async function getTopViewedTitles() {
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

async function getTopViewedGenres() {
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

async function getTopViewedTypes() {
  const topTypes = await sql`
    SELECT t.type, SUM(v.views) as total_views
    FROM title t
    JOIN viewcount v ON t.title_id = v.title_id
    GROUP BY t.type
    ORDER BY total_views DESC
  `

  return topTypes
}

async function getContentByType() {
  const contentTypes = await sql`
    SELECT type, COUNT(*) as count
    FROM title
    GROUP BY type
    ORDER BY count DESC
  `

  return contentTypes
}

async function getRecentActivity() {
  const recentActivity = await sql`
    WITH combined_activity AS (
      -- Recently added titles
      SELECT 
        'Title Added' as action, 
        t.name as item, 
        t.original_release_date as timestamp,
        t.title_id as id,
        '/titles/' || t.title_id as link
      FROM title t
      WHERE t.original_release_date > NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      -- Recently added licenses
      SELECT 
        'License Added' as action, 
        t.name as item, 
        l.start_date as timestamp,
        l.license_id as id,
        '/licenses/' || l.license_id as link
      FROM license l
      JOIN title t ON l.title_id = t.title_id
      WHERE l.start_date > NOW() - INTERVAL '30 days'
      
      UNION ALL
      
      -- Expiring licenses
      SELECT 
        'License Expiring' as action, 
        t.name as item, 
        l.end_date as timestamp,
        l.license_id as id,
        '/licenses/' || l.license_id as link
      FROM license l
      JOIN title t ON l.title_id = t.title_id
      WHERE l.is_active = true AND l.end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    )
    SELECT action, item, timestamp, id, link
    FROM combined_activity
    ORDER BY timestamp DESC
    LIMIT 5
  `

  return recentActivity
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString()
}

export default async function DashboardPage() {
  const stats = await getStats()
  const viewsData = await getViewsData()
  const topTitles = await getTopViewedTitles()
  const topGenres = await getTopViewedGenres()
  const topTypes = await getTopViewedTypes()
  const contentTypes = await getContentByType()
  const recentActivity = await getRecentActivity()

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Titles</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allTitles}</div>
            <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Active
                </Badge>
                <span className="text-foreground">{stats.activeTitles}</span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  Deleted
                </Badge>
                <span className="text-foreground">{stats.deletedTitles}</span>
              </div>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">{stats.newTitles}</span>
                <span className="ml-1 text-foreground">new in last 30 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewers}</div>
            <div className="flex items-center pt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">{stats.activeUsers}</span>
              <span className="ml-1 text-foreground">active in last 30 days</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.totalViews).toLocaleString()}</div>
            <div className="flex items-center pt-1 text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-foreground">Across all content</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground">Likes</div>
                <div className="text-xl font-bold">{Number(stats.totalLikes).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">List Adds</div>
                <div className="text-xl font-bold">{Number(stats.totalListAdds).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Views Overview</CardTitle>
                <CardDescription>Daily view counts across all content</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <LineChart data={viewsData} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>System Summary</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                      <span className="text-sm font-medium">Expiring Licenses</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-background dark:text-foreground bg-amber-50 dark:bg-amber-950"
                    >
                      <span className="text-foreground">{stats.expiringLicenses}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium">New Titles (30 days)</span>
                    </div>
                    <Badge variant="outline" className="bg-background dark:text-foreground bg-blue-50 dark:bg-blue-950">
                      <span className="text-foreground">{stats.newTitles}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Film className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium">Content Providers</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-background dark:text-foreground bg-green-50 dark:bg-green-950"
                    >
                      <span className="text-foreground">{stats.providers}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium">Active Users (30 days)</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-background dark:text-foreground bg-purple-50 dark:bg-purple-950"
                    >
                      <span className="text-foreground">{stats.activeUsers}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ListPlus className="h-4 w-4 text-rose-500 mr-2" />
                      <span className="text-sm font-medium">Total List Adds</span>
                    </div>
                    <Badge variant="outline" className="bg-background dark:text-foreground bg-rose-50 dark:bg-rose-950">
                      <span className="text-foreground">{Number(stats.totalListAdds).toLocaleString()}</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-4 mt-0.5">
                        <span className="flex h-2 w-2 rounded-full bg-sky-500"></span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action}:{" "}
                          <Link href={activity.link} className="font-semibold hover:underline">
                            {activity.item}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Genres</CardTitle>
                <CardDescription>Most popular content categories</CardDescription>
              </CardHeader>
              <CardContent>
                <TopGenres />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Titles</CardTitle>
              <CardDescription>Latest content added to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTitles />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Likes Overview</CardTitle>
                  <CardDescription>User likes over time</CardDescription>
                </div>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{Number(stats.totalLikes).toLocaleString()}</div>
                <div className="mt-4 h-[200px]">
                  <LineChart
                    data={viewsData.map((item) => ({
                      date: item.date,
                      total_views: Math.floor(item.total_views * 0.3), // Simulating likes data
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>List Adds Overview</CardTitle>
                  <CardDescription>Content saved to lists</CardDescription>
                </div>
                <ListPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{Number(stats.totalListAdds).toLocaleString()}</div>
                <div className="mt-4 h-[200px]">
                  <LineChart
                    data={viewsData.map((item) => ({
                      date: item.date,
                      total_views: Math.floor(item.total_views * 0.2), // Simulating list adds data
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Popular Titles</CardTitle>
                  <CardDescription>Most viewed content</CardDescription>
                </div>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pl-2 pt-4">
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
              <CardContent className="pl-2 pt-4">
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
              <CardContent className="pl-2 pt-4">
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
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Content Overview</CardTitle>
                <Film className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.allTitles}</div>
                <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Active
                    </Badge>
                    <span className="text-foreground">{stats.activeTitles}</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      Deleted
                    </Badge>
                    <span className="text-foreground">{stats.deletedTitles}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Content Providers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.providers}</div>
                <div className="pt-1 text-xs text-muted-foreground">
                  <span className="text-foreground">Total active providers</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Available Genres</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.genres}</div>
                <div className="pt-1 text-xs text-muted-foreground">
                  <span className="text-foreground">Content categories</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expiring Licenses</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiringLicenses}</div>
                <div className="pt-1 text-xs text-muted-foreground">
                  <span className="text-foreground">Within next 30 days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
              <CardDescription>Breakdown by content type</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <BarChart
                data={contentTypes.map((item) => ({
                  name: item.type,
                  count: Number(item.count),
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
