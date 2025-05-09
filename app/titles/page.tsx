import { paginatedQuery, sql } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/pagination"
import { DataTableSearch } from "@/components/data-table-search"
import Link from "next/link"
import { Plus, Filter, ArrowUpDown, History, Trash, Eye, Edit, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toggleTitleStatus } from "@/app/actions/title-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export const dynamic = "force-dynamic"

async function getTitles(searchParams: {
  page?: string
  size?: string
  q?: string
  type?: string[]
  origin?: string[]
  genre?: string[]
  showAll?: string
  sort?: string
  order?: string
  status?: string
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = searchParams.size ? Number.parseInt(searchParams.size) : 10
  const searchTerm = searchParams.q || ""
  const typeFilters = searchParams.type || []
  const originFilters = searchParams.origin || []
  const genreFilters = searchParams.genre || []
  const showAll = searchParams.showAll === "true"
  const sortField = searchParams.sort || "t.title_id"
  const sortOrder = searchParams.order || "ASC"
  const status = searchParams.status || "active" // Default to active titles

  let whereClause = status === "active" ? "t.is_deleted = false" : "t.is_deleted = true"
  const params: any[] = []
  let paramIndex = 1

  if (searchTerm) {
    whereClause += ` AND (t.name ILIKE $${paramIndex} OR o.country ILIKE $${paramIndex} OR o.language ILIKE $${paramIndex})`
    params.push(`%${searchTerm}%`)
    paramIndex++
  }

  if (typeFilters.length > 0) {
    whereClause += ` AND t.type IN (${typeFilters.map((_, i) => `$${paramIndex + i}`).join(", ")})`
    params.push(...typeFilters)
    paramIndex += typeFilters.length
  }

  if (originFilters.length > 0) {
    whereClause += ` AND o.origin_id IN (${originFilters.map((_, i) => `$${paramIndex + i}`).join(", ")})`
    params.push(...originFilters)
    paramIndex += originFilters.length
  }

  if (genreFilters.length > 0) {
    whereClause += ` AND EXISTS (SELECT 1 FROM title_genre tg WHERE tg.title_id = t.title_id AND tg.genre_id IN (${genreFilters.map((_, i) => `$${paramIndex + i}`).join(", ")}))`
    params.push(...genreFilters)
    paramIndex += genreFilters.length
  }

  const baseQuery = `
    SELECT t.title_id, t.name, t.type, t.original_release_date, t.is_original, 
           t.season_count, t.episode_count, t.is_deleted,
           o.country, o.language, o.origin_id,
           ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres
    FROM title t
    JOIN origin o ON t.origin_id = o.origin_id
    LEFT JOIN title_genre tg ON t.title_id = tg.title_id
    LEFT JOIN genre g ON tg.genre_id = g.genre_id
    WHERE ${whereClause}
    GROUP BY t.title_id, t.name, t.type, t.original_release_date, t.is_original, 
             t.season_count, t.episode_count, t.is_deleted,
             o.country, o.language, o.origin_id
    ORDER BY ${sortField} ${sortOrder}
  `

  const countQuery = `
    SELECT COUNT(DISTINCT t.title_id) as count
    FROM title t
    JOIN origin o ON t.origin_id = o.origin_id
    LEFT JOIN title_genre tg ON t.title_id = tg.title_id
    LEFT JOIN genre g ON tg.genre_id = g.genre_id
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

async function getFilterOptions() {
  const [types, origins, genres] = await Promise.all([
    // Get unique types
    sql`SELECT DISTINCT type FROM title ORDER BY type`,
    // Get all origins
    sql`SELECT origin_id, country, language FROM origin ORDER BY country`,
    // Get all genres
    sql`SELECT genre_id, name FROM genre ORDER BY name`,
  ])

  return { types, origins, genres }
}

export default async function TitlesPage({
  searchParams,
}: {
  searchParams: {
    page?: string
    size?: string
    q?: string
    type?: string | string[]
    origin?: string | string[]
    genre?: string | string[]
    showAll?: string
    sort?: string
    order?: string
    status?: string
  }
}) {
  // Default to showing all titles
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  // Default to active tab if not specified
  const status = searchParams.status || "active"
  params.status = status

  // Convert single values to arrays for filters
  const processedParams = {
    ...params,
    type: params.type ? (Array.isArray(params.type) ? params.type : [params.type]) : [],
    origin: params.origin ? (Array.isArray(params.origin) ? params.origin : [params.origin]) : [],
    genre: params.genre ? (Array.isArray(params.genre) ? params.genre : [params.genre]) : [],
  }

  const { data: titles, total, totalPages, page } = await getTitles(processedParams)
  const filterOptions = await getFilterOptions()

  // Create client-side URL functions
  const createSortURL = (field: string) => {
    const url = new URLSearchParams()
    const currentSort = searchParams.sort || "t.title_id"
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
        <h1 className="text-3xl font-bold">Titles</h1>
        <Button asChild>
          <Link href="/titles/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Title
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <DataTableSearch placeholder="Search titles..." />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
                {(processedParams.type.length > 0 ||
                  processedParams.origin.length > 0 ||
                  processedParams.genre.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {processedParams.type.length + processedParams.origin.length + processedParams.genre.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] max-h-[500px] overflow-auto">
              <form action="/titles" method="get">
                {/* Preserve existing query parameters */}
                <input type="hidden" name="status" value={status} />
                {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
                {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
                {searchParams.order && <input type="hidden" name="order" value={searchParams.order} />}

                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.types.map((type) => (
                      <div key={type.type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.type}`}
                          name="type"
                          value={type.type}
                          defaultChecked={processedParams.type.includes(type.type)}
                        />
                        <Label htmlFor={`type-${type.type}`} className="text-sm">
                          {type.type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Origin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.origins.map((origin) => (
                      <div key={origin.origin_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`origin-${origin.origin_id}`}
                          name="origin"
                          value={origin.origin_id.toString()}
                          defaultChecked={processedParams.origin.includes(origin.origin_id.toString())}
                        />
                        <Label htmlFor={`origin-${origin.origin_id}`} className="text-sm">
                          {origin.country}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.genres.map((genre) => (
                      <div key={genre.genre_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`genre-${genre.genre_id}`}
                          name="genre"
                          value={genre.genre_id.toString()}
                          defaultChecked={processedParams.genre.includes(genre.genre_id.toString())}
                        />
                        <Label htmlFor={`genre-${genre.genre_id}`} className="text-sm">
                          {genre.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />
                <div className="p-2 flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/titles?status=${status}`}>Clear Filters</Link>
                  </Button>
                  <Button type="submit" size="sm">
                    Apply Filters
                  </Button>
                </div>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue={status} className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            <a href="/titles?status=active">Active Titles</a>
          </TabsTrigger>
          <TabsTrigger value="deleted">
            <a href="/titles?status=deleted">Deleted Titles</a>
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
                      <a href={createSortURL("t.title_id")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <a href={createSortURL("t.name")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Release Date</span>
                      <a href={createSortURL("t.original_release_date")}>
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Seasons/Episodes</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  titles.map((title) => (
                    <TableRow key={title.title_id}>
                      <TableCell>{title.title_id}</TableCell>
                      <TableCell className="font-medium">{title.name}</TableCell>
                      <TableCell>{title.type}</TableCell>
                      <TableCell>{new Date(title.original_release_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {title.country} ({title.language})
                      </TableCell>
                      <TableCell>
                        {title.type === "Movie"
                          ? "N/A"
                          : `${title.season_count !== null ? title.season_count : 0} seasons / ${title.episode_count !== null ? title.episode_count : 0} episodes`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {title.genres &&
                            title.genres.slice(0, 2).map((genre: string, i: number) => (
                              <Badge key={i} variant="outline">
                                {genre}
                              </Badge>
                            ))}
                          {title.genres && title.genres.length > 2 && (
                            <Badge variant="outline">+{title.genres.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={title.is_original ? "default" : "secondary"}>
                          {title.is_original ? "Original" : "Licensed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/titles/${title.title_id}`} title="View">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/titles/${title.title_id}/edit`} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/titles/${title.title_id}/history`} title="History">
                              <History className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form
                            action={async () => {
                              "use server"
                              await toggleTitleStatus(title.title_id.toString(), title.is_deleted)
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
