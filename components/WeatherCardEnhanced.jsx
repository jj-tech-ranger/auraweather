"use client"

const WeatherCard = ({ weather, forecast, loading }) => {
  const getWeatherIcon = (condition) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) {
      return { emoji: "☀️", color: "text-yellow-400", bg: "bg-yellow-500/20" }
    } else if (lowerCondition.includes("cloud")) {
      return { emoji: "☁️", color: "text-gray-300", bg: "bg-gray-500/20" }
    } else if (lowerCondition.includes("rain")) {
      return { emoji: "🌧️", color: "text-blue-400", bg: "bg-blue-500/20" }
    } else if (lowerCondition.includes("drizzle")) {
      return { emoji: "🌦️", color: "text-blue-300", bg: "bg-blue-400/20" }
    } else if (lowerCondition.includes("snow")) {
      return { emoji: "❄️", color: "text-blue-200", bg: "bg-blue-300/20" }
    } else if (lowerCondition.includes("storm") || lowerCondition.includes("thunder")) {
      return { emoji: "⛈️", color: "text-purple-400", bg: "bg-purple-500/20" }
    } else if (lowerCondition.includes("mist") || lowerCondition.includes("fog")) {
      return { emoji: "🌫️", color: "text-gray-400", bg: "bg-gray-400/20" }
    }
    return { emoji: "🌤️", color: "text-blue-300", bg: "bg-blue-400/20" }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 animate-pulse">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-white/20 rounded"></div>
                  <div className="h-4 w-32 bg-white/20 rounded"></div>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="h-20 w-32 bg-white/20 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-white/20 rounded"></div>
                  <div className="h-6 w-16 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-24 h-20 bg-white/10 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!weather) return null

  const weatherIcon = getWeatherIcon(weather.description || weather.condition)
  
  return (
    <div className="w-full space-y-6">
      {/* Current Weather Hero Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left side - Main weather info */}
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center justify-center lg:justify-start gap-6 mb-6">
              <div className={`p-4 rounded-3xl ${weatherIcon.bg} ${weatherIcon.color} shadow-lg`}>
                <span className="text-5xl">{weatherIcon.emoji}</span>
              </div>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {weather.city}, {weather.country}
                </h2>
                <p className="text-lg text-white/80 capitalize">{weather.description}</p>
              </div>
            </div>
            
            <div className="flex items-end justify-center lg:justify-start gap-4">
              <span className="text-7xl lg:text-8xl font-bold text-white leading-none">
                {weather.temperature}°
              </span>
              <div className="text-left pb-2">
                <p className="text-white/70 text-sm">Feels like</p>
                <p className="text-2xl font-semibold text-white">{weather.feelsLike || weather.temperature}°C</p>
              </div>
            </div>
          </div>

          {/* Right side - Weather metrics */}
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-2xl mb-2">💧</div>
              <p className="text-white/70 text-sm mb-1">Humidity</p>
              <p className="text-white text-xl font-bold">{weather.humidity}%</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-2xl mb-2">💨</div>
              <p className="text-white/70 text-sm mb-1">Wind</p>
              <p className="text-white text-xl font-bold">{weather.windSpeed} m/s</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-2xl mb-2">🌡️</div>
              <p className="text-white/70 text-sm mb-1">Pressure</p>
              <p className="text-white text-xl font-bold">{weather.pressure} hPa</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-2xl mb-2">👁️</div>
              <p className="text-white/70 text-sm mb-1">Condition</p>
              <p className="text-white text-lg font-bold capitalize">{weather.condition}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">5-Day Forecast</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.slice(0, 5).map((day, index) => {
              const dayIcon = getWeatherIcon(day.description || day.condition)
              return (
                <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/10 hover:bg-white/10 transition-all duration-200">
                  <p className="text-white/70 text-sm mb-3 font-medium">
                    {index === 0 ? "Today" : formatDate(day.date)}
                  </p>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${dayIcon.bg} ${dayIcon.color} mb-3`}>
                    <span className="text-2xl">{dayIcon.emoji}</span>
                  </div>
                  <p className="text-white font-bold text-lg mb-1">{day.temperature}°C</p>
                  <p className="text-white/60 text-xs capitalize leading-tight">{day.description}</p>
                  <div className="mt-2 text-xs text-white/50">
                    💧 {day.humidity}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Weather Tips */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Weather Insight</h4>
            <p className="text-white/80 text-sm">
              {weather.condition === "Clear" && "Perfect weather for outdoor activities! Don't forget sunscreen."}
              {weather.condition === "Clouds" && "Partly cloudy conditions - great for a walk or outdoor exercise."}
              {weather.condition === "Rain" && "Rainy weather ahead - perfect for indoor activities or bring an umbrella."}
              {weather.condition === "Snow" && "Snowy conditions - dress warmly and drive carefully."}
              {weather.condition === "Thunderstorm" && "Stormy weather - stay indoors and stay safe."}
              {!["Clear", "Clouds", "Rain", "Snow", "Thunderstorm"].includes(weather.condition) && 
                "Check the current conditions before heading out."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherCard