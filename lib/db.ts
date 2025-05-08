console.log("Connecting to Neon database: broke2binge_db")

import { neon } from "@neondatabase/serverless"

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute queries with error handling
export async function query<T>(queryString: string, params: any[] = []): Promise<T> {
  try {
    // Use the sql.query method for parameterized queries
    return (await sql.query(queryString, params)) as T
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error("Database query failed")
  }
}

// Helper function for pagination that allows showing all records
export async function paginatedQuery<T>({
  baseQuery,
  countQuery,
  page = 1,
  pageSize = 10,
  params = [],
  showAll = false,
}: {
  baseQuery: string
  countQuery: string
  page?: number
  pageSize?: number
  params?: any[]
  showAll?: boolean
}): Promise<{ data: T; total: number; totalPages: number; page: number }> {
  try {
    let paginatedQueryString = baseQuery

    // Only apply pagination if not showing all records
    if (!showAll) {
      const offset = (page - 1) * pageSize
      paginatedQueryString = `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`
    }

    // Use sql.query for parameterized queries
    const [data, countResult] = await Promise.all([
      sql.query(paginatedQueryString, params),
      sql.query(countQuery, params),
    ])

    const total = Number.parseInt(countResult[0].count)
    const totalPages = showAll ? 1 : Math.ceil(total / pageSize)

    return {
      data: data as T,
      total,
      totalPages,
      page: showAll ? 1 : page,
    }
  } catch (error) {
    console.error("Paginated query error:", error)
    throw new Error("Database query failed")
  }
}
