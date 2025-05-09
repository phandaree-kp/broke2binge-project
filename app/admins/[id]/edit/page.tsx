import { updateAdmin } from "@/app/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sql } from "@/lib/db"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

async function getAdmin(id: string) {
  const admins = await sql`
    SELECT admin_id, username, email, role, created_date
    FROM admin
    WHERE admin_id = ${id}
  `

  if (admins.length === 0) {
    return null
  }

  return admins[0]
}

async function getRoles() {
  // Get distinct roles from the database
  const roles = await sql`
    SELECT DISTINCT role FROM admin
    ORDER BY role
  `

  // If no roles found, return default roles
  if (roles.length === 0) {
    return [{ role: "Admin" }, { role: "Editor" }, { role: "Viewer" }]
  }

  return roles
}

export default async function EditAdminPage({ params }: { params: { id: string } }) {
  const admin = await getAdmin(params.id)

  if (!admin) {
    notFound()
  }

  const roles = await getRoles()

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await updateAdmin(params.id, formData)
    if (result.success) {
      redirect("/admins")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Edit Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" defaultValue={admin.username} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={admin.email} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password (Leave blank to keep current)</Label>
              <Input id="password" name="password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue={admin.role}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role, index) => (
                    <SelectItem key={index} value={role.role}>
                      {role.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdDate">Created Date</Label>
              <Input
                id="createdDate"
                name="createdDate"
                type="text"
                defaultValue={new Date(admin.created_date).toLocaleString()}
                disabled
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/admins">Cancel</Link>
              </Button>
              <Button type="submit">Update Admin</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
