import { createOrigin } from "@/app/actions/origin-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NewOriginPage() {
  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await createOrigin(formData)
    if (result.success) {
      redirect("/origins")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New Origin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Origin Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" name="language" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/origins">Cancel</Link>
              </Button>
              <Button type="submit">Create Origin</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
