"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Cloud,
  Activity,
  Play,
  MapPin,
  Thermometer,
  Users,
  BarChart3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [backgroundParticles, setBackgroundParticles] = useState([])
  const [stats, setStats] = useState({
    users: 0,
    queries: 0,
    uptime: 0,
    cities: 0
  })

  useEffect(() => {
    setIsMounted(true)

    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4
    }))

    setBackgroundParticles(particles)
    setIsLoaded(true)

    const animateStats = () => {
      const duration = 2000
      const startTime = Date.now()
      const targetStats = { users: 10000, queries: 50000, uptime: 99.9, cities: 150 }

      const updateStats = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        setStats({
          users: Math.floor(targetStats.users * progress),
          queries: Math.floor(targetStats.queries * progress),
          uptime: Number((targetStats.uptime * progress).toFixed(1)),
          cities: Math.floor(targetStats.cities * progress)
        })

        if (progress < 1) {
          requestAnimationFrame(updateStats)
        }
      }

      requestAnimationFrame(updateStats)
    }

    setTimeout(animateStats, 1000)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMounted])

  if (!isMounted) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {backgroundParticles.map((particle) => (
              <div
                  key={`bg-element-${particle.id}`}
                  className="absolute w-2 h-2 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full animate-float blur-sm"
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    animationDelay: `${particle.animationDelay}s`,
                    animationDuration: `${particle.animationDuration}s`
                  }}
              />
          ))}
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <nav className={`relative z-10 p-6 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Cloud className="h-8 w-8 text-white animate-bounce" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-bold text-white">AuraWeather</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 animate-pulse">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
                Live
              </Badge>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 relative z-10 flex-1 flex flex-col justify-center">
          <div className="text-center py-10 md:py-20">
            <h1
                className={`text-5xl md:text-7xl font-bold text-white mb-6 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{
                  transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
                }}
            >
              AuraWeather
            </h1>

            <p className={`text-xl text-white/80 mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              A fast, modern, and simple weather dashboard. Get real-time atmospheric data, forecasts, and environmental conditions instantly.
            </p>

            <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-16 transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {[
                { label: "Active Users", value: `${stats.users.toLocaleString()}+`, icon: Users },
                { label: "Queries", value: `${stats.queries.toLocaleString()}+`, icon: BarChart3 },
                { label: "Uptime", value: `${stats.uptime}%`, icon: Activity },
                { label: "Cities", value: `${stats.cities}+`, icon: MapPin }
              ].map((stat, index) => (
                  <div
                      key={`stat-${index}`}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  >
                    <stat.icon className="h-6 w-6 text-white/60 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
              ))}
            </div>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-1100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-lg px-8 py-4 bg-white text-blue-900 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl rounded-lg font-semibold group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                  href="/dashboard/weather"
                  className="inline-flex items-center justify-center text-lg px-8 py-4 text-white border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 rounded-lg font-semibold"
              >
                <Thermometer className="mr-2 h-5 w-5" />
                Try Weather Feature
                <Cloud className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <footer className="relative z-10 text-center text-white/40 pb-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="border-t border-white/10 pt-8">
              <p>&copy; 2026 AuraWeather. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
  )
}