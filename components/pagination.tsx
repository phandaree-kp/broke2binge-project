"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface PaginationProps {
  totalPages: number
  currentPage: number
  totalItems: number
  showAllOption?: boolean
}

export function Pagination({ totalPages, currentPage, totalItems, showAllOption = true }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number, size?: number, showAll?: boolean) => {
    const params = new URLSearchParams(searchParams)

    if (showAll) {
      params.set("showAll", "true")
      params.delete("page")
      params.delete("size")
    } else {
      params.delete("showAll")
      params.set("page", pageNumber.toString())
      if (size) params.set("size", size.toString())
    }

    return `${pathname}?${params.toString()}`
  }

  const handlePageSizeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("size", value)
    params.set("page", "1")
    params.delete("showAll")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleShowAllChange = (checked: boolean) => {
    if (checked) {
      router.push(createPageURL(1, undefined, true))
    } else {
      router.push(createPageURL(1, 10))
    }
  }

  const pageSize = searchParams.get("size") ? Number.parseInt(searchParams.get("size")!) : 10
  const showAll = searchParams.get("showAll") === "true"

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        {showAll
          ? `Showing all ${totalItems} entries`
          : `Showing ${Math.min(totalItems, (currentPage - 1) * pageSize + 1)} to ${Math.min(totalItems, currentPage * pageSize)} of ${totalItems} entries`}
      </div>
      <div className="flex items-center gap-2">
        {showAllOption && (
          <div className="flex items-center mr-4 space-x-2">
            <Checkbox id="showAll" checked={showAll} onCheckedChange={handleShowAllChange} />
            <Label htmlFor="showAll" className="text-sm">
              Show All
            </Label>
          </div>
        )}

        {!showAll && (
          <>
            <div className="flex items-center mr-4">
              <span className="text-sm text-muted-foreground mr-2">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(createPageURL(1))}
              disabled={currentPage <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(createPageURL(currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(createPageURL(currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(createPageURL(totalPages))}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
