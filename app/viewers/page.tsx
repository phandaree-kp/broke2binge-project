import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"
import Link from "next/link"
import { ArrowUpDown } from "lucide-react"

export const dynamic = "force-dynamic"

async function getViewers(searchParams: {
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
  const sortField = searchParams.sort || "viewer_id"
  const sortOrder = searchParams.order || "ASC"

  let whereClause = "1=1"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND (username ILIKE $1 OR email ILIKE $1)"
    params.push(`%${searchTerm}%`)
  }

  const baseQuery = `
    SELECT viewer_id, username, email, created_date
    FROM viewer
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(*) as count
    FROM viewer
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

export default async function ViewersPage({
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
  // Default to showing all viewers
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  const { data: viewers, total, totalPages, page } = await getViewers(params)

  const createSortURL = (field: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    const currentSort = searchParams.sort || "viewer_id"
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
        <h1 className="text-3xl font-bold">Viewers</h1>
      </div>

      <div className="flex justify-between">
        <DataTableSearch placeholder="Search viewers..." />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <a href={createSortURL("viewer_id")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  <a href={createSortURL("username")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  <a href={createSortURL("email")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Joined</span>
                  <a href={createSortURL("created_date")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              viewers.map((viewer) => (
                <TableRow key={viewer.viewer_id}>
                  <TableCell>{viewer.viewer_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{viewer.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{viewer.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{viewer.email}</TableCell>
                  <TableCell>{new Date(viewer.created_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/viewers/${viewer.viewer_id}`}>View</Link>
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
