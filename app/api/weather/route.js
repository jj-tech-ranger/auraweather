import { NextResponse } from 'next/server'

export async function GET(request) {
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'e77644fbe76ed26110ff8b062f971569';

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const city = searchParams.get('city')

  if (!API_KEY) {
    console.error("Missing API Key!");
    return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
    )
  }

  try {
    let url = 'https://api.openweathermap.org/data/2.5/weather?'

    if (lat && lon) {
      url += `lat=${lat}&lon=${lon}`
    } else if (city) {
      url += `q=${encodeURIComponent(city)}`
    } else {
      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    }

    url += `&appid=${API_KEY}&units=metric`

    const response = await fetch(url)
    const data = await response.json()

    // Pass along the actual OpenWeather error if it fails (e.g., 401 Unauthorized)
    if (!response.ok) {
      console.error(`OpenWeather Error: ${data.message || response.statusText}`);
      return NextResponse.json(
          { error: data.message || `OpenWeather API error: ${response.status}` },
          { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 500 }
    )
  }
}