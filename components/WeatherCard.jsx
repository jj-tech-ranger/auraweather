"use client"

const WeatherCard = ({ weather, forecast, loading }) => {
  const getWeatherIcon = (condition) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) {
      return "☀️"
    } else if (lowerCondition.includes("cloud")) {
      return "☁️"
    } else if (lowerCondition.includes("rain")) {
      return "🌧️"
    } else if (lowerCondition.includes("drizzle")) {
      return "🌦️"
    } else if (lowerCondition.includes("snow")) {
      return "❄️"
    } else if (lowerCondition.includes("storm") || lowerCondition.includes("thunder")) {
      return "⛈️"
    } else if (lowerCondition.includes("mist") || lowerCondition.includes("fog")) {
      return "🌫️"
    }
    return "🌤️"
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-8 bg-white/20 rounded mb-4"></div>
          <div className="h-4 bg-white/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Main Weather Card */}
      <div className="glass rounded-2xl p-8 mb-6 text-center">
        <div className="flex flex-col items-center">
          {/* Weather Icon */}
          <div className="text-6xl mb-4">{getWeatherIcon(weather.weather[0].description)}</div>

          {/* City Name */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {weather.name}, {weather.sys.country}
          </h2>

          {/* Temperature */}
          <div className="text-5xl md:text-6xl font-bold text-white mb-4">{Math.round(weather.main.temp)}°C</div>

          {/* Description */}
          <p className="text-xl text-white/80 capitalize mb-6">{weather.weather[0].description}</p>

          {/* Weather Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-md">
            <div className="text-center">
              <p className="text-white/60 text-sm">Feels like</p>
              <p className="text-white font-semibold">{Math.round(weather.main.feels_like)}°C</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm">Humidity</p>
              <p className="text-white font-semibold">{weather.main.humidity}%</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm">Wind</p>
              <p className="text-white font-semibold">{Math.round(weather.wind.speed)} m/s</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-sm">Pressure</p>
              <p className="text-white font-semibold">{weather.main.pressure} hPa</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">5-Day Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.map((day, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                <p className="text-white/60 text-sm mb-2">{index === 0 ? "Today" : formatDate(day.dt)}</p>
                <div className="text-3xl mb-2">{getWeatherIcon(day.weather[0].description)}</div>
                <p className="text-white font-semibold text-lg">{Math.round(day.main.temp)}°C</p>
                <p className="text-white/60 text-xs capitalize mt-1">{day.weather[0].description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WeatherCard
