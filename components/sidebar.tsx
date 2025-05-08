"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Film,
  Users,
  BarChart,
  Tag,
  Globe,
  Building,
  FileText,
  User,
  Home,
  Clock,
  AlertTriangle,
  Layers,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { getExpiringLicensesCount } from "@/app/actions/sidebar-actions"

const mainRoutes = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Titles", href: "/titles", icon: Film },
  { name: "Analytics", href: "/analytics", icon: BarChart },
]

const contentRoutes = [
  { name: "Genres", href: "/genres", icon: Tag },
  { name: "Origins", href: "/origins", icon: Globe },
  { name: "Content Providers", href: "/providers", icon: Building },
  { name: "Licenses", href: "/licenses", icon: FileText },
]

const viewerRoutes = [{ name: "Viewers", href: "/viewers", icon: Users }]

const adminRoutes = [{ name: "Admins", href: "/admins", icon: User }]

export function Sidebar() {
  const pathname = usePathname()
  const [contentOpen, setContentOpen] = useState(true)
  const [adminOpen, setAdminOpen] = useState(true)
  const [expiringLicenses, setExpiringLicenses] = useState(0)

  useEffect(() => {
    // Fetch the count of expiring licenses
    const fetchExpiringLicensesCount = async () => {
      try {
        const count = await getExpiringLicensesCount()
        setExpiringLicenses(count)
      } catch (error) {
        console.error("Error fetching expiring licenses count:", error)
      }
    }

    fetchExpiringLicensesCount()

    // Set up an interval to refresh the count every 5 minutes
    const interval = setInterval(fetchExpiringLicensesCount, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen sticky top-0 bg-background border-r">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
          <h1 className="text-xl font-bold">Broke2Binge</h1>
        </div>
        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="px-2 space-y-1">
            {/* Main Navigation */}
            <div className="mb-6">
              {mainRoutes.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group mb-1",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Content Management */}
            <div className="mb-6">
              <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-2 py-2 text-sm font-medium rounded-md mb-1"
                  >
                    <div className="flex items-center">
                      <Layers className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span>Content Management</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        contentOpen ? "transform rotate-180" : "",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {contentRoutes.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm font-medium rounded-md group mb-1 pl-10",
                          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                        {item.name === "Licenses" && expiringLicenses > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {expiringLicenses}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Viewers Section - Moved after Content Management */}
            <div className="mb-6">
              {viewerRoutes.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group mb-1",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Admin Section */}
            <div className="mb-6">
              <Link
                href="/admins"
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group mb-1",
                  pathname === "/admins" || pathname.startsWith("/admins")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <User className="mr-3 h-5 w-5 flex-shrink-0" />
                Admins
              </Link>
            </div>

            {/* Quick Access */}
            <div className="pt-4 border-t">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Access
              </h3>
              <div className="mt-2">
                <Link
                  href="/licenses?filter=expiring"
                  className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-destructive hover:bg-muted group"
                >
                  <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0" />
                  Expiring Soon
                  {expiringLicenses > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {expiringLicenses}
                    </Badge>
                  )}
                </Link>
                <Link
                  href="/titles?sort=original_release_date&order=DESC"
                  className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted group"
                >
                  <Clock className="mr-3 h-5 w-5 flex-shrink-0" />
                  Recent Additions
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
