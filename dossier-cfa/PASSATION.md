# Passation — dossier CFA WE-FORM, exercice 1

Tout ce qu'il faut pour reprendre le dossier dans une nouvelle session, sans rien
redemander. Ce fichier est la mémoire de la mission : le contexte, les décisions
prises et leur motif, les chiffres à chaque étape, et ce qui reste ouvert.

**Société** SARL WE-FORM (CFA / organisme de formation) · SIREN interne 155984
**Exercice 1** 17/04/2025 → 31/07/2026
**Cabinet** SECOGEST Rhône et Jura
**Branche Git** `claude/grand-livre-analytique-cfa-444je8`

---

## 1. La mission

Reprendre le grand livre et la balance de SECOGEST dans le **plan comptable CFA**
de WE-FORM, produire le **dossier analytique** correspondant, et intégrer les
corrections de rattachement décidées avec le client.

### La règle d'arbitrage, posée par le client et appliquée partout

> **Le grand livre fait foi.** Le dossier analytique remis par WE-FORM ne
> détermine que (a) le compte CFA et (b) le rattachement analytique — jamais la
> date, ni le montant, ni le libellé d'une écriture.

Les 2 723 lignes du grand livre sont reprises telles quelles. Les écritures de
clôture s'**ajoutent**, elles ne remplacent rien.

### Le fait structurant à ne jamais perdre de vue

**Le classeur analytique WE-FORM est bâti sur le RELEVÉ BANCAIRE (encaissements
et décaissements), le grand livre sur les DROITS CONSTATÉS.** C'est la cause de
presque tous les écarts entre les deux. Preuve au centime : les produits du
classeur (453 353,35 €) valent exactement le total crédit des comptes clients du
grand livre, c'est-à-dire les encaissements.

Conséquence pratique : la colonne « compte actuel » du classeur n'est **jamais**
le compte SECOGEST, c'est un compte CFA. Sur les 34 changements de compte
demandés, 24 sont déjà comptabilisés au bon compte par SECOGEST — ils ne
corrigent que la ventilation WE-FORM.

---

## 2. Les décisions du client

### Prises le 05/09/2026, premier tour

| Sujet | Décision | Effet |
|---|---|---|
| Rémunération de Stéphanie HOUVENAGHEL | « les 15 000 ont été payés et elle les a remis en tréso par la suite » → le versement du 28/02/2026 est une rémunération ; le reversement du 25/05 devient un apport en compte courant | charge −15 000 · compte courant créditeur de 15 000 |
| Salaires d'août | « oui c'est parfait » — chaque paie est déjà dans son mois | aucune écriture |
| Julie HUCHET | « oui elle y est » — comprise dans l'OD de paie de juillet 2026 | aucune écriture |
| Matériel pédagogique (51 PC SMART AINFO) | « c'est une charge car ils sont laissés aux apprentis/clubs » | 2156000 → charge 6068, −25 500 |
| Charges de clôture | les quatre familles retenues : TNS gérants, FAE/PCA, reclassement FPC AFDAS, quote-part Ligue AURA | voir §4 |

### Prises le 05/09/2026, second tour

| Sujet | Décision | Effet |
|---|---|---|
| Compte d'attente 4710000 | « ne solde pas le compte d'attente […] et sinon laisse en compte attente » | les 93 opérations restent au bilan, 18 227,40 € hors résultat |
| Ingénierie ERWAN BENALI | « je veux passer en charge les 15 000 € […] il reste ensuite 10 000 € pour l'année prochaine sur une convention à 25 000 » | 2050000 → charge 611, −15 000 · 10 000 € sur l'exercice 2 |
| Facture LEMOLE-1 | « oui parfait pour le mole » — maintenue | produit +750 |

**Conséquence du maintien du compte d'attente :** l'écriture qui reportait le
carburant au compte courant du gérant est devenue sans objet — les 1 466,10 € de
carburant et d'entretien sont intégralement logés au compte d'attente, donc déjà
hors résultat.

---

## 3. Les chiffres

| | |
|---|---:|
| Résultat comptable SECOGEST | 141 950,06 |
| **Résultat en plan comptable CFA** | **31 136,14** |
| dont apprentissage (après cascade) | 6 242,62 |
| dont formation continue | 20 325,20 |
| dont Ligue AURA | 2 407,48 |
| dont hors périmètre | 2 160,84 |
| Produits | 511 663,16 |
| Charges | 482 371,41 |
| Bilan — actif | 224 915,86 |

### Le passage, poste par poste

| # | Poste | Effet | Cumul |
|---|---|---:|---:|
| | Résultat SECOGEST | | 141 950,06 |
| 1 | Matériel pédagogique 2156000 → charge 6068 | −25 500,00 | 116 450,06 |
| 2 | Ingénierie BENALI 2050000 → charge 611 | −15 000,00 | 101 450,06 |
| 3 | Rémunération de gérance de Stéphanie portée à 34 500 | −15 000,00 | 86 450,06 |
| 4 | Cotisations TNS des gérants (12 600 + 7 500,30) | −20 100,30 | 66 349,76 |
| 5 | Factures non parvenues (8 fournisseurs débiteurs) | −4 826,18 | 61 523,58 |
| 6 | Produits acquis non facturés (FAE) | +15 289,58 | 76 813,16 |
| 7 | Produits constatés d'avance (PCA) | −46 427,02 | 30 386,14 |
| 8 | Facture LEMOLE-1 réintégrée | +750,00 | **31 136,14** |

### L'écart avec le modèle analytique du client (51 477,52)

1. Créances retenues au-delà du grand livre : **+19 358,00** (le modèle compte
   99 110,95 € de factures non encaissées, le grand livre en porte 79 752,95 —
   l'encaissement AKTO du 27/07 précède ses factures du 28/07)
2. Compte d'attente conservé ici, passé en charges par le modèle : −18 227,40
3. PC BOULANGER maintenu en immobilisation : −1 299,99
4. Intérêts d'emprunt et assurance emprunteur en charges ici : +3 981,50
5. Dettes et créances de tiers, effet de la base trésorerie : +13 239,86
   → **48 188,11**, soit le résultat recalculé depuis les feuilles 2, 3 et 4 du classeur
6. **Écart interne au classeur** : ses propres feuilles donnent 48 188,11 mais le
   mode d'emploi annonce 51 477,52. **+3 289,41 non expliqués — à corriger dans le modèle.**

---

## 4. Les écritures de clôture passées au 31/07/2026 (journal EI)

| Réf. | Objet | Montant |
|---|---|---:|
| CL-1 | Rémunération de gérance de Stéphanie HOUVENAGHEL (644 / 4551) | 15 000,00 |
| CL-2 | Cotisations TNS Xavier GAUSSENS (645.9 / 438) | 12 600,00 |
| CL-3 | Cotisations TNS Stéphanie HOUVENAGHEL (645.9 / 438) | 7 500,30 |
| CL-5 | Factures non parvenues, 8 comptes fournisseurs débiteurs apurés | 4 826,18 |
| CL-6 | Produits constatés d'avance (706.11 / 487) | 46 427,02 |
| CL-7 | Produits acquis non facturés (418 / 706.11) | 15 289,58 |
| CL-8 | Facture LEMOLE-1 (411.2 / 706.11) | 750,00 |
| CL-9 | Reclassement FPC des financements AFDAS (706.11 / 706.21) | 64 176,54 |

**CL-4 et CL-10 ont été supprimées** sur décision du client (compte d'attente conservé).

Détail des factures non parvenues (CL-5) : FCELLES 1 190,90 · FMOB 894,10 ·
FJURY 699,50 · FSUIVIJURY 680,00 · FFRAIS 557,30 · FSMART 500,00 ·
FDUTERTRE 300,00 · FUBER 4,38.

---

## 5. Les clés de répartition

| Règle | App. | FPC | AURA | Commun | Base |
|---|---:|---:|---:|---:|---|
| Salaire Anthony | 60 % | 30 % | 0 % | 10 % | 200 |
| Gérant Xavier | 59 % | 15 % | 16 % | 10 % | 200 |
| Gérante Stéphanie | 0 % | 0 % | 0 % | 100 % | 200 |
| Clé salaires | 93,03 % | 3,48 % | 0 % | 3,48 % | 52 557,48 |

**Cascade**, dans cet ordre : clé n° 1 → 5,00 % du commun vers la Ligue AURA
(32 jours de Xavier sur 600) · clé n° 2 → 6,01 % du reste vers la formation
continue · quote-part → 4 592,26 € de moyens FPC repris par la Ligue AURA
(1 action sur 13) · clé n° 3 → le solde de l'apprentissage réparti au
mois-apprenti entre les huit titres (544,42 mois au total).

---

## 6. Ce qui reste ouvert

| # | Sujet | En jeu |
|---|---|---:|
| 1 | Convention BENALI — 10 000 € sur l'exercice 2, rien à provisionner | · |
| 2 | PC BOULANGER du 15/04/2026, immobilisé ici, passé en charge par le modèle | −1 299,99 |
| 3 | Compte d'attente 4710000 conservé ouvert | −18 227,40 |
| 4 | Créances de 99 110,95 € affirmées par le modèle contre 79 752,95 au grand livre | +19 358,00 |
| 5 | Provision pour congés payés — non passée, compteurs manquants | −8 109,75 |
| 6 | INTERSPORT, six cartes cadeaux — 623 retenu, 6238 défendable | −300,00 |
| 7 | PARIS 13 ATLETICO 4 500 € — location ici, dons chez le modèle | −4 500,00 |
| 8 | Lot « CARTE FACTURETTES CB » du 31/07/2026 — relevé carte à obtenir | −8 275,52 |
| 9 | Présentiels — factures globales à faire rectifier (salle / intervention / repas) | · |
| 10 | Taxes assises sur les salaires — ventilation mensuelle fausse, sans effet sur le résultat | · |
| 11 | Doublon de note de frais Xavier du 01/09/2025 | −169,98 |
| 12 | ONEDIRECT 358,51 € — classé en 6064, à basculer en 6068 si c'est du matériel remis aux apprentis | · |

### Anomalies relevées sur le compte bancaire (audit du 5 septembre)

1. **URSSAF — 382,00 € prélevés deux fois le 06/05/2026** (pièces `02842J3` et
   `02841ZR`). Le compte 4310000 est débiteur de 491,13 € à la clôture, ce qui
   corrobore un trop-versé. À réclamer.
2. **Les 34 500 € versés à Stéphanie ne portent nulle part son nom** dans les
   libellés bancaires — origine probable du désaccord avec le cabinet.
3. **Le lot carte du 31/07/2026 est le seul des quinze non ventilé** (les
   quatorze autres, 29 463,50 €, sont éclatés en charges).
4. **AKTO** : 15 269,60 € encaissés le 27/07, factures émises le 28/07.
5. **Notes de frais élevées** : Anthony GRANDCLEMENT 17 149,04 € (dont
   4 097,01 € d'achats réglés chez un tiers : Bolt, Supabase, Digiforma,
   Anthropic) ; Xavier GAUSSENS 8 760,16 €. Ces fournisseurs sont **aussi**
   facturés en direct — deux canaux de règlement, TVA perdue sur le canal
   personnel.
6. **Virement interne de 45 000 €** parti le 24/07/2025 et revenu le 26/07,
   non documenté.
7. Le prêt boucle au centime : 13 échéances = 13 868,01 = capital 9 886,51 +
   intérêts 3 255,77 + assurance 725,73.

---

## 7. Les fichiers

```
dossier-cfa/
├── PASSATION.md              ce fichier
├── README.md                 présentation courte
├── sources/                  LES QUATRE FICHIERS D'ORIGINE — ne rien y modifier
│   ├── 1_Grand_livre_SECOGEST.pdf          73 pages, 2 723 écritures
│   ├── 2_Balance_SECOGEST.pdf               7 pages
│   ├── 3_Modele_analytique_WEFORM.xlsx     12 feuilles, 1 078 lignes ventilées
│   └── 4_Dossier_synthese_WEFORM.html      la note de synthèse
├── donnees/                  extraction certifiée du PDF
│   ├── gl_raw.json           2 748 lignes + tous les totaux imprimés
│   ├── gl_entries.csv        les 2 723 écritures, une par ligne
│   └── gl_accounts.csv       totaux par compte
├── livrables/
│   ├── Grand_livre_CFA_WEFORM.pdf          72 pages, format SECOGEST
│   ├── Balance_CFA_WEFORM.pdf               6 pages
│   ├── Analytique_CFA_WEFORM.xlsx          15 onglets
│   ├── Verification_analytique_WEFORM.html page interactive, chaque chiffre s'ouvre
│   └── Notes_de_frais_WEFORM.xlsx           5 onglets
└── pipeline/                 les scripts qui régénèrent tout
```

### Régénérer les livrables

```bash
pip install pdfplumber openpyxl reportlab
cd dossier-cfa/pipeline
python3 extract_gl.py     # PDF d'origine        -> gl_raw.json
python3 apply_map.py      # correspondance CFA   -> gl_cfa.json
python3 cloture.py        # écritures de clôture -> cloture.json
python3 build_gl.py       # les deux PDF
python3 vent.py           # ventilation 5 axes   -> vent_cfa.json
python3 build_xlsx.py     # le classeur analytique
python3 export_json.py    # données de la page   -> data.json
python3 xl_notes.py       # le classeur des notes de frais
```

La page HTML s'assemble en concaténant `head.html`, `body.html`, puis
`data.json` et `app.js` + `sections.js` dans un unique bloc `<script>`.

### Contrôles qui doivent passer

- l'extraction du PDF recale sur **tous** les totaux imprimés et **tous** les
  soldes progressifs : 0 écart ;
- la balance CFA est équilibrée, le bilan fait apparaître le résultat ;
- la somme des cinq axes redonne le résultat au centime ;
- la cascade conserve le résultat ;
- les marges par titre redonnent le résultat de l'apprentissage.

---

## 8. Reprendre dans l'application Claude bureau

1. Cloner le dépôt et se placer sur la branche :
   ```
   git clone https://github.com/Antho01580/APPLI.git
   cd APPLI
   git checkout claude/grand-livre-analytique-cfa-444je8
   ```
2. Ouvrir le dossier `APPLI` dans l'application Claude bureau.
3. Coller ce message pour amorcer la session :

> Je reprends le dossier CFA WE-FORM. Lis `dossier-cfa/PASSATION.md` en entier :
> il contient le contexte, la règle d'arbitrage, toutes les décisions déjà
> prises, les chiffres et les points ouverts. Les fichiers d'origine sont dans
> `dossier-cfa/sources/`, l'extraction certifiée du grand livre dans
> `dossier-cfa/donnees/gl_entries.csv`, les livrables dans
> `dossier-cfa/livrables/` et les scripts dans `dossier-cfa/pipeline/`.
> Ne redemande pas ce qui est déjà tranché dans la passation. Voici ce que je
> veux faire ensuite : …

---

*Dossier établi en septembre 2026. Résultat CFA de l'exercice : 31 136,14 €.*
