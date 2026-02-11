import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const TO_EMAIL = 'contact.sectionluxe@gmail.com';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const companyName = (formData.get('companyName') as string) || '';
    const siret = (formData.get('siret') as string) || '';
    const address = (formData.get('address') as string) || '';
    const email = (formData.get('email') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const description = (formData.get('description') as string) || '';

    const subject = `Demande "Devenir Vendeur" : ${companyName}`;

    const body = [
      'Nouvelle demande Devenir Vendeur',
      '--------------------------------',
      '',
      `Nom de l'entreprise : ${companyName}`,
      `SIRET : ${siret}`,
      `Adresse : ${address}`,
      `Email professionnel : ${email}`,
      `Téléphone : ${phone}`,
      '',
      'Description de l\'activité :',
      description,
    ].join('\n');

    const attachments: { filename: string; content: Buffer }[] = [];
    const recto = formData.get('fileRecto') as File | null;
    const verso = formData.get('fileVerso') as File | null;
    const kbis = formData.get('fileKbis') as File | null;
    if (recto && recto.size > 0) {
      attachments.push({ filename: `justificatif_recto_${recto.name}`, content: Buffer.from(await recto.arrayBuffer()) });
    }
    if (verso && verso.size > 0) {
      attachments.push({ filename: `justificatif_verso_${verso.name}`, content: Buffer.from(await verso.arrayBuffer()) });
    }
    if (kbis && kbis.size > 0) {
      attachments.push({ filename: `kbis_${kbis.name}`, content: Buffer.from(await kbis.arrayBuffer()) });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.error('SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS)');
      return NextResponse.json(
        { error: 'Envoi d’email non configuré' },
        { status: 503 }
      );
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sectionluxe.com';
    await transporter.sendMail({
      from: `"Section Luxe" <${from}>`,
      to: TO_EMAIL,
      subject,
      text: body,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erreur envoi email devenir vendeur:', err);
    return NextResponse.json(
      { error: 'Erreur lors de l’envoi de l’email' },
      { status: 500 }
    );
  }
}
