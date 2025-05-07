import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"

export const dynamic = "force-dynamic"

async function getLicenses(searchParams: {
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
  const sortField = searchParams.sort || "l.license_id"
  const sortOrder = searchParams.order || "ASC"
  const statusFilter = searchParams.status || ""

  let whereClause = "1=1"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND (t.name ILIKE $1 OR cp.name ILIKE $1)"
    params.push(`%${searchTerm}%`)
  }

  if (statusFilter === "active") {
    whereClause += " AND l.is_active = true"
  } else if (statusFilter === "inactive") {
    whereClause += " AND l.is_active = false"
  } else if (statusFilter === "expiring") {
    whereClause += " AND l.is_active = true AND l.end_date < NOW() + INTERVAL '30 days'"
  }

  const baseQuery = `
    SELECT l.license_id, l.start_date, l.end_date, l.is_active,
           t.name as title_name, t.title_id,
           cp.name as provider_name, cp.provider_id
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
  }
}) {
  // Default to showing all licenses
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  const { data: licenses, total, totalPages, page } = await getLicenses(params)
  const today = new Date()

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

  const createStatusFilterURL = (status: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")

    if (status) {
      url.searchParams.set("status", status)
    } else {
      url.searchParams.delete("status")
    }

    url.searchParams.set("page", "1")
    return url.search
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
          <Button variant={!searchParams.status ? "default" : "outline"} size="sm" asChild>
            <Link href={createStatusFilterURL("")}>All</Link>
          </Button>
          <Button variant={searchParams.status === "active" ? "default" : "outline"} size="sm" asChild>
            <Link href={createStatusFilterURL("active")}>Active</Link>
          </Button>
          <Button variant={searchParams.status === "inactive" ? "default" : "outline"} size="sm" asChild>
            <Link href={createStatusFilterURL("inactive")}>Inactive</Link>
          </Button>
          <Button variant={searchParams.status === "expiring" ? "default" : "outline"} size="sm" asChild>
            <Link href={createStatusFilterURL("expiring")}>Expiring Soon</Link>
          </Button>
        </div>
      </div>

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
                const endDate = new Date(license.end_date)
                const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

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
                    <TableCell>{new Date(license.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(license.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {license.is_active ? (
                        daysRemaining <= 30 ? (
                          <Badge variant="destructive">Expires in {daysRemaining} days</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/licenses/${license.license_id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} />
    </div>
  )
}
