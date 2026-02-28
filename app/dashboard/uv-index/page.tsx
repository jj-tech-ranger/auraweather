"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Sun, 
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Sunrise,
  Sunset,
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  TrendingUp,
  Calendar
} from "lucide-react"

interface UVData {
  current: {
    uvIndex: number
    risk: string
    location: string
    country: string
    time: string
    sunriseTime: string
    sunsetTime: string
    cloudCover: number
  }
  hourly: Array<{
    time: string
    uvIndex: number
    risk: string
    safeExposure: string
  }>
  daily: Array<{
    day: string
    maxUV: number
    avgUV: number
    risk: string
    peakTime: string
  }>
  protection: {
    recommended: string[]
    safeExposureTime: string
    burnTime: string
  }
  coord: { lat: number; lon: number }
}

export default function UVIndexPage() {
  const [uvData, setUvData] = useState<UVData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchUVData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather data
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Fetch UV Index data
      const uvResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!uvResponse.ok) throw new Error('Failed to fetch UV data')
      const uvCurrentData = await uvResponse.json()

      // Fetch forecast data for hourly/daily predictions
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Calculate UV risk level
      const getUVRisk = (uv: number): string => {
        if (uv <= 2) return "Low"
        if (uv <= 5) return "Moderate"
        if (uv <= 7) return "High"
        if (uv <= 10) return "Very High"
        return "Extreme"
      }

      // Calculate safe exposure time (minutes) based on UV index
      const getSafeExposure = (uv: number): string => {
        if (uv <= 2) return "60+ min"
        if (uv <= 5) return "30-40 min"
        if (uv <= 7) return "15-25 min"
        if (uv <= 10) return "10-15 min"
        return "< 10 min"
      }

      // Simulate hourly UV data (OpenWeatherMap free tier doesn't provide hourly UV)
      const currentHour = new Date().getHours()
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = (currentHour + i) % 24
        // UV peaks around noon (12-14)
        let uvIndex: number
        if (hour >= 6 && hour <= 18) {
          // Daytime: calculate UV based on time from sunrise/noon/sunset
          const hoursFromNoon = Math.abs(hour - 13)
          uvIndex = Math.max(0, uvCurrentData.value * (1 - hoursFromNoon / 7))
        } else {
          uvIndex = 0 // No UV at night
        }
        
        return {
          time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          uvIndex: Math.round(uvIndex * 10) / 10,
          risk: getUVRisk(uvIndex),
          safeExposure: getSafeExposure(uvIndex)
        }
      })

      // Process daily data
      const dailyMap: { [key: string]: any[] } = {}
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = []
        }
        dailyMap[dateKey].push(item)
      })

      const dailyData = Object.keys(dailyMap).slice(0, 7).map((dateKey) => {
        const dayData = dailyMap[dateKey]
        // Estimate UV based on cloud cover and time
        const avgCloudCover = dayData.reduce((sum, d) => sum + d.clouds.all, 0) / dayData.length
        const estimatedMaxUV = uvCurrentData.value * (1 - avgCloudCover / 200) // Clouds reduce UV
        const estimatedAvgUV = estimatedMaxUV * 0.7
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          maxUV: Math.max(0, Math.round(estimatedMaxUV * 10) / 10),
          avgUV: Math.max(0, Math.round(estimatedAvgUV * 10) / 10),
          risk: getUVRisk(estimatedMaxUV),
          peakTime: "12:00 PM - 2:00 PM"
        }
      })

      // Generate protection recommendations
      const currentUV = uvCurrentData.value
      const recommendations: string[] = []
      
      if (currentUV <= 2) {
        recommendations.push("Minimal protection required")
        recommendations.push("Sunglasses recommended on bright days")
      } else if (currentUV <= 5) {
        recommendations.push("Wear sunscreen SPF 30+")
        recommendations.push("Wear a hat and sunglasses")
        recommendations.push("Seek shade during midday hours")
      } else if (currentUV <= 7) {
        recommendations.push("Wear sunscreen SPF 30+ and reapply every 2 hours")
        recommendations.push("Wear protective clothing and wide-brimmed hat")
        recommendations.push("Reduce sun exposure 10 AM - 4 PM")
        recommendations.push("Wear UV-blocking sunglasses")
      } else {
        recommendations.push("Wear sunscreen SPF 50+ and reapply frequently")
        recommendations.push("Wear protective clothing covering arms/legs")
        recommendations.push("Avoid sun exposure 10 AM - 4 PM")
        recommendations.push("Seek shade whenever possible")
        recommendations.push("Wear UV-blocking sunglasses and hat")
      }

      setUvData({
        current: {
          uvIndex: Math.round(uvCurrentData.value * 10) / 10,
          risk: getUVRisk(uvCurrentData.value),
          location: currentData.name,
          country: currentData.sys.country,
          time: new Date(uvCurrentData.date_iso || Date.now()).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          sunriseTime: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          sunsetTime: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          cloudCover: currentData.clouds.all
        },
        hourly: hourlyData,
        daily: dailyData,
        protection: {
          recommended: recommendations,
          safeExposureTime: getSafeExposure(currentUV),
          burnTime: currentUV > 7 ? "10-15 minutes" : currentUV > 5 ? "20-30 minutes" : "40-60 minutes"
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching UV data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchUVData(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchUVData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchUVData(-1.2921, 36.8219) // Fallback to London
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      setCurrentLocation({ lat: data.coord.lat, lon: data.coord.lon })
      await fetchUVData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("uvIndexDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("uvIndexDarkMode", String(newDarkMode))
  }

  const getUVColor = (uv: number, dark: boolean): string => {
    if (uv <= 2) return dark ? "text-green-300" : "text-green-600"
    if (uv <= 5) return dark ? "text-yellow-300" : "text-yellow-600"
    if (uv <= 7) return dark ? "text-orange-300" : "text-orange-600"
    if (uv <= 10) return dark ? "text-red-300" : "text-red-600"
    return dark ? "text-purple-300" : "text-purple-600"
  }

  const getUVBg = (uv: number, dark: boolean): string => {
    if (uv <= 2) return dark ? "bg-green-500/20 border-green-400/30" : "bg-green-100 border-green-300"
    if (uv <= 5) return dark ? "bg-yellow-500/20 border-yellow-400/30" : "bg-yellow-100 border-yellow-300"
    if (uv <= 7) return dark ? "bg-orange-500/20 border-orange-400/30" : "bg-orange-100 border-orange-300"
    if (uv <= 10) return dark ? "bg-red-500/20 border-red-400/30" : "bg-red-100 border-red-300"
    return dark ? "bg-purple-500/20 border-purple-400/30" : "bg-purple-100 border-purple-300"
  }

  const getRiskIcon = (risk: string) => {
    switch(risk.toLowerCase()) {
      case "low": return <Shield className="h-5 w-5" />
      case "moderate": return <Eye className="h-5 w-5" />
      case "high": 
      case "very high": return <AlertTriangle className="h-5 w-5" />
      case "extreme": return <AlertTriangle className="h-5 w-5 animate-pulse" />
      default: return <Sun className="h-5 w-5" />
    }
  }

  if (loading && !uvData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950' 
          : 'bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-orange-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading UV Index data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950' 
        : 'bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-orange-500 to-yellow-600' 
                : 'bg-gradient-to-r from-orange-400 to-yellow-500'
            }`}>
              <Sun className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                UV Index Monitor
              </h1>
              {uvData && (
                <div className={`flex items-center gap-2 mt-1 text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{uvData.current.location}, {uvData.current.country}</span>
                  {locationStatus === 'success' && (
                    <Badge className={`${
                      isDarkMode 
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                        : 'bg-orange-100 text-orange-700 border-orange-300'
                    }`}>
                      📍 Your Location
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <form onSubmit={handleSearchCity} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <Button type="submit" size="icon" className="bg-orange-600 hover:bg-orange-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-yellow-600 hover:bg-yellow-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchUVData(currentLocation.lat, currentLocation.lon)}
              size="icon"
              variant="outline"
              className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              onClick={toggleDarkMode}
              size="icon"
              variant="outline"
              className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Current UV Index */}
        {uvData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold mb-2">{uvData.current.location}</h2>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className={`text-6xl font-bold ${getUVColor(uvData.current.uvIndex, isDarkMode)}`}>
                      {uvData.current.uvIndex}
                    </div>
                    <div>
                      <div className={`text-xl ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>UV Index</div>
                      <Badge className={`border text-current ${getUVBg(uvData.current.uvIndex, isDarkMode)}`}>
                        {uvData.current.risk} Risk
                      </Badge>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>Updated: {uvData.current.time}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative w-40 h-40 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={isDarkMode ? "rgba(251, 146, 60, 0.8)" : "rgba(251, 146, 60, 1)"}
                        strokeWidth="8"
                        strokeDasharray={`${Math.min((uvData.current.uvIndex / 11) * 251.2, 251.2)} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {getRiskIcon(uvData.current.risk)}
                    </div>
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>UV Level Gauge</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-orange-500/20 border-orange-400/30' 
                      : 'bg-orange-100 border-orange-300'
                  }`}>
                    <Sunrise className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-orange-300' : 'text-orange-600'
                    }`} />
                    <div className={`text-xl font-bold ${
                      isDarkMode ? 'text-orange-300' : 'text-orange-600'
                    }`}>{uvData.current.sunriseTime}</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Sunrise</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-purple-500/20 border-purple-400/30' 
                      : 'bg-purple-100 border-purple-300'
                  }`}>
                    <Sunset className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`} />
                    <div className={`text-xl font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>{uvData.current.sunsetTime}</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Sunset</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-blue-500/20 border-blue-400/30' 
                      : 'bg-blue-100 border-blue-300'
                  }`}>
                    <Shield className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`} />
                    <div className={`text-xl font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>{uvData.protection.safeExposureTime}</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Safe Time</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-cyan-500/20 border-cyan-400/30' 
                      : 'bg-cyan-100 border-cyan-300'
                  }`}>
                    <Sun className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`} />
                    <div className={`text-xl font-bold ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`}>{uvData.current.cloudCover}%</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Cloud Cover</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly UV Forecast */}
        {uvData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour UV Index Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`h-40 rounded-lg mb-4 flex items-end justify-around p-4 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                {uvData.hourly.slice(0, 12).map((hour, index) => {
                  const height = (hour.uvIndex / 11) * 100
                  return (
                    <div key={`uv-chart-${index}`} className="flex flex-col items-center">
                      <div className={`text-xs mb-1 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{hour.uvIndex}</div>
                      <div 
                        className={`w-4 rounded-t border ${getUVBg(hour.uvIndex, isDarkMode)}`}
                        style={{ height: `${Math.max(height, 10)}%` }}
                      ></div>
                      <div className={`text-xs mt-1 ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>{hour.time}</div>
                    </div>
                  )
                })}
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {uvData.hourly.slice(0, 12).map((hour, index) => (
                  <div key={`uv-hourly-${index}`} className={`rounded-lg p-2 text-center text-xs ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${getUVColor(hour.uvIndex, isDarkMode)}`}>
                      {hour.uvIndex}
                    </div>
                    <Badge className={`text-xs mt-1 text-current border ${getUVBg(hour.uvIndex, isDarkMode)}`}>
                      {hour.risk}
                    </Badge>
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{hour.safeExposure}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily UV Forecast */}
        {uvData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day UV Index Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uvData.daily.map((day, index) => (
                  <div key={`uv-daily-${index}`} className={`grid grid-cols-5 gap-4 items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getUVColor(day.maxUV, isDarkMode)}`}>
                        {day.maxUV}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Max UV</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg ${getUVColor(day.avgUV, isDarkMode)}`}>
                        {day.avgUV}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Avg UV</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`border text-current ${getUVBg(day.maxUV, isDarkMode)}`}>
                        {day.risk}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-gray-700'
                      }`}>Peak: {day.peakTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Protection Recommendations */}
        {uvData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sun Protection Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${getUVColor(uvData.current.uvIndex, isDarkMode)}`} />
                    Current Recommendations
                  </h3>
                  <div className="space-y-2">
                    {uvData.protection.recommended.map((rec, index) => (
                      <div key={`rec-${index}`} className="flex items-start gap-2">
                        <div className={`h-2 w-2 rounded-full mt-1.5 ${
                          isDarkMode ? 'bg-orange-400' : 'bg-orange-600'
                        }`} />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Exposure Guidelines</h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-sm font-medium mb-1">Safe Exposure Time</div>
                      <div className={`text-xl font-bold ${getUVColor(uvData.current.uvIndex, isDarkMode)}`}>
                        {uvData.protection.safeExposureTime}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-gray-500'
                      }`}>Without protection</div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${
                      isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-sm font-medium mb-1">Time to Burn</div>
                      <div className={`text-xl font-bold ${getUVColor(uvData.current.uvIndex, isDarkMode)}`}>
                        {uvData.protection.burnTime}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-gray-500'
                      }`}>For unprotected skin</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* UV Index Scale Reference */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle>UV Index Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className={`p-4 rounded-lg text-center border ${
                isDarkMode ? 'bg-green-500/20 border-green-400/30' : 'bg-green-100 border-green-300'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>0-2</div>
                <div className="font-medium">Low</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Minimal protection</div>
              </div>
              
              <div className={`p-4 rounded-lg text-center border ${
                isDarkMode ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-yellow-100 border-yellow-300'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>3-5</div>
                <div className="font-medium">Moderate</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Protection required</div>
              </div>
              
              <div className={`p-4 rounded-lg text-center border ${
                isDarkMode ? 'bg-orange-500/20 border-orange-400/30' : 'bg-orange-100 border-orange-300'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`}>6-7</div>
                <div className="font-medium">High</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Extra protection</div>
              </div>
              
              <div className={`p-4 rounded-lg text-center border ${
                isDarkMode ? 'bg-red-500/20 border-red-400/30' : 'bg-red-100 border-red-300'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>8-10</div>
                <div className="font-medium">Very High</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Take precautions</div>
              </div>
              
              <div className={`p-4 rounded-lg text-center border ${
                isDarkMode ? 'bg-purple-500/20 border-purple-400/30' : 'bg-purple-100 border-purple-300'
              }`}>
                <div className={`text-2xl font-bold mb-1 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>11+</div>
                <div className="font-medium">Extreme</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Avoid sun exposure</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}