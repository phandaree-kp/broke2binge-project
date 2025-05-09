import { createProvider } from "@/app/actions/provider-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NewProviderPage() {
  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await createProvider(formData)
    if (result.success) {
      redirect("/providers")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New Content Provider</h1>
      <Card>
        <CardHeader>
          <CardTitle>Provider Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/providers">Cancel</Link>
              </Button>
              <Button type="submit">Create Provider</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
