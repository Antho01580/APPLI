# Dossier CFA WE-FORM — exercice 1 (17/04/2025 → 31/07/2026)

> **Pour reprendre le dossier : lire [`PASSATION.md`](PASSATION.md)** — contexte,
> décisions prises, chiffres, points ouverts et mode de reprise.

Reprise du grand livre et de la balance SECOGEST dans le **plan comptable CFA** de WE-FORM,
et dossier analytique associé.

## Livrables

| Fichier | Contenu |
|---|---|
| `livrables/Grand_livre_CFA_WEFORM.pdf` | Le grand livre complet (72 pages) — clients, fournisseurs, comptes généraux — au format et au design SECOGEST, avec les comptes CFA. |
| `livrables/Balance_CFA_WEFORM.pdf` | La balance correspondante (6 pages), y compris la récapitulation. |
| `livrables/Analytique_CFA_WEFORM.xlsx` | Le dossier analytique, 15 onglets, format neutre WE-FORM. |
| `livrables/Verification_analytique_WEFORM.html` | Le même dossier en page interactive : **chaque chiffre s'ouvre sur les lignes de grand livre qui le composent**, et le tiroir recalcule la somme pour afficher le contrôle de concordance. |

## Règle d'arbitrage

**Le grand livre fait foi.** Le dossier analytique remis par WE-FORM ne détermine que
(a) le compte CFA et (b) le rattachement analytique — jamais la date, ni le montant, ni le
libellé d'une écriture. Les 2 723 lignes du grand livre sont reprises telles quelles.

## Chiffres

| | |
|---|---:|
| Résultat comptable SECOGEST | 141 950,06 |
| Résultat en plan comptable CFA | **31 136,14** |
| dont apprentissage (après cascade) | 6 242,62 |
| dont formation continue | 20 325,20 |
| dont Ligue AURA | 2 407,48 |
| dont hors périmètre | 2 160,84 |

Le compte d'attente 4710000 est **conservé ouvert** (18 227,40 €) : ses 93 opérations ne sont
pas des charges de l'exercice tant que les pièces ne sont pas produites. Le détail, la nature
reconnue de chaque ligne et la seule compensation du compte (BOOKING, 1 341,46 €) figurent à
l'onglet « 14. Compte d'attente ».

Le passage de l'un à l'autre est détaillé, poste par poste, dans l'onglet
« 9. Maîtrise du résultat ».

## Contrôles

- L'extraction du PDF d'origine se recale sur **tous** les totaux imprimés et **tous** les
  soldes progressifs : 0 écart.
- La balance CFA est équilibrée ; le bilan fait apparaître le résultat.
- La somme des cinq axes analytiques redonne le résultat au centime.
- La cascade des clés conserve le résultat.
- Les marges par titre redonnent le résultat de l'apprentissage.

## Pipeline

Les scripts de `pipeline/` régénèrent l'ensemble à partir du PDF d'origine :

```
extract_gl.py    extraction certifiée du grand livre PDF  → gl_raw.json
plan_cfa.py      plan comptable CFA (codes et intitulés)
mapping.py       correspondance compte SECOGEST → compte CFA
apply_map.py     application du mapping                   → gl_cfa.json
match.py         appariement grand livre ↔ modèle analytique
cloture.py       écritures de clôture au 31/07/2026        → cloture.json
render_gl.py     rendu du grand livre au format SECOGEST
render_bal.py    rendu de la balance au format SECOGEST
build_gl.py      génère les deux PDF                      → *.pdf
vent.py          ventilation sur les cinq axes            → vent_cfa.json
cascade.py       cascade des clés de répartition
axes_cfa.py      axes CFA (lieu, outil, matériel, titres, stagiaires)
build_xlsx.py    génère le classeur analytique            → *.xlsx
export_json.py   export compact pour la page de vérification → data.json
head.html / body.html / app.js / sections.js  la page de vérification
```

La page de vérification s'assemble en concaténant `head.html`, `body.html`, puis
`data.json` et les deux scripts dans un unique bloc `<script>`.

Dépendances : `pdfplumber`, `openpyxl`, `reportlab`.
