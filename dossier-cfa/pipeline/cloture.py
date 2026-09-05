# -*- coding: utf-8 -*-
"""Écritures de clôture au 31/07/2026 — journal EI, en comptes CFA.

Chaque écriture est équilibrée et porte son motif.  Les libellés du grand livre
d'origine ne sont jamais modifiés : ces écritures s'ajoutent, elles ne remplacent rien.
"""
import json, sys
sys.path.insert(0, '.')
import mapping, match

XLSX = '/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/c148ab38-SECOGESTWEFORMexercice12.xlsx'

DATE = '31/07/2026'
JNL = 'EI'

# --- ventilation du compte d'attente : chaque ligne hérite du compte CFA
#     retenu par le modèle analytique WE-FORM (appariement au centime).
VENT_471 = {          # regex sur le libellé de la ligne 4710000 -> compte CFA
 r'MOB COWORKING':            '6132.9',
 r'BOUYGUES|LA POSTE':        '626',
 r'LAVAGE|MIDAS|VW BANK':     '615',
 r'AUTO ECOLE|PERMIS':        '6251',
 r'CHARLOTTE CALLAND':        '623',
 r'CARTE ETUDIANT|NURYKA':    '6156.9',
 r'8X8|MEETINGS':             '6156.9',
 r'QUAI DES LANTERNES|SEMINAIRE': '6132.9',
 r'RBSR PRELEVEMENT SEDOM':   '6226.1',
 r'RBRT FRAIS PC':            '6068',
 r'REGUL APICIL':             '645.1',
 r'PHARMACIE':                '6064',
 r'AUX TROIS OBUS|LES ZINCS': '6257',
 r'SEDOMICILIER':             '6132.9',
}
# décomposition du lot « CARTE FACTURETTES CB » du 31/07/2026 (8 275,52),
# reconstituée depuis le détail de juillet du modèle WE-FORM — bouclage au centime.
LOT_CB = [
 ('6257',   2294.08, "AIRBNB HM8DPE — hébergement",                  'arbitrage nominatif', [0, 0, 0, 0, 100]),
 ('6256.9', 1436.64, "déplacements et restauration de juillet",       'Commun (indirect)',   [0, 0, 0, 100, 0]),
 ('6256.9', 1341.46, "BOOKING — réservation hôtel (annulée, remboursée le 16/07)", 'Hors périmètre', [0, 0, 0, 0, 100]),
 ('6156.9',  760.06, "abonnements SaaS de juillet",                   'Personnalisé',        [33, 29, 0, 38, 0]),
 ('6022.2',  700.00, "SCORM ALABOS — deux achats de cours (02/07 et 18/07)", 'FPC',          [0, 100, 0, 0, 0]),
 ('615',     597.76, "CENTRAL AUTOS — entretien du véhicule",         'Structure 90/10',     [75, 8.3, 0, 16.7, 0]),
 ('6156.2',  487.03, "abonnements IA de juillet — ventilés par clé",  'arbitrage nominatif', [19, 61.9, 14.6, 4.5, 0]),
 ('6064',    377.99, "fournitures — CULTURA, LECLERC, Action",        'Personnalisé',        [0, 0, 0, 0, 100]),
 ('626',     257.50, "KEYYO — téléphonie",                            'Commun (indirect)',   [0, 0, 0, 100, 0]),
 ('6132.9',   23.00, "MOB COWORKING — usage ponctuel",                'arbitrage nominatif', [0, 0, 0, 100, 0]),
]
# --- factures non parvenues : soldes débiteurs des comptes fournisseurs au 31/07/2026
FNP = [
 ('FCELLES',    '6226.1', 1190.90, "L'École pour Celles — prestation d'animation de juillet, facture non parvenue"),
 ('FMOB',       '6257',    691.70, "MOB COWORKING — repas des apprentis, facture non parvenue"),
 ('FMOB',       '6132.9',  202.40, "MOB COWORKING — usages ponctuels, factures non parvenues"),
 ('FJURY',      '6226.1',  699.50, "Jurys de certification — indemnités versées, notes non parvenues"),
 ('FSUIVIJURY', '6226.1',  499.80, "Pierrick MALLET — formateur juin, facture non parvenue"),
 ('FSUIVIJURY', '6226.3',  180.20, "Pierrick MALLET — part BPJEPS Ligue AURA, facture non parvenue"),
 ('FFRAIS',     '6256.9',  557.30, "Notes de frais réglées et non comptabilisées"),
 ('FSMART',     '6068',    500.00, "SMART AINFO — solde versé sur le lot de PC des apprentis"),
 ('FDUTERTRE',  '6226.1',  300.00, "Carine DUTERTRE — formateur juin, facture non parvenue"),
 ('FUBER',      '6256.9',    4.38, "UBER — course réglée et non facturée"),
]

def journal(E):
    """Retourne la liste des écritures de clôture (dicts compatibles grand livre)."""
    import re
    ec = []
    def add(ref, cfa, lib, deb=None, cre=None, motif='', section='GENERAUX', aux=None, aux_lib=None):
        ec.append({'ref': ref, 'cfa': cfa, 'date': DATE, 'jnl': JNL, 'piece': ref,
                   'libelle': lib, 'debit': deb, 'credit': cre, 'motif': motif,
                   'section': section, 'lettrage': '', 'aux': aux, 'aux_lib': aux_lib,
                   'cle': None, 'pct': None})

    # CL-1 — rémunération de gérance de Stéphanie HOUVENAGHEL
    add('CL-1', '644',  "REM GERANCE STEPHANIE HOUVENAGHEL - RECLASSEMENT DU 28/02/2026", deb=15000.00,
        motif="Le versement du 28/02/2026 est une rémunération de gérance ; il porte le total de l'exercice à 34 500,00 €.")
    add('CL-1', '4551', "REM GERANCE STEPHANIE HOUVENAGHEL - RECLASSEMENT DU 28/02/2026", cre=15000.00,
        motif="Le reversement du 25/05/2026 devient un apport en compte courant : la société lui doit 15 000,00 € au 31/07/2026.")
    # CL-2 / CL-3 — cotisations sociales des gérants
    add('CL-2', '645.9', "CHARGES SOCIALES SUR REMUNERATION DE GERANCE - XAVIER GAUSSENS", deb=12600.00,
        motif="Calculées sur la totalité de la rémunération décidée (27 500,00 €). Aucune cotisation versée dans l'exercice.")
    add('CL-2', '438',   "CHARGES SOCIALES SUR REMUNERATION DE GERANCE - XAVIER GAUSSENS", cre=12600.00, motif="Contrepartie.")
    add('CL-3', '645.9', "CHARGES SOCIALES SUR REMUNERATION DE GERANCE - STEPHANIE HOUVENAGHEL", deb=7500.30,
        motif="Calculées sur la totalité de la rémunération décidée (34 500,00 €).")
    add('CL-3', '438',   "CHARGES SOCIALES SUR REMUNERATION DE GERANCE - STEPHANIE HOUVENAGHEL", cre=7500.30, motif="Contrepartie.")

    # CL-4 — SUPPRIMÉE : le compte d'attente 4710000 est CONSERVÉ tel quel.
    # Décision du 05/09/2026 : ses 93 opérations restent en attente d'imputation ;
    # elles ne sont donc pas des charges de l'exercice. Le détail figure à l'onglet
    # « 14. Compte d'attente » du dossier analytique.

    # CL-5 — factures non parvenues (soldes débiteurs fournisseurs)
    for aux, cfa, m, why in FNP:
        add('CL-5', cfa, f"FNP {aux} - {why.split(' — ')[0].upper()}", deb=m, motif=why)
    AUXLIB = {}
    for e in E:
        if e['section'] == 'FOURNISSEURS': AUXLIB[e['compte']] = e['intitule']
    par_aux = {}
    for aux, cfa, m, why in FNP: par_aux[aux] = round(par_aux.get(aux, 0) + m, 2)
    for aux, m in par_aux.items():
        add('CL-5', '401', "FACTURE NON PARVENUE AU 31/07/2026", cre=m,
            motif="Contrepartie sur le compte fournisseur : son solde débiteur est apuré.",
            section='FOURNISSEURS', aux=aux, aux_lib=AUXLIB.get(aux, aux))

    # CL-6 — produits constatés d'avance
    add('CL-6', '706.11', "PRODUITS CONSTATES D'AVANCE - PART PORTANT SUR L'EXERCICE 2", deb=46427.02,
        motif="Somme, contrat par contrat, de ce qui a été facturé au-delà de l'avancement au 31/07/2026.")
    add('CL-6', '487',    "PRODUITS CONSTATES D'AVANCE - PART PORTANT SUR L'EXERCICE 2", cre=46427.02, motif="Contrepartie.")
    # CL-7 — produits acquis non encore facturés
    add('CL-7', '418',    "PRODUITS ACQUIS NON ENCORE FACTURES AU 31/07/2026", deb=15289.58,
        motif="Enseignement déjà dispensé que le financeur n'a pas encore été appelé à payer.")
    add('CL-7', '706.11', "PRODUITS ACQUIS NON ENCORE FACTURES AU 31/07/2026", cre=15289.58, motif="Contrepartie.")
    # CL-8 — facture LEMOLE-1 non comptabilisée
    add('CL-8', '411.2',  "FACTURE LEMOLE-1 DU 17/02/2026 - RUGBY CLUB LE MOLE - J. DUDING", deb=750.00,
        motif="Reste à charge employeur sur le contrat CA-0274702-1 ; facture absente du grand livre.",
        section='CLIENTS', aux='CLEMOLE', aux_lib='RUGBY CLUB LE MOLE')
    add('CL-8', '706.11', "FACTURE LEMOLE-1 DU 17/02/2026 - RUGBY CLUB LE MOLE - J. DUDING", cre=750.00, motif="Contrepartie.")
    # CL-10 — SUPPRIMÉE : le carburant et l'entretien du véhicule (1 466,10 €) sont
    # intégralement logés au compte d'attente, qui reste ouvert. Ils ne pèsent donc
    # déjà pas sur le résultat : aucun report au compte courant n'est nécessaire.

    # CL-9 — reclassement de la part formation continue des financements AFDAS
    add('CL-9', '706.11', "RECLASSEMENT FPC - PART FORMATION CONTINUE DES FINANCEMENTS AFDAS", deb=64176.54,
        motif="Part des dossiers DC- rattachée à l'exercice 1, lue sur les factures AFDAS. Sans effet sur le résultat.")
    add('CL-9', '706.21', "RECLASSEMENT FPC - PART FORMATION CONTINUE DES FINANCEMENTS AFDAS", cre=64176.54, motif="Contrepartie.")
    return ec

if __name__ == '__main__':
    E = json.load(open('gl_cfa.json'))
    ec = journal(E)
    d = sum(x['debit'] or 0 for x in ec); c = sum(x['credit'] or 0 for x in ec)
    print(f'{len(ec)} lignes | débit {d:,.2f} | crédit {c:,.2f} | écart {d-c:,.2f}')
    res = sum((x['credit'] or 0) - (x['debit'] or 0) for x in ec if x['cfa'][0] in '67')
    print(f'impact sur le résultat : {res:,.2f}')
    json.dump(ec, open('cloture.json', 'w'), ensure_ascii=False)
