const $=id=>document.getElementById(id);
const ids=['ep','bp','ek','bl','hk','hl','lv','km','radius','priceMode'];
const stateKey='michiesGlcOrganizerV3';
const keyStorage='michiesTankkoenigApiKey';

function formatEuro(v,d=2){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(v)}
function readNumber(id){const n=Number($(id).value);return Number.isFinite(n)?n:0}
function save(){const data={};ids.forEach(id=>data[id]=$(id).value);localStorage.setItem(stateKey,JSON.stringify(data));localStorage.setItem(keyStorage,$('apiKey').value.trim())}
function load(){try{const data=JSON.parse(localStorage.getItem(stateKey)||'{}');ids.forEach(id=>{if(data[id]!==undefined)$(id).value=data[id]});$('apiKey').value=localStorage.getItem(keyStorage)||''}catch(e){console.warn(e)}}

function calculate(){
  const ep=readNumber('ep'),bp=readNumber('bp'),ek=readNumber('ek'),bl=readNumber('bl'),hk=readNumber('hk'),hl=readNumber('hl'),loss=1+readNumber('lv')/100,km=readNumber('km');
  const modes=[{name:'Elektro',icon:'🔋',cost:ek*loss*ep},{name:'Hybrid',icon:'🔄',cost:hk*loss*ep+hl*bp},{name:'Benzin',icon:'⛽',cost:bl*bp}];
  $('summary').innerHTML=modes.map(m=>`<article class="metric"><div>${m.icon} ${m.name}</div><div class="value">${formatEuro(m.cost)} / 100 km</div><small>${formatEuro(m.cost/100,3)} / km · ${formatEuro(m.cost*km/100,0)} / Jahr</small></article>`).join('');
  const ranked=[...modes].sort((a,b)=>a.cost-b.cost);const saving=ranked[1].cost-ranked[0].cost;
  const breakEven=(ek*loss)>0?(bl*bp)/(ek*loss):0;
  $('recommendation').innerHTML=`🏆 <strong>${ranked[0].name}</strong> ist aktuell am günstigsten – ${formatEuro(saving)} weniger je 100 km als ${ranked[1].name}.<br><small>Break-even Elektro/Benzin: ${formatEuro(breakEven)} pro kWh.</small>`;
  $('distanceRows').innerHTML=[50,100,250,500,1000,5000].map(d=>`<tr><td>${d} km</td>${modes.map(m=>`<td>${formatEuro(m.cost*d/100)}</td>`).join('')}</tr>`).join('');
  save();
}

function setStatus(text,type=''){$('fuelStatus').textContent=text;$('fuelStatus').className=`status ${type}`}
function getLocation(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Standortabfrage wird von diesem Browser nicht unterstützt.'));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:300000})})}

async function loadFuelPrices(){
  const key=$('apiKey').value.trim(); if(!key){setStatus('Bitte zuerst den Tankerkönig API-Key eingeben.','error');$('apiKey').focus();return}
  save();setStatus('Standort wird ermittelt …');$('locateBtn').disabled=true;
  try{
    const pos=await getLocation();const {latitude:lat,longitude:lng}=pos.coords;const radius=$('radius').value;
    const url=new URL('https://creativecommons.tankerkoenig.de/json/list.php');
    url.search=new URLSearchParams({lat:String(lat),lng:String(lng),rad:String(radius),sort:'price',type:'e10',apikey:key});
    const res=await fetch(url);if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();if(!data.ok)throw new Error(data.message||'API-Anfrage fehlgeschlagen.');
    const stations=(data.stations||[]).filter(s=>s.isOpen&&Number.isFinite(Number(s.price))&&Number(s.price)>0);
    if(!stations.length)throw new Error('Keine offene Tankstelle mit gemeldetem E10-Preis gefunden.');
    const byPrice=[...stations].sort((a,b)=>a.price-b.price);const byDist=[...stations].sort((a,b)=>a.dist-b.dist);let selected;
    if($('priceMode').value==='average') selected={price:stations.reduce((sum,s)=>sum+Number(s.price),0)/stations.length,name:`Durchschnitt aus ${stations.length} offenen Tankstellen`};
    else if($('priceMode').value==='nearest') selected=byDist[0]; else selected=byPrice[0];
    $('bp').value=Number(selected.price).toFixed(3);
    $('stations').innerHTML=byPrice.slice(0,5).map(s=>`<div class="station"><div><strong>${s.brand||s.name||'Tankstelle'}</strong><small>${s.street||''} ${s.houseNumber||''}, ${s.place||''} · ${Number(s.dist).toFixed(1).replace('.',',')} km · ${s.isOpen?'geöffnet':'geschlossen'}</small></div><div class="price">${formatEuro(Number(s.price),3)}</div></div>`).join('');
    $('mapsLink').href=`https://www.google.com/maps/search/Tankstelle/@${lat},${lng},13z`;
    setStatus(`${formatEuro(Number(selected.price),3)} pro Liter wurde automatisch in den Kostenrechner übernommen. Stand: ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr.`,'success');
    calculate();
  }catch(err){let message=err.message||'Unbekannter Fehler';if(err.code===1)message='Standortfreigabe wurde abgelehnt. Bitte in den Browser-Einstellungen erlauben oder den Benzinpreis manuell eintragen.';if(err.code===2)message='Standort konnte nicht bestimmt werden.';if(err.code===3)message='Standortabfrage hat zu lange gedauert.';setStatus(message,'error')}
  finally{$('locateBtn').disabled=false}
}

$('calcBtn').addEventListener('click',calculate);$('locateBtn').addEventListener('click',loadFuelPrices);$('toggleKey').addEventListener('click',()=>{const input=$('apiKey');input.type=input.type==='password'?'text':'password';$('toggleKey').textContent=input.type==='password'?'Anzeigen':'Verbergen'});ids.forEach(id=>$(id).addEventListener('change',()=>{save();calculate()}));
load();calculate();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(console.warn));
