import pdfplumber, collections, json, re
SRC='/root/.claude/uploads/fd4afaac-9d69-5fcd-956c-cb002dee7592/30f12bcb-Grands_livres_final_WEFORM_sans_rouge.pdf'
def num(s):
    s=(s or '').replace(' ','').replace('\xa0','').replace(' ','').replace(',','.')
    if not s: return None
    try: return round(float(s),2)
    except: return None
NUMCOL=re.compile(r'^[\d\s.,\-]+$')
def col(w):           # right-aligned columns
    x1=w['x1']
    if x1<=430: return 'd'
    if x1<=505: return 'c'
    return 's'
pdf=pdfplumber.open(SRC)
entries=[];accounts=[];cur=None;section=None;totals=[];warn=[]
for pi,pg in enumerate(pdf.pages):
    lines=collections.defaultdict(list)
    for w in pg.extract_words(): lines[round(w['top'],1)].append(w)
    tops=sorted(lines);merged=[];i=0
    while i<len(tops):
        grp=list(lines[tops[i]]);j=i+1
        while j<len(tops) and tops[j]-tops[i]<0.9: grp+=lines[tops[j]];j+=1
        merged.append((tops[i],sorted(grp,key=lambda w:w['x0'])));i=j
    for top,ws in merged:
        txt=' '.join(w['text'] for w in ws)
        if 'Grands-livres des comptes' in txt:
            section={'clients':'CLIENTS','fournisseurs':'FOURNISSEURS'}.get(txt.split()[-1],'GENERAUX');continue
        if top>780 or txt.startswith(('155984','Edition ','Date Pièce','BTS COMPTA')) or txt=='(Suite)': continue
        if ws[0]['text']=='Compte' and len(ws)>=2:
            code=ws[1]['text'];lib=re.sub(r'\s*\(Suite\)$','',' '.join(w['text'] for w in ws[2:] if w['x0']>140))
            if '(Suite)' not in txt: cur={'section':section,'compte':code,'intitule':lib,'page':pi+1};accounts.append(cur)
            else: cur=[a for a in accounts if a['compte']==code and a['section']==section][-1]
            continue
        if ws[0]['text'].startswith('Total'):
            cols={'d':'','c':'','s':''}
            for w in ws:
                if w['x0']>=360 and NUMCOL.match(w['text']): cols[col(w)]+=w['text']
            totals.append({'label':' '.join(w['text'] for w in ws if w['x0']<360),'section':section,
                'compte':cur['compte'] if cur else None,'debit':num(cols['d']),'credit':num(cols['c']),
                'solde':num(cols['s']),'page':pi+1});continue
        m=re.match(r'^(\d{2}/\d{2}/\d{4})(.*)$', ws[0]['text'])
        if m and ws[0]['x0']<40:
            date,piece=m.group(1),m.group(2);jnl='';lib=[];cols={'d':'','c':'','s':''};let=''
            for w in ws[1:]:
                x0,t=w['x0'],w['text']
                if 130<=x0<155: jnl=t
                elif x0>=360:
                    mm=re.match(r'^([\d\s.,\-]*?)([A-Z]\*?)?$',t)
                    frag,l=(mm.group(1),mm.group(2)) if mm else (t,None)
                    if l: let=l
                    if frag: cols[col(w)]+=frag
                    elif not l: lib.append(t)
                elif 155<=x0: lib.append(t)
                else: warn.append((pi+1,'COL',t,x0))
            entries.append({'section':section,'compte':cur['compte'],'intitule':cur['intitule'],'date':date,
              'piece':piece.strip(),'jnl':jnl,'libelle':' '.join(lib),'debit':num(cols['d']),
              'credit':num(cols['c']),'solde':num(cols['s']),'lettrage':let,'page':pi+1})
        elif ws[0]['text']=='Centralisation':
            cols={'d':'','c':'','s':''}
            for w in ws:
                if w['x0']>=360 and NUMCOL.match(w['text']): cols[col(w)]+=w['text']
            entries.append({'section':section,'compte':cur['compte'],'intitule':cur['intitule'],'date':None,
              'piece':'','jnl':'CENTRA','libelle':' '.join(w['text'] for w in ws if w['x0']<360),
              'debit':num(cols['d']),'credit':num(cols['c']),'solde':num(cols['s']),'lettrage':'','page':pi+1})
        elif entries and all(w['x1']<=140 for w in ws): entries[-1]['piece']+=' '+txt
        elif entries and all(150<=w['x0']<380 for w in ws): entries[-1]['libelle']+=' '+txt
        elif txt.strip(): warn.append((pi+1,'UNPARSED',txt[:80]))
json.dump({'accounts':accounts,'entries':entries,'totals':totals},open('gl_raw.json','w'),ensure_ascii=False,indent=1)
print('accounts',len(accounts),'entries',len(entries),'totals',len(totals),'warn',len(warn))
for w in warn[:15]:print(w)
