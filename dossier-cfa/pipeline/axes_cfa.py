# -*- coding: utf-8 -*-
"""Axes analytiques CFA : par lieu de présentiel, par outil, par matériel pédagogique,
par formation et par stagiaire — tous construits sur les LIGNES DU GRAND LIVRE."""
import json, re, collections, openpyxl
XLSX = '/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/c148ab38-SECOGESTWEFORMexercice12.xlsx'

# ---- lieux de présentiel : (nom du lieu, comptes concernés, motif de reconnaissance)
LIEUX = [
 ("FC Saint-Claude — le bureau à l'année",      r'FCSC|SAINT CLAUDE', ('6132.9',)),
 ("FC Saint-Claude — le séminaire de mai",      r'FCSC|SAINT CLAUDE', ('6132.1',)),
 ("Stade Français — salle, intervention, repas", r'STADE FRANCAIS',   ('6132.1','6238','6257')),
 ("Paris 13 Atletico",                          r'PARIS 13|PARIS',    ('6132.1','6238')),
 ("Aurillac",                                   r'AURILLAC',          ('6132.1','6238')),
 ("TLG Group",                                  r'TLG',               ('6132.1',)),
 ("MOB Coworking — les certifications",         r'MOB COWORKING',     ('6132.1',)),
 ("MOB Coworking — réunions et équipe",         r'MOB COWORKING',     ('6132.9','6257')),
 ("NovaSystem — salles des jurys",              r'NOVASYSTEM',        ('6132.1',)),
 ("Quai des Lanternes — séminaire de clôture",  r'QUAI DES LANTERNES', ('6132.9',)),
 ("Valserhône / Athletic Club — partenariats",  r'VALSERHONE|ATHLETIC',('6238',)),
 ("Hébergement et restauration des apprentis",  r'.',                 ('6257',)),
]

def par_lieu(R):
    out = []
    pris = set()
    for nom, pat, comptes in LIEUX:
        sel = [l for l in R if l['cfa'] in comptes and re.search(pat, l['libelle'], re.I)
               and id(l) not in pris]
        for l in sel: pris.add(id(l))
        if not sel: continue
        out.append({'lieu': nom, 'montant': round(sum(l['montant'] for l in sel), 2),
                    'n': len(sel), 'comptes': ' '.join(sorted({l['cfa'] for l in sel})),
                    'axes': [round(sum(l['axes'][i] for l in sel), 2) for i in range(5)]})
    reste = [l for l in R if l['cfa'] in ('6132.1','6132.9','6257','6238') and id(l) not in pris]
    if reste:
        out.append({'lieu': 'Autres locations et présentiels', 'n': len(reste),
                    'montant': round(sum(l['montant'] for l in reste), 2),
                    'comptes': ' '.join(sorted({l['cfa'] for l in reste})),
                    'axes': [round(sum(l['axes'][i] for l in reste), 2) for i in range(5)]})
    return sorted(out, key=lambda x: x['montant'])

# ---- outils : fournisseur -> applicatif (repris des feuilles 7 et 8 du dossier WE-FORM)
APPLI = {
 'WE-APP':    r'BOLT|STACKB|SUPABASE|RENDER|VERCEL|NETLIFY|HETZNER',
 'WE-CLUB':   r'LECLUB|CLUB200|API.?SPORTS|SMARTSMAP|AGORA|JAAS|8X8',
 'WEFORM.FR': r'IONOS|OVH|DOMAINE|WEB|SITE|IPT|KEY CREATION|WERYJAL|ZIO',
 'WE-ADMIN':  r'DIGIFORMA|A WORLD FOR US|GOCARDLESS|ODOO|MICROSOFT|GOOGLE|MAILJET',
 'WE-CRM':    r'NURYKA|FILIZ|NOTTA|SCRIBD|OBSIDIAN|PERPLEXITY|GAMMA|CANVA|FOXIT',
 'WE-TRESO':  r'FYGR|OKIMIA|PPG|PAYPAL',
}
FOURN = [
 ('Nellapp / Dante', r'DANTE|NELLAPP'), ('Bolt (StackBlitz)', r'BOLT|STACKB'),
 ('SCORM Cloud (A Labos)', r'SCORM|A LABOS|ALABOS'), ('Seedance', r'SEEDANCE'),
 ('Filiz', r'FILIZ'), ('Supabase', r'SUPABASE'), ('8x8 / JaaS (visio)', r'8X8|JAAS'),
 ('Anthropic', r'ANTHROPIC|CLAUDE'), ('Digiforma', r'DIGIFORMA'),
 ('OpenAI — ChatGPT', r'OPENAI|CHAT ?GPT'), ('HeyGen', r'HEYGEN'),
 ('Microsoft 365 / Teams', r'MICROSOFT'), ('A World For Us (GoCardless)', r'A WORLD FOR US|GC RE'),
 ('Odoo', r'ODOO'), ('Fygr / Okimia', r'FYGR|OKIMIA'), ('Google Workspace / Cloud', r'GOOGLE'),
 ('Foxit (PDF)', r'FOXIT'), ('Canva', r'CANVA'), ('Nuryka', r'NURYKA'),
 ('Expert Software / Mindomo', r'MINDOMO|EXPERT SOFTWARE'), ('Gamma', r'GAMMA'),
 ('Agora.io (visio)', r'AGORA'), ('PPG', r'PPG'), ('Vercel', r'VERCEL'),
 ('Zio Studio', r'ZIO'), ('Perplexity', r'PERPLEXITY'), ('Weryjal', r'WERYJAL'),
 ('API-Sports', r'API.?SPORTS'), ('SmartsMap', r'SMARTSMAP'), ('Render.com', r'RENDER'),
 ('Obsidian', r'OBSIDIAN'), ('Hetzner', r'HETZNER'), ('Netlify', r'NETLIFY'),
 ('Domaines (IONOS, OVH)', r'IONOS|OVH'), ('Notta (transcription)', r'NOTTA'),
 ('Scribd', r'SCRIBD'), ('Mailjet', r'MAILJET'), ('KEYYO / téléphonie', r'KEYYO|BOUYGUES'),
]
COMPTES_OUTIL = ('6156.2', '6156.9', '627', '6022.1', '6022.2', '626')

def par_outil(R):
    sel = [l for l in R if l['cfa'] in COMPTES_OUTIL]
    apps, pris = [], set()
    for nom, pat in APPLI.items():
        s = [l for l in sel if re.search(pat, l['libelle'], re.I) and id(l) not in pris]
        for l in s: pris.add(id(l))
        apps.append({'applicatif': nom, 'montant': round(sum(l['montant'] for l in s), 2), 'n': len(s),
                     'axes': [round(sum(l['axes'][i] for l in s), 2) for i in range(5)]})
    autres = [l for l in sel if id(l) not in pris]
    apps.append({'applicatif': 'Outils communs et frais non rattachés', 'n': len(autres),
                 'montant': round(sum(l['montant'] for l in autres), 2),
                 'axes': [round(sum(l['axes'][i] for l in autres), 2) for i in range(5)]})
    fs, pris2 = [], set()
    for nom, pat in FOURN:
        s = [l for l in sel if re.search(pat, l['libelle'], re.I) and id(l) not in pris2]
        for l in s: pris2.add(id(l))
        if not s: continue
        fs.append({'fournisseur': nom, 'montant': round(sum(l['montant'] for l in s), 2), 'n': len(s),
                   'comptes': ' '.join(sorted({l['cfa'] for l in s}))})
    autres2 = [l for l in sel if id(l) not in pris2]
    if autres2:
        fs.append({'fournisseur': 'Autres fournisseurs et frais', 'n': len(autres2),
                   'montant': round(sum(l['montant'] for l in autres2), 2),
                   'comptes': ' '.join(sorted({l['cfa'] for l in autres2}))})
    return sorted(apps, key=lambda x: x['montant']), sorted(fs, key=lambda x: x['montant'])

# ---- matériel pédagogique
MATERIEL = [
 ('Ordinateurs portables des apprentis (SMART AINFO)', r'SMART ?AINFO|SMART AINFO'),
 ('Vêtements et équipement sportif (JEQUIPE2)',        r'JEQUIPE2'),
 ('Supports imprimés et carnets (VISTAPRINT)',         r'VISTAPRINT'),
 ('PC portable remis à un stagiaire (CARREFOUR)',      r'CARREFOUR'),
 ('Cartes étudiantes (NURYKA)',                        r'NURYKA'),
 ('Casques et périphériques (ONEDIRECT)',              r'ONEDIRECT'),
 ('Avances et soldes sur équipement',                  r'FRAIS PC|SMART'),
]
def par_materiel(R, lignes):
    sel = [l for l in R if l['cfa'] in ('6068', '6064')]
    out, pris = [], set()
    for nom, pat in MATERIEL:
        s = [l for l in sel if re.search(pat, l['libelle'], re.I) and id(l) not in pris]
        for l in s: pris.add(id(l))
        if not s: continue
        out.append({'poste': nom, 'montant': round(sum(l['montant'] for l in s), 2), 'n': len(s),
                    'comptes': ' '.join(sorted({l['cfa'] for l in s})),
                    'axes': [round(sum(l['axes'][i] for l in s), 2) for i in range(5)]})
    autres = [l for l in sel if id(l) not in pris]
    if autres:
        out.append({'poste': 'Autres fournitures et petit équipement', 'n': len(autres),
                    'montant': round(sum(l['montant'] for l in autres), 2), 'comptes': '6064',
                    'axes': [round(sum(l['axes'][i] for l in autres), 2) for i in range(5)]})
    immo = [l for l in lignes if l['cfa'] in ('205', '2183')]
    for l in immo:
        out.append({'poste': f"Immobilisé — {l['libelle'][:44]}", 'n': 1,
                    'montant': -round((l['debit'] or 0) - (l['credit'] or 0), 2),
                    'comptes': l['cfa'] + ' (bilan)', 'axes': [0, 0, 0, 0, 0]})
    return sorted(out, key=lambda x: x['montant'])

def stagiaires():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb['6. Par stagiaire']
    out = []
    for i, r in enumerate(ws.iter_rows(values_only=True)):
        if i == 0: continue
        def num(x):
            try: return float(x)
            except (TypeError, ValueError): return 0.0
        # colonnes réelles : Stagiaire · Titre · Intitulé du contrat · Début · Fin ·
        #                    Prise en charge · Charges nominatives · Lignes · Réserve
        out.append({'nom': r[0], 'titre': r[1], 'intitule': r[2],
                    'debut': str(r[3])[:10] if r[3] else '', 'fin': str(r[4])[:10] if r[4] else '',
                    'prise_en_charge': num(r[5]), 'charges_nominatives': num(r[6]),
                    'lignes': int(num(r[7])), 'reserve': r[8] if len(r) > 8 else None})
    return out
