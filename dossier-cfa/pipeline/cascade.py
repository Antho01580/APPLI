# -*- coding: utf-8 -*-
"""Cascade de répartition du COMMUN sur les activités, puis des activités sur les titres."""
import json, collections, openpyxl

XLSX = '/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/c148ab38-SECOGESTWEFORMexercice12.xlsx'
CLE1_AURA = 5.00      # part de la Ligue AURA dans le commun (32 jours de Xavier sur 600)
CLE2_FPC  = 6.01      # part de la formation continue dans le reste (part des produits FPC)
QP_AURA   = 4592.26   # quote-part des moyens de la formation continue reprise par la Ligue AURA

def titres():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb['5. Par formation']
    out = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0: continue
        def num(x):
            try: return float(x)
            except (TypeError, ValueError): return 0.0
        out.append({'code': r[0], 'nom': r[1], 'contrats': int(num(r[2])), 'mois': num(r[3]),
                    'prise_en_charge': num(r[4]), 'produits_modele': num(r[5]),
                    'direct_modele': num(r[6]), 'qp_modele': num(r[7]), 'marge_modele': num(r[9])})
    return out

def repartir(axes):
    """axes = [App, FPC, AURA, Commun, HP] -> dict détaillé de la cascade."""
    app, fpc, aura, commun, hp = axes
    a1 = round(commun * CLE1_AURA / 100, 2)               # vers Ligue AURA
    reste = round(commun - a1, 2)
    a2 = round(reste * CLE2_FPC / 100, 2)                 # vers formation continue
    a3 = round(reste - a2, 2)                             # vers apprentissage
    return {'commun': commun, 'vers_aura': a1, 'vers_fpc': a2, 'vers_app': a3,
            'app': round(app + a3, 2), 'fpc': round(fpc + a2 + QP_AURA, 2),
            'aura': round(aura + a1 - QP_AURA, 2), 'hp': hp}

if __name__ == '__main__':
    R = json.load(open('vent_cfa.json'))
    ax = [round(sum(l['axes'][i] for l in R), 2) for i in range(5)]
    c = repartir(ax)
    print('AVANT CASCADE');  print('  ', ax)
    print('CASCADE : commun %.2f -> AURA %.2f | FPC %.2f | APP %.2f' % (c['commun'], c['vers_aura'], c['vers_fpc'], c['vers_app']))
    print(f"  quote-part Ligue AURA sur les moyens FPC : {QP_AURA:,.2f}")
    print('APRÈS CASCADE')
    for k, lab in (('app','Apprentissage'),('fpc','Formation continue'),('aura','Ligue AURA'),('hp','Hors périmètre')):
        print(f'   {lab:<22} {c[k]:>13,.2f}')
    print(f"   {'RÉSULTAT':<22} {c['app']+c['fpc']+c['aura']+c['hp']:>13,.2f}")
    print()
    T = titres(); tm = sum(t['mois'] for t in T)
    print(f'titres : {len(T)} | mois-apprenti total {tm:.2f}')
