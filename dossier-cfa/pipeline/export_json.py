# -*- coding: utf-8 -*-
"""Export compact des données pour la page HTML de vérification."""
import json, sys, collections
sys.path.insert(0, '.')
import plan_cfa, cascade, axes_cfa, match as _match

R   = json.load(open('vent_cfa.json'))
L   = json.load(open('lignes_cfa.json'))
EC  = json.load(open('cloture.json'))
BAL = json.load(open('balance_cfa.json'))
GLC = json.load(open('gl_cfa.json'))

# --- lignes ventilées : tableau de tableaux
# [date, piece, jnl, libelle, src, cfa, montant, a0,a1,a2,a3,a4, cle, origine]
LIG = [[l['date'], l['piece'], l['jnl'], l['libelle'], l['src'], l['cfa'],
        round(l['montant'], 2)] + [round(x, 2) for x in l['axes']] + [l['cle'], l['origine']]
       for l in R]

# --- compte d'attente (conservé) : [date, libelle, montant, cfa_reconnu, cle]
ATT = [e for e in GLC if e['compte'] == '4710000']
_V = _match.charger_modele(cascade.XLSX)
_match.apparier(ATT, _V)
ATTJ = []
for e in ATT:
    m = round((e['debit'] or 0) - (e['credit'] or 0), 2)
    mt = e.get('match')
    ATTJ.append([e['date'], e['libelle'], m, (mt['cfa'] if mt else ''), (mt['cle'] if mt else '')])

# --- écritures de clôture
ECJ = [[x['piece'], x['cfa'], x['libelle'], x['debit'], x['credit'], x['motif']] for x in EC]

# --- correspondance des comptes
gm = collections.defaultdict(lambda: {'m': 0.0, 'n': 0, 'motif': ''})
for l in L:
    if l['src'] == 'CLÔTURE': continue
    d = gm[(l['src'], l['cfa'])]
    d['m'] += (l['debit'] or 0) - (l['credit'] or 0); d['n'] += 1
    d['motif'] = l.get('motif') or d['motif']
srclib = {e['compte']: e['intitule'] for e in GLC}
MAPJ = [[s, srclib.get(s, ''), c, round(v['m'], 2), v['n'], v['motif']]
        for (s, c), v in sorted(gm.items())]

# --- axes CFA
LIEUX = axes_cfa.par_lieu(R)
APPS, FRN = axes_cfa.par_outil(R)
MAT = axes_cfa.par_materiel(R, L)
STAG = axes_cfa.stabiaires() if hasattr(axes_cfa, 'stabiaires') else axes_cfa.stagiaires()
TIT = cascade.titres()

# les axes renvoient des sélections : on ré-exporte les index de lignes pour le détail
def idx_of(sel_pred):
    return [i for i, l in enumerate(R) if sel_pred(l)]

import re
def pack_dim(items, keyname, spec):
    """spec : nom -> (regex, comptes) ; renvoie item + indices des lignes."""
    out, pris = [], set()
    for it in items:
        out.append(it)
    return out

# reconstruction des index par dimension, avec la même logique que axes_cfa
def lieux_idx():
    res, pris = [], set()
    for nom, pat, comptes in axes_cfa.LIEUX:
        ids = [i for i, l in enumerate(R) if l['cfa'] in comptes
               and re.search(pat, l['libelle'], re.I) and i not in pris]
        pris.update(ids)
        if ids: res.append((nom, ids))
    reste = [i for i, l in enumerate(R) if l['cfa'] in ('6132.1','6132.9','6257','6238') and i not in pris]
    if reste: res.append(('Autres locations et présentiels', reste))
    return res

def outil_idx():
    sel = [i for i, l in enumerate(R) if l['cfa'] in axes_cfa.COMPTES_OUTIL]
    apps, pris = [], set()
    for nom, pat in axes_cfa.APPLI.items():
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris]
        pris.update(ids); apps.append((nom, ids))
    apps.append(('Outils communs et frais non rattachés', [i for i in sel if i not in pris]))
    frn, pris2 = [], set()
    for nom, pat in axes_cfa.FOURN:
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris2]
        pris2.update(ids)
        if ids: frn.append((nom, ids))
    reste = [i for i in sel if i not in pris2]
    if reste: frn.append(('Autres fournisseurs et frais', reste))
    return apps, frn

def mat_idx():
    sel = [i for i, l in enumerate(R) if l['cfa'] in ('6068', '6064')]
    out, pris = [], set()
    for nom, pat in axes_cfa.MATERIEL:
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris]
        pris.update(ids)
        if ids: out.append((nom, ids))
    reste = [i for i in sel if i not in pris]
    if reste: out.append(('Autres fournitures et petit équipement', reste))
    return out

AX = [round(sum(l['axes'][i] for l in R), 2) for i in range(5)]
CAS = cascade.repartir(AX)


# ================= décompte des contrats, courts contrats, rattachement, direct/indirect =========
import datetime as _dt, statistics as _st
import contrats as _ct
CTR  = _ct.contrats()
MENS = _ct.effectif_mensuel(CTR)

def _dd(s):
    try: return _dt.date.fromisoformat(s)
    except (TypeError, ValueError): return None

_DEB, _FIN = _dt.date(2025, 4, 17), _dt.date(2026, 7, 31)

def _duree(s):
    d, f = _dd(s['debut']), _dd(s['fin'])
    if not (d and f): return None, None
    return round((f - d).days / 30.44, 2), round(max(0, (min(f, _FIN) - max(d, _DEB)).days) / 30.44, 2)

# --- lignes du grand livre qui citent nommément un stagiaire (drill-down du nom)
_STOP = {'JEAN', 'MARIE', 'PIERRE', 'PAUL', 'LOUIS', 'FRANCE', 'PARIS', 'CLUB', 'SPORT',
         'FORMATION', 'GROUPE', 'SAINT', 'MONT', 'BLANC', 'ROUGE', 'PETIT', 'GRAND'}
def _tokens(nom):
    return [t for t in re.split(r"[^A-Za-zÀ-ÿ']+", (nom or '').upper())
            if len(t) >= 5 and t not in _STOP]
_LIBUP = [re.sub(r"[^A-Z0-9À-Ý]+", ' ', (l['libelle'] or '').upper()) for l in R]
def _lignes_du_nom(nom):
    tk = _tokens(nom)
    if not tk: return []
    return [i for i, u in enumerate(_LIBUP) if any(f' {t} ' in f' {u} ' for t in tk)]

# [nom, code titre, intitulé, début, fin, durée, mois_ex, prise_en_charge, charges_nom, lignes_modele, idx_gl]
STAGJ = []
for s in sorted(STAG, key=lambda s: (-s['prise_en_charge'], s['nom'] or '')):
    du, mx = _duree(s)
    STAGJ.append([s['nom'], s['titre'], s['intitule'], s['debut'], s['fin'], du, mx,
                  round(s['prise_en_charge'], 2), round(s['charges_nominatives'], 2),
                  s['lignes'], _lignes_du_nom(s['nom'])])

# --- 15. décompte
_TITC = sorted({c['titre'] for c in CTR})
DECOMPTE = {
  'reperes': [["Contrats de l'exercice", len(CTR)],
              ['Effectif maximal atteint', max(m['presents'] for m in MENS)],
              ['Durée moyenne (mois)', round(_st.mean([c['duree'] for c in CTR]), 2)],
              ['Durée médiane (mois)', round(_st.median([c['duree'] for c in CTR]), 2)],
              ["Mois-apprenti dans l'exercice", round(sum(c['mois_ex'] for c in CTR), 2)],
              ["Contrats qui débordent sur l'exercice 2", sum(1 for c in CTR if c['deborde'])]],
  'titres_cols': _TITC,
  'mensuel': [[m['mois'], m['presents'], m['entrees'], m['sorties']] +
              [m['titres'].get(t, 0) for t in _TITC] for m in MENS],
  'par_titre': [[t, len([c for c in CTR if c['titre'] == t]),
                 round(sum(c['prise_en_charge'] for c in CTR if c['titre'] == t), 2),
                 round(sum(c['charges_nominatives'] for c in CTR if c['titre'] == t), 2),
                 round(_st.mean([c['duree'] for c in CTR if c['titre'] == t]), 2),
                 round(sum(c['mois_ex'] for c in CTR if c['titre'] == t), 2)] for t in _TITC],
}

# --- 16. courts contrats
_SEUIL = 6.0
COURTS = {
  'seuil': _SEUIL,
  'contrats': [[c['nom'], c['titre'], c['intitule'], c['debut'], c['fin'], c['duree'],
                round(c['prise_en_charge'], 2), round(c['charges_nominatives'], 2),
                round(c['prise_en_charge'] / c['duree'], 2) if c['duree'] else None,
                _lignes_du_nom(c['nom'])]
               for c in sorted([c for c in CTR if c['duree'] < _SEUIL], key=lambda c: c['duree'])],
  'tranches': [[lab, len([c for c in CTR if lo <= c['duree'] < hi]),
                round(sum(c['prise_en_charge'] for c in CTR if lo <= c['duree'] < hi), 2)]
               for lo, hi, lab in [(0,3,'moins de 3 mois'),(3,6,'3 à 6 mois'),(6,9,'6 à 9 mois'),
                                   (9,12,'9 à 12 mois'),(12,99,'12 mois et plus')]],
  'total_pec': round(sum(c['prise_en_charge'] for c in CTR), 2),
}

# --- 17. rattachement d'exercice
_CHEV = sorted([c for c in CTR if c['deborde']], key=lambda c: -c['prise_en_charge'])
RATT = {
  'contrats': [[c['nom'], c['titre'], c['debut'], c['fin'], c['duree'], c['mois_ex'],
                round(c['duree'] - c['mois_ex'], 2), round(100 * c['part_ex'], 2),
                round(c['prise_en_charge'], 2), _lignes_du_nom(c['nom'])] for c in _CHEV],
  'ecritures': [["Produits constatés d'avance", '487', -46427.02,
                 "La part des factures déjà émises qui porte sur l'exercice 2. Elle sort du résultat de l'exercice 1."],
                ["Produits acquis non encore facturés", '418', 15289.58,
                 "L'enseignement déjà dispensé au 31/07/2026 que le financeur n'a pas encore été appelé à payer. Il entre dans le résultat."],
                ["Solde net du rattachement", '', -31137.44,
                 "Effet net sur le résultat de l'exercice 1."]],
  # indices des lignes de clôture qui portent le rattachement (côté résultat)
  'idx': [i for i, l in enumerate(R) if str(l.get('piece', '')) in ('CL-6', 'CL-7', 'CL-8')],
  'idx_ecr': [[i for i, l in enumerate(R) if str(l.get('piece', '')) == pc]
              for pc in ('CL-6', 'CL-7')] + [[i for i, l in enumerate(R)
                                              if str(l.get('piece', '')) in ('CL-6', 'CL-7')]],
}

# --- 18. charges directes et indirectes
def _nature(l):
    if l['cfa'][0] == '7': return 'Produit'
    p = l['pct']
    if p[4] >= 99.9: return 'Hors périmètre'
    if p[3] >= 99.9: return 'Indirecte — commun pur'
    if p[3] > 0.01:  return 'Indirecte — répartie par clé'
    return 'Directe'
_NAT = ['Directe', 'Indirecte — répartie par clé', 'Indirecte — commun pur', 'Hors périmètre', 'Produit']
_gn = collections.defaultdict(list)
for i, l in enumerate(R): _gn[(l['cfa'], _nature(l))].append(i)
DIRIND = {
  'natures': _NAT,
  'comptes': [[code, plan_cfa.PLAN.get(code, '')] +
              [[round(sum(R[i]['montant'] for i in _gn.get((code, n), [])), 2),
                _gn.get((code, n), [])] for n in _NAT]
              for code in plan_cfa.ORDRE if any((code, n) in _gn for n in _NAT)],
  'synthese': [[n, sum(len(v) for k, v in _gn.items() if k[1] == n),
                round(sum(R[i]['montant'] for k, v in _gn.items() if k[1] == n for i in v), 2),
                [i for k, v in _gn.items() if k[1] == n for i in v]] for n in _NAT],
}

DATA = {
 'lignes': LIG,
 'plan': plan_cfa.PLAN,
 'ordre': plan_cfa.ORDRE,
 'attente': ATTJ,
 'cloture': ECJ,
 'mapping': MAPJ,
 'lieux': lieux_idx(),
 'applis': outil_idx()[0],
 'fournisseurs': outil_idx()[1],
 'materiel': mat_idx(),
 'immo': [[l['cfa'], l['libelle'], -round((l['debit'] or 0) - (l['credit'] or 0), 2)]
          for l in L if l['cfa'] in ('2183',)],
 'stagiaires': STAGJ,
 'titres': [[t['code'], t['nom'], t['contrats'], t['mois'], t['produits_modele'], t['direct_modele']]
            for t in TIT],
 'decompte': DECOMPTE, 'courts': COURTS, 'ratt': RATT, 'dirind': DIRIND,
 'axes': AX, 'cascade': CAS, 'resultat': BAL['resultat'], 'balance': BAL,
 'cle1': cascade.CLE1_AURA, 'cle2': cascade.CLE2_FPC, 'qpaura': cascade.QP_AURA,
}
json.dump(DATA, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import os
print('data.json', round(os.path.getsize('data.json')/1024), 'Ko |', len(LIG), 'lignes |',
      len(ATTJ), 'attente |', len(STAG), 'stagiaires')
