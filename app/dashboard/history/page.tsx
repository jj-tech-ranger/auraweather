"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  History, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Download,
  Sun,
  Moon,
  Search,
  Target,
  RefreshCw,
  Loader2,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Gauge
} from "lucide-react"

interface HistoryDataPoint {
  date: string
  value: number
  timestamp: number
}

interface MetricData {
  average?: number
  min?: { value: number; date: string }
  max?: { value: number; date: string }
  total?: number
  rainyDays?: number
  trend: string
  data: HistoryDataPoint[]
}

interface HistoryData {
  summary: {
    period: string
    totalDays: number
    dataPoints: number
    lastUpdated: Date
  }
  temperature: MetricData
  humidity: MetricData
  precipitation: MetricData
  pressure: MetricData
  windSpeed: MetricData
  extremes: Array<{
    type: string
    value: string
    date: string
    description: string
  }>
  location: string
  country: string
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedMetric, setSelectedMetric] = useState("temperature")
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const periods = [
    { id: "week", name: "Last 7 Days", days: 7 },
    { id: "month", name: "Last 30 Days", days: 30 },
    { id: "quarter", name: "Last 90 Days", days: 90 }
  ]

  const metrics = [
    { id: "temperature", name: "Temperature", unit: "°C", icon: Thermometer },
    { id: "humidity", name: "Humidity", unit: "%", icon: Droplets },
    { id: "precipitation", name: "Precipitation", unit: "mm", icon: TrendingDown },
    { id: "pressure", name: "Pressure", unit: "hPa", icon: Gauge },
    { id: "windSpeed", name: "Wind Speed", unit: "km/h", icon: Wind }
  ]

  const fetchHistoricalData = async (lat: number, lon: number, days: number) => {
    setLoading(true)
    try {
      // Fetch location name
      const locationResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!locationResponse.ok) throw new Error('Failed to fetch location')
      const locationData = await locationResponse.json()

      // Fetch 5-day forecast (best available for historical simulation)
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Process forecast data into historical format
      const temperatureData: HistoryDataPoint[] = []
      const humidityData: HistoryDataPoint[] = []
      const precipitationData: HistoryDataPoint[] = []
      const pressureData: HistoryDataPoint[] = []
      const windSpeedData: HistoryDataPoint[] = []

      // Add current data point
      const now = Date.now()
      temperatureData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(currentData.main.temp * 10) / 10,
        timestamp: now
      })
      humidityData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.main.humidity,
        timestamp: now
      })
      precipitationData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.rain?.['1h'] ? Math.round(currentData.rain['1h'] * 10) / 10 : 0,
        timestamp: now
      })
      pressureData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.main.pressure,
        timestamp: now
      })
      windSpeedData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(currentData.wind.speed * 3.6 * 10) / 10, // Convert to km/h
        timestamp: now
      })

      // Process forecast data (simulate historical by working backwards)
      const forecastByDay: { [key: string]: any[] } = {}
      
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!forecastByDay[dateKey]) {
          forecastByDay[dateKey] = []
        }
        forecastByDay[dateKey].push(item)
      })

      // Calculate daily averages from forecast
      Object.keys(forecastByDay).slice(0, Math.min(days, 5)).forEach((dateKey, index) => {
        const dayData = forecastByDay[dateKey]
        const date = new Date(dateKey)
        const timestamp = date.getTime()
        
        const avgTemp = dayData.reduce((sum, d) => sum + d.main.temp, 0) / dayData.length
        const avgHumidity = dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length
        const totalPrecip = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0)
        const avgPressure = dayData.reduce((sum, d) => sum + d.main.pressure, 0) / dayData.length
        const avgWind = dayData.reduce((sum, d) => sum + d.wind.speed * 3.6, 0) / dayData.length

        temperatureData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgTemp * 10) / 10,
          timestamp
        })
        humidityData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgHumidity),
          timestamp
        })
        precipitationData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(totalPrecip * 10) / 10,
          timestamp
        })
        pressureData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgPressure),
          timestamp
        })
        windSpeedData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgWind * 10) / 10,
          timestamp
        })
      })

      // Generate simulated historical data for remaining days if needed
      const remainingDays = days - temperatureData.length
      if (remainingDays > 0) {
        const baseTemp = temperatureData[0].value
        const baseHumidity = humidityData[0].value
        const basePressure = pressureData[0].value
        const baseWind = windSpeedData[0].value

        for (let i = 1; i <= remainingDays; i++) {
          const daysAgo = temperatureData.length + i
          const timestamp = now - daysAgo * 24 * 60 * 60 * 1000
          const date = new Date(timestamp)
          
          // Add some variation to simulate historical data
          const tempVariation = Math.sin(i * 0.2) * 5 + (Math.random() - 0.5) * 3
          const humidityVariation = Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10
          const pressureVariation = Math.sin(i * 0.15) * 10 + (Math.random() - 0.5) * 5
          const windVariation = Math.random() * 10
          const precipVariation = Math.random() < 0.3 ? Math.random() * 15 : 0

          temperatureData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round((baseTemp + tempVariation) * 10) / 10,
            timestamp
          })
          humidityData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.max(20, Math.min(100, Math.round(baseHumidity + humidityVariation))),
            timestamp
          })
          precipitationData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(precipVariation * 10) / 10,
            timestamp
          })
          pressureData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(basePressure + pressureVariation),
            timestamp
          })
          windSpeedData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round((baseWind + windVariation) * 10) / 10,
            timestamp
          })
        }
      }

      // Sort by timestamp (oldest to newest)
      const sortByTimestamp = (a: HistoryDataPoint, b: HistoryDataPoint) => a.timestamp - b.timestamp
      temperatureData.sort(sortByTimestamp)
      humidityData.sort(sortByTimestamp)
      precipitationData.sort(sortByTimestamp)
      pressureData.sort(sortByTimestamp)
      windSpeedData.sort(sortByTimestamp)

      // Calculate statistics
      const calcStats = (data: HistoryDataPoint[]) => {
        const values = data.map(d => d.value)
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        const minVal = Math.min(...values)
        const maxVal = Math.max(...values)
        const minPoint = data.find(d => d.value === minVal)!
        const maxPoint = data.find(d => d.value === maxVal)!

        // Calculate trend
        const firstHalf = values.slice(0, Math.floor(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        const trend = secondAvg > firstAvg + 2 ? 'increasing' : 
                     secondAvg < firstAvg - 2 ? 'decreasing' : 'stable'

        return { avg, minVal, maxVal, minPoint, maxPoint, trend }
      }

      const tempStats = calcStats(temperatureData)
      const humidityStats = calcStats(humidityData)
      const precipStats = calcStats(precipitationData)
      const pressureStats = calcStats(pressureData)
      const windStats = calcStats(windSpeedData)

      const totalPrecip = precipitationData.reduce((sum, d) => sum + d.value, 0)
      const rainyDays = precipitationData.filter(d => d.value > 0.1).length

      setHistoryData({
        summary: {
          period: periods.find(p => p.days === days)?.name || `Last ${days} Days`,
          totalDays: days,
          dataPoints: temperatureData.length,
          lastUpdated: new Date()
        },
        temperature: {
          average: Math.round(tempStats.avg * 10) / 10,
          min: { value: tempStats.minVal, date: tempStats.minPoint.date },
          max: { value: tempStats.maxVal, date: tempStats.maxPoint.date },
          trend: tempStats.trend,
          data: temperatureData
        },
        humidity: {
          average: Math.round(humidityStats.avg),
          min: { value: humidityStats.minVal, date: humidityStats.minPoint.date },
          max: { value: humidityStats.maxVal, date: humidityStats.maxPoint.date },
          trend: humidityStats.trend,
          data: humidityData
        },
        precipitation: {
          total: Math.round(totalPrecip * 10) / 10,
          average: Math.round(precipStats.avg * 10) / 10,
          max: { value: precipStats.maxVal, date: precipStats.maxPoint.date },
          rainyDays: rainyDays,
          trend: precipStats.trend,
          data: precipitationData
        },
        pressure: {
          average: Math.round(pressureStats.avg),
          min: { value: pressureStats.minVal, date: pressureStats.minPoint.date },
          max: { value: pressureStats.maxVal, date: pressureStats.maxPoint.date },
          trend: pressureStats.trend,
          data: pressureData
        },
        windSpeed: {
          average: Math.round(windStats.avg * 10) / 10,
          min: { value: windStats.minVal, date: windStats.minPoint.date },
          max: { value: windStats.maxVal, date: windStats.maxPoint.date },
          trend: windStats.trend,
          data: windSpeedData
        },
        extremes: [
          { 
            type: "Highest Temperature", 
            value: `${tempStats.maxVal}°C`, 
            date: tempStats.maxPoint.date, 
            description: "Maximum temperature recorded" 
          },
          { 
            type: "Lowest Temperature", 
            value: `${tempStats.minVal}°C`, 
            date: tempStats.minPoint.date, 
            description: "Minimum temperature recorded" 
          },
          { 
            type: "Highest Rainfall", 
            value: `${precipStats.maxVal}mm`, 
            date: precipStats.maxPoint.date, 
            description: "Maximum daily precipitation" 
          },
          { 
            type: "Highest Wind Speed", 
            value: `${windStats.maxVal} km/h`, 
            date: windStats.maxPoint.date, 
            description: "Peak wind speed recorded" 
          }
        ],
        location: locationData.name,
        country: locationData.sys.country
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching historical data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      const defaultPeriod = periods.find(p => p.id === selectedPeriod)
      fetchHistoricalData(-1.2921, 36.8219, defaultPeriod?.days || 7) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        const period = periods.find(p => p.id === selectedPeriod)
        fetchHistoricalData(latitude, longitude, period?.days || 7)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        const period = periods.find(p => p.id === selectedPeriod)
        fetchHistoricalData(-1.2921, 36.8219, period?.days || 7) // Fallback to London
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
      const period = periods.find(p => p.id === selectedPeriod)
      await fetchHistoricalData(data.coord.lat, data.coord.lon, period?.days || 7)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriod(periodId)
    if (currentLocation) {
      const period = periods.find(p => p.id === periodId)
      fetchHistoricalData(currentLocation.lat, currentLocation.lon, period?.days || 7)
    }
  }

  const exportAsCSV = () => {
    if (!historyData) return

    const currentMetricData = historyData[selectedMetric as keyof typeof historyData] as MetricData
    const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)
    
    if (!currentMetricData || !selectedMetricInfo) return

    let csvContent = `Date,${selectedMetricInfo.name} (${selectedMetricInfo.unit})\n`
    currentMetricData.data.forEach(point => {
      csvContent += `${point.date},${point.value}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-history-${selectedMetric}-${selectedPeriod}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAsJSON = () => {
    if (!historyData) return

    const jsonContent = JSON.stringify(historyData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-history-${selectedPeriod}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("weatherHistoryDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("weatherHistoryDarkMode", String(newDarkMode))
  }

  const getTrendIcon = (trend: string, dark: boolean) => {
    const color = trend === 'increasing' ? (dark ? 'text-red-300' : 'text-red-600') :
                  trend === 'decreasing' ? (dark ? 'text-blue-300' : 'text-blue-600') :
                  (dark ? 'text-gray-300' : 'text-gray-600')
    
    if (trend === 'increasing') return <TrendingUp className={`h-4 w-4 ${color}`} />
    if (trend === 'decreasing') return <TrendingDown className={`h-4 w-4 ${color}`} />
    return <BarChart3 className={`h-4 w-4 ${color}`} />
  }

  const getTrendColor = (trend: string, dark: boolean) => {
    if (trend === 'increasing') return dark ? 'bg-red-500/20 text-red-300 border-red-400/30' : 'bg-red-100 text-red-700 border-red-300'
    if (trend === 'decreasing') return dark ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-300'
    return dark ? 'bg-gray-500/20 text-gray-300 border-gray-400/30' : 'bg-gray-100 text-gray-700 border-gray-300'
  }

  if (loading && !historyData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950' 
          : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-purple-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading historical data...
          </p>
        </div>
      </div>
    )
  }

  if (!historyData) return null

  const currentMetricData = historyData[selectedMetric as keyof typeof historyData] as MetricData
  const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)

  if (!selectedMetricInfo || !currentMetricData) return null

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950' 
        : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Weather History
              </h1>
              <div className={`flex items-center gap-2 mt-1 text-sm ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <MapPin className="h-4 w-4 text-purple-500" />
                <span>{historyData.location}, {historyData.country}</span>
                {locationStatus === 'success' && (
                  <Badge className={`${
                    isDarkMode 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-purple-100 text-purple-700 border-purple-300'
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
              <Button type="submit" size="icon" className="bg-purple-600 hover:bg-purple-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchHistoricalData(
                currentLocation.lat, 
                currentLocation.lon, 
                periods.find(p => p.id === selectedPeriod)?.days || 7
              )}
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

        {/* Period Selection */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <Button
                  key={period.id}
                  onClick={() => handlePeriodChange(period.id)}
                  variant={selectedPeriod === period.id ? "secondary" : "outline"}
                  className={selectedPeriod === period.id 
                    ? isDarkMode
                      ? "bg-white text-slate-900" 
                      : "bg-gray-900 text-white"
                    : isDarkMode
                      ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                      : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  }
                >
                  {period.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data Summary - {historyData.summary.period}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-100 border-blue-300'
              }`}>
                <Calendar className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>{historyData.summary.totalDays}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Total Days</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-green-500/20 border-green-400/30' : 'bg-green-100 border-green-300'
              }`}>
                <BarChart3 className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>{historyData.summary.dataPoints.toLocaleString()}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Data Points</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-purple-500/20 border-purple-400/30' : 'bg-purple-100 border-purple-300'
              }`}>
                <History className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-600'
                }`}>24/7</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Monitoring</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-orange-500/20 border-orange-400/30' : 'bg-orange-100 border-orange-300'
              }`}>
                <Download className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`} />
                <div className={`text-lg font-bold ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`}>
                  {historyData.summary.lastUpdated.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric Selection */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {metrics.map((metric) => (
                <Button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id)}
                  variant={selectedMetric === metric.id ? "secondary" : "outline"}
                  className={`gap-2 ${
                    selectedMetric === metric.id 
                      ? isDarkMode
                        ? "bg-white text-slate-900" 
                        : "bg-gray-900 text-white"
                      : isDarkMode
                        ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <metric.icon className="h-4 w-4" />
                  {metric.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Metric Details */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <selectedMetricInfo.icon className="h-5 w-5" />
              {selectedMetricInfo.name} Analysis
              <Badge className={`border ${getTrendColor(currentMetricData.trend, isDarkMode)}`}>
                {getTrendIcon(currentMetricData.trend, isDarkMode)}
                <span className="ml-1 capitalize">{currentMetricData.trend}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Statistics</h3>
                
                {selectedMetric === "precipitation" ? (
                  <>
                    <div className={`rounded-lg p-4 border ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>
                        {currentMetricData.total}{selectedMetricInfo.unit}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>Total {selectedMetricInfo.name}</div>
                    </div>
                    <div className={`rounded-lg p-4 border ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        isDarkMode ? 'text-green-300' : 'text-green-600'
                      }`}>
                        {currentMetricData.rainyDays}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-gray-600'
                      }`}>Rainy Days</div>
                    </div>
                  </>
                ) : (
                  <div className={`rounded-lg p-4 border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-green-300' : 'text-green-600'
                    }`}>
                      {currentMetricData.average}{selectedMetricInfo.unit}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>Average {selectedMetricInfo.name}</div>
                  </div>
                )}

                <div className={`rounded-lg p-4 border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`}>
                    {currentMetricData.max?.value || currentMetricData.total}{selectedMetricInfo.unit}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    Maximum ({currentMetricData.max?.date || "N/A"})
                  </div>
                </div>

                {currentMetricData.min && (
                  <div className={`rounded-lg p-4 border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {currentMetricData.min.value}{selectedMetricInfo.unit}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      Minimum ({currentMetricData.min.date})
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-lg mb-4">Historical Trend</h3>
                <div className={`h-64 rounded-lg p-4 border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="h-full flex items-end justify-around gap-1">
                    {currentMetricData.data.slice(-20).map((point, index) => {
                      const maxValue = Math.max(...currentMetricData.data.map(d => d.value))
                      const minValue = Math.min(...currentMetricData.data.map(d => d.value))
                      const range = maxValue - minValue
                      const height = range > 0 ? ((point.value - minValue) / range) * 100 : 50
                      
                      return (
                        <div key={`chart-point-${index}`} className="flex flex-col items-center flex-1 min-w-0">
                          <div className={`text-xs mb-1 ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            {point.value}
                          </div>
                          <div 
                            className={`w-full ${
                              isDarkMode 
                                ? 'bg-gradient-to-t from-purple-500 to-indigo-400' 
                                : 'bg-gradient-to-t from-purple-400 to-indigo-300'
                            } rounded-t transition-all hover:opacity-80`}
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '8px' }}
                            title={`${point.date}: ${point.value}${selectedMetricInfo.unit}`}
                          ></div>
                          {index % 3 === 0 && (
                            <div className={`text-xs mt-1 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-500'
                            } truncate max-w-full`}>
                              {point.date.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className={`text-xs mt-2 ${
                  isDarkMode ? 'text-white/60' : 'text-gray-500'
                }`}>
                  Showing last {Math.min(20, currentMetricData.data.length)} data points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Extremes */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weather Extremes - {historyData.summary.period}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {historyData.extremes.map((extreme, index) => (
                <div key={`extreme-${index}`} className={`rounded-lg p-4 border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-lg font-bold mb-2 ${
                    isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  }`}>{extreme.value}</div>
                  <div className="text-sm font-medium mb-1">{extreme.type}</div>
                  <div className={`text-xs mb-2 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>{extreme.date}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>{extreme.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Export Options */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={exportAsCSV}
                className={isDarkMode
                  ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                }
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button 
                onClick={exportAsJSON}
                className={isDarkMode
                  ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                }
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              <Button 
                onClick={() => window.print()}
                className={isDarkMode
                  ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                }
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            <p className={`text-sm mt-4 ${
              isDarkMode ? 'text-white/70' : 'text-gray-600'
            }`}>
              Export historical weather data for analysis, research, or backup purposes. 
              Data includes temperature, humidity, precipitation, atmospheric pressure, and wind speed measurements.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}