# -*- coding: utf-8 -*-
"""Table de correspondance compte SECOGEST -> compte CFA WE-FORM.

Principe : le GRAND LIVRE fait foi.  Le classeur analytique WE-FORM ne sert qu'à
déterminer (a) le compte CFA et (b) le rattachement analytique.  Chaque règle est
nommée et justifiée ; les exceptions sont désignées par l'index de la ligne du
grand livre (colonne idx de gl_entries.csv).
"""
import re

# --- 1. correspondance par défaut, compte à compte -------------------------------
DEFAUT = {
 '1013000':'101', '1640000':'164',
 '2050000':'611',        # ingénierie E. BENALI — passée en charge (convention de 25 000 €, 15 000 sur l'exercice)
 '2156000':'6068',       # 51 PC portables laissés aux apprentis -> charge (décision client)
 '2183000':'2183',
 '40':'401', '41':'411',
 '4210000':'421', '4286000':'421', '4310000':'431',
 '4370200':'437', '4370300':'437', '4370800':'437', '4380000':'438',
 '4421000':'442', '4486100':'448', '4486300':'448',
 '4551000':'4551', '4551700':'4551', '4710000':'471',
 '5120000':'512', '5300000':'530', '5800000':'580',
 '6022000':'6022.1', '6022200':'6022.2',
 '6040000':'604.1',  '6042000':'604.2',
 '6061400':'6256.9', '6063000':'6064',  '6064000':'6064',
 '6068000':'6068',   '6068500':'6068',  '6070000':'6064',
 '6110000':'6226.9', '6115000':'6156.9',
 '6132000':'6132.1', '6135000':'6156.9','6135300':'6156.9',
 '6160000':'616',    '6161000':'616',   '6162000':'616',
 '6185000':'6132.1',
 '6226000':'6226.9', '6226100':'6226.1','6226200':'6226.9','6226300':'6226.9',
 '6226400':'6226.1', '6226900':'6226.9','6227000':'6226.9',
 '6234000':'623',    '6237000':'623',   '6238000':'6238',
 '6251000':'6256.9', '6251200':'6226.1','6257000':'6257',
 '6260000':'626',    '6261000':'626',
 '6275000':'627',    '6284000':'623',
 '6311000':'635', '6312000':'635', '6333000':'635', '6335000':'635', '6358000':'635',
 '6411000':'6411.11','6412000':'6411.11',
 '6415000':'644',    '6415100':'644',
 '6451000':'645.1', '6452000':'645.1', '6453000':'645.1',
 '6454000':'645.1', '6458000':'645.1', '6465000':'645.1',
 '6580000':'627',   '6616000':'661',
 '7060000':'706.11','7061000':'706.4', '7062000':'706.21','7063000':'706.11',
 '7064000':'706.11','7065000':'706.21','7066000':'706.11',
 '7400000':'74.9',
}


# --- 2. règles internes à un compte : (compte SECOGEST, regex libellé, CFA, motif)
# Règles testées ligne à ligne sur le grand livre ; la première qui matche gagne.
REGLES = [
 # --- 6040000 Achats de prestations de formation : éclatement par fournisseur
 ('6040000', r'VIRTUS MENTIS|DUTERTRE|MIGLIORE|BBL HOLDING|CUYNET|PRAT OLIVIER|BRUNET|FH GROUP|SUIVIJURY',
  '6226.1', "formateurs et intervenants externes — honoraires de formation"),
 ('6040000', r'\bFCSC\b|SAINT CLAUDE', '6132.1', "location de salle du présentiel FC Saint-Claude"),
 ('6040000', r'TIMOTEO',  '6226.3', "intervention BPJEPS — sous-traitance Ligue AURA"),
 ('6040000', r'MLTN',     '623',    "action de communication"),
 ('6040000', r'CLEMENT PHILIP', '611', "structuration de club — sous-traitance non pédagogique"),
 # --- 6132000 Locations immobilières
 ('6132000', r'MOB COWORKING', '6132.9', "usages ponctuels du coworking — charge commune"),
 # --- 6135000 Locations logiciels : développement applicatif vs SaaS courant
 ('6135000', r'BOLT|STACKB|ANTHROPIC|ANTRHOPIC|CLAUDE|SUPABASE|RENDER|API.?SPORTS|APPLICATION'
             r'|LOGICI\w* IA|FRAIS IA|LECLUB200|LE ?CLUB ?200', '6156.2',
  "développement de l'applicatif et outils IA — ventilés par clé"),
 # --- 6160000 Assurances
 ('6160000', r'AGIPI',            '646',  "prévoyance-retraite Madelin des gérants (TNS)"),
 ('6160000', r'\bADIS\b|BPCE ?VIE', '6272', "garanties adossées au prêt bancaire"),
 # --- 6275000 Services bancaires
 ('6275000', r'FRAIS DOSSIER',    '6272', "frais de dossier du prêt bancaire"),
 # --- 6226300 Honoraires divers
 ('6226300', r'PROX COURTAGE',    '622',    "courtage sur financement"),
 ('6226300', r'SEDOMICILIER',     '6132.9', "domiciliation du siège"),
 # --- 6227000 Frais d'actes et contentieux
 ('6227000', r'AVOCAT',           '6226.9', "honoraires d'avocat"),
 ('6227000', r'INPI|K.?BIS|GREFFE','635',   "dépôt INPI de la marque et du logo, formalités"),
 # --- 6063000 / 6064000 : ce qui est licence n'est pas fourniture
 ('6063000', r'NURYKA',           '6156.9', "cartes étudiantes numériques"),
 ('6064000', r'MICROSOFT|CANVA',  '6156.9', "licences logicielles"),
 # --- 6237000 Publicité
 ("6237000", r"SO.?TEAM",         '604.1',  "prestation de formation"),
 # --- 6251000 Voyages et déplacements
 ('6251000', r'JURY',             '6226.1', "jury de certification — coût pédagogique"),
 ('6251000', r'TRAINLINE',        '6251',   "mobilité des apprentis"),
]

# --- 3. exceptions nominatives : idx de gl_entries.csv -> (CFA, motif)
EXCEPTIONS = {
 # les 6 vraies reclassifications issues des 34 changements de compte du classeur
 1763: ('6132.9', "FC SAINT CLAUDE 4 000 — bureau mis à disposition à l'année, charge de structure"),
 1790: ('6064',   "note de frais Xavier GAUSSENS 08.2025 — matériel, pas un produit d'entretien"),
 2155: ('623',    "INTERSPORT cartes cadeaux — contrepartie d'un travail de communication"),
 2707: ('706.11', "AURILLAC-2 750 — reste à charge employeur sur contrat d'apprentissage"),
 2709: ('706.11', "STADE OLYMPIQUE CHAMBERIEN 750 — reste à charge employeur sur contrat d'apprentissage"),
 # arbitrages complémentaires du rapprochement
 1848: ('6156.9', "note de frais GRANDCLEMENT — DIGIFORMA pèse 223,20 des 311,20 : abonnement commun"),
 2149: ('6156.9', "A LABOS — implémentation SCORM, licence et non honoraires"),
 2304: ('6257',   "café Les Turbines — repas d'apprentis en présentiel"),
 2334: ('6257',   "Les Deux Stades — repas d'apprentis en présentiel"),
 2242: ('6251',   "Trainline — mobilité des apprentis"),
 2243: ('6251',   "Trainline — mobilité des apprentis"),
 2221: ('6251',   "Trainline — mobilité des apprentis"),
 2252: ('6251',   "Trainline — mobilité des apprentis"),
}

def compte_cfa(e):
    """Retourne (code CFA, motif) pour une ligne du grand livre."""
    idx = e.get('idx')
    # 1. corrections établies sur les relevés bancaires (elles priment sur tout)
    try:
        import corrections_releves
        c = corrections_releves.appliquer(dict(e, cfa=DEFAUT.get(e['compte'], e['compte'])))
        if c: return c[0], c[2]
    except Exception:
        pass
    if idx in EXCEPTIONS:
        return EXCEPTIONS[idx]
    c = e['compte']; lib = (e['libelle'] or '').upper()
    for cs, pat, cfa, motif in REGLES:
        if cs == c and re.search(pat, lib):
            return cfa, motif
    if e['section'] == 'CLIENTS':      return '411', "compte auxiliaire client"
    if e['section'] == 'FOURNISSEURS': return '401', "compte auxiliaire fournisseur"
    return DEFAUT.get(c, c), "correspondance de plan"
