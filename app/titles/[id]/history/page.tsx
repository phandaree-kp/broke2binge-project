import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function getTitle(id: string) {
  const titles = await sql`
    SELECT t.title_id, t.name, t.is_deleted
    FROM title t
    WHERE t.title_id = ${id}
  `

  if (titles.length === 0) {
    return null
  }

  return titles[0]
}

// In a real application, you would have a history table
// For this mockup, we'll simulate history events
async function getTitleHistory(id: string) {
  const title = await getTitle(id)

  if (!title) {
    return []
  }

  // Create a simulated history based on title data
  const history = [
    {
      id: 1,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      action: "Created",
      user: "Admin",
      details: "Title was created",
    },
  ]

  // If the title is deleted, add a delete event
  if (title.is_deleted) {
    // Add a simulated date for deletion (15 days ago)
    history.push({
      id: 3,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      action: "Deleted",
      user: "Admin",
      details: "Title was soft-deleted",
    })
  }

  // Add a simulated update event
  history.push({
    id: 2,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
    action: "Updated",
    user: "Admin",
    details: "Title information was updated",
  })

  return history.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export default async function TitleHistoryPage({ params }: { params: { id: string } }) {
  const title = await getTitle(params.id)

  if (!title) {
    notFound()
  }

  const history = await getTitleHistory(params.id)

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/titles/${title.title_id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Title History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title.name}</span>
            <Badge variant={title.is_deleted ? "destructive" : "outline"}>
              {title.is_deleted ? "Deleted" : "Active"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.action === "Created" ? "default" : item.action === "Updated" ? "secondary" : "destructive"
                      }
                    >
                      {item.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.user}</TableCell>
                  <TableCell>{item.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
