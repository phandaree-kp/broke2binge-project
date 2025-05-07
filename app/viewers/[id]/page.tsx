import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"

export const dynamic = "force-dynamic"

async function getViewer(id: string) {
  const viewers = await sql`
    SELECT viewer_id, username, email, created_date
    FROM viewer
    WHERE viewer_id = ${id}
  `

  if (viewers.length === 0) {
    return null
  }

  return viewers[0]
}

async function getViewerActivity(id: string) {
  // This is a mock query since we don't have actual viewer activity tables
  // In a real application, you would query actual activity data
  const mockActivity = [
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      action: "Watched",
      title: "Stranger Things",
      duration: "45 minutes",
    },
    { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), action: "Liked", title: "The Crown", duration: null },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      action: "Added to List",
      title: "Breaking Bad",
      duration: null,
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      action: "Watched",
      title: "The Queen's Gambit",
      duration: "58 minutes",
    },
    {
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      action: "Watched",
      title: "Ozark",
      duration: "52 minutes",
    },
  ]

  return mockActivity
}

export default async function ViewerPage({ params }: { params: { id: string } }) {
  const viewer = await getViewer(params.id)

  if (!viewer) {
    notFound()
  }

  const activity = await getViewerActivity(params.id)

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/viewers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Viewer Profile</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">{viewer.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{viewer.username}</h2>
                <p className="text-muted-foreground">{viewer.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                <dd>{viewer.viewer_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Joined</dt>
                <dd>{new Date(viewer.created_date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Account Status</dt>
                <dd>Active</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Subscription</dt>
                <dd>Premium</dd>
              </div>
            </dl>
            <div className="flex gap-2 mt-6">
              <Button asChild>
                <Link href={`/viewers/${viewer.viewer_id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Viewing Statistics</CardTitle>
            <CardDescription>User activity summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Total Watch Time</div>
                <div className="text-2xl font-bold mt-1">42.5 hours</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Titles Watched</div>
                <div className="text-2xl font-bold mt-1">18</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">Likes</div>
                <div className="text-2xl font-bold mt-1">12</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium text-muted-foreground">List Items</div>
                <div className="text-2xl font-bold mt-1">7</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="mt-6">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User's recent interactions with content</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.date.toLocaleDateString()}</TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.duration || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Viewer Preferences</CardTitle>
              <CardDescription>User's content preferences and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Favorite Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">Drama</div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">Sci-Fi</div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">Thriller</div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">Comedy</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Language Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">English</div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm">Spanish</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Viewing Habits</h3>
                  <div className="text-sm">
                    <p>Most active on: Weekends</p>
                    <p>Peak viewing time: 8:00 PM - 11:00 PM</p>
                    <p>Average session: 2.5 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
