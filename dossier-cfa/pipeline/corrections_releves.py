# -*- coding: utf-8 -*-
"""Corrections établies par confrontation aux 16 relevés bancaires.

Chaque correction est appuyée sur le libellé ET le motif portés par le relevé,
vérifiés un à un. Le libellé du grand livre n'est repris que lorsqu'il nomme
un tiers qui n'est pas le vrai bénéficiaire — décision du client du 07/09/2026 :
« libellé SECOGEST sauf si vraiment pas compréhensible ».
"""

# idx de gl_entries.csv -> (compte CFA, libellé retenu, motif)
CORR = {
 1999: ('6068', "VISTAPRINT - SACOCHE & TAPIS PC (VIREMENT DU 20/07/2026)",
        "Le relevé nomme VISTAPRINT et le motif « Sacoche & Tapis PC ». Ce n'est ni un abonnement IA "
        "ni une indemnité kilométrique : c'est l'équipement des ordinateurs des apprentis."),
 2379: ('6068', "VISTAPRINT - SACOCHE & TAPIS PC (VIREMENT DU 20/07/2026)",
        "Second morceau de la même opération, que le grand livre avait passé en indemnités kilométriques."),
 1858: ('6156.9', "HEYGEN - API CONSO (VIREMENT DU 04/08/2025)",
        "Le relevé nomme HEYGEN, motif « API Conso ». Ce n'est pas un remboursement de Supabase à "
        "Anthony GRANDCLEMENT : le vrai Supabase de l'exercice ne pèse que 87,97 €."),
 1944: ('6022.2', "SEEDANCE - CONTENU FPC, VIDEO (VIREMENT DU 18/04/2026)",
        "Le relevé nomme SEEDANCE et le motif dit « Contenu FPC - Vidéo » : matière d'œuvre de la "
        "formation continue, comme la facture SEEDANCE de 3 119,63 € déjà au 6022.2."),
 2336: ('6022.2', "SEEDANCE - CONTENU FPC, VIDEO (VIREMENT DU 18/04/2026)",
        "Second morceau de la même opération."),
 2252: ('6068', "PERSO DE L'AIN - EQUIPEMENT + FLOCAGE (VIREMENT DU 06/12/2025)",
        "Le relevé nomme PERSO DE L'AIN, motif « RT - Équipement + flocage ». Du textile floqué, "
        "comme les vêtements JEQUIPE2 : équipement des apprentis, et non mobilité."),
 2013: ('646', None, "Mandat SEPA FR06ZZZ553287, produit « AGIPI Prévoyance » : cotisation TNS des gérants."),
 2014: ('646', None, "Mandat SEPA FR06ZZZ553287, produit « AGIPI Prévoyance » : cotisation TNS des gérants."),
 2019: ('646', None, "Mandat SEPA FR06ZZZ553287, produit « AGIPI Prévoyance » : cotisation TNS des gérants."),
 2027: ('646', None, "Mandat SEPA FR06ZZZ553287, produit « AGIPI Prévoyance » : cotisation TNS des gérants."),
}

# clés analytiques que le motif du relevé fixe
CLES = {
 1845: ('FPC', [0, 100, 0, 0, 0], "Motif du relevé : « APi FPC ». Le virement va directement à BOLT NEW."),
 1944: ('FPC', [0, 100, 0, 0, 0], "Motif du relevé : « Contenu FPC - Vidéo »."),
 1942: ('FPC', [0, 100, 0, 0, 0],
        "Motif du relevé du 23/04/2026 : « Pour BOLTNEW · Développement · application We-Club FPC ». "
        "Le motif nomme lui-même la formation continue : la ligne y est affectée en totalité."),
 2336: ('FPC', [0, 100, 0, 0, 0], "Motif du relevé : « Contenu FPC - Vidéo »."),
}

# règle : dans les notes de frais, l'hébergement n'est pas un déplacement
REGLE_HEBERGEMENT = r'LOGEMEN|LOGMT|HOTEL|AUBERGE|HEBERG'

def appliquer(e):
    """Retourne (cfa, libelle, motif) ou None si la ligne n'est pas corrigée."""
    import re
    i = e.get('idx')
    if i in CORR:
        cfa, lib, motif = CORR[i]
        return cfa, (lib or e['libelle']), motif
    if e['cfa'] == '6256.9' and 'NOTE DE FRAIS' in (e['libelle'] or '').upper() \
       and re.search(REGLE_HEBERGEMENT, e['libelle'], re.I):
        return '6257', e['libelle'], ("Hébergement porté par une note de frais : le compte 6257 nomme la "
                                      "restauration et l'hébergement des apprentis. Le virement du 12/03/2026 "
                                      "de 843,36 € va à ENJOY Hostel, « Auberge jeunesse Paris ».")
    return None
