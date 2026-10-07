// Edge Function (Deno) · envía un email cuando llega una consulta nueva.
// Se dispara con un Database Webhook (tabla `consultas`, evento INSERT).
//
// Secrets necesarios (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   clave de https://resend.com
//   NOTIFY_EMAIL     email donde quieres recibir las consultas
//   WEBHOOK_SECRET   texto largo y aleatorio; el mismo valor va en el header del webhook
//   FROM_EMAIL       (opcional) remitente. Por defecto: onboarding@resend.dev
//                    (con ese remitente Resend solo entrega al email de TU cuenta de Resend)

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const oneLine = (v: unknown) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  if (payload?.type !== 'INSERT' || payload?.table !== 'consultas' || !payload.record) {
    return new Response('Ignored', { status: 200 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('NOTIFY_EMAIL');
  if (!apiKey || !to) return new Response('Missing configuration', { status: 500 });

  const c = payload.record;
  const nights = Math.round((Date.parse(c.fecha_salida) - Date.parse(c.fecha_llegada)) / 86_400_000);
  const phoneDigits = String(c.telefono ?? '').replace(/\D/g, '');
  const waText = encodeURIComponent(
    `Hola ${oneLine(c.nombre)}, gracias por tu consulta por la casa en Villarrica (${c.fecha_llegada} al ${c.fecha_salida}).`,
  );
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits}?text=${waText}` : null;

  const row = (label: string, value: unknown) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b7a72">${label}</td><td style="padding:6px 0"><strong>${esc(value)}</strong></td></tr>`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#17201c;max-width:560px">
      <h2 style="margin:0 0 4px">Nueva consulta de reserva</h2>
      <p style="margin:0 0 20px;color:#6b7a72">Casa Villarrica</p>
      <table style="border-collapse:collapse;font-size:15px">
        ${row('Nombre', c.nombre)}
        ${row('Email', c.email)}
        ${row('Teléfono', c.telefono)}
        ${row('Llegada', c.fecha_llegada)}
        ${row('Salida', c.fecha_salida)}
        ${row('Noches', Number.isFinite(nights) ? nights : '—')}
        ${row('Huéspedes', c.huespedes)}
      </table>
      ${c.mensaje ? `<p style="margin:20px 0 4px;color:#6b7a72">Mensaje</p><p style="margin:0;white-space:pre-wrap">${esc(c.mensaje)}</p>` : ''}
      <p style="margin:28px 0 0">
        ${waLink ? `<a href="${waLink}" style="background:#2f4a3d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">Responder por WhatsApp</a>` : ''}
      </p>
      <p style="margin:20px 0 0;color:#6b7a72;font-size:13px">
        Para aprobar: Supabase → Table Editor → consultas → cambia <em>estado</em> a <strong>aprobada</strong>.
      </p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Casa Villarrica <${Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'}>`,
      to: [to],
      reply_to: c.email,
      subject: `Nueva consulta: ${oneLine(c.nombre)} · ${c.fecha_llegada} → ${c.fecha_salida}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend error', res.status, await res.text());
    return new Response('Email failed', { status: 502 });
  }
  return new Response('OK', { status: 200 });
});
