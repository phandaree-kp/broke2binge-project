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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toggleTitleStatus } from "@/app/actions/title-actions"

export const dynamic = "force-dynamic"

async function getTitles(searchParams: {
  page?: string
  size?: string
  q?: string
  type?: string
  origin?: string
  genre?: string
  showAll?: string
  sort?: string
  order?: string
  status?: string
}) {
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = searchParams.size ? Number.parseInt(searchParams.size) : 10
  const searchTerm = searchParams.q || ""
  const typeFilter = searchParams.type || ""
  const originFilter = searchParams.origin || ""
  const genreFilter = searchParams.genre || ""
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

  if (typeFilter) {
    whereClause += ` AND t.type = $${paramIndex}`
    params.push(typeFilter)
    paramIndex++
  }

  if (originFilter) {
    whereClause += ` AND o.origin_id = $${paramIndex}`
    params.push(originFilter)
    paramIndex++
  }

  if (genreFilter) {
    whereClause += ` AND EXISTS (SELECT 1 FROM title_genre tg WHERE tg.title_id = t.title_id AND tg.genre_id = $${paramIndex})`
    params.push(genreFilter)
    paramIndex++
  }

  const baseQuery = `
    SELECT t.title_id, t.name, t.type, t.original_release_date, t.is_original, 
           t.season_count, t.episode_count, t.is_deleted,
           o.country, o.language, o.origin_id,
           ARRAY_AGG(g.name) as genres
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
    sql`SELECT origin_id, country, language FROM origin ORDER BY country, language`,
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
    type?: string
    origin?: string
    genre?: string
    showAll?: string
    sort?: string
    order?: string
    status?: string
    tab?: string
  }
}) {
  // Default to showing all titles
  const params = { ...searchParams }
  if (!params.showAll && !params.page) {
    params.showAll = "true"
  }

  // Default to active tab if not specified
  const activeTab = params.tab || "active"
  params.status = activeTab

  const { data: titles, total, totalPages, page } = await getTitles(params)
  const filterOptions = await getFilterOptions()

  const createSortURL = (field: string) => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    const currentSort = searchParams.sort || "t.title_id"
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
    url.searchParams.set("tab", tab)
    url.searchParams.delete("page")
    return url.toString()
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!searchParams.type}
                onCheckedChange={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.delete("type")
                  url.searchParams.set("page", "1")
                  window.location.href = url.toString()
                }}
              >
                All Types
              </DropdownMenuCheckboxItem>
              {filterOptions.types.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.type}
                  checked={searchParams.type === type.type}
                  onCheckedChange={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("type", type.type)
                    url.searchParams.set("page", "1")
                    window.location.href = url.toString()
                  }}
                >
                  {type.type}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Origin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!searchParams.origin}
                onCheckedChange={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.delete("origin")
                  url.searchParams.set("page", "1")
                  window.location.href = url.toString()
                }}
              >
                All Origins
              </DropdownMenuCheckboxItem>
              {filterOptions.origins.map((origin) => (
                <DropdownMenuCheckboxItem
                  key={origin.origin_id}
                  checked={searchParams.origin === origin.origin_id.toString()}
                  onCheckedChange={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("origin", origin.origin_id.toString())
                    url.searchParams.set("page", "1")
                    window.location.href = url.toString()
                  }}
                >
                  {origin.country} ({origin.language})
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Genre</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={!searchParams.genre}
                onCheckedChange={() => {
                  const url = new URL(window.location.href)
                  url.searchParams.delete("genre")
                  url.searchParams.set("page", "1")
                  window.location.href = url.toString()
                }}
              >
                All Genres
              </DropdownMenuCheckboxItem>
              {filterOptions.genres.map((genre) => (
                <DropdownMenuCheckboxItem
                  key={genre.genre_id}
                  checked={searchParams.genre === genre.genre_id.toString()}
                  onCheckedChange={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set("genre", genre.genre_id.toString())
                    url.searchParams.set("page", "1")
                    window.location.href = url.toString()
                  }}
                >
                  {genre.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="active" asChild>
            <Link href={createTabURL("active")}>Active Titles</Link>
          </TabsTrigger>
          <TabsTrigger value="deleted" asChild>
            <Link href={createTabURL("deleted")}>Deleted Titles</Link>
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
                      <a href={createSortURL("t.title_id")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <a href={createSortURL("t.name")} className="inline-flex">
                        <ArrowUpDown className="h-4 w-4" />
                      </a>
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Release Date</span>
                      <a href={createSortURL("t.original_release_date")} className="inline-flex">
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
                        {title.type === "Series"
                          ? `${title.season_count} seasons / ${title.episode_count} episodes`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {title.genres.slice(0, 2).map((genre: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {genre}
                            </Badge>
                          ))}
                          {title.genres.length > 2 && <Badge variant="outline">+{title.genres.length - 2}</Badge>}
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
