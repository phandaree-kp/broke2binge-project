import { createGenre } from "@/app/actions/genre-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NewGenrePage() {
  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await createGenre(formData)
    if (result.success) {
      redirect("/genres")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New Genre</h1>
      <Card>
        <CardHeader>
          <CardTitle>Genre Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Genre Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/genres">Cancel</Link>
              </Button>
              <Button type="submit">Create Genre</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
