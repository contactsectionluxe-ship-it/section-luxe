import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateDocumentFile } from '@/lib/file-validation';

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
    const vRecto = validateDocumentFile(fileRecto);
    if (!vRecto.ok) return NextResponse.json({ error: `Recto (CNI) : ${vRecto.error}` }, { status: 400 });
    if (fileVerso?.size) {
      const vVerso = validateDocumentFile(fileVerso);
      if (!vVerso.ok) return NextResponse.json({ error: `Verso (CNI) : ${vVerso.error}` }, { status: 400 });
    }
    const vKbis = validateDocumentFile(fileKbis);
    if (!vKbis.ok) return NextResponse.json({ error: `KBIS : ${vKbis.error}` }, { status: 400 });

    const tempId = `temp_${Date.now()}`;
    const bucket = 'documents';

    const ext = (f: File) => f.name.split('.').pop() || 'bin';

    const [rectoPath, versoPath, kbisPath] = [
      `sellers/${tempId}/idCardFront.${ext(fileRecto)}`,
      fileVerso?.size ? `sellers/${tempId}/idCardBack.${ext(fileVerso)}` : null,
      `sellers/${tempId}/kbis.${ext(fileKbis)}`,
    ];

    const rectoBuf = Buffer.from(await fileRecto.arrayBuffer());
    const { error: errRecto } = await server.storage
      .from(bucket)
      .upload(rectoPath, rectoBuf, { upsert: true, contentType: fileRecto.type || 'image/png' });
    if (errRecto) {
      console.error('Upload recto:', errRecto);
      const msg =
        (errRecto as { message?: string })?.message ??
        (errRecto as { error?: string })?.error ??
        (typeof errRecto === 'object' ? JSON.stringify(errRecto) : String(errRecto));
      return NextResponse.json(
        { error: `Upload recto échoué : ${msg}` },
        { status: 500 }
      );
    }

    if (fileVerso?.size) {
      const versoBuf = Buffer.from(await fileVerso.arrayBuffer());
      const { error: errVerso } = await server.storage
        .from(bucket)
        .upload(versoPath!, versoBuf, { upsert: true, contentType: fileVerso.type || 'image/png' });
      if (errVerso) {
        console.error('Upload verso:', errVerso);
        return NextResponse.json({ error: 'Upload verso échoué' }, { status: 500 });
      }
    }

    const kbisBuf = Buffer.from(await fileKbis.arrayBuffer());
    const { error: errKbis } = await server.storage
      .from(bucket)
      .upload(kbisPath, kbisBuf, { upsert: true, contentType: fileKbis.type || 'application/pdf' });
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
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur upload : ${msg}` },
      { status: 500 }
    );
  }
}
