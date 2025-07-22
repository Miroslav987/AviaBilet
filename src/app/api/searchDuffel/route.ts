import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const DUFFEL_API_KEY = 'duffel_test_4jGVpZ-z7JvDsZJ6T1GJaK9znGCmeMzg5x2uqv_HupS'

export async function POST(request: NextRequest) {
  console.log('🔥 API route reached')

  try {
    const body = await request.json()
    console.log('📦 Request body:', body)

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      cabinClass = 'ECONOMY',
    } = body

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'origin, destination и departureDate обязательны' },
        { status: 400 }
      )
    }

    const slices = [
      {
        origin,
        destination,
        departure_date: departureDate,
      },
    ]

    if (returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate,
      })
    }

    const payload = {
      data: {
        slices,
        passengers: Array.from({ length: adults }, () => ({ type: 'adult' })),
        cabin_class: cabinClass.toUpperCase(),
      }
    }

    console.log('📨 Payload being sent to Duffel:', JSON.stringify(payload, null, 2))

    const response = await axios.post(
      'https://api.duffel.com/air/offer_requests',
      payload,
      {
        headers: {
          Authorization: `Bearer ${DUFFEL_API_KEY}`,
          'Duffel-Version': 'v2',
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('✅ Duffel API response:', response.data)
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('💥 Duffel API error FULL:', error)
    console.error('💥 Duffel API response:', error?.response?.data)
    return NextResponse.json(
      { error: 'Failed to fetch data from Duffel' },
      { status: 500 }
    )
  }
}
