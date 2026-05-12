---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## Convenciones del repositorio Billar en Línea (Frontend)

**SIEMPRE consulta esta sección antes de escribir código nuevo en `Frontend/`.** Estas reglas evitan duplicación y mantienen la base de código predecible.

### Stack y restricciones técnicas

- **Next.js 16+ App Router** con React 19 y Turbopack.
- **TypeScript estricto** con `exactOptionalPropertyTypes: true` → para campos opcionales usa el patrón `if (data.field !== undefined) target.field = data.field` en lugar de asignaciones directas.
- **Tailwind CSS v4** (sintaxis nueva: `bg-linear-to-br`, no `bg-gradient-to-br`).
- **Cookies de auth**: `billar_auth`, `auth_token`. En Server Components NO uses `credentials: "include"`; lee cookies vía `next/headers` y pásalas manualmente como header `Cookie` al fetch.

### Orden de búsqueda antes de crear helpers/clases

Cuando crees un nuevo componente, recorre estas ubicaciones en orden:

1. **Helpers genéricos admin** → `@/components/content/admin/shared`
   - Incluye `toIsoDate`, `toDateTimeLocalValue`, `getErrorMessage`, `AdminSectionScaffold`, `AdminDeleteConfirmationButton`, `AdminDeleteItemButton`, `AdminManageLink`, `formatAdminDate`, `formatAdminMoney`, `humanizeAdminToken`.
2. **Helpers de presentación user/landing** → `@/components/content/user/shared`
   - Incluye `formatDate`, `formatMoney`, `humanizeToken`, `EmptyState`, `MetricCard`, `SectionHeading`, `ShowcaseCard`.
3. **Tokens Tailwind reutilizables** → `@/components/ui/styles`
   - `BUTTON_PRIMARY`, `BUTTON_PRIMARY_COMPACT`, `BUTTON_GHOST`, `BUTTON_DANGER`, `ADMIN_INPUT`, `CARD_SHELL`, `CARD_SHELL_PADDED`, `CARD_INNER`, `LABEL_OVERLINE`, `LABEL_OVERLINE_ACCENT`.
4. **Llamadas a la API** → `@/lib/api/...`
   - Públicas (sin auth o con cookie SSR): `lib/api/public-content/*.ts` (raffles, tournaments, events, posts).
   - Admin (mutaciones autenticadas): `lib/api/admin-*.ts` (`admin-raffles`, `admin-tournaments`, `admin-events`).
   - Cliente HTTP base: `@/lib/api/client` (`API_BASE_URL`, `ApiError`, `getJson`, `postJson`).
5. **Tipos compartidos públicos** → `@/lib/api/public-content/types.ts` (`LandingRaffle`, `RaffleDetail`, `TournamentDetail`, etc.).
6. **Helpers de normalización JSON** → `@/lib/api/public-content/shared.ts` (`pickString`, `pickNumber`, `pickBoolean`, `pickStringArray`, `pickRecordArray`, `resolveApiAssetUrl`, `formatError`).

### Reglas anti-duplicación

- **Nunca** redefinas `getErrorMessage`, `toIsoDate`, `toDateTimeLocalValue` o `formatMoney`/`formatDate` localmente. Importa desde `admin/shared` o `user/shared`.
- **Nunca** copies cadenas largas de Tailwind (botones, inputs, gradientes de tarjeta) — usa los tokens de `@/components/ui/styles`. Si necesitas una variante nueva, agrégala ahí en lugar de inline.
- **Nunca** hagas `fetch` directo al backend desde un componente — añade un helper en `lib/api/...` y reúsalo. La excepción válida es un mutation puntual con `postJson`/`fetch` cliente cuyo handler vive en el componente (e.g., release de reservas en `RaffleNumberGrid`).
- **Nunca** dupliques tipos de API entre componentes y `lib/api/`. Importa siempre desde los archivos `lib/api/`.
- **Sí** está permitido tener `humanizeAdminToken`/`humanizeToken` separados o `formatMoney` "soft" (admin) vs "estricto" (registro de torneo) cuando el comportamiento es **intencionalmente** distinto. Documenta la diferencia con un comentario.

### Convenciones React/Next

- Para leer estado del entorno (`window.location`, etc.) sin warning de hidratación ni "setState in effect", usa `useSyncExternalStore` con un `subscribeNoop` y `getServerSnapshot` que devuelva un valor seguro para SSR. NO uses `useEffect` + `setState` para sincronizar valores estáticos del navegador.
- Páginas dinámicas con SEO deben implementar `generateMetadata` con fallback en cascada: `seoTitle ?? name`, `seoDescription ?? description ?? texto-genérico`. Usa `slug` para canonical cuando exista.
- Server Components que necesiten cookies del usuario: `const cookieStore = await cookies(); const cookieHeader = ['billar_auth', 'auth_token'].map(n => cookieStore.get(n)).filter(Boolean).map(c => \`${c!.name}=${c!.value}\`).join('; ');` y pasarlo como `headers: { Cookie: cookieHeader }`.

### Estructura de carpetas (referencia)

```
Frontend/src/
  app/                       # Rutas App Router (home/, admin/, login/...)
  components/
    auth/                    # Login/registro
    landing/                 # Home pública
    navigation/              # Header, footer
    content/
      admin/
        shared/              # Helpers admin (utils.ts, scaffold, delete buttons)
        raffles/ tournaments/ events/ users/  # CreateLab y AdminDetail
      user/
        shared/              # Helpers user (utils.ts, EmptyState, ShowcaseCard)
        raffles/ tournaments/ ...             # Vistas públicas autenticadas
    ui/
      styles.ts              # Tokens Tailwind reutilizables
  lib/
    api/
      client.ts              # Cliente HTTP base
      admin-*.ts             # Endpoints admin
      public-content/        # Endpoints públicos + types.ts + shared.ts
    site.ts                  # Config (siteConfig.name, locale, socialImage)
```

### Cuándo crear archivos nuevos

- **NO** crees `index.ts` barrel si solo vas a exportar 1 archivo de la carpeta.
- **SÍ** crea barrel cuando una subcarpeta tenga ≥3 archivos consumidos juntos.
- **NO** crees nuevos archivos `utils.ts` por carpeta; usa los de `admin/shared` o `user/shared`. Solo crea uno nuevo si el helper es estrictamente local a un módulo de negocio (ej. `tournaments/registration-state.ts`).

Si necesitas migrar también los inputClass de los demás formularios admin a ADMIN_INPUT, o crear un componente <Button> de verdad (en lugar de constantes string), dime y lo hago. Lo dejé conservador para no tocar 20 archivos en una pasada.