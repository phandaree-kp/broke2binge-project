"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

interface DataTableSearchProps {
  placeholder?: string
}

export function DataTableSearch({ placeholder = "Search..." }: DataTableSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (searchTerm) {
      params.set("q", searchTerm)
    } else {
      params.delete("q")
    }

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setSearchTerm("")
    const params = new URLSearchParams(searchParams)
    params.delete("q")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-sm items-center">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pr-10"
      />
      {searchTerm && (
        <Button type="button" variant="ghost" size="icon" className="absolute right-8 h-7 w-7" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button type="submit" variant="ghost" size="icon" className="absolute right-0">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}
