# -*- coding: utf-8 -*-
"""Rapprochement relevés bancaires ↔ compte 5120000 du grand livre (24/04 → 29/08/2025)."""
import json, datetime, collections, re, unicodedata
R = json.load(open('releves.json'))['ops']
E = json.load(open('gl_cfa.json'))
def d(s): return datetime.datetime.strptime(s, '%d/%m/%Y').date()
DEB, FIN = d('17/04/2025'), d('31/07/2026')
GL = [e for e in E if e['compte'] == '5120000' and DEB <= d(e['date']) <= FIN]
def mg(e): return round((e['credit'] or 0) * -1 + (e['debit'] or 0), 2)   # signe banque

print(f'relevés : {len(R)} opérations, net {sum(o["montant"] for o in R):,.2f}')
print(f'grand livre 5120000 sur la même période : {len(GL)} lignes, net {sum(mg(e) for e in GL):,.2f}')
print()

# appariement par montant + date proche
idx = collections.defaultdict(list)
for e in GL: idx[round(e_m := mg(e), 2)].append(e)
used = set(); pairs = []; orphR = []
for o in sorted(R, key=lambda o: abs(o['montant']), reverse=True):
    c = [e for e in idx.get(o['montant'], []) if id(e) not in used]
    if c:
        c.sort(key=lambda e: abs((d(e['date']) - d(o['date_compta'])).days))
        if abs((d(c[0]['date']) - d(o['date_compta'])).days) <= 10:
            used.add(id(c[0])); pairs.append((o, c[0])); continue
    orphR.append(o)
orphG = [e for e in GL if id(e) not in used]
print(f'appariés : {len(pairs)} | relevé sans écriture : {len(orphR)} ({sum(o["montant"] for o in orphR):,.2f})'
      f' | écriture sans relevé : {len(orphG)} ({sum(mg(e) for e in orphG):,.2f})')
print()
if orphR:
    print('--- opérations du relevé absentes du grand livre ---')
    for o in sorted(orphR, key=lambda o: d(o['date_compta'])):
        print(f"   {o['date_compta']} {o['libelle'][:52]:<54} {o['montant']:>11,.2f}   « {o['motif'][:44]} »")
if orphG:
    print('--- écritures du grand livre absentes du relevé ---')
    for e in sorted(orphG, key=lambda e: d(e['date'])):
        print(f"   {e['date']} {e['libelle'][:52]:<54} {mg(e):>11,.2f}")
print()
# libellés qui divergent
def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').upper())
    return re.sub(r'[^A-Z0-9]', '', ''.join(c for c in s if not unicodedata.combining(c)))
div = [(o, e) for o, e in pairs
       if not (norm(o['libelle'])[:14] in norm(e['libelle']) or norm(e['libelle'])[:14] in norm(o['libelle']))]
print(f'--- libellés divergents entre relevé et grand livre : {len(div)} ---')
for o, e in sorted(div, key=lambda t: -abs(t[0]['montant']))[:40]:
    print(f"   {o['date_compta']} {o['montant']:>10,.2f}")
    print(f"        relevé : {o['libelle'][:62]}   « {o['motif'][:56]} »")
    print(f"        GL     : {e['libelle'][:62]}   [{e['compte']} → {e['cfa']}]")
json.dump({'pairs': [[o, {k: e[k] for k in ('date','libelle','compte','cfa','debit','credit','idx')}] for o, e in pairs],
           'orphR': orphR, 'orphG': orphG}, open('rec_releves.json','w'), ensure_ascii=False)
