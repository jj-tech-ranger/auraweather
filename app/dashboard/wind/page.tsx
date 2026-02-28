"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Wind, 
  Navigation, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Gauge,
  Compass
} from "lucide-react"

interface WindData {
  current: {
    speed: number
    direction: number
    gust: number
    location: string
    country: string
    beaufortScale: number
    pressure: number
  }
  hourly: Array<{
    time: string
    speed: number
    direction: number
    gust: number
  }>
  daily: Array<{
    day: string
    avgSpeed: number
    maxSpeed: number
    direction: string
    gustMax: number
  }>
  alerts: Array<{
    type: string
    message: string
    severity: string
  }>
  coord: { lat: number; lon: number }
}

export default function WindPage() {
  const [windData, setWindData] = useState<WindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState("kmh")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const calculateBeaufortScale = (speedKmh: number): number => {
    if (speedKmh < 1) return 0
    if (speedKmh < 6) return 1
    if (speedKmh < 12) return 2
    if (speedKmh < 20) return 3
    if (speedKmh < 29) return 4
    if (speedKmh < 39) return 5
    if (speedKmh < 50) return 6
    if (speedKmh < 62) return 7
    if (speedKmh < 75) return 8
    if (speedKmh < 89) return 9
    if (speedKmh < 103) return 10
    if (speedKmh < 118) return 11
    return 12
  }

  const fetchWindData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather for wind data
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Fetch forecast data
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Process hourly data
      const hourlyData = forecastData.list.slice(0, 24).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
        speed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
        direction: item.wind.deg,
        gust: Math.round((item.wind.gust || item.wind.speed * 1.5) * 3.6)
      }))

      // Process daily data (group by day)
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
        const speeds = dayData.map(d => d.wind.speed * 3.6)
        const gusts = dayData.map(d => (d.wind.gust || d.wind.speed * 1.5) * 3.6)
        const directions = dayData.map(d => d.wind.deg)
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          avgSpeed: Math.round(speeds.reduce((a, b) => a + b) / speeds.length),
          maxSpeed: Math.round(Math.max(...speeds)),
          direction: getDirectionName(Math.round(directions.reduce((a, b) => a + b) / directions.length)),
          gustMax: Math.round(Math.max(...gusts))
        }
      })

      const windSpeed = Math.round(currentData.wind.speed * 3.6)
      const gustSpeed = Math.round((currentData.wind.gust || currentData.wind.speed * 1.5) * 3.6)

      // Check for wind alerts
      const alerts = []
      if (windSpeed > 40 || gustSpeed > 60) {
        alerts.push({
          type: "Wind Advisory",
          message: `Strong winds with gusts up to ${gustSpeed} km/h expected`,
          severity: windSpeed > 60 ? "high" : "moderate"
        })
      }

      setWindData({
        current: {
          speed: windSpeed,
          direction: currentData.wind.deg,
          gust: gustSpeed,
          location: currentData.name,
          country: currentData.sys.country,
          beaufortScale: calculateBeaufortScale(windSpeed),
          pressure: currentData.main.pressure
        },
        hourly: hourlyData,
        daily: dailyData,
        alerts,
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching wind data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWindData(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWindData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWindData(-1.2921, 36.8219) // Fallback to London
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
      await fetchWindData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("windDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("windDarkMode", String(newDarkMode))
  }

  const convertSpeed = (speed: number) => {
    if (unit === "mph") return Math.round(speed * 0.621371)
    if (unit === "ms") return Math.round(speed * 0.277778)
    return speed
  }

  const getSpeedUnit = () => {
    if (unit === "mph") return "mph"
    if (unit === "ms") return "m/s"
    return "km/h"
  }

  const getDirectionName = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return directions[Math.round(degrees / 22.5) % 16]
  }

  const getBeaufortDescription = (scale: number) => {
    const descriptions = [
      "Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze",
      "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Strong gale",
      "Storm", "Violent storm", "Hurricane"
    ]
    return descriptions[Math.min(scale, 12)]
  }

  const getWindColor = (speed: number, dark: boolean) => {
    if (speed < 10) return dark ? "text-green-300" : "text-green-600"
    if (speed < 20) return dark ? "text-yellow-300" : "text-yellow-600"
    if (speed < 40) return dark ? "text-orange-300" : "text-orange-600"
    return dark ? "text-red-300" : "text-red-600"
  }

  const getWindBg = (speed: number, dark: boolean) => {
    if (speed < 10) return dark ? "bg-green-500/20 border-green-400/30" : "bg-green-100 border-green-300"
    if (speed < 20) return dark ? "bg-yellow-500/20 border-yellow-400/30" : "bg-yellow-100 border-yellow-300"
    if (speed < 40) return dark ? "bg-orange-500/20 border-orange-400/30" : "bg-orange-100 border-orange-300"
    return dark ? "bg-red-500/20 border-red-400/30" : "bg-red-100 border-red-300"
  }

  if (loading && !windData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-blue-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading wind data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-blue-400 to-purple-500'
            }`}>
              <Wind className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Wind Conditions
              </h1>
              {windData && (
                <div className={`flex items-center gap-2 mt-1 text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{windData.current.location}, {windData.current.country}</span>
                  {locationStatus === 'success' && (
                    <Badge className={`${
                      isDarkMode 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 border-blue-300'
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
              <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchWindData(currentLocation.lat, currentLocation.lon)}
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

            <Button
              onClick={() => setUnit("kmh")}
              variant="outline"
              className={`${
                unit === "kmh"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              km/h
            </Button>
            <Button
              onClick={() => setUnit("mph")}
              variant="outline"
              className={`${
                unit === "mph"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              mph
            </Button>
            <Button
              onClick={() => setUnit("ms")}
              variant="outline"
              className={`${
                unit === "ms"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              m/s
            </Button>
          </div>
        </div>

        {/* Wind Alerts */}
        {windData && windData.alerts.length > 0 && (
          <Card className={`border ${
            isDarkMode 
              ? 'bg-orange-500/20 border-orange-400/30 text-white' 
              : 'bg-orange-100 border-orange-300 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-4">
              {windData.alerts.map((alert, index) => (
                <div key={`alert-${index}`} className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`} />
                  <div>
                    <span className="font-medium">{alert.type}: </span>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Current Wind Conditions */}
        {windData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold mb-2">{windData.current.location}</h2>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className={`text-6xl font-bold ${getWindColor(windData.current.speed, isDarkMode)}`}>
                      {convertSpeed(windData.current.speed)}
                    </div>
                    <div>
                      <div className={`text-xl ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>{getSpeedUnit()}</div>
                      <Badge className={`${getWindBg(windData.current.speed, isDarkMode)} border text-current`}>
                        {getBeaufortDescription(windData.current.beaufortScale)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <Navigation className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`} style={{ transform: `rotate(${windData.current.direction}deg)` }} />
                    <span className="text-lg">{getDirectionName(windData.current.direction)} ({windData.current.direction}°)</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="relative w-40 h-40 mx-auto mb-4">
                    <div className={`absolute inset-0 border-4 rounded-full ${
                      isDarkMode ? 'border-white/20' : 'border-gray-300'
                    }`}></div>
                    <div className={`absolute inset-2 border-2 rounded-full ${
                      isDarkMode ? 'border-white/30' : 'border-gray-400'
                    }`}></div>
                    <div className={`absolute inset-4 border rounded-full ${
                      isDarkMode ? 'border-white/20' : 'border-gray-300'
                    }`}></div>
                    
                    <Navigation 
                      className={`absolute top-1/2 left-1/2 h-16 w-16 ${
                        isDarkMode ? 'text-white' : 'text-blue-600'
                      }`}
                      style={{ transform: `translate(-50%, -50%) rotate(${windData.current.direction}deg)` }}
                    />
                    
                    <Compass className={`absolute top-1/2 left-1/2 h-10 w-10 ${
                      isDarkMode ? 'text-white/30' : 'text-gray-400'
                    }`} style={{ transform: 'translate(-50%, -50%)' }} />
                    
                    <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>N</div>
                    <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>E</div>
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>S</div>
                    <div className={`absolute left-1 top-1/2 transform -translate-y-1/2 text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>W</div>
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>Wind Direction Compass</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-red-500/20 border-red-400/30' 
                      : 'bg-red-100 border-red-300'
                  }`}>
                    <Activity className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`}>{convertSpeed(windData.current.gust)}</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Gust {getSpeedUnit()}</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-blue-500/20 border-blue-400/30' 
                      : 'bg-blue-100 border-blue-300'
                  }`}>
                    <Wind className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>{windData.current.beaufortScale}</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Beaufort Scale</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border col-span-2 ${
                    isDarkMode 
                      ? 'bg-purple-500/20 border-purple-400/30' 
                      : 'bg-purple-100 border-purple-300'
                  }`}>
                    <Gauge className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>{windData.current.pressure} hPa</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Atmospheric Pressure</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Wind Forecast */}
        {windData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour Wind Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {windData.hourly.slice(0, 12).map((hour, index) => (
                  <div key={`hourly-wind-${index}`} className={`rounded-lg p-2 text-center text-xs ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${getWindColor(hour.speed, isDarkMode)}`}>
                      {convertSpeed(hour.speed)}
                    </div>
                    <div className={`mb-1 ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{getSpeedUnit()}</div>
                    <Navigation 
                      className={`h-4 w-4 mx-auto ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}
                      style={{ transform: `rotate(${hour.direction}deg)` }}
                    />
                    <div className={`mt-1 ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>G{convertSpeed(hour.gust)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Wind Forecast */}
        {windData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5" />
                7-Day Wind Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {windData.daily.map((day, index) => (
                  <div key={`daily-wind-${index}`} className={`grid grid-cols-5 gap-4 items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getWindColor(day.avgSpeed, isDarkMode)}`}>
                        {convertSpeed(day.avgSpeed)}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Avg {getSpeedUnit()}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getWindColor(day.maxSpeed, isDarkMode)}`}>
                        {convertSpeed(day.maxSpeed)}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Max {getSpeedUnit()}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>{day.direction}</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Direction</div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`${getWindBg(day.gustMax, isDarkMode)} border text-current`}>
                        Gust: {convertSpeed(day.gustMax)} {getSpeedUnit()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beaufort Scale Reference */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle>Beaufort Wind Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { scale: "0-1", name: "Calm to Light Air", speed: "0-5 km/h", desc: "Smoke rises vertically", color: "green" },
                { scale: "2-3", name: "Light to Gentle Breeze", speed: "6-19 km/h", desc: "Leaves rustle, flags move", color: "yellow" },
                { scale: "4-5", name: "Moderate to Fresh Breeze", speed: "20-38 km/h", desc: "Small branches move", color: "orange" },
                { scale: "6-7", name: "Strong Breeze to Gale", speed: "39-61 km/h", desc: "Large branches move", color: "red" }
              ].map((item, index) => (
                <div key={`beaufort-${index}`} className={`text-center p-4 rounded-lg border ${
                  isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`font-bold text-lg mb-1 ${
                    item.color === 'green' ? (isDarkMode ? 'text-green-300' : 'text-green-600') :
                    item.color === 'yellow' ? (isDarkMode ? 'text-yellow-300' : 'text-yellow-600') :
                    item.color === 'orange' ? (isDarkMode ? 'text-orange-300' : 'text-orange-600') :
                    (isDarkMode ? 'text-red-300' : 'text-red-600')
                  }`}>{item.scale}</div>
                  <div className={`text-sm mb-2 ${
                    isDarkMode ? 'text-white/90' : 'text-gray-800'
                  }`}>{item.name}</div>
                  <div className={`text-xs mb-2 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>{item.speed}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}