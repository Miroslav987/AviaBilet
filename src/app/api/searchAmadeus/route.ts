// src/app/api/searchAmadeus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const CLIENT_ID = 'XkXOnx5wbdO93YiPxUDWxfBKNkj5zNdP';
const CLIENT_SECRET = 'NHKspglsAA2eaRBG';
const AMADEUS_API_URL = 'https://test.api.amadeus.com';

export async function POST(request: NextRequest) {
  try {
    const { from, to, date, returnDate, adults, travelClass = 'ECONOMY' } = await request.json();

    // Получение токена
    const tokenResponse = await axios.post(
      `${AMADEUS_API_URL}/v1/security/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Параметры поиска
    const params = {
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: date,
      adults,
      travelClass,
      currencyCode: 'USD',
      max: 10,
      ...(returnDate ? { returnDate } : {}),
    };

    const flightResponse = await axios.get(`${AMADEUS_API_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });

    return NextResponse.json(flightResponse.data);
  } catch (error: any) {
    console.error('Amadeus error:', error?.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch data from Amadeus' }, { status: 500 });
  }
}
