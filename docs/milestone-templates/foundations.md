---
name: "Fondamenta"
description: Trasforma lo scaffold appena creato in questo progetto — branding, ambienti, design system, SEO, form, consenso e contenuti reali.
---

# Fondamenta

Porta lo scaffold appena creato dai segnaposto a un progetto con la sua identità, deployabile,
indicizzabile e capace di ricevere un contatto. Ogni progetto ne ha bisogno esattamente una volta,
come **Milestone 1**: non si costruisce niente sopra uno scaffold che si chiama ancora
`astro-template`.

L'ordine non è arbitrario: il sotto-task 1 rinomina il progetto a cui tutti gli altri si
riferiscono, e il 2 rende verdi le preview, così i rimanenti si rivedono su un deploy vero invece
che in locale.

A differenza degli altri blueprint, questo si **trascrive in `docs/ROADMAP.md` mentre si scrive il
piano**, perché la stima si deriva da quella roadmap e questa milestone è parte di ciò che viene
preventivato. Al momento della semina la sezione esiste già, quindi si semina per via bespoke:
`/milestone 1`, non `/milestone foundations`.

## Sotto-task

### 1. chore(scaffold): personalizza il template per {{project_name}}

**Agent:** general-purpose
**Labels:**

Il repo nasce da `Elia97/astro-template` e porta ancora i suoi segnaposto. Qui si sostituiscono:
non si riscrive lo scaffold. Se il dominio di produzione non è ancora deciso, lascia un `TODO`
esplicito e non inventarne uno — un URL assoluto sbagliato avvelena in silenzio canonical e tag OG.

Qui si riattiva dependabot: è in pausa dalla creazione del repo
(`open-pull-requests-limit: 0`) proprio fino a questo sotto-task.

Checklist:
- [ ] `package.json#name` e `release-please-config.json` rinominati — il nome trapela nel changelog
- [ ] `src/lib/site.ts`: nome, url, descrizione, voci di nav, CTA e legali
- [ ] `SITE.url` sul dominio reale, o un `TODO` esplicito
- [ ] `astro.config.mjs` → `i18n.defaultLocale` e `locales` corrispondono alle lingue del progetto
- [ ] `public/favicon.svg`, `public/favicon.ico`, `public/og-default.png` sostituiti
- [ ] Dependabot riattivato (rimosse le due righe `open-pull-requests-limit: 0`)
- [ ] `pnpm run ci` e `pnpm run build` verdi

### 2. ci(ops): ambienti, secret e deploy da tag di release

**Agent:** ops-agent
**Labels:**

Sviluppo, preview e produzione su Vercel, CI su ogni PR, produzione che esce **solo da un tag di
release**. Senza `RELEASE_PLEASE_TOKEN` la release PR non riceve mai il check `ci` e non si può
mergiare: è l'unico secret la cui assenza sembra che vada tutto bene.

Checklist:
- [ ] Progetto Vercel collegato; `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` impostati
- [ ] `RELEASE_PLEASE_TOKEN` impostato (PAT fine-grained: `contents:write` e `pull_requests:write`)
- [ ] Ignored Build Step → `bash scripts/vercel-ignore-build.sh`
- [ ] `bash scripts/bootstrap-github.sh` rieseguito e verde (ruleset, squash-only, permessi Actions)
- [ ] Un push su un branch produce un deploy di preview verde

### 3. feat(ui): traduci il design approvato in token e primitive

**Agent:** ui-agent
**Labels:**

Il design system reso in codice. **Non è lavoro di design**: è la trasposizione di un design
approvato in `src/styles/tokens.css` e nelle primitive di interfaccia. `tokens.css` è l'unico file
che il rebranding tocca — i nomi semantici in `light.css` e `dark.css` restano come sono.

Checklist:
- [ ] Palette del brand in `src/styles/tokens.css`; `SITE.themeColor` uguale a `--background` nei due temi (lo verifica `src/styles/theme-color.test.ts`)
- [ ] Webfont collegato con l'API font di Astro su `--font-stack-base` e `--font-stack-display`, se ce n'è uno
- [ ] Primitive coerenti col design system, nessun valore fisso fuori dai token
- [ ] Le animazioni rispettano `prefers-reduced-motion`
- [ ] Chiaro e scuro verificati sulla chrome vera, non solo su una pagina di componenti

### 4. feat(seo): canonical, sitemap e dati strutturati per {{domain}}

**Agent:** seo-agent
**Labels:**

Head, canonical, Open Graph, sitemap, `robots.txt` e il JSON-LD che descrive questa attività
specifica. I deploy di preview devono mantenere il loro `X-Robots-Tag: noindex`: una preview che si
posiziona fa concorrenza alla produzione.

Checklist:
- [ ] Canonical assoluti coerenti con `SITE.url`
- [ ] Open Graph con il vero `og-default.png` come fallback
- [ ] `sitemap.xml` e `robots.txt` corretti per le lingue del progetto
- [ ] JSON-LD (`Organization` o `LocalBusiness`) coi dati reali del cliente
- [ ] `hreflang` reciproci con `x-default`, se il progetto è multilingua
- [ ] `*.vercel.app` ancora in `noindex`

### 5. feat(forms): collega il form di contatto alla casella vera

**Agent:** forms-agent
**Labels:**

In sviluppo il form funziona senza configurazione, perché il fornitore non fa niente ma lo dice.
Qui si fa spedire davvero. Verifica DKIM, SPF e DMARC del dominio mittente **prima** del go-live:
senza, la produzione rifiuta di spedire per costruzione, e un record DNS mancante si manifesta come
silenzio invece che come errore.

Checklist:
- [ ] Valori `CONTACT_*` impostati; `BREVO_API_KEY` impostata in locale e nel progetto Vercel (solo server)
- [ ] Dominio mittente verificato in Brevo (DKIM, SPF, DMARC)
- [ ] Rate limiting provato sulla preview deployata, non solo negli unit test
- [ ] Un invio vero arriva nella casella del cliente, e il reply-to è utilizzabile

### 6. feat(ops): consenso, analytics e la CSP che li lascia passare

**Agent:** ops-agent
**Labels:**

Niente parte finché non è configurato: senza variabili d'ambiente il sito non mostra nessun banner,
non carica nessun tag e non scrive nessun cookie non essenziale. **Allargare la CSP in
`vercel.json` è il passo che si dimentica**: `astro dev` non legge mai quel file, quindi in locale
sembra tutto giusto e in produzione il banner non compare affatto.

Checklist:
- [ ] `PUBLIC_GTM_ID`, `PUBLIC_IUBENDA_SITE_ID`, `PUBLIC_IUBENDA_COOKIE_POLICY_ID` impostate come variabili **Plain**, mai Sensitive
- [ ] CSP allargata in `vercel.json`, e le asserzioni di `src/vercel-headers.test.ts` aggiornate insieme
- [ ] Verificato su una preview, accettando e rifiutando, con GA4 Realtime aperto: prima del consenso a Google non arriva niente
- [ ] I default di Consent Mode v2 restano negati

### 7. fix(content): copy vero della homepage, dati societari e pagine legali

**Agent:** content-agent
**Labels:**

Gli ultimi segnaposto: il copy della homepage, i dati societari da cui le pagine legali si
generano, e il passaggio di `/privacy` e `/cookie-policy` dalle bozze segnaposto ai documenti
ospitati. `termini` non ha un corrispettivo ospitato e resta dietro il suo avviso «da rivedere
legalmente» finché qualcuno non lo rivede.

Checklist:
- [ ] `src/content/homepage/*.yml` col copy vero, non lorem
- [ ] Dati societari (ragione sociale, partita IVA, sede legale, contatti) da `docs/PROJECT.md`
- [ ] Id delle policy iubenda impostati — `/privacy` e `/cookie-policy` risolvono ai documenti ospitati
- [ ] `/termini` rivisto, o il suo avviso di bozza lasciato lì di proposito
- [ ] Le pagine 404 e 500 parlano di questo progetto, non di un template
