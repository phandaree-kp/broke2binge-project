import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sql } from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export default async function AddViewDataPage({ params }: { params: { id: string } }) {
  // Check if title exists
  const title = await sql`
    SELECT name FROM title WHERE title_id = ${params.id}
  `

  if (title.length === 0) {
    redirect("/titles")
  }

  async function addViewData(formData: FormData) {
    "use server"

    const date = formData.get("date") as string
    const views = Number.parseInt(formData.get("views") as string)

    try {
      // Check if there's already an entry for this date
      const existingEntry = await sql`
        SELECT * FROM viewcount 
        WHERE title_id = ${params.id} AND date = ${date}
      `

      if (existingEntry.length > 0) {
        // Update existing entry
        await sql`
          UPDATE viewcount 
          SET views = ${views}
          WHERE title_id = ${params.id} AND date = ${date}
        `
      } else {
        // Insert new entry
        await sql`
          INSERT INTO viewcount (title_id, date, views)
          VALUES (${params.id}, ${date}, ${views})
        `
      }

      revalidatePath(`/titles/${params.id}`)
      redirect(`/titles/${params.id}`)
    } catch (error) {
      console.error("Error adding view data:", error)
      return { success: false, error: "Failed to add view data" }
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add View Data</h1>
        <Button variant="outline" asChild>
          <Link href={`/titles/${params.id}`}>Back to Title</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View Data for {title[0]?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addViewData} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="views">Views</Label>
              <Input id="views" name="views" type="number" min="0" defaultValue="0" required />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/titles/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Save View Data</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
