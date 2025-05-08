import { updateLicense } from "@/app/actions/license-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sql } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

async function getLicense(id: string) {
  const licenses = await sql`
    SELECT l.license_id, l.title_id, l.provider_id, l.start_date, l.end_date, l.is_active,
           t.name as title_name, cp.name as provider_name
    FROM license l
    JOIN title t ON l.title_id = t.title_id
    JOIN contentprovider cp ON l.provider_id = cp.provider_id
    WHERE l.license_id = ${id}
  `

  if (licenses.length === 0) {
    return null
  }

  return licenses[0]
}

async function getTitles() {
  const titles = await sql`
    SELECT title_id, name
    FROM title
    WHERE is_deleted = false
    ORDER BY name
  `
  return titles
}

async function getProviders() {
  const providers = await sql`
    SELECT provider_id, name
    FROM contentprovider
    WHERE is_deleted = false
    ORDER BY name
  `
  return providers
}

export default async function EditLicensePage({ params }: { params: { id: string } }) {
  const license = await getLicense(params.id)

  if (!license) {
    notFound()
  }

  const titles = await getTitles()
  const providers = await getProviders()

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await updateLicense(params.id, formData)
    if (result.success) {
      redirect("/licenses")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Edit License</h1>
      <Card>
        <CardHeader>
          <CardTitle>License Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="titleId">Title</Label>
              <Select name="titleId" defaultValue={license.title_id.toString()} required>
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
              <Label htmlFor="providerId">Content Provider</Label>
              <Select name="providerId" defaultValue={license.provider_id.toString()} required>
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
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={formatDate(license.start_date)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={formatDate(license.end_date)} required />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isActive" name="isActive" defaultChecked={license.is_active} value="true" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/licenses">Cancel</Link>
              </Button>
              <Button type="submit">Update License</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
