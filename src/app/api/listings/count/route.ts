import { NextRequest, NextResponse } from 'next/server';
import { expandArticleTypesForFilter } from '@/lib/constants';
import { countListings } from '@/lib/supabase/listings';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const genres = sp.getAll('genre').filter((g) => g === 'femme' || g === 'homme') as ('femme' | 'homme')[];
  const categories = sp.getAll('categories');
  const rawArticleTypes = sp.getAll('articleTypes');
  const articleTypeValues = [
    ...new Set(rawArticleTypes.map((t) => (t.includes('::') ? t.split('::')[0] : t)).filter(Boolean)),
  ];
  const articleTypesExpanded = articleTypeValues.length
    ? expandArticleTypesForFilter(articleTypeValues)
    : undefined;
  const brands = sp.getAll('brands').map((b) => decodeURIComponent(b));

  try {
    const count = await countListings({
      genres: genres.length ? genres : undefined,
      categories: categories.length ? categories : undefined,
      articleTypes: articleTypesExpanded,
      brands: brands.length ? brands : undefined,
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
