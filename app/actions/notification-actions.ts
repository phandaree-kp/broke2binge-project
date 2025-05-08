"use server"

import { sql } from "@/lib/db"

export async function getNotifications() {
  // Get expiring licenses
  const expiringLicenses = await sql`
    SELECT l.license_id, t.name as title_name, l.end_date,
           (l.end_date - CURRENT_DATE) as days_remaining
    FROM license l
    JOIN title t ON l.title_id = t.title_id
    WHERE l.is_active = true 
      AND l.is_deleted = false
      AND l.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    ORDER BY l.end_date ASC
    LIMIT 5
  `

  // Get recent additions
  const recentAdditions = await sql`
    SELECT t.title_id, t.name, t.original_release_date
    FROM title t
    WHERE t.is_deleted = false
      AND t.original_release_date > CURRENT_DATE - INTERVAL '7 days'
    ORDER BY t.original_release_date DESC
    LIMIT 5
  `

  const notifications = []

  // Add expiring license notifications
  for (const license of expiringLicenses) {
    notifications.push({
      id: `license-${license.license_id}`,
      title: "License Expiring Soon",
      message: `"${license.title_name}" license expires in ${Math.round(Number(license.days_remaining))} days`,
      time: new Date().toLocaleString(),
    })
  }

  // Add recent additions notifications
  for (const title of recentAdditions) {
    notifications.push({
      id: `title-${title.title_id}`,
      title: "New Title Added",
      message: `"${title.name}" was added on ${new Date(title.original_release_date).toLocaleDateString()}`,
      time: new Date().toLocaleString(),
    })
  }

  return notifications
}
