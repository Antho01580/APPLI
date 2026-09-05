# -*- coding: utf-8 -*-
"""Ventilation analytique des lignes du grand-livre CFA sur les cinq axes.

Règle de rattachement, dans l'ordre :
 1. la ligne est appariée (montant au centime + date + libellé) à une ligne du modèle
    analytique WE-FORM : elle hérite de SA clé et de SES pourcentages ;
 2. sinon, elle prend la clé par défaut de son compte CFA, calculée sur le modèle ;
 3. les écritures de clôture portent leur clé propre.

Le libellé, la date et le montant restent toujours ceux du GRAND LIVRE.
"""
import json, sys, collections
sys.path.insert(0, '.')
import match, plan_cfa

AXES = match.AXES
XLSX = '/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/c148ab38-SECOGESTWEFORMexercice12.xlsx'

# clés propres aux écritures de clôture (pourcentages sur les 5 axes)
CLES_CLOTURE = {          # (référence, compte CFA) -> (nom de la clé, pourcentages)
 ('CL-1', '644'):    ('Gérance — commun',   [0, 0, 0, 100, 0]),
 ('CL-2', '645.9'):  ('Gérant Xavier',      [59, 15, 16, 10, 0]),
 ('CL-3', '645.9'):  ('Gérante Stéphanie',  [0, 0, 0, 100, 0]),
 ('CL-5', '6226.3'): ('Ligue AURA',         [0, 0, 100, 0, 0]),
 ('CL-6', '706.11'): ('Apprentissage',      [100, 0, 0, 0, 0]),
 ('CL-7', '706.11'): ('Apprentissage',      [100, 0, 0, 0, 0]),
 ('CL-8', '706.11'): ('Apprentissage',      [100, 0, 0, 0, 0]),
 ('CL-9', '706.11'): ('Apprentissage',      [100, 0, 0, 0, 0]),
 ('CL-9', '706.21'):  ('FPC',               [0, 100, 0, 0, 0]),
 ('CL-10', '6256.9'): ('Hors périmètre',    [0, 0, 0, 0, 100]),
 ('CL-10', '615'):    ('Hors périmètre',    [0, 0, 0, 0, 100]),
}

def defauts(V):
    """Pourcentages moyens par compte CFA, mesurés sur le modèle WE-FORM."""
    ax = collections.defaultdict(lambda: [0.0] * 5)
    cle = collections.defaultdict(lambda: collections.defaultdict(float))
    for v in V:
        for i in range(5): ax[v['cfa']][i] += v['axes'][i]
        cle[v['cfa']][v['cle']] += abs(v['m'])
    out = {}
    for c, a in ax.items():
        t = sum(abs(x) for x in a)
        p = [100 * abs(x) / t for x in a] if t else [0, 0, 0, 100, 0]
        dom = max(cle[c], key=cle[c].get) if cle[c] else 'Commun (indirect)'
        out[c] = (dom, p)
    return out

def ventiler():
    V = match.charger_modele(XLSX)
    DEF = defauts(V)
    lignes = json.load(open('lignes_cfa.json'))
    res = [l for l in lignes if l['cfa'][0] in '67']
    match.apparier([l for l in res if l['src'] != 'CLÔTURE'], V)
    for l in res:
        m = round((l['debit'] or 0) - (l['credit'] or 0), 2)
        l['montant'] = -m                      # convention WE-FORM : charge négative, produit positif
        mt = l.get('match')
        if l['src'] == 'CLÔTURE':
            k = (l['piece'], l['cfa'])
            if k in CLES_CLOTURE:
                l['cle'], pct = CLES_CLOTURE[k]; l['origine'] = 'clé de clôture'
            elif l.get('cle') and l.get('pct'):
                l['cle'], pct = l['cle'], l['pct']; l['origine'] = 'modèle WE-FORM (compte d\'attente)'
            else:
                l['cle'], pct = DEF.get(l['cfa'], ('Commun (indirect)', [0, 0, 0, 100, 0]))
                l['origine'] = 'clé par défaut du compte'
        elif mt:
            l['cle'] = mt['cle'] or 'arbitrage nominatif'
            tot = sum(abs(x) for x in mt['axes'])
            pct = [100 * abs(x) / tot for x in mt['axes']] if tot else DEF.get(l['cfa'], (None, [0, 0, 0, 100, 0]))[1]
            l['origine'] = 'modèle WE-FORM (ligne appariée)'
        else:
            l['cle'], pct = DEF.get(l['cfa'], ('Commun (indirect)', [0, 0, 0, 100, 0]))
            l['origine'] = 'clé par défaut du compte'
        l['pct'] = [round(x, 4) for x in pct]
        b = [round(l['montant'] * x / 100, 2) for x in pct]
        b[-1] = round(l['montant'] - sum(b[:-1]), 2)     # l'arrondi tombe sur le dernier axe non nul
        if pct[4] == 0 and b[4] != 0:                    # ne pas créer d'hors-périmètre par arrondi
            j = max(range(4), key=lambda k: abs(b[k]))
            b[j] = round(b[j] + b[4], 2); b[4] = 0.0
        l['axes'] = b
        l.pop('match', None)
    json.dump(res, open('vent_cfa.json', 'w'), ensure_ascii=False)
    return res

if __name__ == '__main__':
    R = ventiler()
    tot = sum(l['montant'] for l in R)
    ax = [round(sum(l['axes'][i] for l in R), 2) for i in range(5)]
    print(f'lignes ventilées : {len(R)}   résultat : {tot:,.2f}')
    for n, v in zip(AXES, ax): print(f'   {n:<22} {v:>13,.2f}')
    print(f'   {"contrôle somme":<22} {sum(ax):>13,.2f}')
    o = collections.Counter(l['origine'] for l in R)
    print(' origine du rattachement :', dict(o))
