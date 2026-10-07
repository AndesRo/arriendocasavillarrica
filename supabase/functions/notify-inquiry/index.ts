// Edge Function: te avisa por correo cuando llega una consulta nueva.
// La invoca un Database Webhook (INSERT en public.consultas).
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   clave de https://resend.com
//   NOTIFY_EMAIL     el correo donde quieres recibir los avisos
//   WEBHOOK_SECRET   una clave larga inventada por ti (la misma que pondrás en el webhook)
// Opcionales:
//   RESEND_FROM      remitente, por defecto "Casa Villarrica <onboarding@resend.dev>"
//   SITE_URL         ej. https://tudominio.cl  (para el botón "Abrir panel")

interface Consulta {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_llegada: string;
  fecha_salida: string;
  huespedes: number;
  mensaje: string | null;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
// Todo lo que escribe el visitante se escapa: nunca se inserta HTML ajeno en tu correo.
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const fmt = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1] ?? '?'} ${y}`;
};

const nightsBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

const waDigits = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  return d.length === 9 && d.startsWith('9') ? `56${d}` : d;
};

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export function buildEmail(c: Consulta, siteUrl: string) {
  const noches = nightsBetween(c.fecha_llegada, c.fecha_salida);
  const fechas = `${fmt(c.fecha_llegada)} → ${fmt(c.fecha_salida)}`;
  const subject = `Nueva consulta: ${oneLine(c.nombre).slice(0, 60)} · ${fmt(c.fecha_llegada)} al ${fmt(c.fecha_salida)}`;

  const waText = `Hola ${c.nombre}, gracias por tu consulta para ${fmt(c.fecha_llegada)} al ${fmt(c.fecha_salida)}.`;
  const waUrl = `https://wa.me/${waDigits(c.telefono)}?text=${encodeURIComponent(waText)}`;
  const adminUrl = siteUrl ? `${siteUrl.replace(/\/+$/, '')}/admin` : '';

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 16px 8px 0;color:#71816F;font-size:13px;text-transform:uppercase;letter-spacing:.08em;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;font-size:16px;color:#17201C">${value}</td></tr>`;

  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;${
      primary ? 'background:#2F4A3D;color:#fff' : 'border:1px solid #2F4A3D;color:#2F4A3D'
    }">${label}</a>`;

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#F7F5F0;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
  <p style="margin:0 0 4px;color:#71816F;font-size:12px;letter-spacing:.2em;text-transform:uppercase">Casa Villarrica</p>
  <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:500;font-size:30px;color:#17201C">Nueva consulta de reserva</h1>
  <div style="background:#fff;border-radius:16px;padding:22px 24px">
    <table role="presentation" style="border-collapse:collapse;width:100%">
      ${row('Nombre', esc(c.nombre))}
      ${row('Fechas', `${esc(fechas)}<br><span style="color:#71816F;font-size:14px">${noches} ${noches === 1 ? 'noche' : 'noches'}</span>`)}
      ${row('Huéspedes', esc(c.huespedes))}
      ${row('Teléfono', `<a href="tel:${esc(c.telefono)}" style="color:#2F4A3D">${esc(c.telefono)}</a>`)}
      ${row('Email', `<a href="mailto:${esc(c.email)}" style="color:#2F4A3D">${esc(c.email)}</a>`)}
      ${c.mensaje ? row('Mensaje', esc(c.mensaje).replace(/\n/g, '<br>')) : ''}
    </table>
  </div>
  <p style="margin:22px 0 8px">
    ${adminUrl ? button(adminUrl, 'Abrir panel y responder', true) : ''}
    ${button(waUrl, 'Responder por WhatsApp', !adminUrl)}
  </p>
  <p style="margin:12px 0 0;color:#71816F;font-size:12px">Puedes responder este correo: llegará directo al cliente.</p>
</div></body></html>`;

  const text = [
    'Nueva consulta de reserva',
    `Nombre: ${c.nombre}`,
    `Fechas: ${fechas} (${noches} ${noches === 1 ? 'noche' : 'noches'})`,
    `Huéspedes: ${c.huespedes}`,
    `Teléfono: ${c.telefono}`,
    `Email: ${c.email}`,
    c.mensaje ? `Mensaje: ${c.mensaje}` : '',
    adminUrl ? `Panel: ${adminUrl}` : '',
    `WhatsApp: ${waUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
}

/** Comparación en tiempo constante para no filtrar el secreto por tiempos de respuesta. */
function safeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('WEBHOOK_SECRET') ?? '';
  const sent = req.headers.get('x-webhook-secret') ?? '';
  if (!secret || !safeEqual(sent, secret)) return new Response('Unauthorized', { status: 401 });

  let payload: { type?: string; table?: string; record?: Consulta };
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (payload.type !== 'INSERT' || payload.table !== 'consultas' || !payload.record) {
    return new Response('Ignored', { status: 200 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_EMAIL');
  if (!apiKey || !to) {
    console.error('Faltan los secretos RESEND_API_KEY o NOTIFY_EMAIL');
    return new Response('Server not configured', { status: 500 });
  }

  const c = payload.record;
  const { subject, html, text } = buildEmail(c, Deno.env.get('SITE_URL') ?? '');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM') ?? 'Casa Villarrica <onboarding@resend.dev>',
      to: [to],
      reply_to: c.email,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    console.error('Resend respondió', res.status, await res.text());
    return new Response('Email provider error', { status: 502 });
  }
  return new Response('ok', { status: 200 });
}

Deno.serve(handler);
