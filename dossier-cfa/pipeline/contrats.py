# -*- coding: utf-8 -*-
"""Le décompte des contrats : effectif, durées, courts contrats, rattachement d'exercice."""
import sys, datetime, collections
sys.path.insert(0, '.')
import axes_cfa

DEB, FIN = datetime.date(2025, 4, 17), datetime.date(2026, 7, 31)
def dd(s): return datetime.date.fromisoformat(s) if s else None

def contrats():
    out = []
    for s in axes_cfa.stagiaires():
        a, b = dd(s['debut']), dd(s['fin'])
        if not (a and b): continue
        s['d'], s['f'] = a, b
        s['duree'] = round((b - a).days / 30.44, 2)
        # part du contrat qui tombe DANS l'exercice
        i0, i1 = max(a, DEB), min(b, FIN)
        s['mois_ex'] = round(max(0, (i1 - i0).days) / 30.44, 2)
        s['deborde'] = b > FIN
        s['commence_avant'] = a < DEB
        s['part_ex'] = round(s['mois_ex'] / s['duree'], 4) if s['duree'] else 0
        out.append(s)
    return out

def effectif_mensuel(C):
    """Effectif présent, entrées et sorties, mois par mois sur l'exercice."""
    mois = []
    y, m = 2025, 4
    while (y, m) <= (2026, 7):
        d0 = datetime.date(y, m, 1)
        d1 = datetime.date(y + (m == 12), (m % 12) + 1, 1) - datetime.timedelta(days=1)
        pres = [c for c in C if c['d'] <= d1 and c['f'] >= d0]
        ent = [c for c in C if d0 <= c['d'] <= d1]
        sor = [c for c in C if d0 <= c['f'] <= d1]
        mois.append({'mois': f'{m:02d}/{y}', 'presents': len(pres), 'entrees': len(ent),
                     'sorties': len(sor), 'titres': collections.Counter(c['titre'] for c in pres)})
        y, m = (y + (m == 12), (m % 12) + 1)
    return mois

if __name__ == '__main__':
    C = contrats()
    print(f'{len(C)} contrats datés')
    import statistics
    D = [c['duree'] for c in C]
    print(f'  durée : moyenne {statistics.mean(D):.2f} · médiane {statistics.median(D):.2f} · '
          f'min {min(D):.2f} · max {max(D):.2f} mois')
    print(f'  mois-apprenti dans l\'exercice : {sum(c["mois_ex"] for c in C):.2f}  (modèle : 544,42)')
    print(f'  contrats qui débordent sur l\'exercice 2 : {sum(1 for c in C if c["deborde"])}')
    print(f'  contrats commencés avant l\'exercice : {sum(1 for c in C if c["commence_avant"])}')
    print()
    print('  distribution des durées :')
    B = [(0,3,'moins de 3 mois'),(3,6,'3 à 6 mois'),(6,9,'6 à 9 mois'),(9,12,'9 à 12 mois'),(12,99,'12 mois et plus')]
    for lo,hi,lab in B:
        s=[c for c in C if lo<=c['duree']<hi]
        print(f'     {lab:<18} {len(s):>3} contrats   prise en charge {sum(c["prise_en_charge"] for c in s):>11,.2f}')
    print()
    print('  effectif mensuel :')
    for m in effectif_mensuel(C):
        print(f"     {m['mois']}  présents {m['presents']:>3}  entrées {m['entrees']:>3}  sorties {m['sorties']:>3}")
