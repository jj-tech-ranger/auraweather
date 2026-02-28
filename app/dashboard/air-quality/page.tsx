"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  Gauge, 
  AlertTriangle, 
  TrendingUp,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Wind,
  Eye,
  Droplets,
  Heart,
  HeartPulse,
  Brain
} from "lucide-react"

interface AirQualityData {
  aqi: number
  location: string
  country: string
  components: {
    pm25: number
    pm10: number
    o3: number
    no2: number
    so2: number
    co: number
    nh3: number
  }
  forecast: Array<{
    day: string
    date: string
    aqi: number
    mainPollutant: string
  }>
  coord: { lat: number; lon: number }
}

export default function AirQualityPage() {
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  // Convert OpenWeatherMap AQI (1-5) to US EPA AQI (0-500)
  const convertToEPAAQI = (aqiLevel: number, components: any): number => {
    // OpenWeatherMap uses CAQI: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    // Convert to EPA AQI scale
    const aqiMap: { [key: number]: number } = {
      1: 25,   // Good: 0-50
      2: 75,   // Fair: 51-100
      3: 125,  // Moderate: 101-150
      4: 175,  // Poor: 151-200
      5: 250   // Very Poor: 201-300
    }
    
    // Calculate based on PM2.5 if available for more accuracy
    if (components.pm2_5) {
      const pm25 = components.pm2_5
      if (pm25 <= 12) return Math.round(pm25 * 4.17) // 0-50 AQI
      if (pm25 <= 35.4) return Math.round(50 + (pm25 - 12) * 2.13) // 51-100 AQI
      if (pm25 <= 55.4) return Math.round(100 + (pm25 - 35.4) * 2.5) // 101-150 AQI
      if (pm25 <= 150.4) return Math.round(150 + (pm25 - 55.4) * 0.53) // 151-200 AQI
      if (pm25 <= 250.4) return Math.round(200 + (pm25 - 150.4)) // 201-300 AQI
      return Math.round(300 + (pm25 - 250.4) * 0.4) // 301-500 AQI
    }
    
    return aqiMap[aqiLevel] || 50
  }

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { 
      label: "Good", 
      color: "bg-green-500", 
      darkColor: "bg-green-500/20 border-green-400/30 text-green-300",
      lightColor: "bg-green-100 border-green-300 text-green-800",
      description: "Air quality is satisfactory, and air pollution poses little or no risk"
    }
    if (aqi <= 100) return { 
      label: "Moderate", 
      color: "bg-yellow-500",
      darkColor: "bg-yellow-500/20 border-yellow-400/30 text-yellow-300",
      lightColor: "bg-yellow-100 border-yellow-300 text-yellow-800",
      description: "Air quality is acceptable. However, there may be a risk for some people"
    }
    if (aqi <= 150) return { 
      label: "Unhealthy for Sensitive Groups", 
      color: "bg-orange-500",
      darkColor: "bg-orange-500/20 border-orange-400/30 text-orange-300",
      lightColor: "bg-orange-100 border-orange-300 text-orange-800",
      description: "Members of sensitive groups may experience health effects"
    }
    if (aqi <= 200) return { 
      label: "Unhealthy", 
      color: "bg-red-500",
      darkColor: "bg-red-500/20 border-red-400/30 text-red-300",
      lightColor: "bg-red-100 border-red-300 text-red-800",
      description: "Some members of the general public may experience health effects"
    }
    if (aqi <= 300) return { 
      label: "Very Unhealthy", 
      color: "bg-purple-500",
      darkColor: "bg-purple-500/20 border-purple-400/30 text-purple-300",
      lightColor: "bg-purple-100 border-purple-300 text-purple-800",
      description: "Health alert: The risk of health effects is increased for everyone"
    }
    return { 
      label: "Hazardous", 
      color: "bg-gray-800",
      darkColor: "bg-red-900/20 border-red-800/30 text-red-200",
      lightColor: "bg-red-200 border-red-400 text-red-900",
      description: "Health warning of emergency conditions: everyone is more likely to be affected"
    }
  }

  const getMainPollutant = (components: any): string => {
    const pollutants = {
      pm2_5: components.pm2_5 || 0,
      pm10: components.pm10 || 0,
      o3: components.o3 || 0,
      no2: components.no2 || 0,
      so2: components.so2 || 0,
      co: (components.co || 0) / 1000 // Convert to mg/m³
    }
    
    const max = Math.max(...Object.values(pollutants))
    const pollutantKey = Object.keys(pollutants).find(key => pollutants[key as keyof typeof pollutants] === max)
    
    const pollutantNames: { [key: string]: string } = {
      pm2_5: "PM2.5",
      pm10: "PM10",
      o3: "Ozone",
      no2: "NO₂",
      so2: "SO₂",
      co: "CO"
    }
    
    return pollutantNames[pollutantKey || "pm2_5"] || "PM2.5"
  }

  const fetchAirQuality = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch location name
      const locationResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!locationResponse.ok) throw new Error('Failed to fetch location')
      const locationData = await locationResponse.json()

      // Fetch current air quality
      const airQualityResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!airQualityResponse.ok) throw new Error('Failed to fetch air quality')
      const airData = await airQualityResponse.json()

      // Fetch air quality forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      const currentAQ = airData.list[0]
      const currentAQI = convertToEPAAQI(currentAQ.main.aqi, currentAQ.components)

      // Process forecast data - group by day and get daily averages
      const dailyForecast: { [key: string]: any[] } = {}
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyForecast[dateKey]) {
          dailyForecast[dateKey] = []
        }
        dailyForecast[dateKey].push(item)
      })

      const forecast = Object.keys(dailyForecast).slice(0, 5).map((dateKey) => {
        const dayData = dailyForecast[dateKey]
        const avgComponents = {
          pm2_5: dayData.reduce((sum, d) => sum + (d.components.pm2_5 || 0), 0) / dayData.length,
          pm10: dayData.reduce((sum, d) => sum + (d.components.pm10 || 0), 0) / dayData.length,
          o3: dayData.reduce((sum, d) => sum + (d.components.o3 || 0), 0) / dayData.length,
          no2: dayData.reduce((sum, d) => sum + (d.components.no2 || 0), 0) / dayData.length,
          so2: dayData.reduce((sum, d) => sum + (d.components.so2 || 0), 0) / dayData.length,
          co: dayData.reduce((sum, d) => sum + (d.components.co || 0), 0) / dayData.length
        }
        
        const avgAQILevel = Math.round(dayData.reduce((sum, d) => sum + d.main.aqi, 0) / dayData.length)
        const avgAQI = convertToEPAAQI(avgAQILevel, avgComponents)
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          aqi: avgAQI,
          mainPollutant: getMainPollutant(avgComponents)
        }
      })

      setAirQualityData({
        aqi: currentAQI,
        location: locationData.name,
        country: locationData.sys.country,
        components: {
          pm25: Math.round(currentAQ.components.pm2_5 * 10) / 10 || 0,
          pm10: Math.round(currentAQ.components.pm10 * 10) / 10 || 0,
          o3: Math.round(currentAQ.components.o3 * 10) / 10 || 0,
          no2: Math.round(currentAQ.components.no2 * 10) / 10 || 0,
          so2: Math.round(currentAQ.components.so2 * 10) / 10 || 0,
          co: Math.round(currentAQ.components.co / 100) / 10 || 0, // Convert to mg/m³
          nh3: Math.round(currentAQ.components.nh3 * 10) / 10 || 0
        },
        forecast,
        coord: { lat, lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching air quality data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchAirQuality(-1.2921, 36.8219) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchAirQuality(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchAirQuality(-1.2921, 36.8219) // Fallback to London
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
      await fetchAirQuality(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("airQualityDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("airQualityDarkMode", String(newDarkMode))
  }

  const getHealthRecommendations = (aqi: number) => {
    if (aqi <= 50) {
      return {
        general: [
          "Enjoy your usual outdoor activities",
          "Air quality is ideal for outdoor activities",
          "No health implications"
        ],
        sensitive: [
          "It's a great day to be active outside",
          "No precautions necessary",
          "Perfect conditions for exercise"
        ]
      }
    } else if (aqi <= 100) {
      return {
        general: [
          "Enjoy your usual outdoor activities",
          "Unusually sensitive people should consider reducing prolonged outdoor exertion",
          "Air quality is acceptable for most people"
        ],
        sensitive: [
          "Consider reducing prolonged or heavy outdoor exertion",
          "Watch for symptoms such as coughing or shortness of breath",
          "Take more breaks during outdoor activities"
        ]
      }
    } else if (aqi <= 150) {
      return {
        general: [
          "Consider reducing prolonged or heavy exertion if you experience symptoms",
          "It's okay to be active outside but take more breaks",
          "Watch for symptoms such as coughing or shortness of breath"
        ],
        sensitive: [
          "Reduce prolonged or heavy outdoor exertion",
          "Consider moving activities indoors",
          "People with asthma should follow their action plans",
          "Children and elderly should limit outdoor exposure"
        ]
      }
    } else if (aqi <= 200) {
      return {
        general: [
          "Consider reducing prolonged or heavy exertion",
          "Everyone may experience symptoms with prolonged exposure",
          "Take more breaks during outdoor activities",
          "Consider moving activities indoors"
        ],
        sensitive: [
          "Avoid prolonged or heavy outdoor exertion",
          "Move activities indoors or reschedule",
          "People with asthma should keep rescue inhaler nearby",
          "Seek medical attention if symptoms persist"
        ]
      }
    } else {
      return {
        general: [
          "Avoid prolonged or heavy outdoor exertion",
          "Consider moving activities indoors",
          "Everyone should reduce outdoor exposure",
          "Wear N95 mask if going outside"
        ],
        sensitive: [
          "Remain indoors and keep activity levels low",
          "Follow tips for keeping indoor air clean",
          "Seek immediate medical attention if experiencing symptoms",
          "Close windows and use air purifiers"
        ]
      }
    }
  }

  if (loading && !airQualityData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950' 
          : 'bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-green-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading air quality data...
          </p>
        </div>
      </div>
    )
  }

  if (!airQualityData) return null

  const aqiStatus = getAQIStatus(airQualityData.aqi)
  const healthRecs = getHealthRecommendations(airQualityData.aqi)

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950' 
        : 'bg-gradient-to-br from-green-50 via-cyan-50 to-blue-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-500 to-cyan-600' 
                : 'bg-gradient-to-r from-green-400 to-cyan-500'
            }`}>
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Air Quality Index
              </h1>
              <div className={`flex items-center gap-2 mt-1 text-sm ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{airQualityData.location}, {airQualityData.country}</span>
                {locationStatus === 'success' && (
                  <Badge className={`${
                    isDarkMode 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-green-100 text-green-700 border-green-300'
                  }`}>
                    📍 Your Location
                  </Badge>
                )}
              </div>
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
              <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-cyan-600 hover:bg-cyan-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchAirQuality(currentLocation.lat, currentLocation.lon)}
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

        {/* Main AQI Display */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{airQualityData.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold ${
                    airQualityData.aqi <= 50 ? isDarkMode ? 'text-green-300' : 'text-green-600' :
                    airQualityData.aqi <= 100 ? isDarkMode ? 'text-yellow-300' : 'text-yellow-600' :
                    airQualityData.aqi <= 150 ? isDarkMode ? 'text-orange-300' : 'text-orange-600' :
                    airQualityData.aqi <= 200 ? isDarkMode ? 'text-red-300' : 'text-red-600' :
                    isDarkMode ? 'text-purple-300' : 'text-purple-600'
                  }`}>
                    {airQualityData.aqi}
                  </div>
                  <div>
                    <Badge className={`border mb-2 ${
                      isDarkMode ? aqiStatus.darkColor : aqiStatus.lightColor
                    }`}>
                      {aqiStatus.label}
                    </Badge>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Air Quality Index</div>
                  </div>
                </div>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {aqiStatus.description}
                </p>
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
                      stroke={
                        airQualityData.aqi <= 50 ? "#22c55e" :
                        airQualityData.aqi <= 100 ? "#eab308" :
                        airQualityData.aqi <= 150 ? "#f97316" :
                        airQualityData.aqi <= 200 ? "#ef4444" :
                        "#a855f7"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${Math.min((airQualityData.aqi / 300) * 251.2, 251.2)} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wind className={`h-12 w-12 ${
                      isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                    }`} />
                  </div>
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>AQI Level Gauge</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 text-center border ${
                  isDarkMode 
                    ? 'bg-red-500/20 border-red-400/30' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <Gauge className={`h-6 w-6 mx-auto mb-2 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`} />
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`}>{airQualityData.components.pm25}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>PM2.5 μg/m³</div>
                </div>
                <div className={`rounded-lg p-4 text-center border ${
                  isDarkMode 
                    ? 'bg-orange-500/20 border-orange-400/30' 
                    : 'bg-orange-100 border-orange-300'
                }`}>
                  <Gauge className={`h-6 w-6 mx-auto mb-2 ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`} />
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-orange-300' : 'text-orange-600'
                  }`}>{airQualityData.components.pm10}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>PM10 μg/m³</div>
                </div>
                <div className={`rounded-lg p-4 text-center border ${
                  isDarkMode 
                    ? 'bg-blue-500/20 border-blue-400/30' 
                    : 'bg-blue-100 border-blue-300'
                }`}>
                  <Eye className={`h-6 w-6 mx-auto mb-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>{airQualityData.components.o3}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>O₃ μg/m³</div>
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
                  }`}>{airQualityData.components.no2}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>NO₂ μg/m³</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Pollutants */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Additional Pollutants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Sulfur Dioxide (SO₂)</span>
                  <Gauge className={`h-5 w-5 ${
                    isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  {airQualityData.components.so2} μg/m³
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}>From fossil fuel burning</div>
              </div>

              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Carbon Monoxide (CO)</span>
                  <Gauge className={`h-5 w-5 ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {airQualityData.components.co} mg/m³
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}>From incomplete combustion</div>
              </div>

              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Ammonia (NH₃)</span>
                  <Gauge className={`h-5 w-5 ${
                    isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                }`}>
                  {airQualityData.components.nh3} μg/m³
                </div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}>From agricultural activities</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5-Day AQI Forecast */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              5-Day Air Quality Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {airQualityData.forecast.map((day, index) => {
                const dayStatus = getAQIStatus(day.aqi)
                return (
                  <div key={`aqi-forecast-${index}`} className={`text-center p-4 rounded-lg border ${
                    isDarkMode ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="font-medium mb-2">{day.day}</div>
                    <div className="text-xs text-gray-500 mb-3">{day.date}</div>
                    <div className={`text-3xl font-bold mb-2 ${
                      day.aqi <= 50 ? isDarkMode ? 'text-green-300' : 'text-green-600' :
                      day.aqi <= 100 ? isDarkMode ? 'text-yellow-300' : 'text-yellow-600' :
                      day.aqi <= 150 ? isDarkMode ? 'text-orange-300' : 'text-orange-600' :
                      day.aqi <= 200 ? isDarkMode ? 'text-red-300' : 'text-red-600' :
                      isDarkMode ? 'text-purple-300' : 'text-purple-600'
                    }`}>{day.aqi}</div>
                    <Badge className={`text-xs mb-2 border ${
                      isDarkMode ? dayStatus.darkColor : dayStatus.lightColor
                    }`}>
                      {dayStatus.label}
                    </Badge>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>Main: {day.mainPollutant}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Health Recommendations */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <Heart className={`h-5 w-5 ${
                    isDarkMode ? 'text-pink-300' : 'text-pink-600'
                  }`} />
                  General Population
                </h3>
                <div className="space-y-2">
                  {healthRecs.general.map((rec, index) => (
                    <div key={`gen-rec-${index}`} className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                        isDarkMode ? 'bg-green-400' : 'bg-green-600'
                      }`} />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                  <HeartPulse className={`h-5 w-5 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`} />
                  Sensitive Groups
                </h3>
                <div className="space-y-2">
                  {healthRecs.sensitive.map((rec, index) => (
                    <div key={`sens-rec-${index}`} className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                        isDarkMode ? 'bg-orange-400' : 'bg-orange-600'
                      }`} />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AQI Scale Reference */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Air Quality Index Scale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { range: "0-50", label: "Good", color: "green", desc: "Excellent" },
                { range: "51-100", label: "Moderate", color: "yellow", desc: "Acceptable" },
                { range: "101-150", label: "Unhealthy for Sensitive", color: "orange", desc: "Some risk" },
                { range: "151-200", label: "Unhealthy", color: "red", desc: "Everyone affected" },
                { range: "201-300", label: "Very Unhealthy", color: "purple", desc: "Health alert" },
                { range: "301+", label: "Hazardous", color: "gray", desc: "Emergency" }
              ].map((level, index) => (
                <div key={`aqi-scale-${index}`} className={`p-4 rounded-lg text-center border ${
                  isDarkMode 
                    ? `bg-${level.color}-500/20 border-${level.color}-400/30` 
                    : `bg-${level.color}-100 border-${level.color}-300`
                }`}>
                  <div className={`text-xl font-bold mb-1 ${
                    isDarkMode ? `text-${level.color}-300` : `text-${level.color}-600`
                  }`}>{level.range}</div>
                  <div className="font-medium text-sm mb-1">{level.label}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>{level.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}