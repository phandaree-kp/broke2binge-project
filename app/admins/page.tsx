import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown, Edit, Trash, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"
import { toggleAdminStatus } from "@/app/actions/admin-actions"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

async function getAdmins(searchParams: {
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
  const sortField = searchParams.sort || "a.admin_id"
  const sortOrder = searchParams.order || "ASC"
  const status = searchParams.status || "active" // Default to active admins

  let whereClause = status === "active" ? "a.is_deleted = false" : "a.is_deleted = true"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND (a.username ILIKE $1 OR a.email ILIKE $1 OR a.role ILIKE $1)"
    params.push(`%${searchTerm}%`)
  }

  const baseQuery = `
    SELECT a.admin_id, a.username, a.email, a.role, a.created_date, a.is_deleted
    FROM admin a
    WHERE ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(*) as count
    FROM admin a
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

export default async function AdminsPage({
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
  // Default to showing all admins
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  // Default to active tab if not specified
  const status = params.status || "active"
  params.status = status

  const { data: admins, total, totalPages, page } = await getAdmins(params)

  const createSortURL = (field: string) => {
    const url = new URLSearchParams()
    const currentSort = searchParams.sort || "a.admin_id"
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
        <h1 className="text-3xl font-bold">Admins</h1>
        <Button asChild>
          <Link href="/admins/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Admin
          </Link>
        </Button>
      </div>

      <div className="flex justify-between">
        <DataTableSearch placeholder="Search admins..." />
      </div>

      <div className="flex border-b">
        <a
          href="/admins?status=active"
          className={`px-4 py-2 ${status === "active" ? "border-b-2 border-primary font-medium" : ""}`}
        >
          Active Admins
        </a>
        <a
          href="/admins?status=deleted"
          className={`px-4 py-2 ${status === "deleted" ? "border-b-2 border-primary font-medium" : ""}`}
        >
          Deleted Admins
        </a>
      </div>

      <div className="mt-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  <div className="flex items-center space-x-1">
                    <span>ID</span>
                    <a href={createSortURL("a.admin_id")}>
                      <ArrowUpDown className="h-4 w-4" />
                    </a>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <span>Username</span>
                    <a href={createSortURL("a.username")}>
                      <ArrowUpDown className="h-4 w-4" />
                    </a>
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    <a href={createSortURL("a.role")}>
                      <ArrowUpDown className="h-4 w-4" />
                    </a>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <span>Created Date</span>
                    <a href={createSortURL("a.created_date")}>
                      <ArrowUpDown className="h-4 w-4" />
                    </a>
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.admin_id}>
                    <TableCell>{admin.admin_id}</TableCell>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{admin.role}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(admin.created_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admins/${admin.admin_id}/edit`} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form
                          action={async () => {
                            "use server"
                            await toggleAdminStatus(admin.admin_id.toString(), admin.is_deleted)
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
      </div>

      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} />
    </div>
  )
}
