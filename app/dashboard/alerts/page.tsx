"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  AlertTriangle,
  Bell,
  BellOff,
  MapPin,
  Search,
  Target,
  Loader2,
  CloudRain,
  Wind,
  Snowflake,
  Zap,
  Thermometer,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Calendar,
  MapPinned,
  Radio,
  Shield,
  Sun,
  Moon
} from "lucide-react"

interface WeatherAlert {
  id: string
  event: string
  headline: string
  description: string
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown"
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown"
  start: number
  end: number
  senderName: string
  tags: string[]
}

interface AlertsData {
  alerts: WeatherAlert[]
  location: string
  country: string
  coord: { lat: number; lon: number }
  lastUpdated: string
}

export default function AlertsPage() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Get user's location on component mount
  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("weatherAlertsDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lon: longitude })
          setLocationStatus('success')
          fetchAlerts(latitude, longitude)
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
          // Fallback to default location (New York)
          fetchAlerts(40.7128, -74.0060)
        }
      )
    } else {
      setLocationStatus('error')
      // Fallback to default location
      fetchAlerts(40.7128, -74.0060)
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("weatherAlertsDarkMode", String(newDarkMode))
  }

  const fetchAlerts = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather to get location name
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data')
      const weatherData = await weatherResponse.json()

      // Fetch weather alerts using One Call API
      const alertsResponse = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      let alerts: WeatherAlert[] = []
      
      if (alertsResponse.ok) {
        const alertsApiData = await alertsResponse.json()
        
        if (alertsApiData.alerts && alertsApiData.alerts.length > 0) {
          alerts = alertsApiData.alerts.map((alert: any, index: number) => ({
            id: `${alert.start}-${index}`,
            event: alert.event || "Weather Alert",
            headline: alert.event || "Weather Alert",
            description: alert.description || "No description available",
            severity: alert.tags?.[0] || "Unknown",
            urgency: "Expected",
            start: alert.start,
            end: alert.end,
            senderName: alert.sender_name || "Weather Service",
            tags: alert.tags || []
          }))
        }
      }

      setAlertsData({
        alerts: alerts,
        location: weatherData.name,
        country: weatherData.sys.country,
        coord: { lat, lon },
        lastUpdated: new Date().toISOString()
      })
      
      setCurrentLocation({ lat, lon })
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      await fetchAlerts(data.coord.lat, data.coord.lon)
      setSearchCity("")
    } catch (error) {
      console.error("Error searching city:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      fetchAlerts(currentLocation.lat, currentLocation.lon)
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'destructive'
      case 'severe':
        return 'destructive'
      case 'moderate':
        return 'default'
      case 'minor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return <AlertTriangle className="h-5 w-5" />
      case 'moderate':
        return <AlertCircle className="h-5 w-5" />
      case 'minor':
        return <Info className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertIcon = (event: string) => {
    const eventLower = event.toLowerCase()
    if (eventLower.includes('rain') || eventLower.includes('flood')) return <CloudRain className="h-6 w-6" />
    if (eventLower.includes('wind') || eventLower.includes('gale')) return <Wind className="h-6 w-6" />
    if (eventLower.includes('snow') || eventLower.includes('ice')) return <Snowflake className="h-6 w-6" />
    if (eventLower.includes('thunder') || eventLower.includes('lightning')) return <Zap className="h-6 w-6" />
    if (eventLower.includes('heat') || eventLower.includes('temperature')) return <Thermometer className="h-6 w-6" />
    return <AlertTriangle className="h-6 w-6" />
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (endTimestamp: number): string => {
    const now = Date.now() / 1000
    const remaining = endTimestamp - now
    
    if (remaining < 0) return "Expired"
    
    const hours = Math.floor(remaining / 3600)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
    
    const minutes = Math.floor(remaining / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[600px] ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
          : 'bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50'
      } transition-colors duration-500`}>
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className={`font-medium ${
            isDarkMode ? 'text-white' : 'text-slate-700'
          }`}>Loading weather alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 space-y-4 p-4 md:p-6 lg:p-8 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
        : 'bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50'
    } transition-colors duration-500`}>
      {/* Header Section - Sidebar Style */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}>Weather Alerts</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-white/70' : 'text-slate-600'
              }`}>Stay informed about severe weather conditions</p>
            </div>
          </div>
          <Button
            onClick={toggleDarkMode}
            size="icon"
            variant="outline"
            className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100'
            }`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Separator className={`${
        isDarkMode ? 'bg-white/20' : 'bg-slate-200'
      }`} />

      {/* Location & Search Controls - Sidebar Style */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current Location Display */}
        {alertsData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-slate-200 bg-white text-slate-900'
          } shadow-sm hover:shadow-md transition-all backdrop-blur-lg`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                  <MapPinned className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-slate-700'
                  }`}>{alertsData.location}, {alertsData.country}</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    {new Date(alertsData.lastUpdated).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Toggle */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'border-slate-200 bg-white text-slate-900'
        } shadow-sm hover:shadow-md transition-all backdrop-blur-lg`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  notificationsEnabled 
                    ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                    : isDarkMode ? "bg-white/10" : "bg-slate-200"
                }`}>
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-white" />
                  ) : (
                    <BellOff className={`h-5 w-5 ${
                      isDarkMode ? 'text-white/70' : 'text-slate-600'
                    }`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-slate-700'
                  }`}>Notifications</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    {notificationsEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' 
                    : 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                Toggle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section - Sidebar Style */}
      <Card className={`${
        isDarkMode 
          ? 'bg-white/10 border-white/20 text-white' 
          : 'border-slate-200 bg-white text-slate-900'
      } shadow-sm backdrop-blur-lg`}>
        <CardHeader>
          <CardTitle className={`text-base font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-800'
          }`}>Search Location</CardTitle>
          <CardDescription className={`text-sm ${
            isDarkMode ? 'text-white/70' : 'text-slate-600'
          }`}>Find weather alerts for any city</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${
                isDarkMode ? 'text-white/50' : 'text-slate-400'
              }`} />
              <Input
                type="text"
                placeholder="Search for a city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className={`pl-8 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
                    : 'bg-white border-slate-200'
                } focus:border-blue-400 focus:ring-blue-400`}
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={loading || locationStatus === 'denied'}
              className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' 
                  : 'border-slate-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Current
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alerts Summary Cards - Sidebar Style */}
      {alertsData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-slate-200 bg-white text-slate-900'
          } shadow-sm hover:shadow-md transition-all backdrop-blur-lg`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-700'
                }`}>Active Alerts</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}>{alertsData.alerts.length}</div>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-white/60' : 'text-slate-500'
              }`}>Current warnings</p>
            </CardContent>
          </Card>

          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-slate-200 bg-white text-slate-900'
          } shadow-sm hover:shadow-md transition-all backdrop-blur-lg`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-700'
                }`}>Severity Level</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                }`}>
                  <Shield className={`h-4 w-4 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}>
                {alertsData.alerts.length > 0 ? alertsData.alerts[0].severity : "None"}
              </div>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-white/60' : 'text-slate-500'
              }`}>Highest level</p>
            </CardContent>
          </Card>

          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'border-slate-200 bg-white text-slate-900'
          } shadow-sm hover:shadow-md transition-all backdrop-blur-lg`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-700'
                }`}>Status</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  notificationsEnabled 
                    ? (isDarkMode ? 'bg-green-500/20' : 'bg-green-100') 
                    : (isDarkMode ? 'bg-white/10' : 'bg-slate-100')
                }`}>
                  <Radio className={`h-4 w-4 ${
                    notificationsEnabled 
                      ? (isDarkMode ? 'text-green-300' : 'text-green-600') 
                      : (isDarkMode ? 'text-white/70' : 'text-slate-600')
                  }`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-800'
              }`}>
                {notificationsEnabled ? "Active" : "Inactive"}
              </div>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-white/60' : 'text-slate-500'
              }`}>Monitoring status</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      {alertsData && alertsData.alerts.length > 0 ? (
        <div className="space-y-4">
          <h2 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>Active Weather Alerts</h2>
          {alertsData.alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 border-l-destructive ${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } backdrop-blur-lg`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getAlertIcon(alert.event)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{alert.headline}</CardTitle>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {getSeverityIcon(alert.severity)}
                          <span className="ml-1">{alert.severity}</span>
                        </Badge>
                      </div>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        Issued by {alert.senderName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {alert.description}
                  </p>
                </div>
                
                <div className={`grid gap-3 md:grid-cols-2 pt-4 border-t ${
                  isDarkMode ? 'border-white/20' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className={`h-4 w-4 ${
                      isDarkMode ? 'text-white/70' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium">Effective</p>
                      <p className={`${
                        isDarkMode ? 'text-white/70' : 'text-muted-foreground'
                      }`}>{formatDate(alert.start)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className={`h-4 w-4 ${
                      isDarkMode ? 'text-white/70' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium">Expires</p>
                      <p className={`${
                        isDarkMode ? 'text-white/70' : 'text-muted-foreground'
                      }`}>
                        {formatDate(alert.end)} ({getTimeRemaining(alert.end)})
                      </p>
                    </div>
                  </div>
                </div>

                {alert.tags && alert.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {alert.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        } backdrop-blur-lg`}>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className={`${
                isDarkMode ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                There are currently no weather alerts for {alertsData?.location || 'this location'}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Footer */}
      <Card className={`${
        isDarkMode 
          ? 'bg-white/10 border-white/20 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      } backdrop-blur-lg`}>
        <CardHeader>
          <CardTitle className="text-sm">About Weather Alerts</CardTitle>
        </CardHeader>
        <CardContent className={`text-sm space-y-2 ${
          isDarkMode ? 'text-white/80' : 'text-muted-foreground'
        }`}>
          <p>
            Weather alerts are official warnings issued by meteorological services about potentially 
            dangerous weather conditions. Stay informed and take necessary precautions when alerts are active.
          </p>
          <div className="grid gap-2 md:grid-cols-4 pt-4">
            <div>
              <p className="font-semibold text-destructive">Extreme</p>
              <p className="text-xs">Severe threat to life</p>
            </div>
            <div>
              <p className="font-semibold text-orange-500">Severe</p>
              <p className="text-xs">Significant danger</p>
            </div>
            <div>
              <p className="font-semibold text-yellow-500">Moderate</p>
              <p className="text-xs">Possible disruption</p>
            </div>
            <div>
              <p className="font-semibold text-blue-500">Minor</p>
              <p className="text-xs">Minimal impact</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
