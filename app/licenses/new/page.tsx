import { createLicense } from "@/app/actions/license-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sql } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { redirect } from "next/navigation"

async function getTitles() {
  const titles = await sql`
    SELECT title_id, name
    FROM title
    ORDER BY title_id ASC
  `
  return titles
}

async function getProviders() {
  const providers = await sql`
    SELECT provider_id, name
    FROM contentprovider
    ORDER BY provider_id ASC
  `
  return providers
}

export default async function NewLicensePage({
  searchParams,
}: {
  searchParams: {
    title?: string
  }
}) {
  const titles = await getTitles()
  const providers = await getProviders()
  const defaultTitleId = searchParams.title || ""

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await createLicense(formData)
    if (result.success) {
      redirect("/licenses")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New License</h1>
      <Card>
        <CardHeader>
          <CardTitle>License Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="titleId">Title</Label>
              <Select name="titleId" defaultValue={defaultTitleId} required>
                <SelectTrigger id="titleId">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  {titles.map((title) => (
                    <SelectItem key={title.title_id} value={title.title_id.toString()}>
                      {title.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="providerId">Content Provider</Label>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/providers/new" target="_blank">
                    Add New Provider
                  </Link>
                </Button>
              </div>
              <Select name="providerId" required>
                <SelectTrigger id="providerId">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.provider_id} value={provider.provider_id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={formatDate(new Date())} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/licenses">Cancel</Link>
              </Button>
              <Button type="submit">Create License</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
