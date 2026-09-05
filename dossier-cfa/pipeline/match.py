# -*- coding: utf-8 -*-
"""Appariement des lignes du grand livre avec la ventilation analytique WE-FORM.

Le classeur WE-FORM est en trésorerie, le grand livre en engagements : l'appariement
se fait sur le MONTANT (exact au centime) et la DATE (fenêtre glissante), départagé
par la ressemblance des libellés.  Il sert uniquement à hériter (a) de la clé
analytique et (b) de la répartition sur les cinq axes.  Ni le montant, ni la date,
ni le libellé du grand livre ne sont modifiés.
"""
import re, datetime, collections, unicodedata

AXES = ['Apprentissage', 'Formation continue', 'Ligue AURA', 'Commun', 'Hors périmètre']
STOP = {'vir','inst','prlv','sepa','cb','de','la','le','les','du','des','pour','sarl','we',
        'form','achat','pas','facture','ticket','fr','sas','sa','evi','ext','et'}

def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9 ]', ' ', s)

def toks(s):
    return {t for t in norm(s).split() if len(t) > 2 and t not in STOP}

def charger_modele(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['2. Ventilation analytique']
    rows = list(ws.iter_rows(values_only=True)); h = list(rows[0])
    ix = {n: i for i, n in enumerate(h)}
    V = []
    for r in rows[1:]:
        m = r[ix['Montant']]
        if m is None: continue
        try: d = datetime.date.fromisoformat(str(r[ix['Date']])[:10])
        except Exception: d = None
        V.append({'date': d, 'lib': str(r[ix['Libellé']] or ''), 'm': round(m, 2),
                  'cfa': str(r[ix['Compte']]), 'cle': str(r[ix['Clé appliquée']] or ''),
                  'nature': str(r[ix['Nature']] or ''),
                  'axes': [round(r[ix[k]] or 0, 2) for k in AXES],
                  'pct': [round(r[ix['% ' + k]] or 0, 4) for k in AXES],
                  'used': False, 'toks': toks(str(r[ix['Libellé']] or ''))})
    return V

def index_montant(V):
    d = collections.defaultdict(list)
    for v in V: d[abs(v['m'])].append(v)
    return d

def apparier(E, V, fenetre=45):
    """E : lignes du grand livre (avec date JJ/MM/AAAA, libelle, debit, credit)."""
    idx = index_montant(V)
    for e in E:
        e['match'] = None
        amt = round((e['debit'] or 0) - (e['credit'] or 0), 2)
        if not amt: continue
        cands = [c for c in idx.get(abs(amt), []) if not c['used']]
        if not cands: continue
        try: gd = datetime.datetime.strptime(e['date'], '%d/%m/%Y').date()
        except Exception: continue
        et = toks(e['libelle'])
        best, score = None, None
        for c in cands:
            if not c['date']: continue
            dd = abs((c['date'] - gd).days)
            if dd > fenetre: continue
            inter = len(et & c['toks'])
            s = (-inter, dd)                       # d'abord la ressemblance, puis la proximité de date
            if score is None or s < score: best, score = c, s
        if best is not None:
            best['used'] = True
            e['match'] = best
    return E
