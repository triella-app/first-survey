# Enquesta: App social per a grups de 3+

Dashboard interactiu d'anàlisi de resultats d'una enquesta sobre una app social per a experiències en grup. Genera un **únic fitxer HTML** autònom que qualsevol persona pot obrir al mòbil o ordinador — sense instal·lar res.

## Què fa?

Llegeix les respostes del CSV, les processa amb Node.js i genera `output/dashboard.html`: un dashboard complet amb tema glassmorphism fosc-violeta que inclou:

- **4 KPIs** — total respostes, edat mitjana, % que utilitzarien l'app, % disposats a pagar
- **14 gràfics interactius** (Plotly.js) organitzats en 6 seccions:
  - Demografia (histograma d'edat, gènere, estat relacional, rang d'edat)
  - Interès i experiència (freqüència, experiència prèvia, barreres)
  - Preferències (què buscarien, composició, on buscarien)
  - Viabilitat de mercat (ús de l'app, disposició a pagar, crosstabs per gènere i edat)
- **8 filtres interactius** al sidebar (píndoles + slider d'edat), combinats amb lògica AND
- **Taula de feedback** amb cerca en temps real + caixa de temes principals
- **URLs compartibles** — els filtres es guarden als query params, pots copiar l'URL i enviar-la

## Quickstart

```bash
node src/generate-dashboard.js
open output/dashboard.html
```

Això és tot. El fitxer HTML resultant és autònom (dades embegudes com a JSON, Plotly.js via CDN).

## Estructura

```
src/
  generate-dashboard.js   ← genera el HTML complet
  csv-parser.js           ← parsing del CSV amb suport multi-línia
  normalizers.js          ← normalització de gènere, edat, estat relacional
data/
  enquesta.csv            ← respostes originals (no inclòs al repo)
output/
  dashboard.html          ← resultat generat (no inclòs al repo)
```

## Filtres disponibles

| Filtre | Tipus | Camp |
|--------|-------|------|
| Gènere | Píndoles | `genere` (normalitzat) |
| Rang d'edat | Slider dual | `edat` (numèric) |
| Estat relacional | Píndoles | `estat_relacional` (normalitzat) |
| Freqüència | Píndoles | `frequencia` (raw) |
| Experiència | Píndoles | `experiencia` (raw) |
| Què buscarien | Píndoles | `que_buscaries` (raw) |
| Utilitzarien l'app | Píndoles | `usaries_app` (raw) |
| Pagarien | Píndoles | `pagaries` (raw) |

Tots els filtres actualitzen els 4 KPIs, els 14 gràfics i la taula de feedback simultàniament. Els camps opcionals (freqüència, experiència, etc.) deixen passar registres buits.

## Compartir una vista filtrada

Filtra les dades al dashboard i copia l'URL del navegador. Exemple:

```
dashboard.html?genere=Dona&age_min=20&age_max=30&estat_relacional=Solter/a
```

Qui obri l'enllaç veurà exactament la mateixa vista filtrada.

## Responsiu

A pantalles < 768px el sidebar es col·lapsa i apareix un botó hamburguesa per obrir-lo. Els gràfics s'apilen verticalment.
