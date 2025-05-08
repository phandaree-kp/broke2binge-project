"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { createTitle, updateTitle } from "@/app/actions/title-actions"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface TitleFormProps {
  title?: any
  titleGenres?: any[]
  allGenres: any[]
  allOrigins: any[]
  allTypes?: any[]
  isEditing?: boolean
}

export function TitleForm({
  title,
  titleGenres = [],
  allGenres,
  allOrigins,
  allTypes = [],
  isEditing = false,
}: TitleFormProps) {
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
    selectedGenres: titleGenres?.map((g) => g.genre_id.toString()) || [],
  })

  const [showSeasonEpisode, setShowSeasonEpisode] = useState(formData.type !== "Movie")
  const [showLicenseSection, setShowLicenseSection] = useState(!formData.isOriginal)

  useEffect(() => {
    setShowSeasonEpisode(formData.type !== "Movie")
  }, [formData.type])

  useEffect(() => {
    setShowLicenseSection(!formData.isOriginal)
  }, [formData.isOriginal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "true" }))
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
      const formDataToSubmit = new FormData()
      formDataToSubmit.append("name", formData.name)
      formDataToSubmit.append("type", formData.type)
      formDataToSubmit.append("originId", formData.originId)
      formDataToSubmit.append("originalReleaseDate", formatDate(formData.originalReleaseDate))
      formDataToSubmit.append("isOriginal", formData.isOriginal.toString())

      // Only include season and episode counts for non-movie types
      if (formData.type !== "Movie") {
        formDataToSubmit.append("seasonCount", formData.seasonCount.toString())
        formDataToSubmit.append("episodeCount", formData.episodeCount.toString())
      } else {
        formDataToSubmit.append("seasonCount", "0")
        formDataToSubmit.append("episodeCount", "0")
      }

      formDataToSubmit.append("selectedGenres", JSON.stringify(formData.selectedGenres))

      let result
      if (isEditing) {
        result = await updateTitle(title.title_id, formDataToSubmit)
      } else {
        result = await createTitle(formDataToSubmit)
      }

      if (result.success) {
        if (!isEditing && !formData.isOriginal) {
          // If it's a new non-original title, redirect to add license page
          router.push(`/licenses/new?title=${result.titleId}`)
        } else {
          router.push("/titles")
        }
        router.refresh()
      } else {
        console.error("Error:", result.error)
        alert("Failed to save title: " + result.error)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("An unexpected error occurred")
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTypes.length > 0 ? (
                      allTypes.map((type) => (
                        <SelectItem key={type.type} value={type.type}>
                          {type.type}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Movie">Movie</SelectItem>
                        <SelectItem value="Series">Series</SelectItem>
                        <SelectItem value="Documentary">Documentary</SelectItem>
                      </>
                    )}
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
                        format(formData.originalReleaseDate, "yyyy-MM-dd")
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
                <Label className="mb-3">Original Content?</Label>
                <RadioGroup
                  defaultValue={formData.isOriginal ? "true" : "false"}
                  onValueChange={(value) => handleRadioChange("isOriginal", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="isOriginal-yes" />
                    <Label htmlFor="isOriginal-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="isOriginal-no" />
                    <Label htmlFor="isOriginal-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {showSeasonEpisode && (
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

            {showLicenseSection && !isEditing && (
              <div className="grid gap-3 border p-4 rounded-md bg-muted/20">
                <Label className="text-md font-semibold">License Information</Label>
                <p className="text-sm text-muted-foreground">
                  You'll be able to add license information after creating this title.
                </p>
              </div>
            )}

            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <Label>Genres</Label>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href="/genres/new" target="_blank">
                    Add New Genre
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {allGenres.map((genre) => (
                  <div key={genre.genre_id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`genre-${genre.genre_id}`}
                      checked={formData.selectedGenres.includes(genre.genre_id.toString())}
                      onChange={() => handleGenreToggle(genre.genre_id.toString())}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
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
              <Button type="button" variant="outline" onClick={() => router.push("/titles")} disabled={isLoading}>
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
