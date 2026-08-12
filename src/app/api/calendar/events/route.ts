import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;

  if (!token && refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId || '',
          client_secret: clientSecret || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        token = tokenData.access_token;
      }
    } catch(e) {
      console.error("Failed to refresh token", e);
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'No autorizado. Faltan permisos de Google Calendar.' }, { status: 401 });
  }

  try {
    // Buscar eventos desde hoy hasta 3 meses en el futuro
    const timeMin = new Date().toISOString();
    const timeMaxDate = new Date();
    timeMaxDate.setMonth(timeMaxDate.getMonth() + 3);
    const timeMax = timeMaxDate.toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al obtener eventos de Google Calendar');
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data.items || []);
    
    // Si obtuvimos un nuevo token, lo actualizamos en la cookie
    if (token !== cookieStore.get('google_access_token')?.value) {
       nextResponse.cookies.set('google_access_token', token, {
           path: '/',
           maxAge: 3600,
           httpOnly: true,
           secure: process.env.NODE_ENV === 'production',
           sameSite: 'lax'
       });
    }
    
    return nextResponse;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
