import json, collections, sys
sys.path.insert(0,'.')
import mapping, plan_cfa
d=json.load(open('gl_raw.json'))
E=[e for e in d['entries'] if e['jnl']!='CENTRA']
for i,e in enumerate(E): e['idx']=i
agg=collections.defaultdict(lambda:[0.0,0.0,0])
motifs=collections.Counter()
for e in E:
    cfa,motif=mapping.compte_cfa(e)
    e['cfa'],e['motif']=cfa,motif
    a=agg[cfa]; a[0]+=e['debit'] or 0; a[1]+=e['credit'] or 0; a[2]+=1
    motifs[motif]+=1
json.dump(E,open('gl_cfa.json','w'),ensure_ascii=False)
inconnu=[c for c in agg if c not in plan_cfa.PLAN]
print('comptes CFA utilisés:',len(agg),'| inconnus:',inconnu)
print()
print(f"{'CFA':<9} {'n':>5} {'débit':>13} {'crédit':>13} {'solde':>13}  intitulé")
r6=r7=0
for c in plan_cfa.ORDRE:
    if c not in agg: continue
    v=agg[c]; s=v[0]-v[1]
    if c[0]=='6': r6+=s
    if c[0]=='7': r7+=s
    print(f'{c:<9} {v[2]:>5} {v[0]:>13,.2f} {v[1]:>13,.2f} {s:>13,.2f}  {plan_cfa.PLAN[c][:46]}')
print()
print(f'CHARGES (classe 6) = {r6:,.2f}   PRODUITS (classe 7) = {-r7:,.2f}   RÉSULTAT = {-r7-r6:,.2f}')
