const D = window.__DATA__;
const L = D.lignes;
const AXN = ['Apprentissage','Formation continue','Ligue AURA','Commun','Hors périmètre'];
const NB = ' ';                                   // espace fine insécable
const E = (s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function fmt(v,blank){
  if(v==null||(blank&&Math.abs(v)<0.005)) return '·';
  const s = Math.abs(v).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,NB);
  return (v<0?'-':'')+s;
}
const R2b = v => Math.round(v*100)/100;
const cls = v => v==null||Math.abs(v)<0.005 ? 'z' : (v<0?'neg':'pos');

/* ---------- sélection des lignes composant un chiffre ---------- */
function select(f){
  if(!f) return [];
  let ix;
  if(f.idx) ix = f.idx.slice();
  else ix = L.map((_,i)=>i);
  return ix.filter(i=>{
    const l = L[i];
    if(f.cfa && l[5]!==f.cfa) return false;
    if(f.cls && l[5][0]!==f.cls) return false;
    if(f.src && l[4]!==f.src) return false;
    if(f.piece && l[1]!==f.piece) return false;
    if(f.cle && l[12]!==f.cle) return false;
    if(f.name && !norm(l[3]).includes(f.name)) return false;
    if(f.ax!=null && Math.abs(l[7+f.ax])<0.005) return false;
    return true;
  });
}
const valOf = (i,f)=> f && f.ax!=null ? L[i][7+f.ax] : L[i][6];
const sumOf = (ix,f)=> Math.round(ix.reduce((s,i)=>s+valOf(i,f),0)*100)/100;

/* ---------- rendu d'un chiffre cliquable ---------- */
let FS = [], TS = [];
function num(v,f,o){
  o = o||{};
  const c = o.plain ? '' : ' '+cls(v);
  if(!f) return `<span class="mono${c}">${fmt(v,o.blank)}</span>`;
  FS.push(f); TS.push(o.title||'');
  return `<button class="f${o.calc?' calc':''}${c}" data-f="${FS.length-1}" data-v="${v}">${fmt(v,o.blank)}</button>`;
}
const cell = (v,f,o)=>`<td class="n">${num(v,f,o)}</td>`;

/* ---------- tiroir ---------- */
const drawer=document.getElementById('drawer'), scrim=document.getElementById('scrim');
function closeD(){drawer.classList.remove('on');scrim.classList.remove('on');drawer.setAttribute('aria-hidden','true');}
document.getElementById('dclose').onclick=closeD; scrim.onclick=closeD;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeD();});

function openD(f,title,expected){
  const ix = select(f), tot = sumOf(ix,f), ok = Math.abs(tot-expected)<0.02;
  document.getElementById('dtitle').textContent = title||'Détail';
  const why = [];
  if(f.cfa) why.push(`compte CFA <strong>${E(f.cfa)}</strong> — ${E(D.plan[f.cfa]||'')}`);
  if(f.cls) why.push(`comptes de classe <strong>${f.cls}</strong>`);
  if(f.src) why.push(`compte SECOGEST <strong>${E(f.src)}</strong>`);
  if(f.piece) why.push(`écriture de clôture <strong>${E(f.piece)}</strong>`);
  if(f.cle) why.push(`clé <strong>${E(f.cle)}</strong>`);
  if(f.ax!=null) why.push(`part de l'axe <strong>${AXN[f.ax]}</strong>`);
  if(f.note) why.push(f.note);
  if(f.mod) why.push(f.mod);
  document.getElementById('dwhy').innerHTML = why.length? why.join(' · ') :
    'Toutes les lignes de charges et de produits du grand livre.';
  document.getElementById('dcheck').innerHTML = f.mod ?
    `<div><span class="lab">Chiffre affiché — votre modèle</span><span class="val">${fmt(expected)}</span></div>
     <div><span class="lab">Ce que porte le grand livre</span><span class="val">${fmt(tot)}</span></div>
     <div><span class="lab">Écart modèle − grand livre</span><span class="val ${Math.abs(tot-expected)<0.02?'ok':''}">${Math.abs(tot-expected)<0.02?'✓ 0,00':fmt(R2b(expected-tot))}</span></div>
     <div><span class="lab">Lignes de grand livre</span><span class="val">${ix.length}</span></div>` :
    f.calc ?
    `<div><span class="lab">Chiffre affiché</span><span class="val">${fmt(expected)}</span></div>
     <div><span class="lab">Mode d'obtention</span><span class="val" style="font-size:12.5px;font-weight:500">${E(f.calc)}</span></div>
     <div><span class="lab">Base répartie</span><span class="val">${fmt(tot)}</span></div>
     <div><span class="lab">Lignes de la base</span><span class="val">${ix.length}</span></div>` :
    `<div><span class="lab">Chiffre affiché</span><span class="val">${fmt(expected)}</span></div>
     <div><span class="lab">Somme des lignes</span><span class="val ${ok?'ok':'ko'}">${fmt(tot)}</span></div>
     <div><span class="lab">Contrôle</span><span class="val ${ok?'ok':'ko'}">${ok?'✓ concordant':'✗ écart '+fmt(Math.round((tot-expected)*100)/100)}</span></div>
     <div><span class="lab">Lignes de grand livre</span><span class="val">${ix.length}</span></div>`;
  const body = document.getElementById('dbody');
  if(!ix.length){ body.innerHTML='<p class="empty">Aucune ligne de grand livre ne compose ce chiffre. Voir l’explication ci-dessus.</p>'; }
  else{
    const ax = f.ax!=null;
    ix.sort((a,b)=>Math.abs(valOf(b,f))-Math.abs(valOf(a,f)));
    body.innerHTML = `<table><thead><tr>
      <th>Date</th><th>Pièce</th><th>Jnl</th><th>Libellé du grand livre</th>
      <th>Cpte SECOGEST</th><th>Cpte CFA</th><th class="n">Montant</th>
      ${ax?`<th class="n">Part ${E(AXN[f.ax])}</th>`:''}<th>Clé analytique</th></tr></thead><tbody>`+
      ix.map(i=>{const l=L[i];return `<tr><td class="mono">${E(l[0])}</td><td class="mono">${E(l[1])}</td>
        <td class="c mono">${E(l[2])}</td><td class="lib">${E(l[3])}</td>
        <td class="c mono">${E(l[4])}</td><td class="c mono">${E(l[5])}</td>
        <td class="n ${cls(l[6])}">${fmt(l[6])}</td>
        ${ax?`<td class="n ${cls(l[7+f.ax])}">${fmt(l[7+f.ax])}</td>`:''}
        <td class="small">${E(l[12])}</td></tr>`;}).join('')+
      `</tbody></table>`;
  }
  body.scrollTop=0;
  drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden','false');
  document.getElementById('dclose').focus();
}
document.addEventListener('click',e=>{
  const b = e.target.closest('button.f'); if(!b) return;
  openD(FS[+b.dataset.f], TS[+b.dataset.f], +b.dataset.v);
});

