# Casa Villarrica · Landing page

Landing de una sola página para una casa de vacaciones en Villarrica (Región de La Araucanía).
React + Vite + TypeScript + Tailwind CSS. Sin pagos, sin reservas automáticas, sin panel admin.

## Inicio rápido

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera /dist listo para publicar (Vercel, Netlify, etc.)
```

## Qué debes reemplazar (checklist)

| Qué | Dónde |
|---|---|
| Fotografías | Copia tus archivos en `public/images/` (nombres en `public/images/LEEME.txt`). Mientras no existan, se ve el recuadro "Agregar fotografía". |
| Nombre, huéspedes, dormitorios, baños, estacionamiento, textos | `src/data/property.ts` (`null` = pendiente, se muestra "—") |
| WhatsApp, email, Instagram | `src/data/property.ts` o `.env.local` (`VITE_WHATSAPP_NUMBER=569XXXXXXXX`, solo dígitos con código de país) |
| Comodidades | `src/data/amenities.ts` → `available: true` **solo** en las que realmente existen |
| Galería (rutas, textos alternativos, proporción) | `src/data/gallery.ts` |
| Lugares cercanos (nombre, descripción, distancia, imagen, URL) | `src/data/places.ts` (distancia `null` = no se muestra) |
| Imagen al compartir el link | `public/images/og-cover.jpg` y, al publicar, cambia `og:image` en `index.html` por la URL absoluta (`https://tudominio.cl/images/og-cover.jpg`) |
| Título/descripción SEO | `index.html` |

Si no configuras el WhatsApp, el botón flotante **no aparece en producción** (nunca se usa un número ficticio).

## Conectar Supabase

1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (la clave **anon**; jamás la `service_role`).
3. Para marcar fechas ocupadas, agrega filas en la tabla `reservas` (Table Editor) con estado `reservado` o `bloqueado`.
   - `fecha_inicio` = día de llegada, `fecha_fin` = día de salida. Las noches ocupadas son `[inicio, fin)`; el día de salida queda libre para otra llegada.
4. Las consultas del formulario se guardan en la tabla `consultas`.

**Privacidad:** el navegador nunca lee la tabla `reservas` (tiene nombre/teléfono/email de clientes). Lee la vista `disponibilidad_publica`, que solo expone fechas y estado.

Sin credenciales: en `npm run dev` el calendario muestra fechas ocupadas **de ejemplo** (con un aviso) y el formulario simula el envío; en producción el calendario aparece todo disponible y el formulario muestra un error amable.

## Panel de administración y avisos por correo

El panel vive en **`/admin`** (ej. `https://tudominio.cl/admin`). No hay ningún enlace público hacia él, pero la
seguridad real está en la base de datos: solo las cuentas listadas en la tabla `admins` pueden leer consultas o
modificar reservas.

### 1. Base de datos (una vez)
1. SQL Editor → ejecuta `supabase/admin.sql`.
2. Authentication → Users → *Add user* → *Create new user* (tu correo + contraseña larga, "Auto Confirm User").
3. Ejecuta en el SQL Editor (con tu correo): `insert into public.admins (user_id) select id from auth.users where email = 'TU_CORREO' on conflict do nothing;`
4. Authentication → Sign In / Providers → desactiva **Allow new users to sign up**.

### 2. Aviso por correo (Resend + Edge Function)
1. Crea una cuenta en [resend.com](https://resend.com) **con el mismo correo en que quieres recibir los avisos** y crea una API key.
   Sin dominio propio verificado, Resend solo permite enviar al correo de tu propia cuenta (suficiente para este caso).
2. Instala la CLI de Supabase y, desde esta carpeta:
   ```bash
   supabase login
   supabase link --project-ref TU_PROJECT_REF
   supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_EMAIL=tu@correo.com WEBHOOK_SECRET=una-clave-larga-inventada SITE_URL=https://tudominio.cl
   supabase functions deploy notify-inquiry --no-verify-jwt
   ```
   (Alternativa sin CLI: Dashboard → Edge Functions → *Deploy a new function* → *Via Editor*, pega `supabase/functions/notify-inquiry/index.ts`,
   desactiva *Verify JWT* y define los mismos secretos en *Edge Functions → Secrets*.)
3. Dashboard → Database → **Webhooks** → *Create a new hook*:
   - Table: `consultas` · Events: **Insert**
   - Type: *HTTP Request* · Method: `POST`
   - URL: `https://TU_PROJECT_REF.supabase.co/functions/v1/notify-inquiry`
   - HTTP Headers: añade `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`.
4. Envía una consulta de prueba desde el sitio. Si el correo no llega, revisa spam y *Edge Functions → notify-inquiry → Logs*.

### 3. Uso diario
- **Consultas:** cada una muestra fechas, contacto y mensaje. *Aceptar y bloquear fechas* crea la reserva y el calendario público
  deja de ofrecer esas noches. Si las fechas chocan con otra reserva, el panel lo avisa y no permite aceptar.
- **Reservas y bloqueos:** ver, agregar (p. ej. estadías acordadas por WhatsApp o días que no arriendas) y quitar.
- Desde cada consulta puedes responder por WhatsApp o email con un mensaje prellenado.
- Publicando en Vercel, `vercel.json` ya incluye la regla para que `/admin` funcione.

## Recibir consultas por email y aprobar reservas

1. **SQL:** en Supabase → SQL Editor ejecuta `supabase/flujo-consultas.sql` (se puede ejecutar más de una vez).
   Agrega `estado` a `consultas`, bloquea dobles reservas y crea la reserva automáticamente al aprobar.
2. **Resend:** crea una cuenta en https://resend.com con el email donde quieres recibir las consultas y genera una API key.
3. **Edge Function:** Supabase → Edge Functions → *Deploy a new function* → *Via Editor*, nombre `notificar-consulta`,
   pega `supabase/functions/notificar-consulta/index.ts` y **desactiva "Verify JWT"** (la protege el secreto del paso 5).
4. **Secrets** (Edge Functions → Secrets): `RESEND_API_KEY`, `NOTIFY_EMAIL`, `WEBHOOK_SECRET` (texto largo aleatorio).
5. **Webhook:** Database → Webhooks → *Create*: tabla `consultas`, evento **Insert**, tipo *Supabase Edge Functions*,
   función `notificar-consulta`, y un header `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`.
6. Prueba enviando el formulario del sitio.

**Uso diario:** Table Editor → `consultas` → cambia `estado` a `aprobada` (se crea la reserva y el calendario público
se actualiza solo) o `rechazada`. Si las fechas chocan con otra reserva, Supabase muestra un error y no aprueba.
Para bloquear fechas por uso personal: `reservas` → Insert row con `estado = bloqueado`.

Nota: con el remitente de prueba `onboarding@resend.dev`, Resend solo entrega al email de tu propia cuenta y el correo
puede caer en spam la primera vez. Para un remitente propio, verifica un dominio en Resend y define `FROM_EMAIL`.

## Estructura

```
src/
  components/   Navbar, Hero, PropertyHighlights, AboutHouse, Gallery (+Lightbox), Amenities,
                AvailabilityCalendar, WeatherWidget, NearbyPlaces, BookingForm, Contact,
                WhatsAppButton, Footer (+ Reveal, SmartImage, Placeholder, Icons)
  data/         property.ts, amenities.ts, gallery.ts, places.ts
  lib/          config.ts, supabase.ts, reservations.ts, inquiries.ts, availability.ts,
                weather.ts (Open-Meteo), whatsapp.ts, dates.ts
supabase/schema.sql
```

La capa `lib/reservations.ts` y `lib/inquiries.ts` es el único punto que habla con Supabase: un futuro panel de administración puede agregarse sin tocar los componentes visuales.

## Notas

- Clima: Open-Meteo (gratis, sin API key), se actualiza cada 10 minutos y al volver a la pestaña.
- Accesibilidad: navegación por teclado, foco visible, labels, `aria-*`, disponibilidad indicada con color **y** patrón/texto, y `prefers-reduced-motion` respetado.
- Fotos: exporta en WebP (calidad 75–80, máx. 2400 px). El Hero idealmente pesa menos de 400 KB. Puedes usar `srcSet` en `gallery.ts` para versiones responsive.
- Antes de publicar: reemplaza todos los textos/datos pendientes y revisa que no queden `[EMAIL]` / `[WHATSAPP]` visibles en la sección de contacto.
- El formulario incluye un campo trampa anti-spam; para tráfico alto conviene sumar un captcha (Turnstile/hCaptcha) y una Edge Function.
