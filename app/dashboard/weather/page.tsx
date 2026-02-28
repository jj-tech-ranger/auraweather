"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Search, Mic, Sun, Moon, Thermometer, Eye, Wind, Droplets } from "lucide-react"

interface WeatherData {
  city: string
  country: string
  temperature: number
  feelsLike: number
  description: string
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  icon: string
  coord: {
    lat: number
    lon: number
  }
}

interface ForecastData {
  date: string
  day: string
  temperature: number
  icon: string
  description: string
}

export default function WeatherDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchCity, setSearchCity] = useState("")
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [lastCity, setLastCity] = useState("")

  // API Configuration
  const API_KEY = "ca695dcbc66c5fa3d0cb955033fd918f"

  // Utility Functions
  const kelvinToCelsius = (kelvin: number) => (kelvin - 273.15)
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5 + 32)
  const metersPerSecondToKmh = (ms: number) => (ms * 3.6)

  const getTemperature = (kelvin: number) => {
    const celsius = kelvinToCelsius(kelvin)
    return isCelsius ? celsius : celsiusToFahrenheit(celsius)
  }

  const getWeatherMessage = (temp: number) => {
    if (temp >= 15 && temp <= 25) {
      return { message: "Perfect weather for a walk! 🌳", type: "cool" }
    } else if (temp > 30) {
      return { message: "Stay hydrated, it's hot out there! ☀️", type: "hot" }
    } else {
      return { message: "Grab a jacket, it's chilly! 🧥", type: "cool" }
    }
  }

  const getWeatherBackground = (description: string, temperature: number) => {
    if (description.includes("rain") || description.includes("shower")) {
      return "bg-rainy"
    } else if (temperature < 15) {
      return "bg-cold"
    } else if (temperature > 30) {
      return "bg-hot"
    } else if (description.includes("clear")) {
      return "bg-sunny"
    } else if (description.includes("cloud")) {
      return "bg-cloudy"
    } else if (description.includes("snow")) {
      return "bg-snowy"
    }
    return "bg-sunny"
  }

  // Fetch Weather Data by City Name
  const fetchWeatherByCity = async (cityName: string) => {
    setLoading(true)
    setError("")
    
    try {
      console.log(`Searching for weather in: ${cityName}`)
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
      )
      
      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${cityName}" not found. Please check the spelling and try again.`)
        } else if (response.status === 401) {
          throw new Error("API key error. Please check your configuration.")
        } else {
          throw new Error(`Weather service error (${response.status}). Please try again later.`)
        }
      }
      
      const data = await response.json()
      console.log('Weather data received:', data)
      
      setLastCity(cityName)
      
      const processedWeather: WeatherData = {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(metersPerSecondToKmh(data.wind.speed)),
        pressure: data.main.pressure,
        icon: data.weather[0].icon,
        coord: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      }
      
      setWeather(processedWeather)
      await fetchForecast(data.coord.lat, data.coord.lon)
      
    } catch (err: any) {
      console.error('Weather fetch error:', err)
      setError(err.message || 'An error occurred while fetching weather data')
      setWeather(null)
      setForecast([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch Weather Data by Coordinates
  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      if (!response.ok) {
        throw new Error("Unable to fetch weather data for your location.")
      }
      
      const data = await response.json()
      setLastCity(`${data.name}`)
      
      const processedWeather: WeatherData = {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(metersPerSecondToKmh(data.wind.speed)),
        pressure: data.main.pressure,
        icon: data.weather[0].icon,
        coord: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      }
      
      setWeather(processedWeather)
      await fetchForecast(lat, lon)
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching weather data')
      setWeather(null)
      setForecast([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch Forecast Data
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      if (!response.ok) {
        console.error('Forecast fetch failed')
        return
      }
      
      const data = await response.json()
      
      // Get daily forecast (12:00 PM data for each day)
      const dailyData = data.list.filter((item: any) => 
        item.dt_txt.includes("12:00:00")
      ).slice(0, 5)
      
      const processedForecast: ForecastData[] = dailyData.map((day: any) => ({
        date: new Date(day.dt * 1000).toLocaleDateString(),
        day: new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }),
        temperature: Math.round(day.main.temp),
        icon: day.weather[0].icon,
        description: day.weather[0].description
      }))
      
      setForecast(processedForecast)
    } catch (error) {
      console.error("Forecast fetch error:", error)
    }
  }

  // Handle Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const cityName = searchCity.trim()
    
    if (!cityName) {
      setError("Please enter a city name.")
      return
    }
    
    console.log(`Handling search for: ${cityName}`)
    fetchWeatherByCity(cityName)
  }

  // Get User Location
  const getCurrentLocation = () => {
    setError("")
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      return
    }
    
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        fetchWeatherByCoords(latitude, longitude)
      },
      (error) => {
        setLoading(false)
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied. Please enable location services and try again.")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.")
            break
          case error.TIMEOUT:
            setError("Location request timed out.")
            break
          default:
            setError("An unknown error occurred while retrieving location.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // Voice Search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Voice recognition is not supported by this browser.")
      return
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    
    recognition.onstart = () => {
      setError("")
      console.log('Voice recognition started')
    }
    
    recognition.onresult = (event: any) => {
      const city = event.results[0][0].transcript
      console.log('Voice recognition result:', city)
      setSearchCity(city)
      fetchWeatherByCity(city)
    }
    
    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error)
      setError(`Voice recognition failed: ${event.error}`)
    }
    
    recognition.onend = () => {
      console.log('Voice recognition ended')
    }
    
    recognition.start()
  }

  // Toggle Temperature Unit
  const toggleUnit = () => {
    setIsCelsius(!isCelsius)
  }

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Set current date on load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString())
  }, [isDarkMode])

  const currentDate = new Date().toLocaleString("en-US", {
    weekday: "long",
    month: "long", 
    day: "numeric"
  })

  const backgroundClass = weather ? getWeatherBackground(weather.description.toLowerCase(), weather.temperature) : "bg-sunny"
  const weatherMessage = weather ? getWeatherMessage(weather.temperature) : null

  return (
    <div className={`min-h-screen transition-all duration-500 ${backgroundClass} ${isDarkMode ? 'dark' : ''}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-white/5 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Weather Center</h1>
            <div className="flex gap-2">
              <Button
                onClick={toggleUnit}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                °{isCelsius ? 'C' : 'F'}
              </Button>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="icon"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-white/90 text-lg">{currentDate}</p>
          {weather && (
            <p className="text-white/80 mt-2">
              {weather.city}, {weather.country} • {weather.description}
            </p>
          )}
        </div>

        {/* Weather Message */}
        {weatherMessage && (
          <Card className={`mb-6 glass ${weatherMessage.type === 'hot' ? 'border-orange-400 bg-orange-50/80' : 'border-blue-400 bg-blue-50/80'}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-lg font-medium ${weatherMessage.type === 'hot' ? 'text-orange-800' : 'text-blue-800'}`}>
                {weatherMessage.message}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <Card className="glass mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Search className="h-5 w-5" />
                  Search Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="Enter city name (e.g. London, Tokyo, New York)..."
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button 
                      type="button" 
                      onClick={handleVoiceSearch} 
                      size="icon" 
                      variant="outline"
                      disabled={loading}
                      title="Voice Search"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Searching..." : "Get Weather"}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={getCurrentLocation} 
                      variant="outline" 
                      size="icon"
                      disabled={loading}
                      title="Use Current Location"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </form>

                {/* Quick City Suggestions */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Popular cities:</p>
                  <div className="flex flex-wrap gap-2">
                    {['London', 'New York', 'Tokyo', 'Paris', 'Sydney'].map((city) => (
                      <Button
                        key={city}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchCity(city)
                          fetchWeatherByCity(city)
                        }}
                        disabled={loading}
                        className="text-xs"
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Weather Display */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="glass border-red-400 mb-6">
                <CardContent className="p-6 text-center">
                  <div className="text-red-500 text-4xl mb-2">⚠️</div>
                  <p className="text-red-600 font-medium text-lg mb-2">Oops! Something went wrong</p>
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={() => setError("")} 
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="glass mb-6">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading weather data...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                </CardContent>
              </Card>
            )}

            {weather && !loading && (
              <Card className="glass mb-6">
                <CardContent className="p-6">
                  {/* Current Weather */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                        alt={weather.description}
                        className="w-20 h-20"
                      />
                      <div>
                        <div className="text-5xl font-bold text-gray-800">
                          {isCelsius ? weather.temperature : Math.round(celsiusToFahrenheit(weather.temperature))}°{isCelsius ? 'C' : 'F'}
                        </div>
                        <div className="text-gray-600">
                          Feels like {isCelsius ? weather.feelsLike : Math.round(celsiusToFahrenheit(weather.feelsLike))}°{isCelsius ? 'C' : 'F'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xl text-gray-700 capitalize">{weather.description}</p>
                    <p className="text-gray-600">{weather.city}, {weather.country}</p>
                  </div>

                  {/* Weather Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Droplets className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-800">{weather.humidity}%</div>
                      <div className="text-blue-600 text-sm">Humidity</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Wind className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-800">{weather.windSpeed} km/h</div>
                      <div className="text-green-600 text-sm">Wind Speed</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-800">{weather.pressure} hPa</div>
                      <div className="text-purple-600 text-sm">Pressure</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <Thermometer className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-800">{weather.condition}</div>
                      <div className="text-orange-600 text-sm">Condition</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 5-Day Forecast */}
            {forecast.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-gray-800">5-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {forecast.map((day, index) => (
                      <div key={index} className="text-center p-3 bg-white/50 rounded-lg">
                        <div className="font-medium text-gray-700 mb-2">{day.day}</div>
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                          alt={day.description}
                          className="w-10 h-10 mx-auto mb-2"
                        />
                        <div className="text-lg font-bold text-gray-800">
                          {isCelsius ? day.temperature : Math.round(celsiusToFahrenheit(day.temperature))}°{isCelsius ? 'C' : 'F'}
                        </div>
                        <div className="text-xs text-gray-600 capitalize">{day.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!weather && !loading && !error && (
              <Card className="glass">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">🌤️</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Weather Center</h3>
                  <p className="text-gray-600 mb-4">Search for a city or use your current location to get started!</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={getCurrentLocation} variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Use My Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}