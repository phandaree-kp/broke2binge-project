import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown, Eye, Edit, Trash, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toggleProviderStatus } from "@/app/actions/provider-actions"

export const dynamic = "force-dynamic"

async function getProviders(searchParams: {
  page?: string
  size?: string
  q?: string
  showAll?: string
  sort?: string
  order?: string
  status?: string
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = searchParams.size ? Number.parseInt(searchParams.size) : 10
  const searchTerm = searchParams.q || ""
  const showAll = searchParams.showAll === "true"
  const sortField = searchParams.sort || "cp.provider_id"
  const sortOrder = searchParams.order || "ASC"
  const status = searchParams.status || "active" // Default to active providers

  let whereClause = status === "active" ? "cp.is_deleted = false" : "cp.is_deleted = true"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND (cp.name ILIKE $1 OR cp.email ILIKE $1 OR cp.phone ILIKE $1)"
    params.push(`%${searchTerm}%`)
  }

  const baseQuery = `
    SELECT cp.provider_id, cp.name, cp.email, cp.phone, cp.is_deleted,
           COUNT(l.license_id) as license_count
    FROM contentprovider cp
    LEFT JOIN license l ON cp.provider_id = l.provider_id
    WHERE ${whereClause}
    GROUP BY cp.provider_id, cp.name, cp.email, cp.phone, cp.is_deleted
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(*) as count
    FROM contentprovider cp
    WHERE ${whereClause}
  `

  const result = await paginatedQuery({
    baseQuery,
    countQuery,
    page,
    pageSize,
    params,
    showAll,
  })

  return result
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: {
    page?: string
    size?: string
    q?: string
    showAll?: string
    sort?: string
    order?: string
    status?: string
  }
}) {
  // Default to showing all providers
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  // Default to active tab if not specified
  const status = params.status || "active"

  const { data: providers, total, totalPages, page } = await getProviders(params)

  const createSortURL = (field: string) => {
    const url = new URLSearchParams()
    const currentSort = searchParams.sort || "cp.provider_id"
    const currentOrder = searchParams.order || "ASC"

    // Copy all existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== "sort" && key !== "order") {
        if (Array.isArray(value)) {
          value.forEach((v) => url.append(key, v))
        } else if (value) {
          url.append(key, value)
        }
      }
    })

    url.set("sort", field)
    if (currentSort === field) {
      url.set("order", currentOrder === "ASC" ? "DESC" : "ASC")
    } else {
      url.set("order", "ASC")
    }

    return `?${url.toString()}`
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Content Providers</h1>
        <Button asChild>
          <Link href="/providers/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Provider
          </Link>
        </Button>
      </div>

      <div className="flex justify-between">
        <DataTableSearch placeholder="Search providers..." />
      </div>

      <Tabs defaultValue={status} className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            <a href="/providers?status=active" className="w-full h-full block">
              Active Providers
            </a>
          </TabsTrigger>
          <TabsTrigger value="deleted">
            <a href="/providers?status=deleted" className="w-full h-full block">
              Deleted Providers
            </a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      <a href={createSortURL("cp.provider_id")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <a href={createSortURL("cp.name")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Licenses</span>
                      <a href={createSortURL("license_count")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  providers.map((provider) => (
                    <TableRow key={provider.provider_id}>
                      <TableCell>{provider.provider_id}</TableCell>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>{provider.email}</TableCell>
                      <TableCell>{provider.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.license_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/providers/${provider.provider_id}`} title="View">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/providers/${provider.provider_id}/edit`} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form
                            action={async () => {
                              "use server"
                              await toggleProviderStatus(provider.provider_id.toString(), provider.is_deleted)
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              title={status === "active" ? "Delete" : "Restore"}
                              className={status === "active" ? "text-destructive" : "text-green-600"}
                              type="submit"
                            >
                              {status === "active" ? <Trash className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} />
    </div>
  )
}
