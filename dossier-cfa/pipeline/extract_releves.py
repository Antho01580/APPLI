# -*- coding: utf-8 -*-
"""Extraction des relevés Banque Populaire — compte 92521637980."""
import pdfplumber, glob, os, re, json, collections

FS = sorted(glob.glob('/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/*Extrait_de_compte*.pdf'),
            key=lambda f: re.search(r'__(\d{8})\.pdf', f).group(1))
DATE = re.compile(r'^(\d{2}/\d{2})\s+(.*?)\s+(\d{2}/\d{2})\s+(\d{2}/\d{2})\s+(-?\s?[\d\s]+,\d{2})\s*€?$')
SOLDE = re.compile(r'SOLDE (CREDITEUR|DEBITEUR) AU (\d{2}/\d{2}/\d{4})\s+(-?[\d\s]+,\d{2})')
def num(s): return round(float(s.replace('€','').replace(' ','').replace(' ','').replace(' ','').replace(',','.')),2)

OPS = []; SOLDES = []
for f in FS:
    releve = re.search(r'__(\d{8})\.pdf', f).group(1)
    pdf = pdfplumber.open(f)
    lines = []
    for pg in pdf.pages:
        lines += (pg.extract_text() or '').split('\n')
    cur = None
    for ln in lines:
        ln = ln.strip()
        s = SOLDE.search(ln)
        if s: SOLDES.append({'releve': releve, 'sens': s.group(1), 'date': s.group(2), 'montant': num(s.group(3))})
        m = DATE.match(ln)
        if m:
            jj, mm = m.group(1).split('/')
            an = int(releve[:4]); am = int(releve[4:6])
            if int(mm) > am + 6: an -= 1          # opération de décembre sur un relevé de janvier
            cur = {'releve': releve, 'date_compta': f'{jj}/{mm}/{an}', 'libelle': m.group(2).strip(),
                   'date_op': m.group(3), 'date_val': m.group(4), 'montant': num(m.group(5)), 'motif': []}
            OPS.append(cur)
        elif cur is not None and ln and not re.match(r'^(Page|DATE|LIBELLE|SOLDE|TOTAL|DETAIL|BANQUE|Votre|SARL|CHEZ|\d{5}|JE CONSERVE|CE DOCUMENT|\d{4}$|\d{8}\*)', ln) \
             and 'BPCE' not in ln and 'RCS Dijon' not in ln and len(ln) < 90:
            cur['motif'].append(ln)
for o in OPS: o['motif'] = ' · '.join(o['motif'])
json.dump({'ops': OPS, 'soldes': SOLDES}, open('releves.json','w'), ensure_ascii=False, indent=1)
print(f'{len(OPS)} opérations extraites sur {len(FS)} relevés')
print(f'  débits  {sum(o["montant"] for o in OPS if o["montant"]<0):>12,.2f}')
print(f'  crédits {sum(o["montant"] for o in OPS if o["montant"]>0):>12,.2f}')
print()
for s in SOLDES: print(f"  solde {s['sens'].lower():<10} au {s['date']} : {s['montant']:>12,.2f}")
print()
c = collections.Counter(o['releve'] for o in OPS)
for k,v in sorted(c.items()): print(f'  relevé {k} : {v} opérations')
