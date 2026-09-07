# -*- coding: utf-8 -*-
"""Génère le grand-livre et la balance en plan comptable CFA, au format SECOGEST."""
import json, sys, datetime, collections
sys.path.insert(0, '.')
import plan_cfa, cloture
from render_gl import GL
from render_bal import BAL

PER   = 'Du 17/04/2025 au 31/07/2026'
PIED  = 'WE-FORM SARL — dossier CFA'
HORO  = datetime.date.today().strftime('%d/%m/%Y') + ' - 00:00'
SOC   = '155984 - SARL WE-FORM'

def d2s(s):
    j, m, a = s.split('/'); return (a, m, j)

E = json.load(open('gl_cfa.json'))
import corrections_releves
for _e in E:                                   # libellé repris quand le relevé nomme un autre tiers
    _c = corrections_releves.CORR.get(_e.get('idx'))
    if _c and _c[1]: _e['libelle'] = _c[1]
EC = cloture.journal(E)

# ---------- 1. lignes du grand-livre CFA ----------------------------------------
lignes = []
for e in E:
    lignes.append({'section': e['section'], 'cfa': e['cfa'], 'date': e['date'], 'piece': e['piece'],
                   'jnl': e['jnl'], 'libelle': e['libelle'], 'debit': e['debit'], 'credit': e['credit'],
                   'lettrage': e['lettrage'], 'aux': e['compte'] if e['section'] != 'GENERAUX' else None,
                   'aux_lib': e['intitule'] if e['section'] != 'GENERAUX' else None,
                   'src': e['compte'], 'motif': e['motif'], 'ord': e['idx'], 'idx': e['idx']})
for i, x in enumerate(EC):
    lignes.append({'section': x.get('section', 'GENERAUX'), 'cfa': x['cfa'], 'date': x['date'],
                   'piece': x['piece'], 'jnl': x['jnl'], 'libelle': x['libelle'], 'debit': x['debit'],
                   'credit': x['credit'], 'lettrage': '', 'aux': x.get('aux'), 'aux_lib': x.get('aux_lib'),
                   'src': 'CLÔTURE', 'motif': x['motif'], 'ord': 100000 + i,
                   'cle': x.get('cle'), 'pct': x.get('pct')})
# le compte d'attente 471 est soldé : ses lignes d'origine restent, la contrepartie de clôture aussi
json.dump(lignes, open('lignes_cfa.json', 'w'), ensure_ascii=False)

# ---------- 2. rendu du grand-livre ---------------------------------------------
g = GL('Grand_livre_CFA_WEFORM.pdf', 'Grands-livres des comptes clients',
       societe=SOC, periode=PER, edition='Édition définitive', pied=PIED, horodatage=HORO)

def bloc_section(sec, titre, cle_compte, cle_lib):
    """Rend une section (clients / fournisseurs / généraux)."""
    g.titre = titre
    if g.page > 1 or g.y > 118.0:
        g._close_rules(g.y); g._new_page()
    grp = collections.OrderedDict()
    for l in lignes:
        if l['section'] != sec: continue
        grp.setdefault(cle_compte(l), []).append(l)
    td = tc = 0.0
    for code in sorted(grp, key=lambda c: (plan_cfa.ORDRE.index(c) if c in plan_cfa.ORDRE else 999, c)) \
            if sec == 'GENERAUX' else sorted(grp):
        rows = sorted(grp[code], key=lambda l: (d2s(l['date']), l['ord']))
        d, c = g.bloc(code, cle_lib(rows[0]), rows)
        td += d; tc += c
    g.total(round(td, 2), round(tc, 2), round(td - tc, 2), label='Total des Mouvements')
    g.total(round(td, 2), round(tc, 2), round(td - tc, 2), label='Total du Grand-Livre')
    return round(td, 2), round(tc, 2)

AUXLIB = {}
for l in lignes:
    if l['aux']: AUXLIB[l['aux']] = l['aux_lib']

bloc_section('CLIENTS', 'Grands-livres des comptes clients',
             lambda l: l['aux'], lambda l: l['aux_lib'])
bloc_section('FOURNISSEURS', 'Grands-livres des comptes fournisseurs',
             lambda l: l['aux'], lambda l: l['aux_lib'])
bloc_section('GENERAUX', 'Grands-livres des comptes généraux',
             lambda l: l['cfa'], lambda l: plan_cfa.PLAN.get(l['cfa'], l['cfa']))
g.save()
print('grand-livre :', g.page, 'pages')

# ---------- 3. balance ------------------------------------------------------------
def solde(rows):
    d = sum(r['debit'] or 0 for r in rows); c = sum(r['credit'] or 0 for r in rows)
    return round(d, 2), round(c, 2), round(d - c, 2)

b = BAL('Balance_CFA_WEFORM.pdf', societe=SOC, periode=PER, pied=PIED, horo=HORO)
recap = []

def sec_balance(sec, titre, cle, lib, label):
    b.new_page(titre, 'std', 'Édition définitive')
    grp = collections.OrderedDict()
    for l in lignes:
        if l['section'] != sec: continue
        grp.setdefault(cle(l), []).append(l)
    TD = TC = 0.0
    for code in sorted(grp):
        d, c, s = solde(grp[code])
        TD += max(s, 0); TC += max(-s, 0)
        b.row(code, lib(grp[code][0]), s if s > 0 else None, -s if s < 0 else None)
    b.total(label, round(TD, 2), round(TC, 2), round(TD - TC, 2))
    recap.append((label, round(TD, 2), round(TC, 2), round(TD - TC, 2)))
    return round(TD, 2), round(TC, 2)

sec_balance('CLIENTS', 'Balance des comptes clients', lambda l: l['aux'], lambda l: l['aux_lib'], 'Total Clients')
sec_balance('FOURNISSEURS', 'Balance des comptes fournisseurs', lambda l: l['aux'], lambda l: l['aux_lib'], 'Total Fournisseurs')

# généraux, par classe
b.new_page('Balance des comptes généraux', 'std', 'Édition définitive')
grp = collections.OrderedDict()
for l in lignes:
    if l['section'] != 'GENERAUX': continue
    grp.setdefault(l['cfa'], []).append(l)
# les collectifs 401 / 411 reprennent les auxiliaires
for sec, code in (('FOURNISSEURS', '401'), ('CLIENTS', '411')):
    grp.setdefault(code, [])
    grp[code] += [l for l in lignes if l['section'] == sec]
classes = collections.OrderedDict()
for code in plan_cfa.ORDRE:
    if code in grp: classes.setdefault(plan_cfa.classe(code), []).append(code)
TOTD = TOTC = 0.0
cl_tot = {}
for cl, codes in classes.items():
    CD = CC = 0.0
    for code in codes:
        d, c, s = solde(grp[code])
        CD += max(s, 0); CC += max(-s, 0)
        b.row(code, plan_cfa.PLAN.get(code, code), s if s > 0 else None, -s if s < 0 else None)
    b.total(f'Total Classe {cl}', round(CD, 2), round(CC, 2), round(CD - CC, 2))
    cl_tot[cl] = (round(CD, 2), round(CC, 2))
    TOTD += CD; TOTC += CC
    recap.append((f'Total Classe {cl}', round(CD, 2), round(CC, 2), round(CD - CC, 2)))
bilan_d = sum(cl_tot[c][0] for c in cl_tot if c in '1245')
bilan_c = sum(cl_tot[c][1] for c in cl_tot if c in '1245')
gest_d  = sum(cl_tot[c][0] for c in cl_tot if c in '67')
gest_c  = sum(cl_tot[c][1] for c in cl_tot if c in '67')
resultat = round(gest_c - gest_d, 2)
b.total('Total Bilan', round(bilan_d, 2), round(bilan_c, 2), round(bilan_d - bilan_c, 2))
b.total('Total Gestion - ' + ('Bénéfice' if resultat >= 0 else 'Perte'), round(gest_d, 2), round(gest_c, 2), resultat)
b.total('Total Cumulé', round(TOTD, 2), round(TOTC, 2), 0)

# récapitulation
b.new_page('Récapitulation de la Balance', 'recap', 'Édition définitive')
for lab, dd, cc, nn in recap:
    b.rtotal(lab, dd, cc, abs(nn), 'd' if nn >= 0 else 'c')
b.rtotal('Total Balance', round(TOTD, 2), round(TOTC, 2), None)
b.rtotal('Total Bilan', round(bilan_d, 2), round(bilan_c, 2), abs(round(bilan_d - bilan_c, 2)),
         'd' if bilan_d >= bilan_c else 'c')
b.rtotal('Total Gestion', round(gest_d, 2), round(gest_c, 2), abs(resultat),
         'c' if resultat >= 0 else 'd', extra=('Bénéfice ' if resultat >= 0 else 'Perte ') + f'{abs(resultat):,.2f}'.replace(',', ' ').replace('.', ','))
b.save()
print('balance :', b.page, 'pages')
print(f'RÉSULTAT CFA = {resultat:,.2f}   | bilan D {bilan_d:,.2f} / C {bilan_c:,.2f} | équilibre {round(TOTD-TOTC,2)}')
json.dump({'resultat': resultat, 'classes': cl_tot, 'recap': recap}, open('balance_cfa.json', 'w'), ensure_ascii=False)
