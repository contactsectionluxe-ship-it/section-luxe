import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://api-adresse.data.gouv.fr/search/';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  const limit = request.nextUrl.searchParams.get('limit') || '15';
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ features: [] });
  }
  try {
    const res = await fetch(
      `${API_URL}?q=${encodeURIComponent(q.trim())}&limit=${encodeURIComponent(limit)}`,
      { next: { revalidate: 0 } }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('search-address proxy error:', err);
    return NextResponse.json({ features: [] }, { status: 500 });
  }
}
