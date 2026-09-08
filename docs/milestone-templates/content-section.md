---
name: "Sezione {{section_name}}"
description: Nuova content collection con pagine di listing e dettaglio, collegata a SEO e sitemap.
---

# Sezione {{section_name}}

Aggiunge dall'inizio alla fine una sezione basata su una content collection — listing e pagine di
dettaglio — con schema, pagine e impianto SEO. Si tira in ballo quando al cliente serve un tipo di
contenuto ricorrente (blog, casi studio, FAQ, portfolio…) oltre alla homepage.

## Sotto-task

### 1. feat(content): aggiungi lo schema della content collection {{collection_name}}

**Agent:** content-agent
**Labels:** enhancement

Schema Zod per {{collection_name}} (titolo, descrizione, `publishedAt`, immagine di copertina, tag,
flag di bozza), loader registrato in `content.config.ts`, 2 voci di esempio come contenuto iniziale.

Checklist:
- [ ] Schema in `content.config.ts` con frontmatter tipizzato
- [ ] 2 voci di esempio sotto `src/content/{{collection_name}}/`
- [ ] `astro sync` e `pnpm run typecheck` puliti

### 2. feat({{collection_name}}): aggiungi la pagina di listing

**Agent:** ui-agent
**Labels:** enhancement

Pagina indice `/{{route_segment}}/`, che riusa le primitive `ui/card` esistenti, in ordine
cronologico, con lo stato vuoto quando ancora non c'è nessuna voce.

Checklist:
- [ ] `src/pages/{{route_segment}}/index.astro`
- [ ] Interfaccia per lo stato vuoto
- [ ] Markup accessibile (gerarchia dei titoli, landmark)

### 3. feat({{collection_name}}): aggiungi la pagina di dettaglio

**Agent:** ui-agent
**Labels:** enhancement

`/{{route_segment}}/[slug]/` via `getStaticPaths`, che rende il corpo della voce e riporta al
listing. La strategia di rendering (prerender o SSR) segue `docs/guides/rendering-performance.md`,
se esiste.

Checklist:
- [ ] `src/pages/{{route_segment}}/[slug].astro`
- [ ] Scelta esplicita di `prerender`, con la ragione
- [ ] 404 per slug sconosciuti o in bozza

### 4. feat(seo): sitemap e metadati per {{collection_name}}

**Agent:** seo-agent
**Labels:** enhancement

Canonical, OG e JSON-LD (`Article` o `CollectionPage`) su listing e dettaglio, inclusione nella
sitemap, `noindex` sulle voci in bozza.

Checklist:
- [ ] JSON-LD sulle pagine di dettaglio
- [ ] Voci in bozza escluse dalla sitemap e in `noindex`
- [ ] Immagine OG che ricade su `public/og-default.png` quando la voce non ne ha una

### 5. docs(guides): codifica i pattern di {{collection_name}}

**Agent:** general-purpose
**Labels:**

Aggiorna (o crea) `docs/guides/content-collections.md` col pattern di schema e loader stabilito qui
sopra, così le sezioni future lo riusano invece di riderivarlo.

Checklist:
- [ ] `docs/guides/content-collections.md` aggiornato
