import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' }, 
      { status: 500 }
    )
  }

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Coordinates required' }, { status: 400 })
  }

  try {
    // ✅ CORRECT: Use UV index API endpoint
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('UV index API error:', response.status, errorText)
      throw new Error('UV index API failed')
    }
    
    const data = await response.json()
    console.log('✅ UV Index API response:', data)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('UV index fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch UV index' }, { status: 500 })
  }
}