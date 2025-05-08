import { createAdmin } from "@/app/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sql } from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"

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

export default async function NewAdminPage() {
  const roles = await getRoles()

  async function handleSubmit(formData: FormData) {
    "use server"
    const result = await createAdmin(formData)
    if (result.success) {
      redirect("/admins")
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <h1 className="text-3xl font-bold">Add New Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue={roles[0]?.role || "Admin"}>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/admins">Cancel</Link>
              </Button>
              <Button type="submit">Create Admin</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
