import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json(
        { error: 'Supabase service role non configuré (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const fileRecto = formData.get('fileRecto') as File | null;
    const fileVerso = formData.get('fileVerso') as File | null;
    const fileKbis = formData.get('fileKbis') as File | null;

    if (!fileRecto?.size || !fileKbis?.size) {
      return NextResponse.json(
        { error: 'Fichiers recto (CNI) et KBIS requis' },
        { status: 400 }
      );
    }

    const tempId = `temp_${Date.now()}`;
    const bucket = 'documents';

    const ext = (f: File) => f.name.split('.').pop() || 'bin';

    const [rectoPath, versoPath, kbisPath] = [
      `sellers/${tempId}/idCardFront.${ext(fileRecto)}`,
      fileVerso?.size ? `sellers/${tempId}/idCardBack.${ext(fileVerso)}` : null,
      `sellers/${tempId}/kbis.${ext(fileKbis)}`,
    ];

    const { error: errRecto } = await server.storage
      .from(bucket)
      .upload(rectoPath, await fileRecto.arrayBuffer(), { upsert: true });
    if (errRecto) {
      console.error('Upload recto:', errRecto);
      return NextResponse.json({ error: 'Upload recto échoué' }, { status: 500 });
    }

    if (fileVerso?.size) {
      const { error: errVerso } = await server.storage
        .from(bucket)
        .upload(versoPath!, await fileVerso.arrayBuffer(), { upsert: true });
      if (errVerso) {
        console.error('Upload verso:', errVerso);
        return NextResponse.json({ error: 'Upload verso échoué' }, { status: 500 });
      }
    }

    const { error: errKbis } = await server.storage
      .from(bucket)
      .upload(kbisPath, await fileKbis.arrayBuffer(), { upsert: true });
    if (errKbis) {
      console.error('Upload kbis:', errKbis);
      return NextResponse.json({ error: 'Upload KBIS échoué' }, { status: 500 });
    }

    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}`;
    const idCardFrontUrl = `${baseUrl}/${rectoPath}`;
    const idCardBackUrl = versoPath ? `${baseUrl}/${versoPath}` : null;
    const kbisUrl = `${baseUrl}/${kbisPath}`;

    return NextResponse.json({
      idCardFrontUrl,
      idCardBackUrl,
      kbisUrl,
    });
  } catch (err) {
    console.error('Upload seller documents:', err);
    return NextResponse.json(
      { error: 'Erreur lors de l’upload des documents' },
      { status: 500 }
    );
  }
}
