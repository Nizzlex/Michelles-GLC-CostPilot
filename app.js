'use strict';
const $ = id => document.getElementById(id);
const defaults={ep:0.41,bp:1.90,ek:23,bl:8.7,hk:11.5,hl:3.8,lv:10,annualKm:15000,odoInput:45680,fuelLevel:64,batteryLevel:78,tankSize:50,batteryCapacity:11.1,radius:5,apiKey:'',mobilityShortcut:'mobility+ öffnen',mercedesShortcut:'Mercedes-Benz öffnen'};
const inputIds=Object.keys(defaults);
const stateKey='michiesGlcOrganizerV70';
let state={...defaults};

function load(){
  try{state={...defaults,...JSON.parse(localStorage.getItem(stateKey)||'{}')}}
  catch{state={...defaults}}
  inputIds.forEach(id=>{if($(id))$(id).value=state[id]??''});
  if($('radiusValue')) $('radiusValue').textContent=state.radius;
}

function save(){
  inputIds.forEach(id=>{
    if($(id)) state[id]=$(id).type==='number'||$(id).type==='range'?Number($(id).value):$(id).value
  });
  localStorage.setItem(stateKey,JSON.stringify(state));
}

function n(id){const v=Number($(id)?.value);return Number.isFinite(v)?v:0}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function money(v,d=2){return Number.isFinite(v)?v.toLocaleString('de-DE',{style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}):'–'}
function number(v,d=0){return Number.isFinite(v)?v.toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d}):'–'}
function toast(msg){if(!$('toast'))return;$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}

function calculate(){
  const ep=Math.max(0,n('ep')),bp=Math.max(0,n('bp')),factor=1+clamp(n('lv'),0,50)/100,annual=Math.max(0,n('annualKm'));
  const costs={electric:n('ek')*factor*ep,hybrid:n('hk')*factor*ep+n('hl')*bp,petrol:n('bl')*bp};
  const names={electric:'Elektrisch',hybrid:'Hybrid',petrol:'Benzin'};
  const sorted=Object.entries(costs).sort((a,b)=>a[1]-b[1]),winner=sorted[0],second=sorted[1],saving=(second[1]-winner[1]),annualSaving=saving*annual/100;

  ['electric','hybrid','petrol'].forEach(k=>{
    if($(`${k}Cost`)) $(`${k}Cost`).textContent=money(costs[k]);
    if($(`${k}100`)) $(`${k}100`).textContent=money(costs[k])+' / 100 km';
    if($(`${k}Year`)) $(`${k}Year`).textContent=money(costs[k]*annual/100)+' / Jahr';
    if($(`${k}Card`)) $(`${k}Card`).classList.toggle('best',k===winner[0]);
  });

  if($('heroWinner')) $('heroWinner').textContent=names[winner[0]]+' fahren';
  if($('heroSaving')) $('heroSaving').textContent=`${money(saving)} günstiger je 100 km`;
  if($('winnerPill')) $('winnerPill').textContent=names[winner[0]];
  if($('recommendation')) $('recommendation').textContent=`${names[winner[0]]} ist aktuell am günstigsten. Gegenüber Platz 2 sparst du etwa ${money(saving)} je 100 km und rund ${money(annualSaving)} pro Jahr.`;

  const fuelPct=clamp(n('fuelLevel'),0,100),batPct=clamp(n('batteryLevel'),0,100),litres=n('tankSize')*fuelPct/100,kwh=n('batteryCapacity')*batPct/100;
  const er=n('ek')>0?kwh/n('ek')*100:0,pr=n('bl')>0?litres/n('bl')*100:0;

  if($('statusOdo')) $('statusOdo').textContent=number(n('odoInput'))+' km';
  if($('statusFuel')) $('statusFuel').textContent=number(fuelPct)+' %';
  if($('statusBattery')) $('statusBattery').textContent=number(batPct)+' %';
  if($('statusRange')) $('statusRange').textContent=number(er+pr)+' km';
  if($('fuelLitres')) $('fuelLitres').textContent=`${number(litres,1)} l`;
  if($('batteryKwh')) $('batteryKwh').textContent=`${number(kwh,1)} kWh`;
  if($('electricRange')) $('electricRange').textContent=`${number(er)} km`;
  if($('petrolRange')) $('petrolRange').textContent=`${number(pr)} km`;
  if($('totalRange')) $('totalRange').textContent=`${number(er+pr)} km`;
  if($('energyValue')) $('energyValue').textContent=money(litres*bp+kwh*factor*ep);

  const beE=n('ek')>0?costs.petrol/(n('ek')*factor):NaN,beP=n('bl')>0?costs.electric/n('bl'):NaN;
  if($('breakEvenElectricity')) $('breakEvenElectricity').textContent=Number.isFinite(beE)?money(beE)+'/kWh':'–';
  if($('breakEvenPetrol')) $('breakEvenPetrol').textContent=Number.isFinite(beP)?money(beP)+'/l':'–';

  save();
}

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('active',b.dataset.go===name));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.go)));
inputIds.forEach(id=>$(id)?.addEventListener('input',()=>{if(id==='radius'&&$('radiusValue'))$('radiusValue').textContent=$(id).value;calculate()}));

function shortcutUrl(name){return `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`}
function openShortcut(name){if(!name){toast('Bitte zuerst den Kurzbefehl-Namen speichern.');return}location.href=shortcutUrl(name)}
if($('openMobility')) $('openMobility').onclick=()=>openShortcut($('mobilityShortcut').value.trim());
if($('openMercedes')) $('openMercedes').onclick=()=>openShortcut($('mercedesShortcut').value.trim());
if($('openMercedesVehicle')) $('openMercedesVehicle').onclick=()=>openShortcut($('mercedesShortcut').value.trim());
if($('openGoogleMaps')) $('openGoogleMaps').onclick=()=>window.open('https://www.google.com/maps/search/?api=1&query=Tankstelle','_blank');
if($('openSettings')) $('openSettings').onclick=()=>$('settingsDialog').showModal();
if($('saveSettings')) $('saveSettings').onclick=()=>{save();toast('Einstellungen gespeichert')};
if($('resetData')) $('resetData').onclick=()=>{if(confirm('Wirklich alle gespeicherten Werte zurücksetzen?')){localStorage.removeItem(stateKey);location.reload()}};

function tankPrice(station){
  const raw = station?.price ?? station?.e10;
  if(raw === false || raw === null || raw === undefined || raw === '') return null;
  const value = Number(String(raw).replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function loadStations(){
  const key=$('apiKey')?.value.trim();
  if(!key){
    if($('fuelMessage')) $('fuelMessage').textContent='Bitte zuerst den Tankerkönig API-Key in den Einstellungen speichern.';
    if($('settingsDialog')) $('settingsDialog').showModal();
    return;
  }
  if(!navigator.geolocation){
    if($('fuelMessage')) $('fuelMessage').textContent='Standortabfrage wird von diesem Gerät nicht unterstützt.';
    return;
  }

  $('fuelMessage').textContent='Standort wird ermittelt …';
  $('stations').innerHTML='';

  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude:lat,longitude:lng}=pos.coords,rad=n('radius');
    try{
      $('fuelMessage').textContent='Aktuelle E10-Preise werden geladen …';

      // type=e10 => Tankerkönig liefert den Kraftstoffpreis in "price".
      const url=`https://creativecommons.tankerkoenig.de/json/list.php?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&rad=${encodeURIComponent(rad)}&sort=dist&type=e10&apikey=${encodeURIComponent(key)}`;
      const res=await fetch(url,{cache:'no-store'});
      const data=await res.json();

      if(!res.ok||!data.ok) throw new Error(data.message||'API-Anfrage fehlgeschlagen');

      const stations=Array.isArray(data.stations)?data.stations:[];
      renderStations(stations.slice(0,12));
      $('fuelMessage').textContent=`${stations.length} Tankstellen im Umkreis gefunden.`;
    }catch(e){
      $('fuelMessage').textContent=`Preise konnten nicht geladen werden${e?.message?`: ${e.message}`:'.'}`;
      console.error('[Tankerkönig]',e);
    }
  },()=>{
    $('fuelMessage').textContent='Standortzugriff wurde nicht erlaubt. Bitte in den iPhone-Einstellungen für Safari aktivieren.';
  },{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
}

function renderStations(stations){
  $('stations').innerHTML=stations.length?'':'<article class="card"><p>Keine Tankstellen gefunden.</p></article>';

  stations.forEach(s=>{
    const card=document.createElement('article');
    card.className='station-card';

    const price=tankPrice(s);
    const maps=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.lat},${s.lng}`)}`;
    const priceText=price!==null
      ? price.toLocaleString('de-DE',{minimumFractionDigits:3,maximumFractionDigits:3})+' €/l'
      : '–';

    card.innerHTML=`
      <div class="station-top">
        <div>
          <h3>${escapeHtml(s.name||'Tankstelle')}</h3>
          <p>${escapeHtml(`${s.street||''} ${s.houseNumber||''}, ${s.postCode||''} ${s.place||''}`)}</p>
        </div>
        <div class="price">${priceText}</div>
      </div>
      <div class="station-meta">
        <span>${number(Number(s.dist),1)} km</span>
        <span>${s.isOpen?'Geöffnet':'Geschlossen'}</span>
      </div>
      <div class="station-actions">
        <button type="button"${price===null?' disabled':''}>${price===null?'Kein E10-Preis':'Preis übernehmen'}</button>
        <a href="${maps}" target="_blank" rel="noopener">Route</a>
      </div>`;

    card.querySelector('button').onclick=()=>{
      if(price===null){
        toast('Für diese Tankstelle ist aktuell kein E10-Preis verfügbar.');
        return;
      }
      $('bp').value=price.toFixed(3);
      calculate();
      save();
      toast(`E10-Preis ${price.toLocaleString('de-DE',{minimumFractionDigits:3,maximumFractionDigits:3})} €/l übernommen`);
      showScreen('calculator');
    };

    $('stations').appendChild(card);
  });
}

function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

if($('loadStations')) $('loadStations').onclick=loadStations;

load();
calculate();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js?v=7.1.1').catch(console.error);
}
