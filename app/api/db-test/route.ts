import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Test the database connection
    const result = await sql`SELECT current_database() as db_name, current_schema() as schema_name`

    return NextResponse.json({
      status: "connected",
      database: result[0].db_name,
      schema: result[0].schema_name,
      message: "Successfully connected to Neon database",
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to database",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
