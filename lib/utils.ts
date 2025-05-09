import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  if (!date) return ""

  // Convert to Date object if it's a string
  const dateObj = typeof date === "string" ? new Date(date) : date

  // Format the date as YYYY-MM-DD for input fields
  return dateObj.toISOString().split("T")[0]
}

export function formatDateTime(date: string | Date): string {
  if (!date) return ""

  // Convert to Date object if it's a string
  const dateObj = typeof date === "string" ? new Date(date) : date

  // Format the date for display
  return dateObj.toLocaleString()
}
