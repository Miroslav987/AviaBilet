import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TRAVELPAYOUTS_API_TOKEN = 'c28cc529a96b8ccdb1b4e5fedb12453e';

export async function POST(request: NextRequest) {
  const { origin, destination, departureDate, returnDate } = await request.json();

  try {
    const response = await axios.get('https://api.travelpayouts.com/aviasales/v3/prices_for_dates', {
      params: {
        origin,
        destination,
        departure_at: departureDate,
        return_at: returnDate || undefined,
        currency: 'usd',
        token: TRAVELPAYOUTS_API_TOKEN,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching from Travelpayouts:', error?.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch data from Travelpayouts' }, { status: 500 });
  }
}
