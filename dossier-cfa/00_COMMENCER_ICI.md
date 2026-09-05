# WE-FORM — dossier CFA, exercice 1 · **VERSION DÉFINITIVE du 05/09/2026**

Vous venez de déposer ce dossier quelque part. Voici comment repartir.

---

## À faire en premier

**1. Ouvrir le dossier `WEFORM-dossier-CFA` dans l'application Claude bureau.**

**2. Coller ce message :**

> Je reprends le dossier CFA WE-FORM. Lis `PASSATION.md` en entier avant toute
> chose : il contient le contexte, la règle d'arbitrage, toutes les décisions
> déjà prises par le client, les chiffres et les points ouverts. Les livrables
> définitifs sont dans `1_livrables/`, les fichiers d'origine du cabinet dans
> `2_sources/`, l'extraction certifiée du grand livre dans
> `3_donnees/gl_entries.csv` et les scripts qui régénèrent tout dans
> `4_pipeline/`. Ne redemande pas ce qui est déjà tranché dans la passation, et
> ne repars pas d'un fichier trouvé ailleurs sur le poste. Voici ce que je veux
> faire ensuite : …

---

## ⚠ Ne pas confondre avec les versions antérieures

Si d'anciens fichiers traînent ailleurs sur le poste (dans `Téléchargements`
notamment), **ils sont périmés**. On les reconnaît ainsi :

| | Ancienne version | **Cette version** |
|---|---|---|
| Grand livre CFA | 75 pages | **72 pages** |
| Résultat de l'exercice | 27 908,74 ou 29 291,75 € | **31 136,14 €** |
| Compte d'attente 4710000 | soldé, passé en charges | **conservé ouvert** |
| Ingénierie ERWAN BENALI | immobilisée au 2050000 | **passée en charge au 611** |
| Classeur analytique | 14 onglets | **15 onglets** |

**Supprimez les anciens.** Ils raisonnent sur des arbitrages que vous avez
changés depuis.

---

## Les chiffres de cette version

| | |
|---|---:|
| Résultat comptable SECOGEST | 141 950,06 |
| **Résultat en plan comptable CFA** | **31 136,14** |
| dont apprentissage (après cascade) | 6 242,62 |
| dont formation continue | 20 325,20 |
| dont Ligue AURA | 2 407,48 |
| dont hors périmètre | 2 160,84 |

Le passage de l'un à l'autre, poste par poste, est au §3 de `PASSATION.md` et
dans l'onglet « 9. Maîtrise du résultat » du classeur analytique.

---

## Ce qu'il y a dans chaque dossier

### `1_livrables/` — ce qui se lit et se transmet

| Fichier | Contenu |
|---|---|
| `Grand_livre_CFA_WEFORM.pdf` | 72 pages, format et design du cabinet, comptes CFA |
| `Balance_CFA_WEFORM.pdf` | 6 pages, récapitulation comprise |
| `Analytique_CFA_WEFORM.xlsx` | 15 onglets : analytique comptable, par formation, par stagiaire, par outil, par lieu, par matériel, maîtrise du résultat, points ouverts, compte d'attente |
| `Verification_analytique_WEFORM.html` | **La page de contrôle.** Chaque chiffre s'ouvre sur les lignes de grand livre qui le composent, et le tiroir recalcule la somme. S'ouvre hors ligne dans n'importe quel navigateur, double-clic suffit. |
| `Notes_de_frais_WEFORM.xlsx` | 5 onglets : les 58 notes, les 59 règlements, les lignes de charge, et les achats faits pour le compte de la société |

### `2_sources/` — les fichiers d'origine, à ne pas modifier

Le grand livre et la balance de SECOGEST, le modèle analytique WE-FORM et sa
note de synthèse. Tout le reste en découle.

### `3_donnees/` — l'extraction certifiée

`gl_entries.csv` : les 2 723 écritures du grand livre, une par ligne, dans un
format exploitable. L'extraction recale sur **tous** les totaux imprimés et
**tous** les soldes progressifs du PDF : 0 écart. C'est la pièce à utiliser pour
tout recalcul, plutôt que de relire le PDF.

### `4_pipeline/` — les scripts

Ils régénèrent l'intégralité des livrables depuis `2_sources/`.

```
pip install pdfplumber openpyxl reportlab

python3 extract_gl.py     # le PDF du cabinet      -> gl_raw.json
python3 apply_map.py      # correspondance CFA     -> gl_cfa.json
python3 cloture.py        # écritures de clôture   -> cloture.json
python3 build_gl.py       # les deux PDF
python3 vent.py           # ventilation 5 axes     -> vent_cfa.json
python3 build_xlsx.py     # le classeur analytique
python3 export_json.py    # données de la page     -> data.json
python3 xl_notes.py       # le classeur des notes de frais
```

La page HTML s'assemble en concaténant `head.html`, `body.html`, puis
`data.json` et `app.js` + `sections.js` dans un unique bloc `<script>`.

**Les scripts attendent les sources dans le même dossier qu'eux.** Le plus
simple est de copier `2_sources/` et `3_donnees/` dans `4_pipeline/` avant de
lancer, ou d'ajuster les chemins en tête de `extract_gl.py` et `cascade.py`.

---

## La règle qui gouverne tout le dossier

> **Le grand livre fait foi.** Le modèle analytique remis par WE-FORM ne
> détermine que (a) le compte CFA et (b) le rattachement analytique — jamais la
> date, ni le montant, ni le libellé d'une écriture.

Et le fait qui explique presque tous les écarts avec le modèle : **celui-ci est
bâti sur le relevé bancaire** (encaissements et décaissements), **le grand livre
sur les droits constatés**.

---

## Les contrôles qui doivent passer

Si vous ou une nouvelle session refaites les calculs, ces cinq contrôles doivent
tomber juste — ils sont dans l'onglet « 9. Maîtrise du résultat » :

- l'extraction du PDF recale sur tous les totaux imprimés et tous les soldes progressifs ;
- la balance CFA est équilibrée, le bilan fait apparaître le résultat ;
- la somme des cinq axes redonne le résultat au centime ;
- la cascade des clés conserve le résultat ;
- les marges par titre redonnent le résultat de l'apprentissage.

---

## Et ensuite

`PASSATION.md` contient le reste : les huit décisions prises et leur motif, les
écritures de clôture, les clés de répartition, les **douze points encore
ouverts** (chiffrés) et les **sept anomalies relevées sur le compte bancaire** —
dont le double prélèvement URSSAF de 382 € du 06/05/2026 et les 34 500 € versés
à Stéphanie sans son nom dans les libellés.
