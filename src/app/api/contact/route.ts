import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sanitizeEmail, sanitizeName, sanitizeSubject, sanitizeMessage, MAX_JSON_BODY_BYTES } from '@/lib/sanitize';

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'contact.sectionluxe@gmail.com';
const REPORT_TO_EMAIL = process.env.REPORT_TO_EMAIL || 'contact.sectionluxe@gmail.com';

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
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_JSON_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Corps de requête trop volumineux' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const name = sanitizeName((body.name as string) || '');
    const emailResult = sanitizeEmail((body.email as string) || '');
    const subject = sanitizeSubject((body.subject as string) || '');
    const messageResult = sanitizeMessage((body.message as string) || '');

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error }, { status: 400 });
    }
    if (!messageResult.ok) {
      return NextResponse.json({ error: messageResult.error }, { status: 400 });
    }

    const email = emailResult.value;
    const message = messageResult.value;

    const emailBody = [
      body.report
        ? 'Signalement d\'annonce (formulaire site)'
        : 'Nouvelle demande de contact (formulaire site)',
      '----------------------------------------------',
      '',
      `Nom : ${name || '(non renseigné)'}`,
      `Email : ${email}`,
      `Sujet : ${subject}`,
      '',
      'Message :',
      message,
    ].join('\n');

    const transporter = getTransporter();
    if (!transporter) {
      console.error('SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS)');
      return NextResponse.json(
        { error: 'Envoi email indisponible' },
        { status: 503 }
      );
    }

    const toEmail = body.report ? REPORT_TO_EMAIL : TO_EMAIL;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sectionluxe.com';
    const safeSubject = subject.slice(0, 60).replace(/[\r\n]/g, ' ');
    await transporter.sendMail({
      from: `"Section Luxe" <${from}>`,
      to: toEmail,
      replyTo: email,
      subject: body.report ? `[Signalement] ${safeSubject}` : `[Contact] ${safeSubject}`,
      text: emailBody,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erreur envoi email contact:', err);
    return NextResponse.json(
      { error: 'Envoi email échoué' },
      { status: 500 }
    );
  }
}
