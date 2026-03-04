import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'contact@sectionluxe.fr';
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
    const body = await request.json();
    const name = (body.name as string)?.trim() || '';
    const email = (body.email as string)?.trim() || '';
    const subject = (body.subject as string)?.trim() || 'Demande de contact';
    const message = (body.message as string)?.trim() || '';

    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email et message requis' },
        { status: 400 }
      );
    }

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
    await transporter.sendMail({
      from: `"Section Luxe" <${from}>`,
      to: toEmail,
      replyTo: email,
      subject: body.report ? `[Signalement] ${subject.slice(0, 60)}` : `[Contact] ${subject.slice(0, 60)}`,
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
