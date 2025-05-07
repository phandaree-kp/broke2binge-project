import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"

export const dynamic = "force-dynamic"

async function getProviders(searchParams: {
  page?: string
  size?: string
  q?: string
  showAll?: string
  sort?: string
  order?: string
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = searchParams.size ? Number.parseInt(searchParams.size) : 10
  const searchTerm = searchParams.q || ""
  const showAll = searchParams.showAll === "true"
  const sortField = searchParams.sort || "cp.provider_id"
  const sortOrder = searchParams.order || "ASC"

  let whereClause = "1=1"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND (cp.name ILIKE $1 OR cp.email ILIKE $1 OR cp.phone ILIKE $1)"
    params.push(`%${searchTerm}%`)
  }

  const baseQuery = `
    SELECT cp.provider_id, cp.name, cp.email, cp.phone,
           COUNT(l.license_id) as license_count
    FROM contentprovider cp
    LEFT JOIN license l ON cp.provider_id = l.provider_id
    WHERE ${whereClause}
    GROUP BY cp.provider_id, cp.name, cp.email, cp.phone
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
  }
}) {
  // Default to showing all providers
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  const { data: providers, total, totalPages, page } = await getProviders(params)

  const createSortURL = (field: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    const currentSort = searchParams.sort || "cp.provider_id"
    const currentOrder = searchParams.order || "ASC"

    url.searchParams.set("sort", field)
    if (currentSort === field) {
      url.searchParams.set("order", currentOrder === "ASC" ? "DESC" : "ASC")
    } else {
      url.searchParams.set("order", "ASC")
    }

    return url.search
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <a href={createSortURL("cp.provider_id")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <a href={createSortURL("cp.name")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Licensed Titles</span>
                  <a href={createSortURL("license_count")} className="inline-flex">
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
                  <TableCell>{provider.license_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/providers/${provider.provider_id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} />
    </div>
  )
}
