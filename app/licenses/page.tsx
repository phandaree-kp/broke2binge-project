import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown, Edit, Trash, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toggleLicenseStatus } from "@/app/actions/license-actions"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getLicenses(searchParams: {
  page?: string
  size?: string
  q?: string
  showAll?: string
  sort?: string
  order?: string
  status?: string
  filter?: string
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = searchParams.size ? Number.parseInt(searchParams.size) : 10
  const searchTerm = searchParams.q || ""
  const showAll = searchParams.showAll === "true"
  const sortField = searchParams.sort || "l.license_id"
  const sortOrder = searchParams.order || "ASC"
  const status = searchParams.status || "active" // Default to active licenses
  const filter = searchParams.filter || "all" // Filter: all, active, inactive, expiring

  let whereClause = status === "active" ? "l.is_deleted = false" : "l.is_deleted = true"
  const params: any[] = []
  let paramIndex = 1

  if (searchTerm) {
    whereClause += ` AND (t.name ILIKE $${paramIndex} OR cp.name ILIKE $${paramIndex})`
    params.push(`%${searchTerm}%`)
    paramIndex++
  }

  // Apply additional filters
  if (filter === "active") {
    whereClause += " AND l.is_active = true"
  } else if (filter === "inactive") {
    whereClause += " AND l.is_active = false"
  } else if (filter === "expiring") {
    whereClause += " AND l.is_active = true AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'"
  }

  const baseQuery = `
    SELECT l.license_id, l.start_date, l.end_date, l.is_active, l.is_deleted,
           t.title_id, t.name as title_name,
           cp.provider_id, cp.name as provider_name,
           (l.end_date - CURRENT_DATE) as days_remaining
    FROM license l
    JOIN title t ON l.title_id = t.title_id
    JOIN contentprovider cp ON l.provider_id = cp.provider_id
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(*) as count
    FROM license l
    JOIN title t ON l.title_id = t.title_id
    JOIN contentprovider cp ON l.provider_id = cp.provider_id
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

export default async function LicensesPage({
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
    tab?: string
    filter?: string
  }
}) {
  // Default to showing all licenses
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  // Default to active tab if not specified
  const activeTab = params.tab || "active"
  params.status = activeTab

  // Default filter
  const activeFilter = params.filter || "all"

  const { data: licenses, total, totalPages, page } = await getLicenses(params)

  const createSortURL = (field: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    const currentSort = searchParams.sort || "l.license_id"
    const currentOrder = searchParams.order || "ASC"

    url.searchParams.set("sort", field)
    if (currentSort === field) {
      url.searchParams.set("order", currentOrder === "ASC" ? "DESC" : "ASC")
    } else {
      url.searchParams.set("order", "ASC")
    }

    return url.search
  }

  const createTabURL = (tab: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")

    // Preserve all existing search params
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "tab" && key !== "status") {
        url.searchParams.set(key, value as string)
      }
    }

    url.searchParams.set("tab", tab)
    return url.toString()
  }

  const createFilterURL = (filter: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")

    // Preserve all existing search params
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== "filter" && key !== "page") {
        url.searchParams.set(key, value as string)
      }
    }

    url.searchParams.set("filter", filter)
    url.searchParams.set("page", "1")
    return url.toString()
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Licenses</h1>
        <Button asChild>
          <Link href="/licenses/new">
            <Plus className="mr-2 h-4 w-4" /> Add New License
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <DataTableSearch placeholder="Search licenses..." />
        <div className="flex flex-wrap gap-2">
          <Button variant={activeFilter === "all" ? "default" : "outline"} size="sm" asChild>
            <Link href={createFilterURL("all")}>All</Link>
          </Button>
          <Button variant={activeFilter === "active" ? "default" : "outline"} size="sm" asChild>
            <Link href={createFilterURL("active")}>Active</Link>
          </Button>
          <Button variant={activeFilter === "inactive" ? "default" : "outline"} size="sm" asChild>
            <Link href={createFilterURL("inactive")}>Inactive</Link>
          </Button>
          <Button variant={activeFilter === "expiring" ? "default" : "outline"} size="sm" asChild>
            <Link href={createFilterURL("expiring")}>Expiring Soon</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="active" asChild>
            <Link href={createTabURL("active")}>Active Licenses</Link>
          </TabsTrigger>
          <TabsTrigger value="deleted" asChild>
            <Link href={createTabURL("deleted")}>Deleted Licenses</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      <a href={createSortURL("l.license_id")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Title</span>
                      <a href={createSortURL("t.name")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Provider</span>
                      <a href={createSortURL("cp.name")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Start Date</span>
                      <a href={createSortURL("l.start_date")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>End Date</span>
                      <a href={createSortURL("l.end_date")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  licenses.map((license) => {
                    const daysRemaining = Number(license.days_remaining)
                    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30

                    return (
                      <TableRow key={license.license_id}>
                        <TableCell>{license.license_id}</TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/titles/${license.title_id}`} className="hover:underline">
                            {license.title_name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/providers/${license.provider_id}`} className="hover:underline">
                            {license.provider_name}
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(license.start_date)}</TableCell>
                        <TableCell>{formatDate(license.end_date)}</TableCell>
                        <TableCell>
                          {license.is_active ? (
                            isExpiringSoon ? (
                              <Badge variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Expires in {daysRemaining} days
                              </Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/licenses/${license.license_id}/edit`} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <form
                              action={async () => {
                                "use server"
                                await toggleLicenseStatus(license.license_id.toString(), license.is_deleted)
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                title={activeTab === "active" ? "Delete" : "Restore"}
                                className={activeTab === "active" ? "text-destructive" : "text-green-600"}
                                type="submit"
                              >
                                {activeTab === "active" ? (
                                  <Trash className="h-4 w-4" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
