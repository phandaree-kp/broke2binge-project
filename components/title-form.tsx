"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface TitleFormProps {
  title?: any
  titleGenres?: any[]
  allGenres: any[]
  allOrigins: any[]
  isEditing?: boolean
}

export function TitleForm({ title, titleGenres = [], allGenres, allOrigins, isEditing = false }: TitleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: title?.name || "",
    type: title?.type || "Movie",
    originId: title?.origin_id?.toString() || "",
    originalReleaseDate: title?.original_release_date ? new Date(title.original_release_date) : new Date(),
    isOriginal: title?.is_original || false,
    seasonCount: title?.season_count || 1,
    episodeCount: title?.episode_count || 1,
    description: title?.description || "",
    selectedGenres: titleGenres?.map((g) => g.genre_id.toString()) || [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, originalReleaseDate: date }))
    }
  }

  const handleGenreToggle = (genreId: string) => {
    setFormData((prev) => {
      const selectedGenres = [...prev.selectedGenres]
      if (selectedGenres.includes(genreId)) {
        return { ...prev, selectedGenres: selectedGenres.filter((id) => id !== genreId) }
      } else {
        return { ...prev, selectedGenres: [...selectedGenres, genreId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // This would be a server action in a real implementation
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push(isEditing ? `/titles/${title.title_id}` : "/titles")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Title Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Movie">Movie</SelectItem>
                    <SelectItem value="Series">Series</SelectItem>
                    <SelectItem value="Documentary">Documentary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="originId">Origin</Label>
                <Select value={formData.originId} onValueChange={(value) => handleSelectChange("originId", value)}>
                  <SelectTrigger id="originId">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {allOrigins.map((origin) => (
                      <SelectItem key={origin.origin_id} value={origin.origin_id.toString()}>
                        {origin.country} ({origin.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label>Release Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.originalReleaseDate ? (
                        format(formData.originalReleaseDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.originalReleaseDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-3">
                <Label className="mb-3">Title Type</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOriginal"
                    checked={formData.isOriginal}
                    onCheckedChange={(checked) => handleCheckboxChange("isOriginal", checked as boolean)}
                  />
                  <label
                    htmlFor="isOriginal"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Original Content
                  </label>
                </div>
              </div>
            </div>

            {formData.type === "Series" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="seasonCount">Number of Seasons</Label>
                  <Input
                    id="seasonCount"
                    name="seasonCount"
                    type="number"
                    min="1"
                    value={formData.seasonCount}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="episodeCount">Number of Episodes</Label>
                  <Input
                    id="episodeCount"
                    name="episodeCount"
                    type="number"
                    min="1"
                    value={formData.episodeCount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <Label>Genres</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {allGenres.map((genre) => (
                  <div key={genre.genre_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genre-${genre.genre_id}`}
                      checked={formData.selectedGenres.includes(genre.genre_id.toString())}
                      onCheckedChange={() => handleGenreToggle(genre.genre_id.toString())}
                    />
                    <label
                      htmlFor={`genre-${genre.genre_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {genre.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update" : "Create"} Title
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
