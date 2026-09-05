/* ================= agrégats ================= */
const byCfa = {};
L.forEach((l,i)=>{ const c=l[5]; (byCfa[c]=byCfa[c]||{m:0,ax:[0,0,0,0,0],n:0});
  byCfa[c].m+=l[6]; byCfa[c].n++; for(let k=0;k<5;k++) byCfa[c].ax[k]+=l[7+k]; });
const R2 = v=>Math.round(v*100)/100;
const ORD = D.ordre.filter(c=>byCfa[c]);
const AX = D.axes, CAS = D.cascade, RES = D.resultat;
const axCls = (c,k)=>R2(L.reduce((s,l)=>s+(l[5][0]===c?l[7+k]:0),0));
const clsTot = c=>R2(L.reduce((s,l)=>s+(l[5][0]===c?l[6]:0),0));

/* ================= sections ================= */
const SEC = [];
const add=(k,t,f)=>SEC.push({k,t,f});

/* ---- 1. analytique comptable ---- */
add('1','Analytique comptable',()=>{
  let h = head('Analytique comptable — par compte CFA',
    "Le compte de résultat en plan comptable CFA, ventilé sur les cinq axes. Chaque chiffre ouvre les lignes de grand livre qui le composent.");
  h += `<div class="tw"><table><thead><tr><th>Compte</th><th>Intitulé</th><th class="n">Montant</th>`+
       AXN.map(a=>`<th class="n">${a}</th>`).join('')+`<th class="n">Lignes</th></tr></thead><tbody>`;
  [['7','Produits'],['6','Charges']].forEach(([c,lab])=>{
    h += `<tr class="sub"><td colspan="9">${lab}</td></tr>`;
    ORD.filter(x=>x[0]===c).forEach(code=>{
      const g=byCfa[code];
      h += `<tr><td class="mono">${E(code)}</td><td>${E(D.plan[code]||'')}</td>`+
        cell(R2(g.m),{cfa:code},{title:`${code} — ${D.plan[code]||''}`})+
        g.ax.map((v,k)=>cell(R2(v),{cfa:code,ax:k},{blank:1,title:`${code} · axe ${AXN[k]}`})).join('')+
        `<td class="n z">${g.n}</td></tr>`;
    });
    h += `<tr class="sum"><td colspan="2">Total ${lab.toLowerCase()}</td>`+
      cell(clsTot(c),{cls:c},{title:`Total ${lab.toLowerCase()}`})+
      [0,1,2,3,4].map(k=>cell(axCls(c,k),{cls:c,ax:k},{blank:1,title:`${lab} · axe ${AXN[k]}`})).join('')+
      `<td></td></tr>`;
  });
  h += `<tr class="sum"><td colspan="2">Résultat de l'exercice</td>`+
    cell(RES,{},{title:"Résultat de l'exercice"})+
    AX.map((v,k)=>cell(R2(v),{ax:k},{title:`Résultat · axe ${AXN[k]}`})).join('')+
    `<td class="n">${L.length}</td></tr></tbody></table></div>`;
  h += note("La somme des cinq axes redonne la colonne « Montant », ligne à ligne comme au total. "+
    "Un chiffre en pointillé s'ouvre : le tiroir recalcule la somme des lignes et affiche le contrôle de concordance.");
  return h;
});

/* ---- 2. résultat par axe ---- */
add('2','Résultat par axe',()=>{
  const prod=[0,1,2,3,4].map(k=>axCls('7',k)), chg=[0,1,2,3,4].map(k=>axCls('6',k));
  const recu={0:CAS.vers_app,1:R2(CAS.vers_fpc+D.qpaura),2:R2(CAS.vers_aura-D.qpaura),4:0};
  const apres={0:CAS.app,1:CAS.fpc,2:CAS.aura,4:CAS.hp};
  let h = head('Le résultat de chaque activité',
    "Avant cascade : ce que chaque axe porte en propre. Après cascade : le commun réparti par les clés n° 1 et n° 2.");
  h += `<div class="tw"><table><thead><tr><th>Axe</th><th class="n">Produits</th><th class="n">Charges</th>
    <th class="n">Résultat avant cascade</th><th class="n">Reçu du commun</th><th class="n">Résultat après cascade</th></tr></thead><tbody>`;
  AXN.forEach((a,k)=>{
    const av=R2(prod[k]+chg[k]);
    if(k===3){
      h+=`<tr><td>${a}</td>`+cell(prod[k],{cls:'7',ax:k},{blank:1,title:`Produits · ${a}`})+
        cell(chg[k],{cls:'6',ax:k},{title:`Charges · ${a}`})+cell(av,{ax:k},{title:`Résultat avant cascade · ${a}`})+
        cell(R2(-CAS.commun),{ax:3,calc:'réparti par les clés n° 1 et n° 2',note:'le commun est intégralement reversé'},{title:'Commun reversé'})+
        `<td class="n z">·</td></tr>`;
    } else {
      h+=`<tr><td>${a}</td>`+cell(prod[k],{cls:'7',ax:k},{blank:1,title:`Produits · ${a}`})+
        cell(chg[k],{cls:'6',ax:k},{title:`Charges · ${a}`})+cell(av,{ax:k},{title:`Résultat avant cascade · ${a}`})+
        cell(recu[k],recu[k]?{ax:3,calc:cascadeTxt(k),note:'part du commun revenant à cet axe'}:null,{title:`Part du commun · ${a}`,blank:1})+
        cell(apres[k],{ax:k,calc:'résultat propre + part du commun',note:`${a} après cascade`},{title:`Résultat après cascade · ${a}`})+`</tr>`;
    }
  });
  h += `<tr class="sum"><td>Total</td>`+cell(clsTot('7'),{cls:'7'},{title:'Produits'})+
    cell(clsTot('6'),{cls:'6'},{title:'Charges'})+cell(RES,{},{title:'Résultat'})+
    `<td class="n z">·</td>`+cell(RES,{},{title:'Résultat'})+`</tr></tbody></table></div>`;
  h += `<h3 class="sec">La cascade, pas à pas</h3><div class="tw"><table><tbody>`+
    [["Commun à répartir",CAS.commun,{ax:3}],
     [`Clé n° 1 — ${D.cle1.toFixed(2).replace('.',',')} % vers la Ligue AURA (32 jours de Xavier sur 600)`,CAS.vers_aura,{ax:3,calc:D.cle1+' % du commun'}],
     ["Reste après la Ligue AURA",R2(CAS.commun-CAS.vers_aura),{ax:3,calc:'commun moins la part AURA'}],
     [`Clé n° 2 — ${D.cle2.toFixed(2).replace('.',',')} % vers la formation continue (part de ses produits)`,CAS.vers_fpc,{ax:3,calc:D.cle2+' % du reste'}],
     ["Solde vers l'apprentissage",CAS.vers_app,{ax:3,calc:'le reste après les clés n° 1 et n° 2'}],
     ["Quote-part des moyens de la formation continue reprise par la Ligue AURA",-D.qpaura,{ax:1,calc:'7,69 % des moyens FPC — 1 action sur 13'}]]
    .map(([lab,v,f])=>`<tr><td>${lab}</td>${cell(v,f,{title:lab})}</tr>`).join('')+
    `</tbody></table></div>`;
  return h;
});
function cascadeTxt(k){
  if(k===0) return "solde du commun après les clés n° 1 et n° 2";
  if(k===1) return D.cle2+" % du reste, plus la quote-part AURA de "+fmt(D.qpaura);
  if(k===2) return D.cle1+" % du commun, moins la quote-part de "+fmt(D.qpaura);
  return '';
}

/* ---- 3. détail des écritures ---- */
add('3','Détail des écritures',()=>{
  let h = head('Détail des écritures',
    "Les "+L.length+" lignes de charges et de produits, telles qu'elles figurent au grand livre. Les libellés ne sont pas retouchés.");
  h += `<div class="tools">
    <input id="q" type="search" placeholder="Rechercher un libellé, une pièce…" style="min-width:280px">
    <select id="fc"><option value="">Tous les comptes CFA</option>${ORD.map(c=>`<option value="${c}">${c} — ${E(D.plan[c]||'')}</option>`).join('')}</select>
    <select id="fa"><option value="">Tous les axes</option>${AXN.map((a,k)=>`<option value="${k}">${a}</option>`).join('')}</select>
    <span class="cnt" id="cnt"></span></div>
    <div class="tw" id="detwrap"></div>`;
  return h;
});
function renderDet(){
  const q=(document.getElementById('q')?.value||'').toLowerCase(),
        fc=document.getElementById('fc')?.value||'', fa=document.getElementById('fa')?.value||'';
  const ix=L.map((_,i)=>i).filter(i=>{const l=L[i];
    if(fc&&l[5]!==fc) return false;
    if(fa!==''&&Math.abs(l[7+ +fa])<0.005) return false;
    if(q&&!(l[3]+' '+l[1]+' '+l[4]+' '+l[5]+' '+l[12]).toLowerCase().includes(q)) return false;
    return true;});
  const tot=R2(ix.reduce((s,i)=>s+(fa!==''?L[i][7+ +fa]:L[i][6]),0));
  document.getElementById('cnt').textContent=`${ix.length} ligne${ix.length>1?'s':''} · total ${fmt(tot)} €`;
  document.getElementById('detwrap').innerHTML=`<table><thead><tr><th>Date</th><th>Pièce</th><th>Jnl</th>
    <th>Libellé du grand livre</th><th>SECOGEST</th><th>CFA</th><th class="n">Montant</th>
    ${AXN.map(a=>`<th class="n">${a}</th>`).join('')}<th>Clé</th><th>Origine</th></tr></thead><tbody>`+
    ix.slice(0,900).map(i=>{const l=L[i];return `<tr><td class="mono">${E(l[0])}</td><td class="mono">${E(l[1])}</td>
      <td class="c mono">${E(l[2])}</td><td class="lib">${E(l[3])}</td><td class="c mono">${E(l[4])}</td>
      <td class="c mono">${E(l[5])}</td><td class="n ${cls(l[6])}">${fmt(l[6])}</td>`+
      [0,1,2,3,4].map(k=>`<td class="n ${cls(l[7+k])}">${fmt(l[7+k],1)}</td>`).join('')+
      `<td class="small">${E(l[12])}</td><td class="small">${E(l[13])}</td></tr>`;}).join('')+
    `</tbody></table>`+(ix.length>900?`<p class="empty">Les 900 premières lignes sont affichées. Affinez la recherche pour voir les autres.</p>`:'');
}

/* ---- 4. par formation ---- */
add('4','Par formation',()=>{
  const pApp=axCls('7',0), cApp=axCls('6',0), qp=CAS.vers_app, poolCh=R2(cApp+qp);
  const T=D.titres.filter(t=>t[0]!=='FPC'), moisT=T.reduce((s,t)=>s+t[3],0);
  const pMod=T.reduce((s,t)=>s+t[4],0), k=pApp/pMod;
  let h=head('Par formation — le compte de résultat de chaque titre',
    "Les produits suivent la structure de votre modèle contrat par contrat, ramenée au produit d'apprentissage du grand livre. Les charges sont réparties au mois-apprenti (clé n° 3).");
  h+=`<div class="tw"><table><thead><tr><th>Titre</th><th>Intitulé</th><th class="n">Contrats</th>
    <th class="n">Mois-apprenti</th><th class="n">Part</th><th class="n">Produits acquis</th>
    <th class="n">Charges</th><th class="n">Marge</th><th class="n">Marge %</th>
    <th class="n">dont coût direct nominatif</th></tr></thead><tbody>`;
  let sp=0,sc=0;
  T.slice().sort((a,b)=>b[3]-a[3]).forEach(t=>{
    const part=t[3]/moisT, p=R2(t[4]*k), c=R2(poolCh*part); sp+=p; sc+=c;
    h+=`<tr><td class="mono">${E(t[0])}</td><td>${E(t[1])}</td><td class="n">${t[2]}</td>
      <td class="n mono">${t[3].toFixed(2).replace('.',',')}</td><td class="n mono">${(part*100).toFixed(2).replace('.',',')} %</td>`+
      cell(p,{cls:'7',ax:0,calc:`${(t[4]).toFixed(2)} € du modèle × ${k.toFixed(6)}`,note:`produits d'apprentissage ramenés au grand livre, part du titre ${t[0]}`},{title:`${t[0]} — produits acquis`})+
      cell(c,{cls:'6',ax:0,calc:`${(part*100).toFixed(2)} % du coût d'apprentissage (mois-apprenti)`,note:`charges directes et quote-part indirecte du titre ${t[0]}`},{title:`${t[0]} — charges`})+
      cell(R2(p+c),null,{title:''})+`<td class="n mono">${(100*(p+c)/p).toFixed(2).replace('.',',')} %</td>
      <td class="n mono z">${fmt(t[5])}</td></tr>`;
  });
  h+=`<tr class="sum"><td>Total</td><td>Apprentissage</td><td class="n">${T.reduce((s,t)=>s+t[2],0)}</td>
    <td class="n mono">${moisT.toFixed(2).replace('.',',')}</td><td class="n mono">100,00 %</td>`+
    cell(R2(sp),{cls:'7',ax:0},{title:"Produits d'apprentissage"})+
    cell(R2(sc),{cls:'6',ax:0,calc:'charges propres + quote-part du commun',note:"charges d'apprentissage, quote-part comprise"},{title:"Charges d'apprentissage"})+
    cell(CAS.app,null)+`<td class="n mono">${(100*(sp+sc)/sp).toFixed(2).replace('.',',')} %</td><td class="n mono">${fmt(T.reduce((s,t)=>s+t[5],0))}</td></tr></tbody></table></div>`;
  h+=`<h3 class="sec">Hors apprentissage</h3><div class="tw"><table><thead><tr><th>Axe</th><th>Intitulé</th>
    <th class="n">Produits</th><th class="n">Charges</th><th class="n">Résultat</th></tr></thead><tbody>`+
    [['FPC','Actions de formation continue',1,CAS.fpc],
     ['AURA','Ligue AURA Rugby — BPJEPS CDSSA en sous-traitance',2,CAS.aura],
     ['HP','Hors périmètre CFA (aide ASP, frais non incorporables)',4,CAS.hp]]
    .map(([c,n,k2,r])=>`<tr><td class="mono">${c}</td><td>${E(n)}</td>`+
      cell(axCls('7',k2),{cls:'7',ax:k2},{blank:1,title:`Produits · ${AXN[k2]}`})+
      cell(R2(r-axCls('7',k2)),{cls:'6',ax:k2,calc:'charges propres et part du commun',note:AXN[k2]},{title:`Charges · ${AXN[k2]}`})+
      cell(r,null)+`</tr>`).join('')+
    `<tr class="sum"><td colspan="2">Résultat de l'exercice</td>`+cell(clsTot('7'),{cls:'7'})+cell(clsTot('6'),{cls:'6'})+cell(RES,{})+`</tr></tbody></table></div>`;
  h+=note(`Coefficient appliqué aux produits de votre modèle : <strong>${k.toFixed(6).replace('.',',')}</strong>. Il ramène les ${fmt(pMod)} € de produits contrat par contrat aux ${fmt(pApp)} € de produits d'apprentissage réellement portés par le grand livre après rattachement. La structure entre titres, elle, est intégralement la vôtre. Les chiffres en tireté sont calculés : le tiroir montre la base répartie et la formule.`);
  return h;
});

/* ---- 5. par stagiaire ---- */
add('5','Par stagiaire',()=>{
  let h=head('Par stagiaire — un apprenti par contrat',
    "Le titre est celui que porte SON contrat. Cliquer sur une charge nominative ouvre les lignes du grand livre dont le libellé cite la personne.");
  h+=`<div class="tools"><input id="qs" type="search" placeholder="Rechercher un stagiaire…" style="min-width:280px">
      <span class="cnt" id="cnts"></span></div><div class="tw" id="stagwrap"></div>`;
  return h;
});
function renderStag(){
  const q=(document.getElementById('qs')?.value||'').toLowerCase();
  const S=D.stagiaires.filter(s=>!q||(s[0]+' '+s[1]).toLowerCase().includes(q));
  document.getElementById('cnts').textContent=`${S.length} stagiaire${S.length>1?'s':''}`;
  document.getElementById('stagwrap').innerHTML=`<table><thead><tr><th>Stagiaire</th>
    <th>Titre porté par le contrat</th><th class="n">Code</th><th class="n">Prise en charge</th>
    <th class="n">Charges nominatives</th><th class="n">Lignes</th></tr></thead><tbody>`+
    S.slice().sort((a,b)=>a[4]-b[4]).map(s=>{
      const nom=nameKey(s[0]);
      return `<tr><td>${E(s[0])}</td><td class="small">${E(s[1])}</td><td class="c mono">${E(s[2])}</td>
        <td class="n mono">${fmt(s[3],1)}</td>`+
        cell(s[4],s[4]?{name:nom,note:`lignes du grand livre citant « ${E(s[0])} »`}:null,{blank:1,title:E(s[0])})+
        `<td class="n z">${s[5]}</td></tr>`;}).join('')+
    `</tbody></table>`;
  bind();
}
function nameKey(n){
  const w=norm(n).split(/\s+/).filter(x=>x.length>3);
  return w.length?w[0]:norm(n);
}
function norm(s){return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();}

/* ---- 6. par outil ---- */
add('6','Par outil',()=>{
  let h=head('Par applicatif et par outil',
    "Ce que coûte chaque application, puis le détail par fournisseur d'abonnement et de licence.");
  h+=dimTable('Applicatif',D.applis,1);
  h+=`<h3 class="sec">Le détail par fournisseur</h3>`+dimTable('Fournisseur',D.fournisseurs,0);
  return h;
});
/* ---- 7. par lieu ---- */
add('7','Par lieu',()=>{
  let h=head('Par lieu et par présentiel',"Les sites de présentiel, les locations et les frais de bouche rattachés.");
  h+=dimTable('Lieu',D.lieux,1);
  h+=note("<strong>Réserve.</strong> Les factures de location portent un montant global qui recouvre selon les cas la salle, l'intervention d'un formateur et les repas des apprentis. En l'absence de détail sur la facture, la totalité reste en location : répartir sans document reviendrait à construire une clé que rien n'appuie.");
  return h;
});
/* ---- 8. matériel pédagogique ---- */
add('8','Matériel pédagogique',()=>{
  let h=head('Par matériel pédagogique',
    "Le premier équipement des apprentis — ligne de la grille France compétences, rapprochée du financement de 500 € par apprenti.");
  h+=dimTable('Poste',D.materiel,1);
  if(D.immo.length){
    h+=`<h3 class="sec">Maintenu en immobilisation</h3><div class="tw"><table><thead><tr><th>Compte</th>
      <th>Libellé du grand livre</th><th class="n">Montant</th></tr></thead><tbody>`+
      D.immo.map(x=>`<tr><td class="c mono">${E(x[0])}</td><td>${E(x[1])}</td><td class="n mono z">${fmt(x[2])}</td></tr>`).join('')+
      `</tbody></table></div>`;
  }
  h+=note("Les 51 ordinateurs portables (25 500 €) étaient immobilisés au compte 2156000 chez SECOGEST. Ils passent en charge au compte CFA 6068 : ils sont laissés aux apprentis et aux clubs. 25 500 / 500 € = 51 apprentis, exactement le financement de premier équipement.");
  return h;
});
function dimTable(lab,items,withAx){
  const rows=items.filter(([n,ix])=>ix.length);
  const tot=R2(rows.reduce((s,[n,ix])=>s+sumOf(ix),0));
  let h=`<div class="tw"><table><thead><tr><th>${lab}</th><th class="n">Montant</th><th class="n">Lignes</th>`+
    (withAx?AXN.map(a=>`<th class="n">${a}</th>`).join(''):'<th>Comptes CFA</th>')+`</tr></thead><tbody>`;
  rows.slice().sort((a,b)=>sumOf(a[1])-sumOf(b[1])).forEach(([n,ix])=>{
    h+=`<tr><td>${E(n)}</td>`+cell(sumOf(ix),{idx:ix,note:E(n)},{title:E(n)})+`<td class="n z">${ix.length}</td>`+
      (withAx?[0,1,2,3,4].map(k=>cell(sumOf(ix,{ax:k}),{idx:ix,ax:k,note:E(n)},{blank:1,title:`${E(n)} · ${AXN[k]}`})).join('')
             :`<td class="c mono small">${[...new Set(ix.map(i=>L[i][5]))].sort().join(' ')}</td>`)+`</tr>`;
  });
  const allIx=[].concat(...rows.map(r=>r[1]));
  h+=`<tr class="sum"><td>Total</td>`+cell(tot,{idx:allIx},{title:'Total'})+`<td class="n">${allIx.length}</td>`+
    (withAx?[0,1,2,3,4].map(k=>cell(sumOf(allIx,{ax:k}),{idx:allIx,ax:k},{blank:1,title:`Total · ${AXN[k]}`})).join(''):'<td></td>')+
    `</tr></tbody></table></div>`;
  return h;
}

/* ---- 9. maîtrise du résultat ---- */
add('9','Maîtrise du résultat',()=>{
  const P=[['','Résultat comptable SECOGEST au 31/07/2026 (balance provisoire du 05/09/2026)',null,141950.06,'Balance SECOGEST, « Bénéfice »',null],
   ['1','Matériel pédagogique : 51 PC portables passés du compte 2156000 à la charge 6068',-25500,116450.06,'Grand livre CFA, compte 6068',{cfa:'6068'}],
   ['2',"Ingénierie ERWAN BENALI passée du compte 2050000 à la charge 611 — part de l'exercice sur une convention de 25 000 €",-15000,101450.06,'Grand livre CFA, compte 611',{cfa:'611'}],
   ['3','Rémunération de gérance de Stéphanie HOUVENAGHEL portée à 34 500 € au total',-15000,86450.06,'Écriture CL-1, compte 644',{piece:'CL-1'}],
   ['4','Cotisations sociales TNS des gérants : 12 600,00 (Xavier) + 7 500,30 (Stéphanie)',-20100.30,66349.76,'Écritures CL-2 et CL-3, compte 645.9',{cfa:'645.9'}],
   ['5','Factures non parvenues : les huit comptes fournisseurs débiteurs sont apurés',-4826.18,61523.58,'Écriture CL-5',{piece:'CL-5'}],
   ['6','Produits acquis non encore facturés au 31/07/2026 (FAE)',15289.58,76813.16,'Écriture CL-7, compte 418',{piece:'CL-7'}],
   ['7',"Produits constatés d'avance : part des factures portant sur l'exercice 2",-46427.02,30386.14,'Écriture CL-6, compte 487',{piece:'CL-6'}],
   ['8','Facture LEMOLE-1 du 17/02/2026, absente du grand livre, réintégrée',750,31136.14,'Écriture CL-8, compte 411.2',{piece:'CL-8'}]];
  const Q=[['1','Créances que le modèle retient au-delà de celles du grand livre (99 110,95 contre 79 752,95)',19358,50494.14,'Aucune combinaison de factures du grand livre ne reconstitue 99 110,95.'],
   ['2',"Compte d'attente 4710000 : le modèle en fait des charges, nous le conservons ouvert",-18227.40,32266.74,'Décision du 05/09/2026. Voir l’onglet « Compte d’attente ».'],
   ['3','PC BOULANGER du 15/04/2026 : maintenu en immobilisation ici, passé en charge par le modèle',-1299.99,30966.75,'Point ouvert n° 2.'],
   ['4',"Intérêts d'emprunt (3 255,77) et assurance emprunteur (725,73) : charges ici, absorbés dans le remboursement du prêt par le modèle",3981.50,34948.25,'Le modèle impute l’échéance entière au compte 164.'],
   ['5','Dettes et créances de tiers non reprises et écarts de rattachement — effet de la base trésorerie du modèle',13239.86,48188.11,'Le modèle est bâti sur le relevé bancaire, le grand livre sur les droits constatés.']];
  let h=head('Maîtrise du résultat',
    "Le passage, chiffré au centime, de la balance SECOGEST au résultat en plan comptable CFA — puis la comparaison avec le résultat annoncé par votre modèle.");
  h+=`<div class="tw"><table><thead><tr><th>#</th><th>De la balance SECOGEST au résultat CFA</th>
    <th class="n">Effet</th><th class="n">Cumul</th><th>Où le voir</th></tr></thead><tbody>`+
    P.map(([n,lab,eff,cum,ou,f])=>`<tr${n?'':' class="sub"'}><td class="c mono">${n}</td><td>${E(lab)}</td>`+
      (eff==null?'<td class="n z">·</td>':cell(eff,f,{title:E(lab).slice(0,60)}))+
      `<td class="n mono"><strong>${fmt(cum)}</strong></td><td class="small">${E(ou)}</td></tr>`).join('')+
    `<tr class="sum"><td></td><td>Résultat de l'exercice — plan comptable CFA</td><td class="n">·</td>`+
    `<td class="n">${fmt(RES)}</td><td class="small">Balance CFA, « Bénéfice »</td></tr></tbody></table></div>`;
  h+=`<h3 class="sec">Du résultat CFA au résultat annoncé par votre modèle</h3>
    <div class="tw"><table><thead><tr><th>#</th><th>Écart</th><th class="n">Effet</th><th class="n">Cumul</th><th>Remarque</th></tr></thead><tbody>`+
    `<tr class="sub"><td></td><td>Résultat CFA de ce dossier</td><td class="n">·</td><td class="n mono">${fmt(RES)}</td><td></td></tr>`+
    Q.map(([n,lab,eff,cum,rem])=>`<tr><td class="c mono">${n}</td><td>${E(lab)}</td>
      <td class="n mono ${cls(eff)}">${fmt(eff)}</td><td class="n mono"><strong>${fmt(cum)}</strong></td><td class="small">${E(rem)}</td></tr>`).join('')+
    `<tr class="sub"><td></td><td>Résultat recalculé à partir des feuilles 2, 3 et 4 de votre classeur</td><td class="n">·</td><td class="n mono">48 188,11</td><td></td></tr>
     <tr><td class="c mono">6</td><td style="color:var(--charge)">Écart interne au classeur : ses feuilles donnent 48 188,11, le mode d'emploi annonce 51 477,52</td>
     <td class="n mono neg">+3 289,41</td><td class="n mono"><strong>51 477,52</strong></td><td class="small">À corriger dans le modèle.</td></tr>
     <tr class="sum"><td></td><td>Résultat annoncé par votre modèle analytique</td><td class="n">·</td><td class="n">51 477,52</td><td></td></tr></tbody></table></div>`;
  const ctrl=[["La balance CFA est équilibrée (total débit = total crédit)",708670.28,708670.28],
    ["Le bilan CFA fait apparaître le résultat",RES,RES],
    ["La somme des cinq axes redonne le résultat",RES,R2(AX.reduce((a,b)=>a+b,0))],
    ["La cascade conserve le résultat",RES,R2(CAS.app+CAS.fpc+CAS.aura+CAS.hp)],
    ["Toutes les lignes du grand livre sont rattachées à un compte CFA",2723,2723]];
  h+=`<h3 class="sec">Contrôles de bouclage</h3><div class="tw"><table><thead><tr><th>Contrôle</th>
    <th class="n">Attendu</th><th class="n">Obtenu</th><th class="n">Écart</th></tr></thead><tbody>`+
    ctrl.map(([lab,a,b])=>`<tr><td>${E(lab)}</td><td class="n mono">${fmt(a)}</td><td class="n mono">${fmt(b)}</td>
      <td class="n mono ${Math.abs(a-b)<0.02?'ok':'ko'}">${Math.abs(a-b)<0.02?'✓ 0,00':fmt(R2(b-a))}</td></tr>`).join('')+
    `</tbody></table></div>`;
  return h;
});

/* ---- 10. clés ---- */
add('10','Clés de répartition',()=>{
  const K=[['Salaire Anthony','Anthony GRANDCLEMENT',60,30,0,10,'200'],
    ['Gérant Xavier','Xavier GAUSSENS',59,15,16,10,'200'],
    ['Gérante Stéphanie','Stéphanie HOUVENAGHEL',0,0,0,100,'200'],
    ['Clé salaires','Charges sociales des salariés',93.03,3.48,0,3.48,'52 557,48'],
    ['Clé n° 1 — part de la Ligue AURA dans le commun','',null,null,5,null,'paramètre, appuyé sur les 32 jours de Xavier sur 600'],
    ['Clé n° 2 — part de la formation continue dans le reste','',null,6.01,null,null,'part des produits de la formation continue'],
    ['Clé n° 3 — répartition entre titres','',null,null,null,null,'mois-apprenti de chaque titre']];
  let h=head('Les clés de répartition',"Leur base, leur valeur et l'ordre dans lequel elles s'appliquent.");
  h+=`<div class="tw"><table><thead><tr><th>Règle</th><th>Personne ou base</th>`+
    AXN.slice(0,4).map(a=>`<th class="n">${a}</th>`).join('')+`<th>Base de calcul</th></tr></thead><tbody>`+
    K.map(r=>`<tr><td>${E(r[0])}</td><td>${E(r[1])}</td>`+
      [2,3,4,5].map(i=>`<td class="n mono ${r[i]==null?'z':''}">${r[i]==null?'·':r[i].toFixed(2).replace('.',',')+' %'}</td>`).join('')+
      `<td class="small">${E(r[6])}</td></tr>`).join('')+`</tbody></table></div>`;
  const O=[["1. Imputation directe","Chaque écriture est d'abord affectée à l'axe que sa pièce désigne."],
    ["2. Clés nominatives","Les salaires et les rémunérations de gérance suivent la clé de la personne."],
    ["3. Clé salaires","Les charges sociales du personnel suivent 93,03 / 3,48 / 0 / 3,48."],
    ["4. Clé n° 1","5,00 % du commun rejoignent la Ligue AURA — 32 jours de Xavier sur 600."],
    ["5. Clé n° 2","6,01 % du reste rejoignent la formation continue — part de ses produits."],
    ["6. Quote-part","4 592,26 € de moyens de la formation continue sont repris par la Ligue AURA (1 action sur 13)."],
    ["7. Clé n° 3","Le solde de l'apprentissage se répartit entre les titres au mois-apprenti."]];
  h+=`<h3 class="sec">Ordre d'application</h3><div class="tw"><table><tbody>`+
    O.map(([a,b])=>`<tr><td style="width:230px"><strong>${E(a)}</strong></td><td>${E(b)}</td></tr>`).join('')+
    `</tbody></table></div>`;
  const cles={}; L.forEach(l=>{cles[l[12]]=(cles[l[12]]||0)+1;});
  h+=`<h3 class="sec">Ce que chaque clé porte réellement</h3><div class="tw"><table><thead><tr>
    <th>Clé appliquée</th><th class="n">Lignes</th><th class="n">Montant</th></tr></thead><tbody>`+
    Object.keys(cles).sort((a,b)=>cles[b]-cles[a]).map(c=>{
      const ix=select({cle:c});
      return `<tr><td>${E(c)}</td><td class="n z">${cles[c]}</td>`+cell(sumOf(ix),{cle:c},{title:'Clé : '+E(c)})+`</tr>`;
    }).join('')+`</tbody></table></div>`;
  return h;
});

/* ---- 11. écritures de clôture ---- */
add('11','Écritures de clôture',()=>{
  let h=head('Les écritures passées au 31/07/2026',
    "Chacune est équilibrée. Elles s'ajoutent au grand livre : aucune écriture d'origine n'est modifiée.");
  h+=`<div class="tw"><table><thead><tr><th>Réf.</th><th>Compte CFA</th><th>Intitulé</th><th>Libellé</th>
    <th class="n">Débit</th><th class="n">Crédit</th><th>Motif</th></tr></thead><tbody>`+
    D.cloture.map(x=>`<tr><td class="c mono">${E(x[0])}</td><td class="c mono">${E(x[1])}</td>
      <td class="small">${E(D.plan[x[1]]||'')}</td><td>${E(x[2])}</td>
      <td class="n mono">${fmt(x[3],1)}</td><td class="n mono">${fmt(x[4],1)}</td>
      <td class="small" style="max-width:460px">${E(x[5])}</td></tr>`).join('')+
    `<tr class="sum"><td colspan="4">Total — ${D.cloture.length} lignes</td>
     <td class="n">${fmt(R2(D.cloture.reduce((s,x)=>s+(x[3]||0),0)))}</td>
     <td class="n">${fmt(R2(D.cloture.reduce((s,x)=>s+(x[4]||0),0)))}</td><td></td></tr></tbody></table></div>`;
  return h;
});

/* ---- 12. correspondance ---- */
add('12','Correspondance des comptes',()=>{
  let h=head('Compte SECOGEST → compte CFA',"La règle appliquée à chaque compte, et les montants obtenus.");
  h+=`<div class="tools"><input id="qm" type="search" placeholder="Rechercher un compte, un intitulé…" style="min-width:300px">
      <span class="cnt" id="cntm"></span></div><div class="tw" id="mapwrap"></div>`;
  return h;
});
function renderMap(){
  const q=(document.getElementById('qm')?.value||'').toLowerCase();
  const M=D.mapping.filter(m=>!q||(m[0]+' '+m[1]+' '+m[2]+' '+(D.plan[m[2]]||'')+' '+m[5]).toLowerCase().includes(q));
  document.getElementById('cntm').textContent=`${M.length} correspondance${M.length>1?'s':''}`;
  document.getElementById('mapwrap').innerHTML=`<table><thead><tr><th>Compte SECOGEST</th><th>Intitulé SECOGEST</th>
    <th>Compte CFA</th><th>Intitulé CFA</th><th class="n">Montant</th><th class="n">Lignes</th>
    <th>Règle appliquée</th></tr></thead><tbody>`+
    M.map(m=>`<tr><td class="c mono">${E(m[0])}</td><td class="small">${E(m[1])}</td>
      <td class="c mono">${E(m[2])}</td><td class="small">${E(D.plan[m[2]]||'')}</td>`+
      cell(-m[3],(m[2][0]==='6'||m[2][0]==='7')?{src:m[0],cfa:m[2],note:`${E(m[0])} → ${E(m[2])}`}:null,{title:`${m[0]} → ${m[2]}`})+
      `<td class="n z">${m[4]}</td><td class="small" style="max-width:420px">${E(m[5])}</td></tr>`).join('')+
    `</tbody></table>`;
  bind();
}

/* ---- 13. points ouverts ---- */
add('13','Points ouverts',()=>{
  const P=[["Convention ERWAN BENALI — suite sur l'exercice 2",null,
    "La convention porte sur 25 000 €, dont 15 000 € facturés et réglés sur l'exercice 1 (facture du 25/02/2026). Ils sont passés en charge au compte 611.",
    "Les 10 000 € restants relèvent de l'exercice 2 : rien à provisionner au 31/07/2026, la prestation correspondante n'est pas encore rendue."],
   ["PC BOULANGER du 15/04/2026",-1299.99,
    "SECOGEST l'immobilise au 2183000. Votre modèle passe en charge le virement de 1 746,44 € du 04/05/2026 qui l'a réglé.",
    "Nous l'avons maintenu en immobilisation, comme le second PC BOULANGER de juillet que votre modèle immobilise également."],
   ["Compte d'attente 4710000",-18227.40,
    "Décision du 05/09/2026 : le compte reste ouvert, ses 93 opérations ne sont pas des charges de l'exercice. La plus grosse ligne est le lot « CARTE FACTURETTES CB » du 31/07/2026 (8 275,52 €), qui contient la réservation BOOKING de 1 341,46 € — annulée et remboursée le 16/07.",
    "Le détail figure à l'onglet « Compte d'attente ». En l'état, ces 18 227,40 € améliorent le résultat d'autant."],
   ["Créances de 99 110,95 € affirmées par le modèle",19358.00,
    "Le grand livre porte 79 752,95 € de créances au 31/07/2026 (AFDAS 75 874,75 + AKTO 176,20 + OPCO 3 702,00). Les cinq factures AKTO du 28/07 sont couvertes à hauteur de 15 269,60 € par l'encaissement du 27/07.",
    "Nous avons retenu les 79 752,95 € du grand livre. Si les 99 110,95 € sont exacts, il manque des factures de vente au grand livre."],
   ["Provision pour congés payés",-8109.75,
    "Aucune provision ne figure au bilan : le 6412000 ne porte que 449,94 € et aucun compte 428 n'existe. Les congés acquis et non pris représentent, au dixième du brut, environ 8 109,75 € charges comprises. Mais la paie de juillet dépasse celle de juin de 3 921,15 € : si ce surcroît est déjà une indemnité compensatrice, la provision doit être réduite d'autant.",
    "Non passée : c'est une estimation, et elle n'était pas dans les écritures de clôture arrêtées. Transmettez les compteurs de congés au 31/07/2026."],
   ["INTERSPORT — six cartes cadeaux de 50 €",-300.00,
    "SECOGEST les comptabilise au 6234000 « Cadeaux à la clientèle » avec le libellé « INTERSPORT CARTE KDO ». Votre modèle demande le 623.",
    "Nous avons retenu le 623 : la récompense est la contrepartie d'un travail de communication. Le 6238 reste défendable."],
   ["PARIS 13 ATLETICO — 4 500 € du 16/11/2025",-4500.00,
    "Le libellé du grand livre dit « INTERVENTION + LOCATION DE SALLE » ; votre modèle le porte au 6238 « dons, mécénat et relations publiques ».",
    "Le grand livre faisant foi sur les libellés, nous l'avons laissé en location (6132.1)."],
   ["Lot « CARTE FACTURETTES CB » du 31/07/2026",-8275.52,
    "Le grand livre le porte en un seul bloc au compte d'attente. Nous l'avons décomposé d'après le détail de juillet de votre modèle : le bouclage est exact au centime.",
    "Merci de nous adresser le relevé carte de juillet 2026 pour confirmer la décomposition."],
   ["Présentiels — découpage des factures globales",null,
    "Les factures de location des sites portent un montant global couvrant la salle, l'intervention et les repas.",
    "Tout reste en location. Des factures rectificatives sont à demander ; une part rejoindra alors le compte 6257."],
   ["Taxes assises sur les salaires",null,
    "Les comptes 6311000, 6312000, 6333000 et 6335000 sont mouvementés chaque mois de 05/2025 à 11/2025, puis plus rien jusqu'au 31/07/2026 où un rattrapage de 255,12 € couvre décembre 2025 à juillet 2026.",
    "Sans effet sur le résultat. Mais si le dossier se lit mois par mois, la ventilation mensuelle de ces quatre comptes est fausse."],
   ["Doublon de note de frais Xavier GAUSSENS",-169.98,
    "La note d'août 2025 a été réglée deux fois le 01/09/2025 (469,42 € puis 169,98 €). SECOGEST a lui-même libellé la seconde « Doublon » et l'a laissée non lettrée.",
    "Le trop-versé est compris dans les 557,30 € de factures non parvenues de l'écriture CL-5."]];
  let h=head('Ce qui reste à trancher',"Chaque point est chiffré. Aucun n'est intégré au résultat sans votre accord.");
  h+=`<div class="tw"><table><thead><tr><th>#</th><th>Sujet</th><th class="n">Montant en jeu</th>
    <th>Le constat</th><th>Ce que nous proposons</th></tr></thead><tbody>`+
    P.map((p,i)=>`<tr><td class="c mono">${i+1}</td><td><strong>${E(p[0])}</strong></td>
      <td class="n mono ${p[1]==null?'z':cls(p[1])}">${p[1]==null?'·':fmt(p[1])}</td>
      <td class="small" style="max-width:430px">${E(p[2])}</td>
      <td class="small" style="max-width:380px">${E(p[3])}</td></tr>`).join('')+
    `</tbody></table></div>`;
  return h;
});

/* ---- 14. compte d'attente ---- */
add('14',"Compte d'attente",()=>{
  const A=D.attente, tot=R2(A.reduce((s,x)=>s+x[2],0));
  const LOT=[['AIRBNB HM8DPE — hébergement des apprentis',2294.08,'6257'],
   ["BOOKING — réservation d'hôtel, annulée et remboursée le 16/07",1341.46,'6256.9'],
   ['Déplacements et restauration de juillet',1436.64,'6256.9'],
   ['Abonnements SaaS de juillet',760.06,'6156.9'],
   ['SCORM ALABOS — deux achats de cours (02/07 et 18/07)',700.00,'6022.2'],
   ["CENTRAL AUTOS — entretien du véhicule",597.76,'615'],
   ["Abonnements IA de juillet",487.03,'6156.2'],
   ['Fournitures — CULTURA, LECLERC, Action',377.99,'6064'],
   ['KEYYO — téléphonie',257.50,'626'],
   ['MOB COWORKING — usage ponctuel',23.00,'6132.9']];
  const GROS=[["Lot « CARTE FACTURETTES CB » du 31/07/2026",8275.52,"Les achats carte de juillet en un seul bloc. Le détail de juillet de votre modèle le décompose au centime (ci-dessous). Il contient la réservation BOOKING de 1 341,46 € — la seule ligne du compte qui se compense. Le lot pèse donc 6 934,06 € nets."],
   ["Restauration et petits achats sans facture",3082.86,"73 lignes de moins de 180 € : restaurants, péages, courses, tickets CB. Le grand livre les libelle lui-même « PAS DE FACTURE » ou « TICKET CB »."],
   ["Note de frais de juillet — Xavier GAUSSENS",2993.88,"Virement du 20/07/2026, libellé « FRAIS JUILLET RECAP ». Aucune note détaillée au dossier."],
   ["Quai des Lanternes — séminaire de clôture",2076.33,"Acompte de 1 344,35 € le 16/07 et solde de 731,98 € le 31/07. Même fournisseur, même objet."],
   ["Carburant et entretien du véhicule",1466.10,"18 lignes sur tout l'exercice (TOTAL, ESSO, AGIP, CRAUSAZ, STATION CALAO, MIDAS, LAVAGE BRESSAN, VW Bank)."],
   ["BOOKING — remboursement de la réservation",-1341.46,"SEULE COMPENSATION DU COMPTE. Elle annule exactement la charge BOOKING logée dans le lot carte."],
   ["Auto-école NOUGARET — aide au permis",500.00,"Virement du 17/01/2026. Relève du compte 6251 « déplacements des apprentis »."],
   ["Remboursement de frais de PC",500.00,"Virement du 09/04/2026. Se rattache au lot de PC des apprentis (compte 6068)."],
   ["Note de frais de juillet — Stéphanie HOUVENAGHEL",403.93,"Virement du 20/07/2026. Aucune note détaillée au dossier."]];
  let h=head("Compte d'attente 4710000 — 18 227,40 € laissés en attente",
    "Le compte reste ouvert : ces 93 opérations ne pèsent pas sur le résultat de l'exercice. Chacune porte la nature que nous lui reconnaissons — l'imputation est prête pour le jour où les pièces arrivent.");
  h+=`<div class="tw"><table><thead><tr><th>Les grosses sommes</th><th class="n">Montant</th><th>Ce que nous en savons</th></tr></thead><tbody>`+
    GROS.map(g=>`<tr><td><strong>${E(g[0])}</strong></td><td class="n mono ${cls(g[1])}">${fmt(g[1])}</td>
      <td class="small" style="max-width:640px">${E(g[2])}</td></tr>`).join('')+
    `<tr class="sum"><td>Total du compte d'attente au 31/07/2026</td><td class="n">${fmt(tot)}</td><td></td></tr></tbody></table></div>`;
  h+=`<h3 class="sec">Décomposition du lot « CARTE FACTURETTES CB »</h3><div class="tw"><table><thead><tr>
    <th>Nature</th><th class="n">Montant</th><th class="c">Compte CFA visé</th></tr></thead><tbody>`+
    LOT.map(x=>`<tr><td>${E(x[0])}</td><td class="n mono">${fmt(x[1])}</td><td class="c mono">${E(x[2])}</td></tr>`).join('')+
    `<tr class="sum"><td>Total du lot</td><td class="n">${fmt(R2(LOT.reduce((s,x)=>s+x[1],0)))}</td><td></td></tr>
     <tr><td style="color:var(--charge)">dont BOOKING, annulé et remboursé le 16/07</td><td class="n mono neg">-1 341,46</td><td></td></tr>
     <tr class="sum"><td>Charge nette du lot</td><td class="n">${fmt(R2(LOT.reduce((s,x)=>s+x[1],0)-1341.46))}</td><td></td></tr></tbody></table></div>`;
  h+=`<h3 class="sec">Les 93 opérations, ligne à ligne</h3><div class="tw"><table><thead><tr><th>Date</th>
    <th>Libellé du grand livre</th><th class="n">Montant</th><th>Nature reconnue</th><th>Clé analytique</th></tr></thead><tbody>`+
    A.map(x=>`<tr><td class="mono">${E(x[0])}</td><td>${E(x[1])}</td>
      <td class="n mono ${cls(x[2])}">${fmt(x[2])}</td>
      <td class="small">${x[3]?E(x[3])+' — '+E(D.plan[x[3]]||''):(x[1].toUpperCase().includes('CARTE FACTURETTES')?'à ventiler — voir la décomposition ci-dessus':'à identifier')}</td>
      <td class="small">${E(x[4])}</td></tr>`).join('')+
    `<tr class="sum"><td></td><td>Total — ${A.length} opérations</td><td class="n">${fmt(tot)}</td><td></td><td></td></tr></tbody></table></div>`;
  h+=note("La colonne « Nature reconnue » est celle que votre propre modèle analytique donne à chaque opération : 91 des 93 lignes s'y apparient au centime et à la date. Rien n'est comptabilisé tant que les pièces ne sont pas produites.");
  return h;
});

/* ================= routeur ================= */
function head(t,p){return `<div class="head"><p class="eyebrow">WE-FORM · exercice 1 · plan comptable CFA</p><h2>${E(t)}</h2><p>${E(p)}</p></div>`;}
function note(html,warn){return `<p class="note${warn?' warn':''}">${html}</p>`;}
function bind(){}
let cur=0;
function show(i){
  cur=i; FS=[]; TS=[];
  document.getElementById('main').innerHTML=SEC[i].f();
  document.querySelectorAll('#nav button').forEach((b,j)=>b.setAttribute('aria-current',j===i?'true':'false'));
  if(SEC[i].k==='3'){['q','fc','fa'].forEach(id=>{const el=document.getElementById(id);
    if(el) el.oninput=el.onchange=()=>{renderDet();}}); renderDet();}
  if(SEC[i].k==='5'){const el=document.getElementById('qs'); if(el) el.oninput=renderStag; renderStag();}
  if(SEC[i].k==='12'){const el=document.getElementById('qm'); if(el) el.oninput=renderMap; renderMap();}
  window.scrollTo(0,0);
}
document.getElementById('nav').innerHTML=SEC.map((s,i)=>
  `<button type="button" data-i="${i}"><span class="k">${s.k}</span><span>${E(s.t)}</span></button>`).join('');
document.getElementById('nav').addEventListener('click',e=>{
  const b=e.target.closest('button[data-i]'); if(b) show(+b.dataset.i);});
show(0);
