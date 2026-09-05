# -*- coding: utf-8 -*-
"""Les notes de frais — compte fournisseur FFRAIS, note par note, avec leur imputation."""
import json, collections, datetime, re, unicodedata

E = json.load(open('gl_cfa.json'))
def dt(e): return datetime.datetime.strptime(e['date'], '%d/%m/%Y').date()

PERS = [('GRANDCLEMENT','Anthony GRANDCLEMENT'),('GRANCLEMENT','Anthony GRANDCLEMENT'),
        ('ANTHONY G','Anthony GRANDCLEMENT'),
        ('GAUSSENS','Xavier GAUSSENS'),('GANSSENS','Xavier GAUSSENS'),
        ('HOUVENAGHEL','Stéphanie HOUVENAGHEL'),('HOUVEHAGHEL','Stéphanie HOUVENAGHEL'),
        ('MARGUIN','Mélanie MARGUIN'),('DONIN','Baptiste DONIN'),('ZEH','Pauline ZEH'),
        ('VIGNOLINI','Océane VIGNOLINI'),('RABAULT','Sébastien RABAULT'),('SEBASTIEN','Sébastien RABAULT')]
def qui(lib):
    u = lib.upper()
    for k, v in PERS:
        if k in u: return v
    return 'Autres (jury, divers)'

NOTES = [e for e in E if e['compte'] == 'FFRAIS' and e['credit']]
CHG = [e for e in E if e['section'] == 'GENERAUX' and e['compte'][0] in '26'
       and e['debit'] and 'NOTE DE FRAIS' in e['libelle'].upper() and 'JURY' not in e['libelle'].upper()]

# regroupement des lignes de charge par (date, personne)
grp = collections.defaultdict(list)
for c in CHG: grp[(c['date'], qui(c['libelle']))].append(c)

for n in NOTES:
    n['qui'] = qui(n['libelle'])
    n['imp'] = []
same = collections.defaultdict(list)
for n in NOTES: same[(n['date'], n['qui'])].append(n)
for k, notes in same.items():
    lignes = grp.get(k, [])
    tn = round(sum(x['credit'] for x in notes), 2)
    tl = round(sum(x['debit'] for x in lignes), 2)
    for n in notes:
        n['imp'] = lignes if abs(tn - tl) < 0.02 else lignes
        n['ok'] = abs(tn - tl) < 0.02
        n['tl'] = tl; n['tn'] = tn

g = collections.defaultdict(list)
for n in NOTES: g[n['qui']].append(n)

REGL = [e for e in E if e['compte'] == 'FFRAIS' and e['debit']]
print(f"NOTES DE FRAIS — compte fournisseur FFRAIS, {len(NOTES)+len(REGL)} lignes au grand livre")
print(f"  {len(NOTES)} notes comptabilisées   {sum(n['credit'] for n in NOTES):>12,.2f} €")
print(f"  {len(REGL)} règlements              {sum(e['debit'] for e in REGL):>12,.2f} €")
print(f"  solde débiteur au 31/07/2026        {sum(e['debit'] or 0 for e in E if e['compte']=='FFRAIS')-sum(e['credit'] or 0 for e in E if e['compte']=='FFRAIS'):>12,.2f} €")

for who in sorted(g, key=lambda w: -sum(n['credit'] for n in g[w])):
    Ls = sorted(g[who], key=dt)
    print('\n' + '='*112)
    print(f"{who}  —  {len(Ls)} notes, {sum(n['credit'] for n in Ls):,.2f} €")
    print('-'*112)
    print(f"{'Date':<11}{'Libellé de la note':<52}{'Montant':>10}   Imputation au grand livre")
    for n in Ls:
        det = ' + '.join(f"{c['compte']} {c['debit']:,.2f}" for c in n['imp']) if n['imp'] else '—'
        if len(n['imp']) > 3: det = ' + '.join(f"{c['compte']} {c['debit']:,.2f}" for c in n['imp'][:3]) + f" + {len(n['imp'])-3} autres"
        print(f"{n['date']:<11}{n['libelle'][:50]:<52}{n['credit']:>10,.2f}   {det}")
    par = collections.defaultdict(float)
    for k in {(n['date'], n['qui']) for n in Ls}:
        for c in grp.get(k, []): par[c['compte']] += c['debit']
    print(f"   → imputation totale : " + ' · '.join(f"{k} {v:,.2f}" for k, v in sorted(par.items(), key=lambda x: -x[1])))
