import { paginatedQuery } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"

export const dynamic = "force-dynamic"

async function getGenres(searchParams: {
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
  const sortField = searchParams.sort || "g.genre_id"
  const sortOrder = searchParams.order || "ASC"

  let whereClause = "1=1"
  const params: any[] = []

  if (searchTerm) {
    whereClause += " AND g.name ILIKE $1"
    params.push(`%${searchTerm}%`)
  }

  const baseQuery = `
    SELECT g.genre_id, g.name, COUNT(tg.title_id) as title_count
    FROM genre g
    LEFT JOIN title_genre tg ON g.genre_id = tg.genre_id
    WHERE ${whereClause}
    GROUP BY g.genre_id, g.name
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(*) as count
    FROM genre g
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

export default async function GenresPage({
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
  // Default to showing all genres
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  const { data: genres, total, totalPages, page } = await getGenres(params)

  const createSortURL = (field: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    const currentSort = searchParams.sort || "g.genre_id"
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
        <h1 className="text-3xl font-bold">Genres</h1>
        <Button asChild>
          <Link href="/genres/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Genre
          </Link>
        </Button>
      </div>

      <div className="flex justify-between">
        <DataTableSearch placeholder="Search genres..." />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <a href={createSortURL("g.genre_id")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <a href={createSortURL("g.name")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center space-x-1">
                  <span>Title Count</span>
                  <a href={createSortURL("title_count")} className="inline-flex">
                    <ArrowUpDown className="h-4 w-4" />
                  </a>
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {genres.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              genres.map((genre) => (
                <TableRow key={genre.genre_id}>
                  <TableCell>{genre.genre_id}</TableCell>
                  <TableCell className="font-medium">{genre.name}</TableCell>
                  <TableCell>{genre.title_count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/genres/${genre.genre_id}`}>Edit</Link>
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
