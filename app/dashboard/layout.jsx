"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  Cloud,
  Menu,
  MapPin,
  TrendingUp,
  Satellite,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  AlertTriangle,
  History,
  Search,
  BarChart3,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: Home, shortcut: "⌘D" },
      { name: "Weather Map", href: "/dashboard/weather-map", icon: MapPin, shortcut: "⌘M" },
    ]
  },
  {
    title: "Forecasts",
    items: [
      { name: "Hourly", href: "/dashboard/hourly", icon: TrendingUp },
      { name: "7-Day Forecast", href: "/dashboard/weekly", icon: Calendar },
      { name: "Radar & Satellite", href: "/dashboard/radar", icon: Satellite },
    ]
  },
  {
    title: "Conditions",
    items: [
      { name: "Wind", href: "/dashboard/wind", icon: Wind },
      { name: "Temperature", href: "/dashboard/temperature", icon: Thermometer },
      { name: "Precipitation", href: "/dashboard/precipitation", icon: Droplets },
      { name: "UV Index", href: "/dashboard/uv-index", icon: Sun },
      { name: "Air Quality", href: "/dashboard/air-quality", icon: Activity },
    ]
  },
  {
    title: "Insights",
    items: [
      { name: "Alerts", href: "/dashboard/alerts", icon: AlertTriangle, badge: "2", important: true },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "History", href: "/dashboard/history", icon: History },
    ]
  },
]

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()

  const allNavItems = navigationGroups.flatMap(group => group.items)

  const filteredGroups = searchQuery
      ? [{
        title: "Search Results",
        items: allNavItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }]
      : navigationGroups

  return (
      <TooltipProvider>
        <div className={`grid h-screen w-full overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'md:grid-cols-[70px_1fr]' : 'md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]'
        }`}>
          <div className={`hidden border-r bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 md:flex flex-col h-full transition-all duration-300 ${
              isCollapsed ? 'w-[70px]' : ''
          }`}>
            <div className="flex h-14 items-center border-b px-3 lg:h-[60px] lg:px-4 shrink-0">
              {!isCollapsed && (
                  <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800 transition-all">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                      <Cloud className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-base">AuraWeather</span>
                  </Link>
              )}
              {isCollapsed && (
                  <Link href="/" className="flex items-center justify-center w-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                      <Cloud className="h-5 w-5 text-white" />
                    </div>
                  </Link>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className={`h-8 w-8 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all ${
                          isCollapsed ? 'ml-0' : 'ml-auto'
                      }`}
                  >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </TooltipContent>
              </Tooltip>
            </div>

            {!isCollapsed && (
                <div className="px-3 py-3 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>
            )}

            <div className="flex-1 px-2 overflow-y-auto sidebar-scroll pb-4">
              <nav className="space-y-1 py-2">
                {filteredGroups.map((group, groupIndex) => (
                    <div key={group.title} className={groupIndex > 0 ? "mt-4" : ""}>
                      {!isCollapsed && (
                          <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {group.title}
                          </h3>
                      )}
                      {isCollapsed && groupIndex > 0 && (
                          <Separator className="my-2" />
                      )}
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href
                          const NavLink = (
                              <Link
                                  key={item.name}
                                  href={item.href}
                                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                      isActive
                                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20"
                                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                                  } ${isCollapsed ? "justify-center" : ""} ${
                                      item.important && !isActive ? "text-orange-600 hover:text-orange-700" : ""
                                  }`}
                              >
                                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                                {!isCollapsed && (
                                    <>
                                      <span className="flex-1">{item.name}</span>
                                      {item.badge && (
                                          <Badge className={`h-5 px-2 text-xs ${
                                              isActive
                                                  ? "bg-white/20 text-white border-white/30"
                                                  : "bg-red-500 text-white"
                                          }`}>
                                            {item.badge}
                                          </Badge>
                                      )}
                                      {item.shortcut && !isActive && (
                                          <span className="text-xs text-slate-400">{item.shortcut}</span>
                                      )}
                                    </>
                                )}
                              </Link>
                          )

                          if (isCollapsed) {
                            return (
                                <Tooltip key={item.name}>
                                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                                  <TooltipContent side="right" className="flex items-center gap-4">
                                    <span>{item.name}</span>
                                    {item.badge && (
                                        <Badge className="bg-red-500 text-white">{item.badge}</Badge>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                            )
                          }

                          return NavLink
                        })}
                      </div>
                    </div>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex flex-col h-full overflow-y-auto relative">
            <header className="flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50 shrink-0">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 md:hidden border-slate-300 text-slate-600 hover:bg-slate-50"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="flex flex-col bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 p-0 w-[280px]"
                >
                  <div className="flex items-center gap-2 px-4 py-4 border-b shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <Cloud className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">AuraWeather</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                          type="search"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9 bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto sidebar-scroll">
                    <div className="px-4">
                      <nav className="space-y-1 pb-4">
                        {filteredGroups.map((group, groupIndex) => (
                            <div key={group.title} className={groupIndex > 0 ? "mt-6" : "mt-2"}>
                              <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {group.title}
                              </h3>
                              <div className="space-y-1">
                                {group.items.map((item) => {
                                  const isActive = pathname === item.href
                                  return (
                                      <Link
                                          key={item.name}
                                          href={item.href}
                                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                                              isActive
                                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                                  : "text-slate-700 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                                          } ${item.important && !isActive ? "text-orange-600" : ""}`}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                      >
                                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : ""}`} />
                                        <span className="flex-1">{item.name}</span>
                                        {item.badge && (
                                            <Badge className={`h-5 px-2 text-xs ${
                                                isActive
                                                    ? "bg-white/20 text-white border-white/30"
                                                    : "bg-red-500 text-white"
                                            }`}>
                                              {item.badge}
                                            </Badge>
                                        )}
                                      </Link>
                                  )
                                })}
                              </div>
                            </div>
                        ))}
                      </nav>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex-1">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search weather data..."
                        className="w-full pl-8 h-9 bg-white/50 backdrop-blur-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400 md:w-2/3 lg:w-1/3"
                    />
                  </div>
                </form>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-slate-200 hover:bg-slate-50 relative"
                    >
                      <Bell className="h-4 w-4" />
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                      2
                    </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </header>

            <main className="flex flex-1 flex-col bg-slate-50/50">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
  )
}