"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  MapPin,
  Satellite,
  Layers,
  Zap,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Activity,
  TrendingUp,
  Clock,
  Loader2,
  Info,
  Search,
  Target,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface WeatherData {
  coord: { lat: number; lon: number }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: { speed: number; deg: number }
  visibility: number
  name: string
  sys: { country: string }
}

export default function WeatherMapPage() {
  const [activeLayer, setActiveLayer] = useState("temperature")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(5)
  const [opacity, setOpacity] = useState([70])
  const [isAnimating, setIsAnimating] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [searchCity, setSearchCity] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])
  const [nearbyLocations, setNearbyLocations] = useState<Array<{name: string, lat: number, lon: number, temp: number}>>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const mapRef = useRef<HTMLDivElement>(null)

  const mapLayers = [
    {
      id: "temperature",
      name: "Temperature",
      icon: Thermometer,
      color: "bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500",
      description: "Real-time temperature data"
    },
    {
      id: "precipitation",
      name: "Precipitation",
      icon: CloudRain,
      color: "bg-gradient-to-r from-green-400 to-blue-600",
      description: "Live rainfall data"
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      icon: Satellite,
      color: "bg-gradient-to-r from-gray-400 to-gray-700",
      description: "Cloud coverage percentage"
    },
    {
      id: "pressure",
      name: "Pressure",
      icon: Gauge,
      color: "bg-gradient-to-r from-purple-500 to-pink-600",
      description: "Atmospheric pressure"
    },
    {
      id: "wind",
      name: "Wind Speed",
      icon: Wind,
      color: "bg-gradient-to-r from-cyan-400 to-teal-600",
      description: "Wind speed and direction"
    }
  ]

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("weatherMapDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    getUserLocation()

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      if (currentLocation?.lat && currentLocation?.lon) {
        fetchWeatherData(currentLocation.lat, currentLocation.lon)
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(refreshTimer)
  }, [currentLocation])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("weatherMapDarkMode", String(newDarkMode))
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location')
      setLocationStatus('error')
      fetchWeatherData(-1.2921, 36.8219)
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ Got your live location:', latitude, longitude)
          setCurrentLocation({ lat: latitude, lon: longitude })
          setLocationStatus('success')
          fetchWeatherData(latitude, longitude)
          fetchNearbyLocations(latitude, longitude)
        },
        (error) => {
          console.warn('⚠️ Location access denied or error:', error.message)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
          setCurrentLocation({ lat: -1.2921, lon: 36.8219 })
          fetchWeatherData(-1.2921, 36.8219)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
    )
  }

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (!response.ok) throw new Error('Failed to fetch weather')
      const data = await response.json()
      setWeatherData(data)
      console.log('📍 Weather data for:', data.name, data.sys.country)
    } catch (error) {
      console.error('Weather fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNearbyLocations = async (lat: number, lon: number) => {
    const offsets = [
      { name: "North", latOffset: 0.5, lonOffset: 0 },
      { name: "South", latOffset: -0.5, lonOffset: 0 },
      { name: "East", latOffset: 0, lonOffset: 0.5 },
      { name: "West", latOffset: 0, lonOffset: -0.5 },
    ]

    const locations = await Promise.all(
        offsets.map(async (offset) => {
          try {
            const response = await fetch(
                `/api/weather?lat=${lat + offset.latOffset}&lon=${lon + offset.lonOffset}`
            )
            const data = await response.json()
            return {
              name: data.name,
              lat: data.coord.lat,
              lon: data.coord.lon,
              temp: Math.round(data.main.temp)
            }
          } catch {
            return null
          }
        })
    )

    setNearbyLocations(locations.filter(Boolean) as any)
  }

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(searchCity)}`)
      if (!response.ok) throw new Error('City not found')
      const data = await response.json()
      setWeatherData(data)
      setCurrentLocation({ lat: data.coord.lat, lon: data.coord.lon })
      fetchNearbyLocations(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const currentLayerInfo = mapLayers.find(l => l.id === activeLayer)

  return (
      <div className={`min-h-screen ${
          isDarkMode
              ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950'
              : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      } relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
              <div
                  key={particle.id}
                  className={`absolute w-1 h-1 ${
                      isDarkMode ? 'bg-blue-400/30' : 'bg-blue-600/20'
                  } rounded-full animate-float`}
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${4 + Math.random() * 3}s`
                  }}
              />
          ))}
        </div>

        <div className="relative z-10 p-4 md:p-6">
          <div className="mb-6">
            <Card className={`${
                isDarkMode
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-xl transition-colors duration-500`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 ${
                          isDarkMode
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                              : 'bg-gradient-to-r from-blue-400 to-purple-500'
                      } rounded-xl`}>
                        <Satellite className="h-6 w-6 text-white" />
                      </div>
                      <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${
                          isDarkMode
                              ? 'from-blue-400 via-purple-400 to-pink-400'
                              : 'from-blue-600 via-purple-600 to-pink-600'
                      } bg-clip-text text-transparent`}>
                        Live Weather Map
                      </h1>
                    </div>
                    <div className={`flex flex-wrap items-center gap-3 text-sm ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{weatherData?.name || 'Loading...'}, {weatherData?.sys.country || ''}</span>
                      </div>
                      {locationStatus === 'success' && (
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                            📍 Your Location
                          </Badge>
                      )}
                      {locationStatus === 'denied' && (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Location Denied
                          </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{currentTime.toLocaleTimeString()}</span>
                      </div>
                      <Badge className={`${
                          isDarkMode
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-green-100 text-green-700 border-green-300'
                      }`}>
                        <Activity className="h-3 w-3 mr-1 animate-pulse" />
                        Live Data
                      </Badge>
                    </div>
                  </div>

                  <form onSubmit={handleSearchCity} className="flex gap-2">
                    <Button
                        type="button"
                        onClick={toggleDarkMode}
                        size="icon"
                        variant="outline"
                        className={`${
                            isDarkMode
                                ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                        }`}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
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
                    <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        onClick={getUserLocation}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        title="Use My Location"
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card className={`${
                  isDarkMode
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    Map Layers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mapLayers.map((layer) => {
                    const Icon = layer.icon
                    return (
                        <button
                            key={layer.id}
                            onClick={() => setActiveLayer(layer.id)}
                            className={`w-full p-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                                activeLayer === layer.id
                                    ? isDarkMode
                                        ? 'bg-white/20 scale-105 shadow-lg'
                                        : 'bg-blue-100 scale-105 shadow-lg'
                                    : isDarkMode
                                        ? 'bg-white/5 hover:bg-white/10'
                                        : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                          <div className={`p-2 rounded-lg ${layer.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-sm">{layer.name}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                              {layer.description}
                            </p>
                          </div>
                        </button>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className={`${
                  isDarkMode
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'} mb-2 block`}>
                      Layer Opacity: {opacity[0]}%
                    </label>
                    <Slider
                        value={opacity}
                        onValueChange={setOpacity}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'} mb-2 block`}>
                      Zoom Level: {zoom}x
                    </label>
                    <div className="flex gap-2">
                      <Button
                          onClick={() => setZoom(Math.max(1, zoom - 1))}
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${
                              isDarkMode
                                  ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                          }`}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                          onClick={() => setZoom(Math.min(15, zoom + 1))}
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${
                              isDarkMode
                                  ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                          }`}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                      onClick={() => setIsAnimating(!isAnimating)}
                      variant="outline"
                      className={`w-full ${
                          isDarkMode
                              ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                      }`}
                  >
                    {isAnimating ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Animation
                        </>
                    ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Play Animation
                        </>
                    )}
                  </Button>

                  <Button
                      onClick={() => {
                        setZoom(5)
                        setOpacity([70])
                      }}
                      variant="outline"
                      className={`w-full ${
                          isDarkMode
                              ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                      }`}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset View
                  </Button>
                </CardContent>
              </Card>

              {weatherData && (
                  <Card className={`${
                      isDarkMode
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                  } backdrop-blur-xl`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        Live Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Temperature</span>
                        <span className="font-bold">{Math.round(weatherData.main.temp)}°C</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Humidity</span>
                        <span className="font-bold">{weatherData.main.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Wind Speed</span>
                        <span className="font-bold">{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Pressure</span>
                        <span className="font-bold">{weatherData.main.pressure} hPa</span>
                      </div>
                    </CardContent>
                  </Card>
              )}

              <Card className={`${
                  isDarkMode
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    Legend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentLayerInfo && (
                      <div className="space-y-3">
                        <div className={`h-4 rounded-full ${currentLayerInfo.color}`} />
                        <div className={`flex justify-between text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <Card
                  ref={mapRef}
                  className={`${
                      isDarkMode
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                  } backdrop-blur-xl overflow-hidden`}
              >
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button
                      onClick={toggleFullscreen}
                      size="sm"
                      variant="outline"
                      className={`${
                          isDarkMode
                              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                      } backdrop-blur-xl`}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Satellite className="h-5 w-5" />
                    {currentLayerInfo?.name} Map
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="relative h-[600px] lg:h-[700px] overflow-hidden rounded-xl">
                    <div
                        className="absolute inset-0 transition-all duration-500"
                        style={{
                          opacity: opacity[0] / 100,
                          transform: `scale(${1 + zoom * 0.05})`
                        }}
                    >
                      <div className={`absolute inset-0 ${
                          isDarkMode
                              ? 'bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-purple-900/50'
                              : 'bg-gradient-to-br from-blue-100/80 via-indigo-100/80 to-purple-100/80'
                      }`} />

                      {activeLayer === 'temperature' && (
                          <div className={`absolute inset-0 ${isAnimating ? 'animate-pulse' : ''}`}>
                            <div className={`absolute inset-0 ${
                                isDarkMode
                                    ? 'bg-gradient-to-r from-blue-400/30 via-yellow-400/30 to-red-400/30'
                                    : 'bg-gradient-to-r from-blue-300/40 via-yellow-300/40 to-red-300/40'
                            }`} />
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute rounded-full blur-xl"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      width: `${50 + Math.random() * 100}px`,
                                      height: `${50 + Math.random() * 100}px`,
                                      background: `radial-gradient(circle, ${
                                          isDarkMode
                                              ? ['rgba(239,68,68,0.3)', 'rgba(251,191,36,0.3)', 'rgba(59,130,246,0.3)'][Math.floor(Math.random() * 3)]
                                              : ['rgba(239,68,68,0.4)', 'rgba(251,191,36,0.4)', 'rgba(59,130,246,0.4)'][Math.floor(Math.random() * 3)]
                                      } 0%, transparent 70%)`,
                                      animation: isAnimating ? 'float 6s ease-in-out infinite' : 'none',
                                      animationDelay: `${Math.random() * 3}s`
                                    }}
                                />
                            ))}
                          </div>
                      )}

                      {activeLayer === 'precipitation' && (
                          <div className="absolute inset-0">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute w-1 h-6 ${
                                        isDarkMode ? 'bg-blue-400/60' : 'bg-blue-500/70'
                                    } rounded-full`}
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      animation: isAnimating ? 'fall 2s linear infinite' : 'none',
                                      animationDelay: `${Math.random() * 2}s`
                                    }}
                                />
                            ))}
                          </div>
                      )}

                      {activeLayer === 'clouds' && (
                          <div className="absolute inset-0">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute rounded-full blur-2xl ${
                                        isDarkMode ? 'bg-white/20' : 'bg-gray-400/30'
                                    }`}
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      width: `${100 + Math.random() * 200}px`,
                                      height: `${60 + Math.random() * 100}px`,
                                      animation: isAnimating ? 'drift 15s ease-in-out infinite' : 'none',
                                      animationDelay: `${Math.random() * 5}s`
                                    }}
                                />
                            ))}
                          </div>
                      )}

                      {activeLayer === 'wind' && (
                          <div className="absolute inset-0">
                            {Array.from({ length: 25 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute h-0.5 w-12 ${
                                        isDarkMode ? 'bg-cyan-400/50' : 'bg-cyan-500/60'
                                    }`}
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      transform: `rotate(${Math.random() * 360}deg)`,
                                      animation: isAnimating ? 'slide 3s linear infinite' : 'none',
                                      animationDelay: `${Math.random() * 3}s`
                                    }}
                                />
                            ))}
                          </div>
                      )}

                      {activeLayer === 'pressure' && (
                          <div className="absolute inset-0">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`absolute rounded-full border-2 ${
                                        isDarkMode ? 'border-purple-400/30' : 'border-purple-500/40'
                                    }`}
                                    style={{
                                      left: '50%',
                                      top: '50%',
                                      width: `${100 + i * 80}px`,
                                      height: `${100 + i * 80}px`,
                                      transform: 'translate(-50%, -50%)',
                                      animation: isAnimating ? 'ripple 4s ease-out infinite' : 'none',
                                      animationDelay: `${i * 0.5}s`
                                    }}
                                />
                            ))}
                          </div>
                      )}

                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" style={{ width: '50px', height: '50px' }} />
                          <div className="relative bg-blue-600 rounded-full p-4 shadow-2xl border-4 border-white/30">
                            <Navigation className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        {weatherData && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-black/80 backdrop-blur-lg rounded-lg px-4 py-2 whitespace-nowrap">
                              <p className="text-white font-bold text-sm">{weatherData.name}</p>
                              <p className="text-blue-300 text-xs">{Math.round(weatherData.main.temp)}°C</p>
                            </div>
                        )}
                      </div>

                      {nearbyLocations.map((location, index) => {
                        const angle = (index * 90) * (Math.PI / 180)
                        const radius = 150
                        const x = 50 + radius * Math.cos(angle) / 3
                        const y = 50 + radius * Math.sin(angle) / 3

                        return (
                            <div
                                key={index}
                                className="absolute z-10 cursor-pointer group"
                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                            >
                              <div className={`${
                                  isDarkMode ? 'bg-white/20' : 'bg-white/80'
                              } backdrop-blur-lg rounded-full p-2 border ${
                                  isDarkMode ? 'border-white/30' : 'border-gray-300'
                              } group-hover:scale-125 transition-transform`}>
                                <MapPin className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-semibold">{location.name}</p>
                                <p className="text-blue-300">{location.temp}°C</p>
                              </div>
                            </div>
                        )
                      })}

                      <div className="absolute inset-0 opacity-5">
                        <div className="grid grid-cols-12 grid-rows-12 h-full">
                          {Array.from({ length: 144 }).map((_, i) => (
                              <div key={i} className={`border ${
                                  isDarkMode ? 'border-white/20' : 'border-gray-400/20'
                              }`} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {loading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                          <div className="text-center">
                            <Loader2 className={`h-12 w-12 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            } animate-spin mx-auto mb-4`} />
                            <p className="text-white font-semibold">Loading Live Weather Data...</p>
                          </div>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {weatherData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Thermometer, label: "Temperature", value: `${Math.round(weatherData.main.temp)}°C`, color: "from-red-500 to-orange-500" },
                      { icon: Droplets, label: "Humidity", value: `${weatherData.main.humidity}%`, color: "from-blue-500 to-cyan-500" },
                      { icon: Wind, label: "Wind Speed", value: `${Math.round(weatherData.wind.speed * 3.6)} km/h`, color: "from-green-500 to-teal-500" },
                      { icon: Eye, label: "Visibility", value: `${(weatherData.visibility / 1000).toFixed(1)} km`, color: "from-purple-500 to-pink-500" },
                    ].map((stat, index) => {
                      const Icon = stat.icon
                      return (
                          <Card
                              key={index}
                              className={`${
                                  isDarkMode
                                      ? 'bg-white/10 border-white/20 text-white'
                                      : 'bg-white border-gray-200 text-gray-900'
                              } backdrop-blur-xl hover:scale-105 transition-transform duration-300`}
                          >
                            <CardContent className="p-4">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="text-2xl font-bold mb-1">{stat.value}</div>
                              <div className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                                {stat.label}
                              </div>
                            </CardContent>
                          </Card>
                      )
                    })}
                  </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
        }
        @keyframes fall {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px);
            opacity: 0;
          }
        }
        @keyframes slide {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(200px);
            opacity: 0;
          }
        }
        @keyframes drift {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(50px);
          }
        }
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
      </div>
  )
}