"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Settings, 
  Bell, 
  Globe, 
  Thermometer, 
  MapPin,
  Save,
  Moon,
  Sun,
  Smartphone,
  Shield,
  AlertTriangle,
  Cloud,
  Wind,
  Droplets,
  Eye,
  Zap,
  RefreshCw,
  Clock,
  Database,
  Palette
} from "lucide-react"

interface SettingsData {
  notifications: {
    enabled: boolean
    browserNotifications: boolean
    soundAlerts: boolean
    weatherAlerts: boolean
    severityLevel: "all" | "moderate" | "severe"
  }
  units: {
    temperature: "celsius" | "fahrenheit"
    wind: "kmh" | "mph" | "ms"
    pressure: "hpa" | "inhg" | "mb"
    precipitation: "mm" | "in"
    visibility: "km" | "mi"
  }
  location: {
    autoDetect: boolean
    defaultCity: string
    updateInterval: number
  }
  display: {
    darkMode: boolean
    language: string
    timeFormat: "12h" | "24h"
    animatedBackgrounds: boolean
    showDetailedInfo: boolean
    compactView: boolean
  }
  weather: {
    showHourlyForecast: boolean
    forecastDays: number
    showUVIndex: boolean
    showAirQuality: boolean
    showSunriseSunset: boolean
    showWindDirection: boolean
    refreshInterval: number
  }
  advanced: {
    cacheEnabled: boolean
    highAccuracyLocation: boolean
    lowDataMode: boolean
    prefetchData: boolean
  }
}

const defaultSettings: SettingsData = {
  notifications: {
    enabled: true,
    browserNotifications: false,
    soundAlerts: false,
    weatherAlerts: true,
    severityLevel: "moderate"
  },
  units: {
    temperature: "celsius",
    wind: "kmh",
    pressure: "hpa",
    precipitation: "mm",
    visibility: "km"
  },
  location: {
    autoDetect: true,
    defaultCity: "",
    updateInterval: 30
  },
  display: {
    darkMode: false,
    language: "en",
    timeFormat: "24h",
    animatedBackgrounds: true,
    showDetailedInfo: true,
    compactView: false
  },
  weather: {
    showHourlyForecast: true,
    forecastDays: 7,
    showUVIndex: true,
    showAirQuality: true,
    showSunriseSunset: true,
    showWindDirection: true,
    refreshInterval: 10
  },
  advanced: {
    cacheEnabled: true,
    highAccuracyLocation: true,
    lowDataMode: false,
    prefetchData: true
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("weatherAppSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        // Merge with defaults to ensure all fields exist
        setSettings({
          ...defaultSettings,
          ...parsed,
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          units: { ...defaultSettings.units, ...parsed.units },
          location: { ...defaultSettings.location, ...parsed.location },
          display: { ...defaultSettings.display, ...parsed.display },
          weather: { ...defaultSettings.weather, ...parsed.weather },
          advanced: { ...defaultSettings.advanced, ...parsed.advanced }
        })
        setIsDarkMode(parsed.display?.darkMode || false)
      } catch (error) {
        console.error("Error loading settings:", error)
        setSettings(defaultSettings)
      }
    } else {
      // Load only dark mode preference if no full settings exist
      const savedDarkMode = localStorage.getItem("weatherAppDarkMode")
      if (savedDarkMode !== null) {
        const darkMode = savedDarkMode === "true"
        setIsDarkMode(darkMode)
        setSettings(prev => ({
          ...prev,
          display: {
            ...prev.display,
            darkMode
          }
        }))
      }
    }
    setIsLoaded(true)
  }, [])

  const handleSave = () => {
    localStorage.setItem("weatherAppSettings", JSON.stringify(settings))
    localStorage.setItem("weatherAppDarkMode", String(settings.display.darkMode))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    
    // Trigger page reload to apply settings
    window.dispatchEvent(new Event('settingsUpdated'))
  }

  const toggleDarkMode = () => {
    const newDarkMode = !settings.display.darkMode
    setIsDarkMode(newDarkMode)
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        darkMode: newDarkMode
      }
    }))
  }

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings(defaultSettings)
      setIsDarkMode(false)
      localStorage.removeItem("weatherAppSettings")
      localStorage.removeItem("weatherAppDarkMode")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  // Don't render until settings are loaded to prevent undefined values
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-r from-blue-400 to-indigo-500'
            }`}>
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Settings
              </h1>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                Customize your weather experience
              </p>
            </div>
          </div>

          <div className="flex gap-2">
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
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Weather Preferences */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Show Hourly Forecast</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Display detailed hourly weather predictions
                </p>
              </div>
              <Switch
                checked={settings.weather.showHourlyForecast}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  weather: { ...prev.weather, showHourlyForecast: checked }
                }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="forecastDays">Forecast Days: {settings.weather.forecastDays}</Label>
              </div>
              <Slider
                id="forecastDays"
                min={3}
                max={14}
                step={1}
                value={[settings.weather.forecastDays]}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  weather: { ...prev.weather, forecastDays: value[0] }
                }))}
                className="w-full"
              />
              <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                Number of days to show in forecast
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <Label className="text-sm">Show UV Index</Label>
                </div>
                <Switch
                  checked={settings.weather.showUVIndex}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, showUVIndex: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  <Label className="text-sm">Show Air Quality</Label>
                </div>
                <Switch
                  checked={settings.weather.showAirQuality}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, showAirQuality: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <Label className="text-sm">Sunrise/Sunset</Label>
                </div>
                <Switch
                  checked={settings.weather.showSunriseSunset}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, showSunriseSunset: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  <Label className="text-sm">Wind Direction</Label>
                </div>
                <Switch
                  checked={settings.weather.showWindDirection}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    weather: { ...prev.weather, showWindDirection: checked }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="refreshInterval">
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Auto-refresh: {settings.weather.refreshInterval} min
                </Label>
              </div>
              <Slider
                id="refreshInterval"
                min={5}
                max={60}
                step={5}
                value={[settings.weather.refreshInterval]}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  weather: { ...prev.weather, refreshInterval: value[0] }
                }))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Notifications</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Receive weather alerts and updates
                </p>
              </div>
              <Switch
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, enabled: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <div>
                  <Label className="text-base">Browser Notifications</Label>
                  <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                    Push notifications in your browser
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.browserNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, browserNotifications: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <div>
                  <Label className="text-base">Sound Alerts</Label>
                  <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                    Play sound for important alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.soundAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, soundAlerts: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <div>
                  <Label className="text-base">Severe Weather Alerts</Label>
                  <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                    Get notified about dangerous conditions
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.notifications.weatherAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, weatherAlerts: checked }
                }))}
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="severityLevel">Alert Severity Level</Label>
              <Select
                value={settings.notifications.severityLevel}
                onValueChange={(value: "all" | "moderate" | "severe") => 
                  setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, severityLevel: value }
                  }))
                }
              >
                <SelectTrigger 
                  id="severityLevel"
                  className={`${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="moderate">Moderate & Severe</SelectItem>
                  <SelectItem value="severe">Severe Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Unit Settings */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Units of Measurement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Select
                  value={settings.units.temperature}
                  onValueChange={(value: "celsius" | "fahrenheit") => 
                    setSettings(prev => ({
                      ...prev,
                      units: { ...prev.units, temperature: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="temperature"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">Celsius (°C)</SelectItem>
                    <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wind">Wind Speed</Label>
                <Select
                  value={settings.units.wind}
                  onValueChange={(value: "kmh" | "mph" | "ms") => 
                    setSettings(prev => ({
                      ...prev,
                      units: { ...prev.units, wind: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="wind"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kmh">km/h</SelectItem>
                    <SelectItem value="mph">mph</SelectItem>
                    <SelectItem value="ms">m/s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pressure">Pressure</Label>
                <Select
                  value={settings.units.pressure}
                  onValueChange={(value: "hpa" | "inhg" | "mb") => 
                    setSettings(prev => ({
                      ...prev,
                      units: { ...prev.units, pressure: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="pressure"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hpa">hPa</SelectItem>
                    <SelectItem value="mb">mb</SelectItem>
                    <SelectItem value="inhg">inHg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precipitation">Precipitation</Label>
                <Select
                  value={settings.units.precipitation}
                  onValueChange={(value: "mm" | "in") => 
                    setSettings(prev => ({
                      ...prev,
                      units: { ...prev.units, precipitation: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="precipitation"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={settings.units.visibility}
                  onValueChange={(value: "km" | "mi") => 
                    setSettings(prev => ({
                      ...prev,
                      units: { ...prev.units, visibility: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="visibility"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers (km)</SelectItem>
                    <SelectItem value="mi">Miles (mi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-detect Location</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Automatically use your current GPS location
                </p>
              </div>
              <Switch
                checked={settings.location.autoDetect}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  location: { ...prev.location, autoDetect: checked }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultCity">Default City</Label>
              <Input
                id="defaultCity"
                type="text"
                value={settings.location.defaultCity || ""}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  location: { ...prev.location, defaultCity: e.target.value }
                }))}
                placeholder="Enter city name (e.g., London, New York)"
                disabled={settings.location.autoDetect}
                className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                } ${settings.location.autoDetect ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                Used when location detection is disabled
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="updateInterval">
                  Location Update: {settings.location.updateInterval} min
                </Label>
              </div>
              <Slider
                id="updateInterval"
                min={10}
                max={120}
                step={10}
                value={[settings.location.updateInterval]}
                onValueChange={(value) => setSettings(prev => ({
                  ...prev,
                  location: { ...prev.location, updateInterval: value[0] }
                }))}
                className="w-full"
              />
              <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                How often to check for location changes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Display & Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Use dark theme throughout the app
                </p>
              </div>
              <Switch
                checked={settings.display.darkMode}
                onCheckedChange={(checked) => {
                  setIsDarkMode(checked)
                  setSettings(prev => ({
                    ...prev,
                    display: { ...prev.display, darkMode: checked }
                  }))
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Animated Backgrounds</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Show animated weather effects
                </p>
              </div>
              <Switch
                checked={settings.display.animatedBackgrounds}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, animatedBackgrounds: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Show Detailed Info</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Display extended weather information
                </p>
              </div>
              <Switch
                checked={settings.display.showDetailedInfo}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, showDetailedInfo: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Compact View</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Show condensed weather cards
                </p>
              </div>
              <Switch
                checked={settings.display.compactView}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  display: { ...prev.display, compactView: checked }
                }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.display.language}
                  onValueChange={(value) => 
                    setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, language: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="language"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select
                  value={settings.display.timeFormat}
                  onValueChange={(value: "12h" | "24h") => 
                    setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, timeFormat: value }
                    }))
                  }
                >
                  <SelectTrigger 
                    id="timeFormat"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Data Cache</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Store weather data locally for faster loading
                </p>
              </div>
              <Switch
                checked={settings.advanced.cacheEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  advanced: { ...prev.advanced, cacheEnabled: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">High Accuracy Location</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Use GPS for precise location (uses more battery)
                </p>
              </div>
              <Switch
                checked={settings.advanced.highAccuracyLocation}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  advanced: { ...prev.advanced, highAccuracyLocation: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Low Data Mode</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Reduce data usage by limiting updates
                </p>
              </div>
              <Switch
                checked={settings.advanced.lowDataMode}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  advanced: { ...prev.advanced, lowDataMode: checked }
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Prefetch Data</Label>
                <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                  Load forecast data in advance
                </p>
              </div>
              <Switch
                checked={settings.advanced.prefetchData}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  advanced: { ...prev.advanced, prefetchData: checked }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button 
            onClick={resetToDefaults}
            variant="outline"
            className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
            }`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {saved ? "Settings Saved!" : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}