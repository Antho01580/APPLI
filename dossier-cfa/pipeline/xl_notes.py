# -*- coding: utf-8 -*-
import json, collections, datetime, sys
sys.path.insert(0,'.')
import openpyxl, xl
from xl import title, header, row, total, note, finish, TEAL_P, BRIQUE
E = json.load(open('gl_cfa.json'))
def dt(e): return datetime.datetime.strptime(e['date'], '%d/%m/%Y').date()
PERS=[('GRANDCLEMENT','Anthony GRANDCLEMENT'),('GRANCLEMENT','Anthony GRANDCLEMENT'),('ANTHONY G','Anthony GRANDCLEMENT'),
      ('GAUSSENS','Xavier GAUSSENS'),('GANSSENS','Xavier GAUSSENS'),
      ('HOUVENAGHEL','Stéphanie HOUVENAGHEL'),('HOUVEHAGHEL','Stéphanie HOUVENAGHEL'),('SHEPHANIE','Stéphanie HOUVENAGHEL'),
      ('MARGUIN','Mélanie MARGUIN'),('DONIN','Baptiste DONIN'),('ZEH','Pauline ZEH'),
      ('VIGNOLINI','Océane VIGNOLINI'),('RABAULT','Sébastien RABAULT'),('SEBASTIEN','Sébastien RABAULT')]
def qui(l):
    u=l.upper()
    for k,v in PERS:
        if k in u: return v
    return 'Non identifié'
NOTES=[e for e in E if e['compte']=='FFRAIS' and e['credit']]
REGL =[e for e in E if e['compte']=='FFRAIS' and e['debit']]
CHG=[e for e in E if e['section']=='GENERAUX' and e['compte'][0] in '26' and e['debit'] and 'NOTE DE FRAIS' in e['libelle'].upper() and 'JURY' not in e['libelle'].upper()]
grp=collections.defaultdict(list)
for c in CHG: grp[(c['date'],qui(c['libelle']))].append(c)

wb=openpyxl.Workbook(); wb.remove(wb.active)
# --- synthèse
ws=wb.create_sheet('Synthèse'); r=title(ws,1,"Notes de frais — exercice 1",
  "Compte fournisseur FFRAIS « NOTE DE FRAIS » du grand livre SECOGEST · 17/04/2025 → 31/07/2026")
g=collections.defaultdict(list)
for n in NOTES: g[qui(n['libelle'])].append(n)
r=header(ws,r,['Personne','Notes','Montant des notes','Part','dont déplacements 6251','dont logiciels 6135','dont autres comptes'],
         [30,9,18,9,20,18,20],['left','right','right','right','right','right','right'])
T=sum(n['credit'] for n in NOTES)
for who in sorted(g,key=lambda w:-sum(n['credit'] for n in g[w])):
    L=g[who]; s=round(sum(n['credit'] for n in L),2)
    par=collections.defaultdict(float)
    for k in {(n['date'],who) for n in L}:
        for c in grp.get(k,[]): par[c['compte']]+=c['debit']
    dep=round(par.get('6251000',0)+par.get('6061400',0),2); log=round(par.get('6135000',0),2)
    aut=round(sum(v for k2,v in par.items() if k2 not in ('6251000','6061400','6135000')),2)
    r=row(ws,r,[who,len(L),s,round(100*s/T,2),dep,log,aut],['','n0','n','p','n','n','n'])
r=total(ws,r,['Total',len(NOTES),round(T,2),100.0,'','',''],['','n0','n','p','','',''])
r+=1
r=header(ws,r,['Le compte FFRAIS au grand livre','Montant'],[46,18],['left','right'])
for lab,v in [('Notes de frais comptabilisées (crédit)',round(T,2)),
              ('Règlements effectués (débit)',round(sum(e['debit'] for e in REGL),2)),
              ('Solde débiteur au 31/07/2026 — réglé sans note',
               round(sum(e['debit'] for e in REGL)-T,2))]:
    r=row(ws,r,[lab,v],['','n'],bold=lab.startswith('Solde'))
r=note(ws,r,"Le solde débiteur de 557,30 € correspond à des remboursements versés sans note comptabilisée en face. "
            "Il comprend le doublon de 169,98 € du 01/09/2025, que le cabinet a lui-même libellé « Doublon » et laissé non lettré. "
            "Ces 557,30 € sont repris en factures non parvenues dans l'écriture de clôture CL-5.",7)
finish(ws,cols=[30,9,18,9,20,18,20])

# --- détail des notes
ws=wb.create_sheet('Notes'); r=title(ws,1,"Les 58 notes de frais, une par ligne",
  "Le libellé est celui du grand livre. La colonne « Imputation » donne les comptes de charge où la note a été éclatée.")
r=header(ws,r,['Personne','Date','Libellé du grand livre','Montant','Imputation au grand livre','Total imputé','Contrôle'],
         [26,11,54,13,50,13,12],['left','center','left','right','left','right','center'])
for who in sorted(g,key=lambda w:-sum(n['credit'] for n in g[w])):
    for n in sorted(g[who],key=dt):
        L=grp.get((n['date'],who),[])
        det=' + '.join(f"{c['compte']} {c['debit']:,.2f}".replace(',',' ') for c in L) or '—'
        tn=round(sum(x['credit'] for x in NOTES if x['date']==n['date'] and qui(x['libelle'])==who),2)
        tl=round(sum(c['debit'] for c in L),2)
        ok='✓' if abs(tn-tl)<0.02 else '✗'
        r=row(ws,r,[who,n['date'],n['libelle'],n['credit'],det,tl,ok],
              ['','c','','n','w','n','c'],color=(None if ok=='✓' else BRIQUE))
r=total(ws,r,['',f'TOTAL — {len(NOTES)} notes','',round(T,2),'','',''],['','','','n','','',''])
finish(ws,freeze='A4'); ws.auto_filter.ref=f"A3:G{r-1}"

# --- règlements
ws=wb.create_sheet('Règlements'); r=title(ws,1,"Les 59 règlements de notes de frais",
  "Les virements sortis du compte bancaire en remboursement des notes.")
r=header(ws,r,['Personne','Date','Pièce','Libellé du grand livre','Montant'],
         [26,11,13,66,13],['left','center','center','left','right'])
for e in sorted(REGL,key=dt):
    r=row(ws,r,[qui(e['libelle']),e['date'],e['piece'],e['libelle'],e['debit']],['','c','c','','n'])
r=total(ws,r,['',f'TOTAL — {len(REGL)} règlements','','',round(sum(e['debit'] for e in REGL),2)],['','','','','n'])
finish(ws,freeze='A4'); ws.auto_filter.ref=f"A3:E{r-1}"

# --- lignes de charge
ws=wb.create_sheet('Lignes de charge'); r=title(ws,1,"Les lignes de charge issues des notes de frais",
  "Le détail par compte : c'est là que les notes atterrissent dans le compte de résultat.")
r=header(ws,r,['Personne','Date','Compte','Intitulé du compte','Libellé du grand livre','Montant'],
         [26,11,11,44,58,13],['left','center','center','left','left','right'])
for c in sorted(CHG,key=lambda c:(qui(c['libelle']),dt(c))):
    r=row(ws,r,[qui(c['libelle']),c['date'],c['compte'],c['intitule'],c['libelle'],c['debit']],['','c','c','','','n'])
r=total(ws,r,['',f'TOTAL — {len(CHG)} lignes','','','',round(sum(c['debit'] for c in CHG),2)],['','','','','','n'])
finish(ws,freeze='A4'); ws.auto_filter.ref=f"A3:F{r-1}"
wb.save('Notes_de_frais_WEFORM.xlsx')
print('Notes_de_frais_WEFORM.xlsx —',len(wb.sheetnames),'onglets |',len(NOTES),'notes',len(REGL),'règlements',len(CHG),'lignes de charge')
print('contrôle : notes',round(T,2),'| lignes de charge',round(sum(c['debit'] for c in CHG),2))

# --- remboursements à une entité tierce ---------------------------------------
ws=wb.create_sheet('Achats pour compte'); r=title(ws,1,
  "Les notes de frais qui remboursent un achat fait chez un tiers",
  "À distinguer des indemnités kilométriques : ici le salarié a payé un fournisseur de sa poche, "
  "et la facture est à son nom, pas à celui de la société.")
ENT={'30/04/2025':('Bolt + Supabase',"« Douze lignes BOLT + SUPABASE sur la note d'avril 2025, aucun kilomètre » (dossier de synthèse WE-FORM)"),
     '31/05/2025':('Bolt 88,00 + Digiforma 223,20',"« BOLT - ABO MAI - 100$ » 88,00 € et « DIGIFORMA » 223,20 € (dossier de synthèse WE-FORM)"),
     '04/08/2025':('Supabase',"Le libellé du grand livre le nomme : « SUPABASE (AVANCE) ». Votre modèle : « VIR INST SUPABASE — Base de données We-Admin »."),
     '30/04/2026':('Anthropic — API Claude',"Votre modèle isole « Note de frais avril — part API Claude » pour 738,00 €."),
     '31/07/2026':('Non identifiée',"Libellé « AVANCE FRAIS IA ». Aucune entité nommée, ni au grand livre ni au modèle analytique.")}
CH=[c for c in CHG if qui(c['libelle'])=='Anthony GRANDCLEMENT' and c['compte']=='6135000']
r=header(ws,r,['Date','Libellé du grand livre','Montant','Entité derrière la dépense','Comment on le sait'],
         [11,50,13,30,86],['center','left','right','left','left'])
for c in sorted(CH,key=dt):
    e=ENT.get(c['date'],('—',''))
    r=row(ws,r,[c['date'],c['libelle'],c['debit'],e[0],e[1]],['c','','n','','w'],
          color=(BRIQUE if e[0]=='Non identifiée' else None))
r=total(ws,r,['','Total des achats faits pour le compte de la société',round(sum(c['debit'] for c in CH),2),'',''],
        ['','','n','',''])
r+=1
tot_a=round(sum(n['credit'] for n in NOTES if qui(n['libelle'])=='Anthony GRANDCLEMENT'),2)
ik=round(tot_a-sum(c['debit'] for c in CH),2)
r=header(ws,r,['Ses notes de frais, en deux blocs','Montant','Part'],[54,15,10],['left','right','right'])
for lab,v in [("Achats payés chez un tiers et remboursés (logiciels, abonnements)",round(sum(c['debit'] for c in CH),2)),
              ("Indemnités kilométriques, péages, repas et logement",ik)]:
    r=row(ws,r,[lab,v,round(100*v/tot_a,2)],['','n','p'])
r=total(ws,r,['Total des notes de frais d\'Anthony GRANDCLEMENT',tot_a,100.0],['','n','p'])
r+=1
r=header(ws,r,['Ces fournisseurs sont aussi facturés en direct','Facturé en direct','Via note de frais','Remarque'],
         [30,18,18,74],['left','right','right','left'])
DBL=[('Bolt (StackBlitz)',2016.92,88.00,"Plus une part indéterminée des 439,63 € de la note d'avril 2025."),
     ('Supabase',87.97,1508.17,"1 508,17 € remboursés à Anthony contre 87,97 € facturés en direct : l'essentiel de la dépense passe par lui."),
     ('Anthropic',1296.36,738.01,"Plus, peut-être, les 1 100 € de « AVANCE FRAIS IA » de juillet 2026."),
     ('Digiforma',1951.20,223.20,"Le direct passe par A World For Us (prélèvement GoCardless).")]
for n_,a,b,rem in DBL: r=row(ws,r,[n_,a,b,rem],['','n','n','w'])
r=note(ws,r,"Un même fournisseur réglé par deux canaux : c'est le point à traiter. Quand la facture est au nom "
            "d'Anthony GRANDCLEMENT, la société perd la TVA déductible et la charge ne tient que par la note de frais. "
            "Le plus simple est de basculer ces abonnements sur un moyen de paiement de la société, comme cela a déjà "
            "été fait pour la part facturée en direct.",4)
r=note(ws,r,"À part : la note du 06/12/2025, « TRANSPORT \"RT\" (A JUSTIFIER) » pour 314,00 €. La mention « à justifier » "
            "est du cabinet lui-même, elle figure telle quelle au grand livre.",4)
finish(ws,cols=[11,50,13,30,86])
wb.save('Notes_de_frais_WEFORM.xlsx')
print("onglet « Achats pour compte » ajouté —",len(wb.sheetnames),'onglets')
