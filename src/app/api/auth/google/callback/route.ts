import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Falta el código de autorización de Google' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback` : 'http://localhost:3000/api/auth/google/callback';

  try {
    // Intercambiar código por access token y refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || 'Error obteniendo tokens de Google');
    }

    /*
     * AQUI SE GUARDARIA EL tokenData.access_token y tokenData.refresh_token EN LA BASE DE DATOS
     * (Supabase - tabla user_tokens)
     * Por ahora redigimos de vuelta a las sesiones con éxito.
     */
    const finalRedirect = new URL('/sessions?googleSync=success', url.origin);
    const response = NextResponse.redirect(finalRedirect.toString());
    
    // Set cookies for 30 days to persist Google connection
    const thirtyDays = 30 * 24 * 60 * 60;
    
    response.cookies.set('google_access_token', tokenData.access_token, {
        path: '/',
        maxAge: tokenData.expires_in || 3600, // Access token max age
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    if (tokenData.refresh_token) {
        response.cookies.set('google_refresh_token', tokenData.refresh_token, {
            path: '/',
            maxAge: thirtyDays,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }
    
    return response;
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
