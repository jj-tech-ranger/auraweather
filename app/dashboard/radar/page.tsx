"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Satellite, 
  Radar, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Sun, 
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  Wind,
  Thermometer,
  Cloud,
  CloudRain,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface RadarView {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  layer: string
}

interface WeatherData {
  location: string
  country: string
  coord: { lat: number; lon: number }
  temp: number
  humidity: number
  windSpeed: number
  clouds: number
  rain?: number
  condition: string
  description: string
}

export default function RadarPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [activeView, setActiveView] = useState("clouds")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [mapOpacity, setMapOpacity] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(new Date())

  const radarViews: RadarView[] = [
    { 
      id: "clouds", 
      name: "Cloud Cover", 
      icon: Cloud, 
      description: "Real-time cloud coverage",
      layer: "clouds_new"
    },
    { 
      id: "precipitation", 
      name: "Precipitation", 
      icon: CloudRain, 
      description: "Live rainfall data",
      layer: "precipitation_new"
    },
    { 
      id: "temperature", 
      name: "Temperature", 
      icon: Thermometer, 
      description: "Temperature distribution",
      layer: "temp_new"
    },
    { 
      id: "wind", 
      name: "Wind Speed", 
      icon: Wind, 
      description: "Wind patterns and speed",
      layer: "wind_new"
    }
  ]

  const getCurrentView = (): RadarView => {
    return radarViews.find(v => v.id === activeView) || radarViews[0]
  }

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!response.ok) throw new Error('Failed to fetch weather')
      
      const data = await response.json()
      
      setWeatherData({
        location: data.name,
        country: data.sys.country,
        coord: { lat: data.coord.lat, lon: data.coord.lon },
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        clouds: data.clouds.all,
        rain: data.rain?.['1h'] || 0,
        condition: data.weather[0].main,
        description: data.weather[0].description
      })
      
      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWeatherData(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWeatherData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWeatherData(-1.2921, 36.8219) // Fallback to London
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
      await fetchWeatherData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("radarDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()

    // Update time
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 10)
      }, 800)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("radarDarkMode", String(newDarkMode))
  }

  const currentView = getCurrentView()

  const getWeatherLayerUrl = () => {
    if (!currentLocation) return null
    const { lat, lon } = currentLocation
    const zoom = 8
    const tileX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom))
    const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    
    return `https://tile.openweathermap.org/map/${currentView.layer}/${zoom}/${tileX}/${tileY}.png?appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
  }

  const getRainIntensityColor = (rain: number) => {
    if (rain === 0) return isDarkMode ? 'bg-gray-500/20 border-gray-400/30' : 'bg-gray-100 border-gray-300'
    if (rain < 2.5) return isDarkMode ? 'bg-green-500/20 border-green-400/30' : 'bg-green-100 border-green-300'
    if (rain < 7.6) return isDarkMode ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-yellow-100 border-yellow-300'
    if (rain < 50) return isDarkMode ? 'bg-orange-500/20 border-orange-400/30' : 'bg-orange-100 border-orange-300'
    return isDarkMode ? 'bg-red-500/20 border-red-400/30' : 'bg-red-100 border-red-300'
  }

  const getRainIntensityLabel = (rain: number) => {
    if (rain === 0) return 'No Rain'
    if (rain < 2.5) return 'Light Rain'
    if (rain < 7.6) return 'Moderate Rain'
    if (rain < 50) return 'Heavy Rain'
    return 'Violent Rain'
  }

  if (loading && !weatherData) {
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
            Loading radar data...
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
              <Satellite className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Radar & Satellite
              </h1>
              {weatherData && (
                <div className={`flex items-center gap-2 mt-1 text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span>{weatherData.location}, {weatherData.country}</span>
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
              onClick={() => currentLocation && fetchWeatherData(currentLocation.lat, currentLocation.lon)}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-lg`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  View Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {radarViews.map((view) => {
                  const IconComponent = view.icon
                  return (
                    <Button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      variant={activeView === view.id ? "secondary" : "outline"}
                      className={`w-full justify-start gap-2 ${
                        activeView === view.id 
                          ? isDarkMode
                            ? "bg-white text-blue-900" 
                            : "bg-blue-600 text-white"
                          : isDarkMode
                            ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {view.name}
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-lg`}>
              <CardHeader>
                <CardTitle>Animation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="outline"
                    className={`flex-1 ${
                      isDarkMode 
                        ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' 
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentFrame(0)
                      setIsPlaying(false)
                    }}
                    variant="outline"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' 
                        : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Frame</span>
                    <span>{currentFrame + 1}/10</span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${
                    isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                  }`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-200 ${
                        isDarkMode ? 'bg-white' : 'bg-blue-600'
                      }`}
                      style={{ width: `${((currentFrame + 1) / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Layer Opacity</span>
                    <span>{Math.round(mapOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mapOpacity * 100}
                    onChange={(e) => setMapOpacity(Number(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>

                <div className={`text-xs space-y-1 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <div>• Updated: {currentTime.toLocaleTimeString()}</div>
                  <div>• Live OpenWeather data</div>
                  <div>• Auto-refresh every 5 min</div>
                </div>
              </CardContent>
            </Card>

            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-lg`}>
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {activeView === 'precipitation' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-green-400' : 'bg-green-500'
                        }`}></div>
                        <span>Light (0-2.5 mm/h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                        }`}></div>
                        <span>Moderate (2.5-7.6 mm/h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-orange-500' : 'bg-orange-600'
                        }`}></div>
                        <span>Heavy (7.6-50 mm/h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-red-500' : 'bg-red-600'
                        }`}></div>
                        <span>Violent (&gt;50 mm/h)</span>
                      </div>
                    </>
                  )}
                  {activeView === 'clouds' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                        }`}></div>
                        <span>Clear (0-25%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-gray-500' : 'bg-gray-400'
                        }`}></div>
                        <span>Partly Cloudy (25-75%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                        }`}></div>
                        <span>Cloudy (75-100%)</span>
                      </div>
                    </>
                  )}
                  {activeView === 'temperature' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-blue-400' : 'bg-blue-500'
                        }`}></div>
                        <span>Cold (&lt;10°C)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-green-400' : 'bg-green-500'
                        }`}></div>
                        <span>Moderate (10-25°C)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                        }`}></div>
                        <span>Warm (25-35°C)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-red-400' : 'bg-red-500'
                        }`}></div>
                        <span>Hot (&gt;35°C)</span>
                      </div>
                    </>
                  )}
                  {activeView === 'wind' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-cyan-400' : 'bg-cyan-500'
                        }`}></div>
                        <span>Calm (0-5 km/h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-teal-400' : 'bg-teal-500'
                        }`}></div>
                        <span>Moderate (5-30 km/h)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-2 rounded ${
                          isDarkMode ? 'bg-orange-400' : 'bg-orange-500'
                        }`}></div>
                        <span>Strong (&gt;30 km/h)</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar/Satellite Display */}
          <div className="lg:col-span-3">
            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-lg`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <currentView.icon className="h-5 w-5" />
                  {currentView.name}
                  <Badge className={`ml-auto ${
                    isDarkMode 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 animate-pulse ${
                      isDarkMode ? 'bg-green-300' : 'bg-green-600'
                    }`} />
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`h-[500px] rounded-lg flex items-center justify-center relative overflow-hidden ${
                  isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
                }`}>
                  {/* Base Map Visualization */}
                  <div className="absolute inset-0">
                    {currentLocation && getWeatherLayerUrl() ? (
                      <div className="relative w-full h-full">
                        {/* Base map representation */}
                        <div className={`absolute inset-0 ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-slate-700 to-slate-900' 
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                        }`}>
                          {/* Grid overlay */}
                          <div className="absolute inset-0 opacity-10">
                            <div className="grid grid-cols-12 grid-rows-12 h-full">
                              {Array.from({ length: 144 }).map((_, i) => (
                                <div key={i} className={`border ${
                                  isDarkMode ? 'border-white/20' : 'border-gray-400/20'
                                }`} />
                              ))}
                            </div>
                          </div>

                          {/* Weather layer simulation */}
                          <div 
                            className="absolute inset-0 transition-opacity duration-500"
                            style={{ opacity: mapOpacity }}
                          >
                            {activeView === 'clouds' && weatherData && (
                              <div className="absolute inset-0">
                                {Array.from({ length: Math.floor(weatherData.clouds / 10) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`absolute rounded-full blur-2xl ${
                                      isDarkMode ? 'bg-white/20' : 'bg-gray-400/30'
                                    }`}
                                    style={{
                                      width: `${100 + Math.random() * 150}px`,
                                      height: `${60 + Math.random() * 80}px`,
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      animation: isPlaying ? `drift 15s ease-in-out infinite ${i * 0.5}s` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {activeView === 'precipitation' && weatherData && weatherData.rain && weatherData.rain > 0 && (
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
                                      animation: isPlaying ? `fall 2s linear infinite ${Math.random() * 2}s` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {activeView === 'temperature' && weatherData && (
                              <div className="absolute inset-0">
                                {Array.from({ length: 15 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="absolute rounded-full blur-xl"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      width: `${50 + Math.random() * 100}px`,
                                      height: `${50 + Math.random() * 100}px`,
                                      background: weatherData.temp <= 10 
                                        ? 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)'
                                        : weatherData.temp <= 25
                                          ? 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)'
                                          : 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                                      animation: isPlaying ? `float 6s ease-in-out infinite ${Math.random() * 3}s` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            )}

                            {activeView === 'wind' && weatherData && (
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
                                      animation: isPlaying ? `slide 3s linear infinite ${Math.random() * 3}s` : 'none'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Location marker */}
                          {currentLocation && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                              <div className="relative">
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" style={{ width: '40px', height: '40px' }} />
                                <div className="relative bg-red-600 rounded-full p-3 shadow-2xl border-4 border-white/30">
                                  <MapPin className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center z-10">
                        <currentView.icon className={`h-16 w-16 mx-auto mb-4 ${
                          isDarkMode ? 'text-white/70' : 'text-gray-400'
                        }`} />
                        <p className="text-lg mb-2">{currentView.name}</p>
                        <p className={`text-sm mb-4 ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>
                          {currentView.description}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            isPlaying 
                              ? isDarkMode ? 'bg-green-400 animate-pulse' : 'bg-green-600 animate-pulse'
                              : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                          }`}></div>
                          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Stamps */}
                <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                  {Array.from({ length: 5 }, (_, i) => {
                    const time = new Date(Date.now() - (4 - i) * 10 * 60 * 1000)
                    const frameIndex = Math.floor((i * 10) / 5)
                    return (
                      <div 
                        key={`timestamp-${i}`}
                        className={`text-center p-2 rounded transition-colors ${
                          frameIndex === Math.floor(currentFrame / 2)
                            ? isDarkMode 
                              ? 'bg-white/20 text-white' 
                              : 'bg-blue-100 text-blue-900'
                            : isDarkMode
                              ? 'text-white/70'
                              : 'text-gray-600'
                        }`}
                      >
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weather Activity Cards */}
        {weatherData && (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-lg`}>
            <CardHeader>
              <CardTitle>Current Weather Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`border rounded-lg p-4 ${
                  getRainIntensityColor(weatherData.rain || 0)
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      weatherData.rain && weatherData.rain > 0
                        ? isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                        : isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                    }`}></div>
                    <span className="font-medium">{getRainIntensityLabel(weatherData.rain || 0)}</span>
                  </div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {weatherData.description}
                  </p>
                  <div className={`mt-2 text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    Precipitation: {weatherData.rain || 0} mm/h
                  </div>
                </div>
                
                <div className={`border rounded-lg p-4 ${
                  isDarkMode 
                    ? 'bg-blue-500/20 border-blue-400/30' 
                    : 'bg-blue-100 border-blue-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                    }`}></div>
                    <span className="font-medium">Cloud Cover</span>
                  </div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {weatherData.clouds < 25 ? 'Clear skies' : weatherData.clouds < 75 ? 'Partly cloudy' : 'Overcast'}
                  </p>
                  <div className={`mt-2 text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    Coverage: {weatherData.clouds}%
                  </div>
                </div>
                
                <div className={`border rounded-lg p-4 ${
                  isDarkMode 
                    ? 'bg-green-500/20 border-green-400/30' 
                    : 'bg-green-100 border-green-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isDarkMode ? 'bg-green-400' : 'bg-green-600'
                    }`}></div>
                    <span className="font-medium">Wind Conditions</span>
                  </div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {weatherData.windSpeed < 5 ? 'Calm' : weatherData.windSpeed < 30 ? 'Moderate breeze' : 'Strong winds'}
                  </p>
                  <div className={`mt-2 text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    Speed: {weatherData.windSpeed} km/h
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Radar Information */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle>Radar Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className="font-medium mb-1">Data Source</div>
                <div className={isDarkMode ? 'text-white/80' : 'text-gray-600'}>
                  OpenWeatherMap
                </div>
              </div>
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className="font-medium mb-1">Update Frequency</div>
                <div className={isDarkMode ? 'text-white/80' : 'text-gray-600'}>
                  Every 5 minutes
                </div>
              </div>
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className="font-medium mb-1">Coverage Type</div>
                <div className={isDarkMode ? 'text-white/80' : 'text-gray-600'}>
                  {currentView.name}
                </div>
              </div>
              <div className={`rounded-lg p-3 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className="font-medium mb-1">Status</div>
                <div className={`flex items-center gap-1 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.6; }
        }
        @keyframes fall {
          0% { transform: translateY(-10px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        @keyframes slide {
          0% { transform: translateX(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(200px); opacity: 0; }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(50px); }
        }
      `}</style>
    </div>
  )
}