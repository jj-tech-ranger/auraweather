"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Cloud,
  Droplets,
  Wind,
  Eye,
  Gauge,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Mic,
  Moon,
  Sun,
  Navigation,
  Loader2,
  AlertCircle,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
  Compass,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  User,
  LogOut,
  Umbrella,
  Snowflake,
  Info,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  CloudSun,
  Home,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface WeatherData {
  name: string
  coord: {
    lat: number
    lon: number
  }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    temp_min: number
    temp_max: number
    sea_level?: number
    grnd_level?: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  visibility: number
  clouds: {
    all: number
  }
  rain?: {
    "1h"?: number
    "3h"?: number
  }
  snow?: {
    "1h"?: number
    "3h"?: number
  }
  sys: {
    country: string
    sunrise: number
    sunset: number
  }
  dt: number
  timezone: number
}

interface ForecastItem {
  dt: number
  dt_txt: string
  main: {
    temp: number
    temp_min: number
    temp_max: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    icon: string
    description: string
    main: string
  }>
  wind: {
    speed: number
    deg: number
  }
  pop: number
}

interface AirQualityData {
  list: Array<{
    main: {
      aqi: number
    }
    components: {
      co: number
      no: number
      no2: number
      o3: number
      so2: number
      pm2_5: number
      pm10: number
      nh3: number
    }
  }>
}

interface UVIndexData {
  value: number
  date: number
}

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number, delay: number}>>([])

  const clockTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [userLocation, setUserLocation] = useState({
    name: "Detecting your location...",
    lat: null as number | null,
    lon: null as number | null
  })

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastItem[]>([])
  const [hourlyForecast, setHourlyForecast] = useState<ForecastItem[]>([])
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [uvIndexData, setUVIndexData] = useState<UVIndexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [weatherMessage, setWeatherMessage] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const kelvinToCelsius = (kelvin: number) => (kelvin - 273.15)
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5 + 32)

  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(deg / 22.5) % 16
    return directions[index]
  }

  const getAQIDescription = (aqi: number) => {
    switch(aqi) {
      case 1: return { label: "Good", color: "text-green-600", bgColor: "bg-green-100" }
      case 2: return { label: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
      case 3: return { label: "Moderate", color: "text-orange-600", bgColor: "bg-orange-100" }
      case 4: return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100" }
      case 5: return { label: "Very Poor", color: "text-purple-600", bgColor: "bg-purple-100" }
      default: return { label: "Unknown", color: "text-gray-600", bgColor: "bg-gray-100" }
    }
  }

  const getUVDescription = (uv: number) => {
    if (uv <= 2) return { label: "Low", color: "text-green-600", bgColor: "bg-green-100" }
    if (uv <= 5) return { label: "Moderate", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    if (uv <= 7) return { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" }
    if (uv <= 10) return { label: "Very High", color: "text-red-600", bgColor: "bg-red-100" }
    return { label: "Extreme", color: "text-purple-600", bgColor: "bg-purple-100" }
  }

  const requestUserLocation = (showAlert = false) => {
    if (!navigator.geolocation) {
      setError("❌ Geolocation is not supported by your browser")
      setUserLocation({ name: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219 })
      fetchWeather({ name: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219 })
      return
    }

    setLoading(true)
    setError(null)
    setUserLocation({ name: "📍 Getting your GPS location...", lat: null, lon: null })

    navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          if (showAlert) {
            alert(`✅ Location Access Granted!\nLatitude: ${latitude.toFixed(4)}\nLongitude: ${longitude.toFixed(4)}\nAccuracy: ${position.coords.accuracy.toFixed(0)}m`)
          }

          localStorage.setItem("userCoordinates", JSON.stringify({
            lat: latitude,
            lon: longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
          }))

          const savedPrefs = localStorage.getItem("weatherPreferences")
          const prefs = savedPrefs ? JSON.parse(savedPrefs) : {}
          prefs.useCurrentLocation = true
          prefs.lastLocationUpdate = new Date().toISOString()
          localStorage.setItem("weatherPreferences", JSON.stringify(prefs))

          setUserLocation({
            name: "🌍 Fetching live weather data...",
            lat: latitude,
            lon: longitude
          })

          await fetchWeather({ name: "", lat: latitude, lon: longitude })
        },
        (error) => {
          console.warn('⚠️ Location fallback triggered:', error.message)
          let errorMessage = '⚠️ Failed to get your location, falling back to Nairobi'

          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '⚠️ Location permission denied. Falling back to default.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = '⚠️ Location information is unavailable. Falling back to default.'
              break
            case error.TIMEOUT:
              errorMessage = '⚠️ Location request timed out. Falling back to default.'
              break
          }

          setError(errorMessage)

          const fallbackLocation = { name: "Nairobi, Kenya (Fallback)", lat: -1.2921, lon: 36.8219 }
          setUserLocation(fallbackLocation)
          fetchWeather(fallbackLocation)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
    )
  }

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setCurrentTime(now)
      clockTimerRef.current = setTimeout(updateClock, 1000)
    }
    updateClock()
    return () => {
      if (clockTimerRef.current) {
        clearTimeout(clockTimerRef.current)
        clockTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    setIsLoaded(true)
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(savedDarkMode)

    const savedPrefs = localStorage.getItem("weatherPreferences")
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      setIsCelsius(prefs.temperatureUnit === "celsius")
    }

    const savedCoords = localStorage.getItem("userCoordinates")
    if (savedCoords) {
      const coords = JSON.parse(savedCoords)
      const minutesSinceLastUpdate = (Date.now() - coords.timestamp) / (1000 * 60)

      if (minutesSinceLastUpdate < 30) {
        setUserLocation({
          name: "Loading weather from saved location...",
          lat: coords.lat,
          lon: coords.lon
        })
        fetchWeather({ name: "", lat: coords.lat, lon: coords.lon })
      } else {
        requestUserLocation(false)
      }
    } else {
      requestUserLocation(false)
    }

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    const weatherRefreshTimer = setInterval(() => {
      if (userLocation.lat && userLocation.lon && !loading) {
        fetchWeather(userLocation).catch(() => {
          retryCount++
          if (retryCount < maxRetries) {
            setTimeout(() => fetchWeather(userLocation), retryCount * 5000)
          }
        })
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(weatherRefreshTimer)
  }, [userLocation.lat, userLocation.lon, loading])

  const fetchWeather = async (location: typeof userLocation) => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/weather?'
      if (location.lat && location.lon) {
        url += `lat=${location.lat}&lon=${location.lon}`
      } else if (location.name && !location.name.includes("Detecting") && !location.name.includes("Getting") && !location.name.includes("Loading")) {
        url += `city=${encodeURIComponent(location.name)}`
      } else {
        throw new Error('No valid location data')
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 404) throw new Error('📍 Location not found. Please check the city name or enable GPS.')
        else if (response.status === 401) throw new Error('🔑 API key invalid. Please check your OpenWeatherMap API key.')
        else if (response.status === 429) throw new Error('⏰ Too many requests. Please try again in a moment.')
        else if (response.status >= 500) throw new Error('🛠️ Weather service temporarily unavailable. Please try again later.')
        throw new Error(errorData.error || 'Failed to fetch weather data')
      }

      const data = await response.json()
      setWeatherData(data)
      setLastUpdated(new Date())
      setUserLocation(prev => ({
        ...prev,
        name: `${data.name}, ${data.sys.country}`,
        lat: data.coord.lat,
        lon: data.coord.lon
      }))

      if (data.coord) {
        await Promise.all([
          fetchForecast(data.coord.lat, data.coord.lon),
          fetchAirQuality(data.coord.lat, data.coord.lon),
          fetchUVIndex(data.coord.lat, data.coord.lon)
        ])
      }
      generateWeatherMessage(data.main.temp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`, { headers: { 'Cache-Control': 'no-cache' } })
      if (!response.ok) throw new Error('Failed to fetch forecast')
      const data = await response.json()
      setHourlyForecast(data.list.slice(0, 8))
      setForecastData(data.list.filter((item: ForecastItem) => item.dt_txt.includes("12:00:00")).slice(0, 5))
    } catch (error) {
      console.error('❌ Forecast fetch error:', error)
    }
  }

  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/air-quality?lat=${lat}&lon=${lon}`, { headers: { 'Cache-Control': 'no-cache' } })
      if (!response.ok) throw new Error('Failed to fetch air quality')
      const data = await response.json()
      setAirQuality(data)
    } catch (error) {
      console.error('❌ Air quality fetch error:', error)
    }
  }

  const fetchUVIndex = async (lat: number, lon: number): Promise<void> => {
    try {
      const response: Response = await fetch(`/api/uv?lat=${lat}&lon=${lon}`, { headers: { 'Cache-Control': 'no-cache' } })
      if (!response.ok) return
      const data: UVIndexData = await response.json()
      setUVIndexData(data)
    } catch (error) {
      console.warn('⚠️ UV index fetch error:', error)
    }
  }

  const generateWeatherMessage = (tempCelsius: number) => {
    const recs: string[] = []
    if (tempCelsius < -10) {
      setWeatherMessage("🥶 Extreme cold! Bundle up with layers and stay warm!")
      recs.push("Wear thermal underwear, heavy coat, and insulated gloves")
      recs.push("Limit time outdoors to prevent frostbite")
      recs.push("Keep emergency supplies in your car")
    } else if (tempCelsius >= -10 && tempCelsius < 0) {
      setWeatherMessage("❄️ It's freezing! Wear a heavy coat and gloves!")
      recs.push("Bundle up with warm layers")
      recs.push("Watch for icy conditions when walking")
      recs.push("Keep hot drinks handy")
    } else if (tempCelsius >= 0 && tempCelsius < 10) {
      setWeatherMessage("🧥 Grab a jacket, it's quite chilly outside!")
      recs.push("Wear a warm jacket or coat")
      recs.push("Consider layering for comfort")
      recs.push("Perfect weather for hot beverages")
    } else if (tempCelsius >= 10 && tempCelsius < 15) {
      setWeatherMessage("🧣 A bit cool! Light jacket recommended.")
      recs.push("A light jacket or sweater is ideal")
      recs.push("Great weather for outdoor activities")
    } else if (tempCelsius >= 15 && tempCelsius < 20) {
      setWeatherMessage("🌸 Pleasant weather! Perfect for a walk.")
      recs.push("Comfortable temperature for most activities")
      recs.push("Ideal for a walk in the park")
    } else if (tempCelsius >= 20 && tempCelsius < 25) {
      setWeatherMessage("😊 Comfortable temperature! Enjoy your day!")
      recs.push("Perfect weather for outdoor dining")
      recs.push("Great time for sports and exercise")
    } else if (tempCelsius >= 25 && tempCelsius < 30) {
      setWeatherMessage("🌞 It's getting warm! Stay hydrated.")
      recs.push("Drink plenty of water throughout the day")
      recs.push("Wear light, loose-fitting clothes")
    } else if (tempCelsius >= 30 && tempCelsius < 35) {
      setWeatherMessage("🔥 Hot day ahead! Drink plenty of water.")
      recs.push("Stay in air-conditioned areas when possible")
      recs.push("Avoid strenuous outdoor activity")
    } else if (tempCelsius >= 35 && tempCelsius < 40) {
      setWeatherMessage("☀️ Very hot! Limit outdoor activities.")
      recs.push("Minimize time outdoors during peak hours")
      recs.push("Stay hydrated and seek shade")
    } else if (tempCelsius >= 40) {
      setWeatherMessage("🌡️ Extreme heat warning! Stay indoors!")
      recs.push("Stay indoors with air conditioning")
      recs.push("Avoid all outdoor activities")
    }

    if (weatherData?.rain) recs.push("☔ Bring an umbrella - rain expected")
    if (weatherData?.wind.speed && weatherData.wind.speed > 10) recs.push("💨 Windy conditions - secure loose objects")
    if (weatherData?.main.humidity && weatherData.main.humidity > 80) recs.push("💧 High humidity - may feel warmer than actual temperature")
    setRecommendations(recs)
  }

  const handleRefresh = () => requestUserLocation(true)
  const handleUserProfile = () => console.log('👤 User profile clicked')
  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }
  const toggleUnit = () => setIsCelsius(!isCelsius)
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Voice recognition not supported")
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const city = event.results[0][0].transcript
      fetchWeather({ name: city, lat: null, lon: null })
    }
    recognition.onerror = () => setError("Voice recognition failed")
    recognition.start()
  }

  const formatTemp = (temp: number) => {
    const displayTemp = isCelsius ? temp : celsiusToFahrenheit(temp)
    return Math.round(displayTemp)
  }

  // UPDATED: Trimmed sidebar menu
  const sidebarMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true, badge: null },
    { icon: CloudSun, label: 'Try weather feature', href: '/dashboard/weather', active: false, badge: 'Live' },
  ]

  const weatherCards = [
    {
      icon: Droplets,
      title: "Humidity",
      value: weatherData?.main.humidity.toString() || "0",
      unit: "%",
      color: "text-white",
      surface: "from-sky-400 via-blue-500 to-indigo-600",
      description: `${weatherData?.main.humidity || 0}% relative humidity`
    },
    {
      icon: Wind,
      title: "Wind Speed",
      value: weatherData?.wind.speed ? (weatherData.wind.speed * 3.6).toFixed(1) : "0",
      unit: "km/h",
      color: "text-white",
      surface: "from-green-400 via-emerald-500 to-teal-600",
      description: weatherData?.wind.deg ? `${getWindDirection(weatherData.wind.deg)} direction` : "No data"
    },
    {
      icon: Eye,
      title: "Visibility",
      value: weatherData?.visibility ? (weatherData.visibility / 1000).toFixed(1) : "0",
      unit: "km",
      color: "text-white",
      surface: "from-purple-400 via-violet-500 to-pink-600",
      description: weatherData?.visibility ? (weatherData.visibility >= 10000 ? "Excellent" : weatherData.visibility >= 5000 ? "Good" : "Moderate") : "No data"
    },
    {
      icon: Gauge,
      title: "Pressure",
      value: weatherData?.main.pressure.toString() || "0",
      unit: "hPa",
      color: "text-white",
      surface: "from-red-400 via-orange-500 to-amber-600",
      description: weatherData?.main.pressure ? (weatherData.main.pressure > 1013 ? "High" : weatherData.main.pressure < 1013 ? "Low" : "Normal") : "No data"
    },
  ]

  return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'} relative overflow-x-hidden min-w-0 transition-colors duration-500`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
              <div
                  key={particle.id}
                  className={`absolute w-2 h-2 ${isDarkMode ? 'bg-blue-300/20' : 'bg-blue-400/20'} rounded-full animate-float`}
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                  }}
              />
          ))}
        </div>

        <div className="relative z-10 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 sm:pb-12 box-border px-2 sm:px-4 md:px-6 page-inner">
          <div className="lg:hidden">
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <div
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] ${
                    isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-white via-blue-50 to-indigo-50'
                } shadow-2xl z-50 transition-all duration-300 ease-out overflow-y-auto ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                style={{
                  boxShadow: isSidebarOpen ? '0 0 50px rgba(0,0,0,0.3)' : 'none'
                }}
            >
              <div className={`sticky top-0 ${
                  isDarkMode ? 'bg-gradient-to-r from-blue-900/95 to-indigo-900/95' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              } backdrop-blur-lg p-4 flex items-center justify-between border-b ${
                  isDarkMode ? 'border-blue-800' : 'border-blue-400'
              } z-10 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
                    <CloudSun className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">AuraWeather</h2>
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live Updates
                    </p>
                  </div>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Close menu"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className={`p-4 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Guest User</p>
                    <p className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{userLocation.name.split(',')[0]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2 rounded-lg text-center ${
                      isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
                  }`}>
                    <Thermometer className={`h-4 w-4 mx-auto mb-1 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <p className={`text-xs font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{weatherData ? formatTemp(weatherData.main.temp) : '--'}°</p>
                  </div>
                  <div className={`p-2 rounded-lg text-center ${
                      isDarkMode ? 'bg-cyan-900/40' : 'bg-cyan-100'
                  }`}>
                    <Droplets className={`h-4 w-4 mx-auto mb-1 ${
                        isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                    }`} />
                    <p className={`text-xs font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{weatherData?.main.humidity || '--'}%</p>
                  </div>
                  <div className={`p-2 rounded-lg text-center ${
                      isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'
                  }`}>
                    <Wind className={`h-4 w-4 mx-auto mb-1 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`} />
                    <p className={`text-xs font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{weatherData ? (weatherData.wind.speed * 3.6).toFixed(0) : '--'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Navigation</p>
                <nav className="space-y-1">
                  {sidebarMenuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <a
                            key={index}
                            href={item.href}
                            onClick={(e) => {
                              e.preventDefault()
                              setIsSidebarOpen(false)
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                                item.active
                                    ? isDarkMode
                                        ? 'bg-blue-900/60 text-white shadow-lg'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                    : isDarkMode
                                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                        >
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                              isDarkMode ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20' : 'bg-gradient-to-r from-blue-100/50 to-indigo-100/50'
                          }`} />

                          <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 relative z-10 ${
                              item.active
                                  ? 'text-white'
                                  : isDarkMode
                                      ? 'text-gray-400 group-hover:text-white'
                                      : 'text-gray-500 group-hover:text-blue-600'
                          }`} />
                          <span className="font-medium text-sm flex-1 relative z-10">{item.label}</span>

                          {item.active && (
                              <div className="ml-auto relative z-10">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              </div>
                          )}

                          {item.badge && !item.active && (
                              <Badge className={`ml-auto text-[10px] px-1.5 py-0.5 relative z-10 ${
                                  item.badge === 'New' || item.badge === 'Live'
                                      ? 'bg-red-500 text-white border-0 animate-pulse'
                                      : item.badge === 'Good' || item.badge === 'Low'
                                          ? 'bg-green-500 text-white border-0'
                                          : item.badge === 'Moderate' || item.badge === 'Fair'
                                              ? 'bg-yellow-500 text-white border-0'
                                              : 'bg-orange-500 text-white border-0'
                              }`}>
                                {item.badge}
                              </Badge>
                          )}
                        </a>
                    )
                  })}
                </nav>
              </div>

              <div className={`p-4 border-t ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Quick Actions</p>
                <div className="space-y-2">
                  <button
                      onClick={() => {
                        toggleUnit()
                        setIsSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    <Thermometer className="h-5 w-5" />
                    <span className="text-sm font-medium">Temperature Unit: °{isCelsius ? 'C' : 'F'}</span>
                  </button>

                  <button
                      onClick={() => {
                        toggleDarkMode()
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                      onClick={() => {
                        requestUserLocation(true)
                        setIsSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    <Navigation className="h-5 w-5" />
                    <span className="text-sm font-medium">Refresh Location</span>
                  </button>

                  <button
                      onClick={() => {
                        handleVoiceSearch()
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                  >
                    <Mic className="h-5 w-5" />
                    <span className="text-sm font-medium">Voice Search</span>
                  </button>
                </div>
              </div>

              <div className={`p-4 border-t mt-auto ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                    onClick={() => {
                      handleLogout()
                      setIsSidebarOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>

                <div className={`mt-4 p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                }`}>
                  <div className={`text-center text-xs space-y-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <p className="font-semibold flex items-center justify-center gap-2">
                      <CloudSun className="h-3 w-3" />
                      AuraWeather v1.0
                    </p>
                    {lastUpdated && (
                        <p className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last update: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                    <p className="text-[10px] opacity-75">© 2026 All rights reserved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && !weatherData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4`}>
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                  <div className="text-center">
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Loading Weather Data
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {userLocation.name}
                    </p>
                  </div>
                </div>
              </div>
          )}

          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <div className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-5 md:p-7 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} transition-colors duration-500`}>
              <div className="flex flex-col gap-3 sm:gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2`}>
                      Live Weather Dashboard
                    </h1>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base md:text-lg`}>Real-time weather data from your location</p>

                    {weatherMessage && !loading && (
                        <div className={`mt-2 sm:mt-3 px-3 sm:px-4 py-2 sm:py-2.5 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-blue-700/50' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'} rounded-xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 inline-block`}>
                          <div className="flex items-center gap-2">
                            <div className="animate-pulse">
                              <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                            </div>
                            <p className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>{weatherMessage}</p>
                          </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-2 sm:mt-3">
                      <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {loading && !weatherData ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-spin" />
                              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{userLocation.name}</span>
                            </>
                        ) : (
                            <>
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 animate-pulse" />
                              <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{userLocation.name}</span>
                              {userLocation.lat && userLocation.lon && (
                                  <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                                    GPS: {userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°
                                  </Badge>
                              )}
                            </>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        <span suppressHydrationWarning className="hidden sm:inline">
                      {isLoaded ? currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Loading date...'}
                    </span>
                        <span suppressHydrationWarning className="sm:hidden">
                      {isLoaded ? currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                    </span>
                      </div>
                      {lastUpdated && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            Updated: {lastUpdated.toLocaleTimeString()}
                          </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-1">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    <span suppressHydrationWarning className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {isLoaded ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                  </span>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5 order-1 sm:order-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestUserLocation(true)}
                        className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                        title="Refresh GPS location"
                    >
                      <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVoiceSearch}
                        className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                        title="Voice search"
                    >
                      <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleUnit}
                        className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    >
                      <span className="text-xs sm:text-sm">°{isCelsius ? 'C' : 'F'}</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleDarkMode}
                        className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    >
                      {isDarkMode ? <Sun className="h-3 w-3 sm:h-4 sm:w-4" /> : <Moon className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUserProfile}
                        className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                        title="User profile"
                    >
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>

                    <Button
                        onClick={handleRefresh}
                        disabled={loading}
                        size="sm"
                        className="flex-1 sm:flex-none min-w-[36px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        title="Refresh all data"
                    >
                      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
              <div className="mb-4 sm:mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 text-red-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 shadow-lg animate-in slide-in-from-top duration-500">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="font-bold text-sm sm:text-base mb-1">⚠️ Alert</p>
                  <p className="text-xs sm:text-sm">{error}</p>
                  <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => setError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
          )}

          {weatherData && !loading && (
              <>
                {weatherData.main.temp > 308.15 && (
                    <div className="mb-4 sm:mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400 rounded-xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0 animate-pulse" />
                        <div>
                          <p className="font-bold text-sm sm:text-base text-orange-900 mb-1">🌡️ Extreme Heat Warning</p>
                          <p className="text-xs sm:text-sm text-orange-800">
                            Temperature is dangerously high. Stay indoors, stay hydrated, and avoid outdoor activities.
                          </p>
                        </div>
                      </div>
                    </div>
                )}

                {weatherData.wind.speed > 15 && (
                    <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Wind className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 animate-bounce" />
                        <div>
                          <p className="font-bold text-sm sm:text-base text-blue-900 mb-1">💨 High Wind Advisory</p>
                          <p className="text-xs sm:text-sm text-blue-800">
                            Strong winds detected. Secure loose objects and be cautious when driving.
                          </p>
                        </div>
                      </div>
                    </div>
                )}

                {weatherData.visibility < 1000 && (
                    <div className="mb-4 sm:mb-6 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-400 rounded-xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm sm:text-base text-gray-900 mb-1">🌫️ Low Visibility Warning</p>
                          <p className="text-xs sm:text-sm text-gray-800">
                            Poor visibility conditions. Drive carefully and use fog lights if available.
                          </p>
                        </div>
                      </div>
                    </div>
                )}
              </>
          )}

          {weatherData && !loading && (
              <div className={`mb-4 sm:mb-6 transition-all duration-1000 delay-150 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-400 to-blue-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                      <Thermometer className="h-5 w-5 sm:h-6 sm:w-6" />
                      <Badge className="bg-white/20 text-white border-0 text-xs">Now</Badge>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{formatTemp(weatherData.main.temp)}°</p>
                    <p className="text-xs sm:text-sm text-white/80">Temperature</p>
                  </div>

                  <div className={`${isDarkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                      <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
                      <Badge className="bg-white/20 text-white border-0 text-xs">Live</Badge>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{weatherData.main.humidity}%</p>
                    <p className="text-xs sm:text-sm text-white/80">Humidity</p>
                  </div>

                  <div className={`${isDarkMode ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                      <Wind className="h-5 w-5 sm:h-6 sm:w-6" />
                      <Badge className="bg-white/20 text-white border-0 text-xs">{getWindDirection(weatherData.wind.deg)}</Badge>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{(weatherData.wind.speed * 3.6).toFixed(0)}</p>
                    <p className="text-xs sm:text-sm text-white/80">Wind (km/h)</p>
                  </div>

                  <div className={`${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-400 to-purple-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                      <Cloud className="h-5 w-5 sm:h-6 sm:w-6" />
                      <Badge className="bg-white/20 text-white border-0 text-xs">Sky</Badge>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold">{weatherData.clouds.all}%</p>
                    <p className="text-xs sm:text-sm text-white/80">Cloud Cover</p>
                  </div>
                </div>
              </div>
          )}

          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white overflow-hidden relative group hover:shadow-cyan-500/50 transition-all duration-500 hover:scale-[1.01]">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-pink-500/20 animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
              <div className="absolute inset-0 w-full h-full box-border bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl pointer-events-none" />

              <div className="absolute inset-0 overflow-hidden opacity-10">
                <Cloud className="absolute top-4 right-8 h-24 w-24 animate-float" style={{animationDelay: '0s'}} />
                <Sun className="absolute bottom-8 left-8 h-20 w-20 animate-float" style={{animationDelay: '2s'}} />
                <Droplets className="absolute top-1/2 left-1/4 h-16 w-16 animate-float" style={{animationDelay: '1s'}} />
              </div>

              <CardContent className="p-3 sm:p-5 md:p-7 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-5 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 w-full sm:w-auto">
                    <div className="p-3 sm:p-5 bg-white/25 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-lg ring-2 ring-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {weatherData?.weather[0]?.icon ? (
                          <img
                              src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                              alt={weatherData.weather[0].description}
                              className="h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 drop-shadow-lg animate-bounce"
                              style={{animationDuration: '3s'}}
                          />
                      ) : (
                          <Cloud className="h-14 w-14 sm:h-18 sm:w-18 animate-pulse drop-shadow-lg" />
                      )}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-2 drop-shadow-lg animate-in slide-in-from-bottom duration-700">
                          {loading ? '--' : formatTemp(weatherData?.main.temp || 0)}°{isCelsius ? 'C' : 'F'}
                        </h2>
                        {weatherData?.main && (
                            <div className="relative group/tooltip">
                              <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help transition-colors" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl z-50">
                                <p className="font-semibold mb-1">Temperature Details</p>
                                <p>Current: {formatTemp(weatherData.main.temp)}°</p>
                                <p>Feels like: {formatTemp(weatherData.main.feels_like)}°</p>
                                <p>High: {formatTemp(weatherData.main.temp_max)}°</p>
                                <p>Low: {formatTemp(weatherData.main.temp_min)}°</p>
                              </div>
                            </div>
                        )}
                      </div>
                      <p className="text-sm sm:text-base md:text-lg text-white/95 font-medium capitalize drop-shadow-md flex items-center gap-2 justify-center sm:justify-start">
                        {loading ? 'Loading live data...' : (
                            <>
                              <span>{weatherData?.weather[0]?.description || 'N/A'}</span>
                              {weatherData?.weather[0]?.main === 'Rain' && <Umbrella className="h-4 w-4" />}
                              {weatherData?.weather[0]?.main === 'Snow' && <Snowflake className="h-4 w-4" />}
                              {weatherData?.weather[0]?.main === 'Clear' && <Sun className="h-4 w-4" />}
                            </>
                        )}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 justify-center sm:justify-start">
                        <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-100" />
                        <p className="text-xs sm:text-sm text-cyan-100 font-medium">
                          Feels like {loading ? '--' : formatTemp(weatherData?.main.feels_like || 0)}°{isCelsius ? 'C' : 'F'}
                        </p>
                      </div>
                      {weatherData?.main && (
                          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm text-white/95">
                        <span className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-200" />
                          <span className="font-semibold">{formatTemp(weatherData.main.temp_max)}°</span>
                        </span>
                            <span className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors">
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />
                          <span className="font-semibold">{formatTemp(weatherData.main.temp_min)}°</span>
                        </span>
                          </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center sm:text-right w-full sm:w-auto">
                    <Badge className="bg-gradient-to-r from-white/40 to-white/30 text-white shadow-lg text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1.5 sm:py-2 mb-2 sm:mb-3 border-white/40 font-semibold hover:scale-105 transition-transform">
                      {loading ? 'Loading' : weatherData?.weather[0]?.main || 'N/A'}
                    </Badge>
                    {weatherData?.clouds && (
                        <p className="text-xs sm:text-sm text-cyan-50 font-medium mb-1 sm:mb-2 drop-shadow flex items-center gap-1 justify-center sm:justify-end">
                          <Cloud className="h-3 w-3 sm:h-4 sm:w-4" />
                          Cloud cover: {weatherData.clouds.all}%
                        </p>
                    )}
                    {weatherData?.visibility && (
                        <p className="text-xs sm:text-sm text-cyan-100/90 drop-shadow flex items-center gap-1 justify-center sm:justify-end">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          Visibility: {(weatherData.visibility / 1000).toFixed(1)} km
                        </p>
                    )}
                    {weatherData?.dt && (
                        <p className="text-xs text-cyan-100/80 drop-shadow mt-1 sm:mt-2">
                          📡 Updated: {new Date(weatherData.dt * 1000).toLocaleTimeString()}
                        </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {recommendations.length > 0 && !loading && (
              <div className={`mb-4 sm:mb-6 transition-all duration-1000 delay-250 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80' : 'bg-gradient-to-br from-indigo-50 to-purple-50'} backdrop-blur-lg`}>
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      Weather Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {recommendations.map((rec, index) => (
                          <div
                              key={index}
                              className={`flex items-start gap-2 p-2 sm:p-3 rounded-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-sm transition-colors border ${isDarkMode ? 'border-white/10' : 'border-indigo-100'}`}
                          >
                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {rec}
                            </p>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
            {weatherCards.map((card, index) => {
              const Icon = card.icon
              return (
                  <div
                      key={card.title}
                      className={`transition-all duration-1000 min-w-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                      style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${card.surface} text-white cursor-pointer active:scale-100`}>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                      <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                      <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      <div className="relative z-10">
                        <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs sm:text-sm font-semibold text-white group-hover:scale-105 transition-transform origin-left">
                              {card.title}
                            </CardTitle>
                            <div className={`p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50`}>
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white drop-shadow group-hover:drop-shadow-lg" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0">
                          <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-2 group-hover:scale-110 transition-transform origin-left">
                        <span className={`text-2xl sm:text-3xl md:text-4xl font-bold ${card.color} group-hover:text-shadow-lg transition-all`}>
                          {loading ? '--' : card.value}
                        </span>
                            <span className="text-white/80 text-xs sm:text-sm md:text-base font-medium group-hover:text-white transition-colors">{card.unit}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-white/80 line-clamp-2 font-medium group-hover:text-white/95 transition-colors">
                            {card.description}
                          </p>
                        </CardContent>
                      </div>
                    </Card>
                  </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
            {uvIndexData && (
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-yellow-600 via-amber-700 to-orange-800' : 'from-yellow-400 via-amber-500 to-orange-600'} text-white cursor-pointer active:scale-100`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-300/30 via-yellow-200/20 to-amber-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="relative z-10">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-180 transition-all duration-700 ring-1 ring-white/25 group-hover:ring-2">
                          <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                        </div>
                        UV Index
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-baseline gap-1.5 sm:gap-2 group-hover:scale-105 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{uvIndexData.value.toFixed(1)}</span>
                          <Badge className={`${getUVDescription(uvIndexData.value).bgColor} ${getUVDescription(uvIndexData.value).color} border-0 text-xs font-semibold shadow-lg group-hover:scale-110 transition-transform`}>
                            {getUVDescription(uvIndexData.value).label}
                          </Badge>
                        </div>
                        <div className="relative">
                          <Progress value={(uvIndexData.value / 11) * 100} className="h-1.5 sm:h-2 bg-white/20 group-hover:h-2.5 transition-all" />
                          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/40 via-white/20 to-transparent rounded-full" style={{width: `${(uvIndexData.value / 11) * 100}%`}} />
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white transition-colors">
                          {uvIndexData.value <= 2 ? "Minimal sun protection required" :
                              uvIndexData.value <= 5 ? "Moderate sun protection needed" :
                                  uvIndexData.value <= 7 ? "High sun protection required" :
                                      "Extreme protection necessary"}
                        </p>
                      </div>
                    </CardContent>
                  </div>
                </Card>
            )}

            {airQuality && (
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-green-600 via-emerald-700 to-teal-800' : 'from-green-400 via-emerald-500 to-teal-600'} text-white cursor-pointer active:scale-100`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-300/30 via-green-200/20 to-teal-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className="absolute inset-0 border border-white/20 rounded-2xl group-hover:border-white/40 transition-colors" />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="relative z-10">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 transition-all duration-500 ring-1 ring-white/25 group-hover:ring-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:animate-pulse" />
                        </div>
                        Air Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-baseline gap-1.5 sm:gap-2 group-hover:scale-105 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{airQuality.list[0].main.aqi}</span>
                          <Badge className={`${getAQIDescription(airQuality.list[0].main.aqi).bgColor} ${getAQIDescription(airQuality.list[0].main.aqi).color} border-0 text-xs font-semibold shadow-lg group-hover:scale-110 transition-transform`}>
                            {getAQIDescription(airQuality.list[0].main.aqi).label}
                          </Badge>
                        </div>
                        <div className="relative">
                          <Progress value={(airQuality.list[0].main.aqi / 5) * 100} className="h-1.5 sm:h-2 bg-white/20 group-hover:h-2.5 transition-all" />
                          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/40 via-white/20 to-transparent rounded-full" style={{width: `${(airQuality.list[0].main.aqi / 5) * 100}%`}} />
                        </div>
                        <div className="text-[10px] sm:text-xs space-y-0.5 sm:space-y-1 text-white/80 font-medium group-hover:text-white transition-colors">
                          <p>PM2.5: {airQuality.list[0].components.pm2_5.toFixed(1)} μg/m³</p>
                          <p>PM10: {airQuality.list[0].components.pm10.toFixed(1)} μg/m³</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
            )}

            {weatherData?.sys && (
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-rose-600 via-pink-700 to-purple-800' : 'from-rose-400 via-pink-500 to-purple-500'} text-white cursor-pointer active:scale-100`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-300/30 via-pink-200/20 to-purple-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="relative z-10">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 transition-all duration-500 ring-1 ring-white/25 group-hover:ring-2">
                          <Sunrise className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        Sun Times
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="space-y-2 sm:space-y-3 group-hover:scale-105 transition-transform origin-left">
                        <div className="flex items-center justify-between group/item hover:bg-white/10 p-1 rounded transition-colors">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Sunrise className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-200 group-hover/item:scale-125 transition-transform" />
                            <span className="text-xs sm:text-sm font-medium text-white/80">Sunrise</span>
                          </div>
                          <span className="font-bold text-sm sm:text-base text-white drop-shadow">
                        {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                        </div>
                        <div className="flex items-center justify-between group/item hover:bg-white/10 p-1 rounded transition-colors">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Sunset className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-200 group-hover/item:scale-125 transition-transform" />
                            <span className="text-xs sm:text-sm font-medium text-white/80">Sunset</span>
                          </div>
                          <span className="font-bold text-sm sm:text-base text-white drop-shadow">
                        {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                        </div>
                        <div className="pt-1 border-t border-white/20 group-hover:border-white/30 transition-colors">
                          <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white transition-colors">
                            Daylight: {(((weatherData.sys.sunset - weatherData.sys.sunrise) / 3600)).toFixed(1)} hours
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
            )}
          </div>

          {hourlyForecast.length > 0 && (
              <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-indigo-600 via-purple-700 to-pink-800' : 'from-indigo-400 via-purple-500 to-pink-600'} text-white group`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-300/30 via-purple-200/20 to-pink-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                  <div className="relative z-10">
                    <CardHeader className="p-2 sm:p-3 md:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-white group-hover:scale-105 transition-transform origin-left">
                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all duration-500">
                          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:animate-pulse" />
                        </div>
                        Hourly Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
                      <div className="overflow-x-auto pb-2">
                        <div className="flex gap-1.5 sm:gap-2 md:gap-3 px-1 sm:px-3 md:px-4 pb-1 snap-x snap-mandatory overflow-y-hidden">
                          {hourlyForecast.map((hour, index) => {
                            const time = new Date(hour.dt * 1000)
                            return (
                                <div key={index} className="flex-shrink-0 text-center p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-white/15 backdrop-blur-sm min-w-[60px] sm:min-w-[75px] md:min-w-[90px] snap-center hover:bg-white/30 hover:scale-110 hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/40 cursor-pointer group/hour">
                                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold mb-0.5 sm:mb-1 text-white/90 group-hover/hour:text-white group-hover/hour:scale-105 transition-all">
                                    {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <div className="relative">
                                    <img
                                        src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`}
                                        alt={hour.weather[0].description}
                                        className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 mx-auto group-hover/hour:scale-125 group-hover/hour:drop-shadow-lg transition-all duration-300"
                                    />
                                  </div>
                                  <p className="text-sm sm:text-base md:text-lg font-bold mt-0.5 sm:mt-1 text-white drop-shadow group-hover/hour:scale-110 transition-transform">
                                    {formatTemp(hour.main.temp)}°
                                  </p>
                                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 group-hover/hour:scale-105 transition-transform">
                                    <Droplets className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-blue-200 group-hover/hour:animate-pulse" />
                                    <span className="text-[10px] sm:text-xs text-white/80 group-hover/hour:text-white font-medium transition-colors">
                                {(hour.pop * 100).toFixed(0)}%
                              </span>
                                  </div>
                                </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
          )}

          {forecastData.length > 0 && (
              <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-cyan-600 via-blue-700 to-indigo-800' : 'from-cyan-400 via-blue-500 to-indigo-600'} text-white group`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-300/30 via-blue-200/20 to-indigo-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                  <div className="relative z-10">
                    <CardHeader className="p-2 sm:p-3 md:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-white group-hover:scale-105 transition-transform origin-left">
                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all duration-500">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:animate-pulse" />
                        </div>
                        5-Day Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                        {forecastData.map((day, index) => {
                          const date = new Date(day.dt * 1000)
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          return (
                              <div key={index} className="text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/30 hover:scale-105 hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-white/40 min-w-0 cursor-pointer group/day">
                                <p className="font-semibold mb-0.5 text-xs sm:text-sm text-white group-hover/day:scale-105 transition-transform">{dayName}</p>
                                <p className="text-[10px] sm:text-xs mb-0.5 sm:mb-1 text-white/80 group-hover/day:text-white transition-colors">{dateStr}</p>
                                <div className="relative">
                                  <img
                                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                                      alt={day.weather[0].description}
                                      className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 mx-auto group-hover/day:scale-125 group-hover/day:drop-shadow-lg transition-all duration-300"
                                  />
                                </div>
                                <p className="text-lg sm:text-xl font-bold mt-0.5 sm:mt-1 text-white drop-shadow group-hover/day:scale-110 transition-transform">
                                  {formatTemp(day.main.temp)}°
                                </p>
                                <p className="text-[10px] sm:text-xs capitalize mt-0.5 sm:mt-1 text-white/80 line-clamp-2 group-hover/day:text-white transition-colors">
                                  {day.weather[0].description}
                                </p>
                                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs group-hover/day:scale-105 transition-transform">
                            <span className="text-white/80 group-hover/day:text-white transition-colors flex items-center gap-0.5">
                              <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 inline text-red-300" /> {formatTemp(day.main.temp_max)}°
                            </span>
                                  <span className="text-white/80 group-hover/day:text-white transition-colors flex items-center gap-0.5">
                              <TrendingDown className="h-2 w-2 sm:h-2.5 sm:w-2.5 inline text-blue-300" /> {formatTemp(day.main.temp_min)}°
                            </span>
                                </div>
                                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 group-hover/day:scale-105 transition-transform">
                                  <Droplets className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-blue-200 group-hover/day:animate-pulse" />
                                  <span className="text-[10px] sm:text-xs text-white/80 group-hover/day:text-white font-medium transition-colors">
                              {(day.pop * 100).toFixed(0)}%
                            </span>
                                </div>
                              </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
          )}

          {weatherData && (
              <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-violet-600 via-purple-700 to-fuchsia-800' : 'from-violet-400 via-purple-500 to-fuchsia-600'} text-white group`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-300/30 via-purple-200/20 to-fuchsia-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />

                  <div className="relative z-10">
                    <CardHeader className="p-2 sm:p-3 md:p-4">
                      <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-white group-hover:scale-105 transition-transform origin-left">
                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 transition-all duration-500">
                          <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:animate-pulse" />
                        </div>
                        Additional Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-3 md:p-4 pt-0">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                        {weatherData.wind.gust && (
                            <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300 min-w-0 cursor-pointer group/item">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 group-hover/item:scale-105 transition-transform">
                                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-200 group-hover/item:animate-pulse" />
                                <span className="text-xs sm:text-sm text-white/90 group-hover/item:text-white transition-colors">Wind Gust</span>
                              </div>
                              <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow group-hover/item:scale-110 transition-transform">
                                {(weatherData.wind.gust * 3.6).toFixed(1)} km/h
                              </p>
                            </div>
                        )}

                        <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300 min-w-0 cursor-pointer group/item">
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 group-hover/item:scale-105 transition-transform">
                            <Compass className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-200 group-hover/item:rotate-180 transition-transform duration-700" />
                            <span className="text-xs sm:text-sm text-white/90 group-hover/item:text-white transition-colors">Wind Dir</span>
                          </div>
                          <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow group-hover/item:scale-110 transition-transform">
                            {getWindDirection(weatherData.wind.deg)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-white/80 group-hover/item:text-white transition-colors">
                            ({weatherData.wind.deg}°)
                          </p>
                        </div>

                        {weatherData.rain && (
                            <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300 min-w-0 cursor-pointer group/item">
                              <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 group-hover/item:scale-105 transition-transform">
                                <CloudRain className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-200 group-hover/item:animate-bounce" />
                                <span className="text-xs sm:text-sm text-white/90 group-hover/item:text-white transition-colors">Rainfall</span>
                              </div>
                              <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow group-hover/item:scale-110 transition-transform">
                                {weatherData.rain["1h"] || weatherData.rain["3h"] || 0} mm
                              </p>
                            </div>
                        )}

                        <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300 min-w-0 cursor-pointer group/item">
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 group-hover/item:scale-105 transition-transform">
                            <Cloud className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80 group-hover/item:text-white transition-colors" />
                            <span className="text-xs sm:text-sm text-white/90 group-hover/item:text-white transition-colors">Cloudiness</span>
                          </div>
                          <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow group-hover/item:scale-110 transition-transform">
                            {weatherData.clouds.all}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </div>
          )}
        </div>

        <div className="lg:hidden fixed left-2 right-2 bottom-2 z-50">
          <div className={`flex items-center justify-between gap-1 ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl rounded-full shadow-2xl px-2 py-1.5 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
                className={`w-10 h-10 rounded-full flex items-center justify-center relative ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95`}
                title="Menu"
            >
              <Menu className="h-5 w-5" />
              {weatherData && (weatherData.main.temp > 308.15 || weatherData.wind.speed > 15 || weatherData.visibility < 1000) && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            <button
                onClick={() => requestUserLocation(true)}
                aria-label="Refresh location"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                title="Refresh GPS"
            >
              <Navigation className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </button>

            <button
                onClick={handleVoiceSearch}
                aria-label="Voice search"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                title="Voice search"
            >
              <Mic className={`h-4 w-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
            </button>

            <button
                onClick={toggleUnit}
                aria-label="Toggle unit"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                title="Toggle °C/°F"
            >
              <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{isCelsius ? '°C' : '°F'}</span>
            </button>

            <button
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-gray-700" />}
            </button>

            <button
                onClick={handleUserProfile}
                aria-label="User profile"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                title="User profile"
            >
              <User className={`h-4 w-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} />
            </button>

            <button
                onClick={handleRefresh}
                aria-label="Refresh all data"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                title="Refresh all data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <style jsx>{`
         @keyframes float {
           0%, 100% {
             transform: translateY(0px) translateX(0px);
             opacity: 0.3;
           }
           50% {
             transform: translateY(-20px) translateX(10px);
             opacity: 0.6;
           }
         }
         
         @keyframes slide-in-from-top {
           from {
             transform: translateY(-100%);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         @keyframes slide-in-from-bottom {
           from {
             transform: translateY(20px);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         .animate-float {
           animation: float 6s ease-in-out infinite;
         }
         
         .animate-in {
           animation-fill-mode: forwards;
         }
         
         .slide-in-from-top {
           animation: slide-in-from-top 0.5s ease-out;
         }
         
         .slide-in-from-bottom {
           animation: slide-in-from-bottom 0.7s ease-out;
         }
         
         .overflow-x-auto::-webkit-scrollbar { display: none; }
         .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
 
        :global(html), :global(body), :global(#__next) {
          margin: 0;
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }

        :global(*), :global(*::before), :global(*::after) {
          box-sizing: inherit;
        }

        :global(.grid > *), :global(.flex > *), :global(.page-inner > *) {
          min-width: 0;
        }

        :global(img), :global(svg) {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        :global(button), :global(a), :global(.card) {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @media (min-width: 1024px) {
          :global(::-webkit-scrollbar) {
            width: 8px;
            height: 8px;
          }
          
          :global(::-webkit-scrollbar-track) {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          
          :global(::-webkit-scrollbar-thumb) {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          
          :global(::-webkit-scrollbar-thumb:hover) {
            background: rgba(0, 0, 0, 0.3);
          }
        }
       `}</style>
      </div>
  )
}