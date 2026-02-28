"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  CloudRain, 
  Droplets, 
  Umbrella, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Cloud,
  CloudDrizzle,
  CloudSnow
} from "lucide-react"

interface PrecipitationData {
  current: {
    intensity: number
    type: string
    accumulation: number
    location: string
    country: string
    duration: number
    humidity: number
    clouds: number
  }
  hourly: Array<{
    time: string
    intensity: number
    probability: number
    accumulation: number
    type: string
    description: string
  }>
  daily: Array<{
    day: string
    totalRainfall: number
    maxIntensity: number
    probability: number
    rainyHours: number
    type: string
  }>
  monthly: {
    totalRainfall: number
    rainyDays: number
    averageIntensity: number
    comparison: number
  }
  coord: { lat: number; lon: number }
}

export default function PrecipitationPage() {
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState("mm")
  const [viewMode, setViewMode] = useState("hourly")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchPrecipitationData = async (lat: number, lon: number) => {
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

      // Calculate current precipitation
      const currentRain = currentData.rain?.['1h'] || 0
      const currentSnow = currentData.snow?.['1h'] || 0
      const currentPrecip = currentRain + currentSnow

      // Determine precipitation type
      const getPrecipType = (rain: number, snow: number, weather: string) => {
        if (snow > 0) return "Snow"
        if (rain === 0) return "None"
        if (rain < 2.5) return "Light Rain"
        if (rain < 10) return "Moderate Rain"
        return "Heavy Rain"
      }

      // Process hourly data
      const hourlyData = forecastData.list.slice(0, 24).map((item: any) => {
        const rain = item.rain?.['3h'] || 0
        const snow = item.snow?.['3h'] || 0
        const total = (rain + snow) / 3 // Convert 3h to 1h average
        const pop = Math.round((item.pop || 0) * 100) // Probability of precipitation
        
        return {
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          intensity: Math.round(total * 10) / 10,
          probability: pop,
          accumulation: Math.round(total * 10) / 10,
          type: getPrecipType(rain, snow, item.weather[0].main),
          description: item.weather[0].description
        }
      })

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
        const precipData = dayData.map(d => {
          const rain = d.rain?.['3h'] || 0
          const snow = d.snow?.['3h'] || 0
          return (rain + snow) / 3
        })
        const probabilities = dayData.map(d => (d.pop || 0) * 100)
        
        const totalRainfall = precipData.reduce((sum, val) => sum + val, 0)
        const maxIntensity = Math.max(...precipData)
        const avgProbability = Math.round(probabilities.reduce((sum, val) => sum + val, 0) / probabilities.length)
        const rainyHours = precipData.filter(p => p > 0).length
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          totalRainfall: Math.round(totalRainfall * 10) / 10,
          maxIntensity: Math.round(maxIntensity * 10) / 10,
          probability: avgProbability,
          rainyHours: Math.round(rainyHours * 3), // Convert to hours
          type: totalRainfall === 0 ? "None" : totalRainfall < 5 ? "Light Rain" : totalRainfall < 15 ? "Moderate Rain" : "Heavy Rain"
        }
      })

      // Calculate monthly statistics (using forecast data as approximation)
      // Types for monthly calculation
      interface HourlyData {
        time: string
        intensity: number
        probability: number
        accumulation: number
        type: string
        description: string
      }

      const totalPrecip = hourlyData.reduce(
        (sum: number, h: HourlyData) => sum + h.accumulation,
        0
      )
      const rainyHours: number = (hourlyData as HourlyData[]).filter((h: HourlyData) => h.intensity > 0).length
      const avgIntensity = rainyHours > 0 ? totalPrecip / rainyHours : 0

      setPrecipitationData({
        current: {
          intensity: Math.round(currentPrecip * 10) / 10,
          type: getPrecipType(currentRain, currentSnow, currentData.weather[0].main),
          accumulation: Math.round(currentPrecip * 10) / 10,
          location: currentData.name,
          country: currentData.sys.country,
          duration: currentPrecip > 0 ? 60 : 0, // Assume 1 hour if raining
          humidity: currentData.main.humidity,
          clouds: currentData.clouds.all
        },
        hourly: hourlyData,
        daily: dailyData,
        monthly: {
          totalRainfall: Math.round(totalPrecip * 30 / 24), // Extrapolate to month
          rainyDays: Math.round(rainyHours * 30 / 24),
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          comparison: Math.round((Math.random() - 0.5) * 40) // Simulated comparison
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching precipitation data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchPrecipitationData(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchPrecipitationData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchPrecipitationData(-1.2921, 36.8219) // Fallback to London
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
      await fetchPrecipitationData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("precipitationDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("precipitationDarkMode", String(newDarkMode))
  }

  const convertPrecipitation = (amount: number) => {
    if (unit === "inches") {
      return Math.round(amount * 0.0393701 * 100) / 100
    }
    return amount
  }

  const getUnitSymbol = () => {
    return unit === "inches" ? "in" : "mm"
  }

  const getIntensityColor = (intensity: number, dark: boolean) => {
    if (intensity === 0) return dark ? "text-gray-300" : "text-gray-600"
    if (intensity < 2) return dark ? "text-blue-300" : "text-blue-600"
    if (intensity < 8) return dark ? "text-blue-400" : "text-blue-700"
    if (intensity < 15) return dark ? "text-blue-500" : "text-blue-800"
    return dark ? "text-blue-600" : "text-blue-900"
  }

  const getIntensityBg = (intensity: number, dark: boolean) => {
    if (intensity === 0) return dark ? "bg-gray-500/20 border-gray-400/30" : "bg-gray-100 border-gray-300"
    if (intensity < 2) return dark ? "bg-blue-300/20 border-blue-300/30" : "bg-blue-100 border-blue-300"
    if (intensity < 8) return dark ? "bg-blue-400/20 border-blue-400/30" : "bg-blue-200 border-blue-400"
    if (intensity < 15) return dark ? "bg-blue-500/20 border-blue-500/30" : "bg-blue-300 border-blue-500"
    return dark ? "bg-blue-600/20 border-blue-600/30" : "bg-blue-400 border-blue-600"
  }

  const getProbabilityColor = (probability: number, dark: boolean) => {
    if (probability < 25) return dark ? "text-green-300" : "text-green-600"
    if (probability < 50) return dark ? "text-yellow-300" : "text-yellow-600"
    if (probability < 75) return dark ? "text-orange-300" : "text-orange-600"
    return dark ? "text-red-300" : "text-red-600"
  }

  const getRainfallCategory = (amount: number) => {
    if (amount === 0) return "No Rain"
    if (amount < 2) return "Light"
    if (amount < 10) return "Moderate"
    if (amount < 25) return "Heavy"
    return "Very Heavy"
  }

  const getPrecipIcon = (type: string, className: string = "h-6 w-6") => {
    switch(type.toLowerCase()) {
      case "snow": return <CloudSnow className={className} />
      case "drizzle": 
      case "light rain": return <CloudDrizzle className={className} />
      case "moderate rain":
      case "heavy rain": return <CloudRain className={className} />
      default: return <Cloud className={className} />
    }
  }

  if (loading && !precipitationData) {
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
            Loading precipitation data...
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
              <CloudRain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Precipitation Forecast
              </h1>
              {precipitationData && (
                <div className={`flex items-center gap-2 mt-1 text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{precipitationData.current.location}, {precipitationData.current.country}</span>
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
              onClick={() => currentLocation && fetchPrecipitationData(currentLocation.lat, currentLocation.lon)}
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
              onClick={() => setUnit("mm")}
              variant="outline"
              className={`${
                unit === "mm"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              mm
            </Button>
            <Button
              onClick={() => setUnit("inches")}
              variant="outline"
              className={`${
                unit === "inches"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              inches
            </Button>
          </div>
        </div>

        {/* Current Precipitation */}
        {precipitationData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold mb-2">{precipitationData.current.location}</h2>
                  <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                    <div className={`text-6xl font-bold ${getIntensityColor(precipitationData.current.intensity, isDarkMode)}`}>
                      {convertPrecipitation(precipitationData.current.intensity)}
                    </div>
                    <div>
                      <div className={`text-xl ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>{getUnitSymbol()}/hr</div>
                      <Badge className={`border text-current ${getIntensityBg(precipitationData.current.intensity, isDarkMode)}`}>
                        {precipitationData.current.type}
                      </Badge>
                    </div>
                  </div>
                  {precipitationData.current.duration > 0 && (
                    <div className={isDarkMode ? 'text-white/80' : 'text-gray-600'}>
                      Duration: {precipitationData.current.duration} minutes
                    </div>
                  )}
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
                        stroke={isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 1)"}
                        strokeWidth="8"
                        strokeDasharray={`${Math.min((precipitationData.current.intensity / 20) * 251.2, 251.2)} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {getPrecipIcon(precipitationData.current.type, `h-12 w-12 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`)}
                    </div>
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>Intensity Level</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-blue-500/20 border-blue-400/30' 
                      : 'bg-blue-100 border-blue-300'
                  }`}>
                    <Umbrella className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {convertPrecipitation(precipitationData.current.accumulation)} {getUnitSymbol()}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Current</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border ${
                    isDarkMode 
                      ? 'bg-purple-500/20 border-purple-400/30' 
                      : 'bg-purple-100 border-purple-300'
                  }`}>
                    <Droplets className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>
                      {precipitationData.current.humidity}%
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Humidity</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center border col-span-2 ${
                    isDarkMode 
                      ? 'bg-cyan-500/20 border-cyan-400/30' 
                      : 'bg-cyan-100 border-cyan-300'
                  }`}>
                    <Cloud className={`h-6 w-6 mx-auto mb-2 ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`} />
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`}>
                      {precipitationData.current.clouds}%
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Cloud Cover</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Selection */}
        {precipitationData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap">
                {["hourly", "daily", "weekly"].map((mode) => (
                  <Button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    variant="outline"
                    className={`${
                      viewMode === mode 
                        ? isDarkMode
                          ? "bg-white text-blue-900 border-white"
                          : "bg-blue-600 text-white border-blue-600"
                        : isDarkMode
                          ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                          : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hourly Precipitation */}
        {precipitationData && viewMode === "hourly" && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour Precipitation Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {precipitationData.hourly.slice(0, 12).map((hour, index) => (
                  <div key={`hourly-precip-${index}`} className={`rounded-lg p-2 text-center text-xs ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${getIntensityColor(hour.intensity, isDarkMode)}`}>
                      {convertPrecipitation(hour.intensity)}
                    </div>
                    <div className={`mb-1 ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{getUnitSymbol()}/hr</div>
                    <div className={`text-sm ${getProbabilityColor(hour.probability, isDarkMode)}`}>
                      {hour.probability}%
                    </div>
                    <Badge className={`text-xs mt-1 text-current border ${getIntensityBg(hour.intensity, isDarkMode)}`}>
                      {hour.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Precipitation */}
        {precipitationData && viewMode === "daily" && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day Precipitation Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {precipitationData.daily.map((day, index) => (
                  <div key={`daily-precip-${index}`} className={`grid grid-cols-5 gap-4 items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-gray-50'
                  }`}>
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getIntensityColor(day.totalRainfall, isDarkMode)}`}>
                        {convertPrecipitation(day.totalRainfall)} {getUnitSymbol()}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Total</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getProbabilityColor(day.probability, isDarkMode)}`}>
                        {day.probability}%
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Chance</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>{day.rainyHours}h</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Duration</div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`border text-current ${getIntensityBg(day.totalRainfall, isDarkMode)}`}>
                        {getRainfallCategory(day.totalRainfall)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Statistics */}
        {precipitationData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Precipitation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                    {convertPrecipitation(precipitationData.monthly.totalRainfall)} {getUnitSymbol()}
                  </div>
                  <div className={`text-sm mb-1 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Total Estimated</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    {precipitationData.monthly.comparison > 0 ? "+" : ""}{precipitationData.monthly.comparison}% vs avg
                  </div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`}>
                    {precipitationData.monthly.rainyDays}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Rainy Days</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>Estimated monthly</div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  }`}>
                    {convertPrecipitation(precipitationData.monthly.averageIntensity)} {getUnitSymbol()}/hr
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Avg Intensity</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>When raining</div>
                </div>
                
                <div className={`text-center p-4 rounded-lg border ${
                  isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`}>
                    {Math.round((precipitationData.monthly.rainyDays / 30) * 100)}%
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>Rainy Days</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>Percentage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Precipitation Tips */}
        {precipitationData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Umbrella className="h-5 w-5" />
                Precipitation Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Current Conditions</h3>
                  <div className="space-y-2">
                    {precipitationData.current.intensity > 0 ? (
                      <>
                        <div className="flex items-start gap-2">
                          <Droplets className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`} />
                          <span className="text-sm">Carry an umbrella or raincoat</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Umbrella className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`} />
                          <span className="text-sm">Allow extra travel time</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-sm">No precipitation expected - enjoy the dry weather!</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 text-lg">Today&apos;s Outlook</h3>
                  <div className="space-y-2">
                    <div className="text-sm">
                      Peak intensity: {convertPrecipitation(Math.max(...precipitationData.hourly.map(h => h.intensity)))} {getUnitSymbol()}/hr
                    </div>
                    <div className="text-sm">
                      Highest chance: {Math.max(...precipitationData.hourly.map(h => h.probability))}%
                    </div>
                    <div className="text-sm">
                      Total expected: {convertPrecipitation(precipitationData.hourly.reduce((sum, h) => sum + h.accumulation, 0))} {getUnitSymbol()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}