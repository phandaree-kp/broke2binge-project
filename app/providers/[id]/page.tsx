import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft, Edit, Trash, RefreshCw } from "lucide-react"
import { toggleProviderStatus } from "@/app/actions/provider-actions"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getProvider(id: string) {
  const providers = await sql`
    SELECT provider_id, name, email, phone, address, is_deleted
    FROM contentprovider
    WHERE provider_id = ${id}
  `

  if (providers.length === 0) {
    return null
  }

  return providers[0]
}

async function getProviderLicenses(id: string) {
  const licenses = await sql`
    SELECT l.license_id, l.start_date, l.end_date, l.is_active,
           t.name as title_name, t.title_id
    FROM license l
    JOIN title t ON l.title_id = t.title_id
    WHERE l.provider_id = ${id}
    ORDER BY l.end_date DESC
  `

  return licenses
}

export default async function ProviderPage({ params }: { params: { id: string } }) {
  const provider = await getProvider(params.id)

  if (!provider) {
    notFound()
  }

  const licenses = await getProviderLicenses(params.id)

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/providers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{provider.name}</h1>
        {provider.is_deleted && <Badge variant="destructive">Deleted</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provider Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{provider.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                <dd>{provider.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd>{provider.address || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                <dd>{provider.provider_id}</dd>
              </div>
            </dl>
            <div className="flex gap-2 mt-6">
              <Button asChild>
                <Link href={`/providers/${provider.provider_id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <form
                action={async () => {
                  "use server"
                  await toggleProviderStatus(provider.provider_id.toString(), provider.is_deleted)
                }}
              >
                <Button variant={provider.is_deleted ? "default" : "destructive"} type="submit">
                  {provider.is_deleted ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" /> Restore
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Licenses</CardTitle>
            <CardDescription>Content licensing agreements</CardDescription>
          </CardHeader>
          <CardContent>
            {licenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.license_id}>
                      <TableCell>
                        <Link href={`/titles/${license.title_id}`} className="hover:underline">
                          {license.title_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatDate(license.start_date)} - {formatDate(license.end_date)}
                      </TableCell>
                      <TableCell>
                        {license.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No licenses found for this provider</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
