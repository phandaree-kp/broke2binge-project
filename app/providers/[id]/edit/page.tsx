import { updateProvider } from "@/app/actions/provider-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sql } from "@/lib/db"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

async function getProvider(id: string) {
  const providers = await sql`
    SELECT provider_id, name, email, phone, address
    FROM contentprovider
    WHERE provider_id = ${id}
  `

  if (providers.length === 0) {
    return null
  }

  return providers[0]
}

export default async function EditProviderPage({ params }: { params: { id: string } }) {
  const provider = await getProvider(params.id)

  if (!provider) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await updateProvider(params.id, formData)
    if (result.success) {
      redirect("/providers")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Edit Content Provider</h1>
      <Card>
        <CardHeader>
          <CardTitle>Provider Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input id="name" name="name" defaultValue={provider.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={provider.email} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={provider.phone} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={provider.address || ""} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/providers">Cancel</Link>
              </Button>
              <Button type="submit">Update Provider</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
