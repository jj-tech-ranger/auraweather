"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Thermometer, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Droplets,
  Eye,
  Gauge
} from "lucide-react"

interface TemperatureData {
  current: {
    temperature: number
    feelsLike: number
    high: number
    low: number
    location: string
    country: string
    humidity: number
    visibility: number
    pressure: number
  }
  hourly: Array<{
    time: string
    temperature: number
    feelsLike: number
  }>
  daily: Array<{
    day: string
    high: number
    low: number
    trend: "up" | "down" | "stable"
  }>
  extremes: {
    recordHigh: { temp: number; date: string }
    recordLow: { temp: number; date: string }
    avgHigh: number
    avgLow: number
  }
  coord: { lat: number; lon: number }
}

export default function TemperaturePage() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchTemperatureData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather
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
        temperature: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like)
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

      const dailyData = Object.keys(dailyMap).slice(0, 7).map((dateKey, index) => {
        const dayData = dailyMap[dateKey]
        const temps = dayData.map(d => d.main.temp)
        const high = Math.round(Math.max(...temps))
        const low = Math.round(Math.min(...temps))
        
        // Calculate trend
        let trend: "up" | "down" | "stable" = "stable"
        if (index > 0) {
          const prevDayKey = Object.keys(dailyMap)[index - 1]
          const prevDayData = dailyMap[prevDayKey]
          const prevTemps = prevDayData.map(d => d.main.temp)
          const prevAvg = prevTemps.reduce((a, b) => a + b) / prevTemps.length
          const currentAvg = temps.reduce((a, b) => a + b) / temps.length
          
          if (currentAvg > prevAvg + 2) trend = "up"
          else if (currentAvg < prevAvg - 2) trend = "down"
        }
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          high,
          low,
          trend
        }
      })

      // Calculate averages for extremes
      const allTemps = forecastData.list.map((item: any) => item.main.temp)
      const avgHigh = Math.round(Math.max(...allTemps))
      const avgLow = Math.round(Math.min(...allTemps))

      setTemperatureData({
        current: {
          temperature: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          high: Math.round(currentData.main.temp_max),
          low: Math.round(currentData.main.temp_min),
          location: currentData.name,
          country: currentData.sys.country,
          humidity: currentData.main.humidity,
          visibility: Math.round(currentData.visibility / 1000), // Convert to km
          pressure: currentData.main.pressure
        },
        hourly: hourlyData,
        daily: dailyData,
        extremes: {
          recordHigh: { 
            temp: avgHigh + 8, 
            date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          recordLow: { 
            temp: avgLow - 15, 
            date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          avgHigh,
          avgLow
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching temperature data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchTemperatureData(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchTemperatureData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchTemperatureData(-1.2921, 36.8219) // Fallback to London
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
      await fetchTemperatureData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("temperatureDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("temperatureDarkMode", String(newDarkMode))
  }

  const convertTemp = (temp: number): number => {
    if (unit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  const getTemperatureColor = (temp: number, dark: boolean): string => {
    if (temp <= 0) return dark ? "text-blue-300" : "text-blue-600"
    if (temp <= 10) return dark ? "text-blue-200" : "text-blue-500"
    if (temp <= 20) return dark ? "text-green-300" : "text-green-600"
    if (temp <= 30) return dark ? "text-yellow-300" : "text-yellow-600"
    return dark ? "text-red-300" : "text-red-600"
  }

  const getTemperatureBg = (temp: number, dark: boolean): string => {
    if (temp <= 0) return dark ? "bg-blue-500/20 border-blue-400/30" : "bg-blue-100 border-blue-300"
    if (temp <= 10) return dark ? "bg-blue-400/20 border-blue-300/30" : "bg-blue-50 border-blue-200"
    if (temp <= 20) return dark ? "bg-green-400/20 border-green-400/30" : "bg-green-100 border-green-300"
    if (temp <= 30) return dark ? "bg-yellow-400/20 border-yellow-400/30" : "bg-yellow-100 border-yellow-300"
    return dark ? "bg-red-400/20 border-red-400/30" : "bg-red-100 border-red-300"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable", dark: boolean) => {
    switch(trend) {
      case "up": return <TrendingUp className={`h-4 w-4 ${dark ? 'text-red-400' : 'text-red-600'}`} />
      case "down": return <TrendingDown className={`h-4 w-4 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
      default: return <Minus className={`h-4 w-4 ${dark ? 'text-gray-400' : 'text-gray-600'}`} />
    }
  }

  if (loading && !temperatureData) {
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
            Loading temperature data...
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
              <Thermometer className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Temperature Analysis
              </h1>
              {temperatureData && (
                <div className={`flex items-center gap-2 mt-1 text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{temperatureData.current.location}, {temperatureData.current.country}</span>
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
              onClick={() => currentLocation && fetchTemperatureData(currentLocation.lat, currentLocation.lon)}
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
              onClick={() => setUnit("celsius")}
              variant="outline"
              className={`${
                unit === "celsius"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              °C
            </Button>
            <Button
              onClick={() => setUnit("fahrenheit")}
              variant="outline"
              className={`${
                unit === "fahrenheit"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              °F
            </Button>
          </div>
        </div>

        {/* Current Temperature */}
        {temperatureData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold mb-2">{temperatureData.current.location}</h2>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className={`text-6xl font-bold ${getTemperatureColor(temperatureData.current.temperature, isDarkMode)}`}>
                      {convertTemp(temperatureData.current.temperature)}°
                    </div>
                    <div>
                      <div className={`text-xl ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>{unit === "celsius" ? "Celsius" : "Fahrenheit"}</div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        Feels like {convertTemp(temperatureData.current.feelsLike)}°
                      </div>
                    </div>
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
                        stroke={isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(59,130,246,0.8)"}
                        strokeWidth="8"
                        strokeDasharray={`${((temperatureData.current.temperature + 20) / 80) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Thermometer className={`h-12 w-12 ${
                        isDarkMode ? 'text-white' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>Temperature Gauge</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-red-500/20 border-red-400/30' 
                      : 'bg-red-100 border-red-300'
                  }`}>
                    <TrendingUp className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-red-300' : 'text-red-600'
                    }`}>{convertTemp(temperatureData.current.high)}°</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Today's High</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-blue-500/20 border-blue-400/30' 
                      : 'bg-blue-100 border-blue-300'
                  }`}>
                    <TrendingDown className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>{convertTemp(temperatureData.current.low)}°</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Today's Low</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-cyan-500/20 border-cyan-400/30' 
                      : 'bg-cyan-100 border-cyan-300'
                  }`}>
                    <Droplets className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`}>{temperatureData.current.humidity}%</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Humidity</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-purple-500/20 border-purple-400/30' 
                      : 'bg-purple-100 border-purple-300'
                  }`}>
                    <Eye className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>{temperatureData.current.visibility} km</div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Visibility</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Temperature Chart */}
        {temperatureData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour Temperature Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`h-40 rounded-lg mb-4 flex items-end justify-around p-4 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                {temperatureData.hourly.slice(0, 12).map((hour, index) => {
                  const height = ((hour.temperature + 20) / 70) * 100
                  return (
                    <div key={`temp-chart-${index}`} className="flex flex-col items-center">
                      <div className={`text-xs mb-1 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{convertTemp(hour.temperature)}°</div>
                      <div 
                        className={`w-4 rounded-t border ${getTemperatureBg(hour.temperature, isDarkMode)}`}
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
                {temperatureData.hourly.slice(0, 12).map((hour, index) => (
                  <div key={`temp-hourly-${index}`} className={`rounded-lg p-2 text-center text-xs ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${getTemperatureColor(hour.temperature, isDarkMode)}`}>
                      {convertTemp(hour.temperature)}°
                    </div>
                    <div className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>
                      Feels {convertTemp(hour.feelsLike)}°
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Temperature Forecast */}
        {temperatureData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                7-Day Temperature Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {temperatureData.daily.map((day, index) => (
                  <div key={`temp-daily-${index}`} className={`grid grid-cols-4 gap-4 items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="flex items-center gap-2">
                      {getTrendIcon(day.trend, isDarkMode)}
                      <span className="text-sm capitalize">{day.trend}</span>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className={`text-xl font-bold ${getTemperatureColor(day.high, isDarkMode)}`}>
                          {convertTemp(day.high)}°
                        </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>High</div>
                      </div>
                      <div className={isDarkMode ? 'text-white/50' : 'text-gray-400'}>|</div>
                      <div className="text-center">
                        <div className={`text-xl font-bold ${getTemperatureColor(day.low, isDarkMode)}`}>
                          {convertTemp(day.low)}°
                        </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>Low</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`border text-current ${getTemperatureBg(day.high, isDarkMode)}`}>
                        Range: {convertTemp(day.high - day.low)}°
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Temperature Records */}
        {temperatureData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle>Temperature Records & Averages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-red-500/20 border-red-400/30' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`}>
                    {convertTemp(temperatureData.extremes.recordHigh.temp)}°
                  </div>
                  <div className={`text-sm mb-1 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Record High</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>{temperatureData.extremes.recordHigh.date}</div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-blue-500/20 border-blue-400/30' 
                    : 'bg-blue-100 border-blue-300'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                    {convertTemp(temperatureData.extremes.recordLow.temp)}°
                  </div>
                  <div className={`text-sm mb-1 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Record Low</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>{temperatureData.extremes.recordLow.date}</div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-orange-500/20 border-orange-400/30' 
                    : 'bg-orange-100 border-orange-300'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`}>
                    {convertTemp(temperatureData.extremes.avgHigh)}°
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Average High</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>5-day forecast</div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-cyan-500/20 border-cyan-400/30' 
                    : 'bg-cyan-100 border-cyan-300'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                  }`}>
                    {convertTemp(temperatureData.extremes.avgLow)}°
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Average Low</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>5-day forecast</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}