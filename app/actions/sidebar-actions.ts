"use server"

import { sql } from "@/lib/db"

export async function getExpiringLicensesCount() {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM license
      WHERE is_active = true 
        AND is_deleted = false
        AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `
    return Number(result[0].count)
  } catch (error) {
    console.error("Error fetching expiring licenses count:", error)
    return 0
  }
}
