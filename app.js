(() => {
"use strict";
const $=id=>document.getElementById(id);
const defaults={electricityPrice:.41,fuelPrice:1.90,electricConsumption:23,fuelConsumption:8.7,hybridElectric:11.5,hybridFuel:3.8,chargingLoss:10,annualDistance:15000,batteryHealth:97,mileage:45680};
const ids={electricityPrice:"electricityPrice",fuelPrice:"fuelPrice",electricConsumption:"electricConsumption",fuelConsumption:"fuelConsumption",hybridElectric:"hybridElectric",hybridFuel:"hybridFuel",chargingLoss:"chargingLoss",annualDistance:"annualDistance",batteryHealth:"batteryHealth"};
const parse=v=>Number(String(v).trim().replace(/\s/g,"").replace(",","."));
const euro=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
const num=v=>new Intl.NumberFormat("de-DE",{maximumFractionDigits:0}).format(v);
const dec=(v,d=2)=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
let state=load();
function load(){try{return {...defaults,...JSON.parse(localStorage.getItem("glc-v21"))}}catch(e){return {...defaults}}}
function save(){try{localStorage.setItem("glc-v21",JSON.stringify(state))}catch(e){}}
function fill(){Object.entries(ids).forEach(([k,id])=>$(id).value=String(state[k]).replace(".",","));$("mileageInput").value=state.mileage;updateMileage()}
function vals(){const v={};Object.entries(ids).forEach(([k,id])=>v[k]=parse($(id).value));return v}
function validate(v){if(Object.values(v).some(n=>!Number.isFinite(n)))return"Bitte in allen Feldern gültige Zahlen eingeben.";if(Object.values(v).some(n=>n<0))return"Negative Werte sind nicht zulässig.";if(v.electricConsumption<=0||v.fuelConsumption<=0||v.annualDistance<=0)return"Verbrauch und Jahresfahrleistung müssen größer als null sein.";if(v.batteryHealth>100)return"Der Akkuzustand darf maximal 100 % betragen.";return""}
function updateMileage(){$("mileageDisplay").textContent=num(state.mileage)+" km"}
function calc(scroll=false){
 const v=vals(),err=validate(v);if(err){$("error").hidden=false;$("error").textContent=err;return}$("error").hidden=true;
 const factor=1+v.chargingLoss/100;
 const costs={electric:v.electricConsumption*factor*v.electricityPrice,hybrid:v.hybridElectric*factor*v.electricityPrice+v.hybridFuel*v.fuelPrice,fuel:v.fuelConsumption*v.fuelPrice};
 const names={electric:"Elektrisch fahren",hybrid:"Kombiniert fahren",fuel:"Rein mit Benzin"}, labels={electric:"Elektrisch",hybrid:"Kombiniert",fuel:"Benzin"};
 const sorted=Object.entries(costs).map(([key,cost])=>({key,cost})).sort((a,b)=>a.cost-b.cost),best=sorted[0],second=sorted[1];
 const save100=second.cost-best.cost,saveYear=save100*v.annualDistance/100;
 $("bestMode").textContent=names[best.key];$("bestDescription").textContent="ist bei den aktuellen Preisen die günstigste Wahl.";
 $("saving100").textContent=euro(save100)+" / 100 km";$("savingYear").textContent=euro(saveYear)+" pro Jahr";
 $("ranking").innerHTML=sorted.map((m,i)=>`<div><span>${i+1}. ${labels[m.key]}</span><strong>${euro(m.cost)} / 100 km</strong></div>`).join("");
 ["electric","hybrid","fuel"].forEach(key=>{
   $(key+"Cost").textContent=euro(costs[key]);$(key+"Detail").textContent=euro(costs[key]/100)+" pro km";
   $(key+"Month").textContent=euro(costs[key]*v.annualDistance/1200);$(key+"Year").textContent=euro(costs[key]*v.annualDistance/100);
   document.querySelector(`[data-mode="${key}"]`).classList.toggle("best",key===best.key);
 });
 const be=v.fuelConsumption*v.fuelPrice/(v.electricConsumption*factor);
 $("breakEven").textContent=dec(be)+" €/kWh";$("bestMonthly").textContent=euro(best.cost*v.annualDistance/1200);
 $("bestMonthlyText").textContent=labels[best.key]+" bei "+num(v.annualDistance/12)+" km pro Monat.";
 $("totalSaving").textContent=euro(saveYear)+" / Jahr";$("totalSavingText").textContent="gegenüber "+labels[second.key]+" bei "+num(v.annualDistance)+" km.";
 const ds=[50,100,250,500,1000,5000,v.annualDistance].filter((d,i,a)=>a.indexOf(d)===i);
 $("distanceTable").innerHTML=ds.map(d=>`<tr><td>${num(d)} km</td><td>${euro(costs.electric*d/100)}</td><td>${euro(costs.hybrid*d/100)}</td><td>${euro(costs.fuel*d/100)}</td></tr>`).join("");
 $("batteryDisplay").textContent=dec(v.batteryHealth,0)+" %";$("batteryBar").style.width=Math.min(100,v.batteryHealth)+"%";
 state={...state,...v};save();if(scroll)$("comparison").scrollIntoView({behavior:"smooth"})
}
$("calcForm").addEventListener("submit",e=>{e.preventDefault();calc(true)});
let timer;Object.values(ids).forEach(id=>$(id).addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>calc(false),180)}));
$("reset").addEventListener("click",()=>{state={...defaults};fill();calc(false)});
const drawer=$("drawer"),backdrop=$("drawerBackdrop");
function openMenu(){drawer.classList.add("open");backdrop.classList.add("show")}
function closeMenu(){drawer.classList.remove("open");backdrop.classList.remove("show")}
$("menuButton").addEventListener("click",openMenu);$("closeMenu").addEventListener("click",closeMenu);backdrop.addEventListener("click",closeMenu);document.querySelectorAll(".drawer a").forEach(a=>a.addEventListener("click",closeMenu));
const dialog=$("mileageDialog");$("editMileage").addEventListener("click",()=>dialog.showModal());$("saveMileage").addEventListener("click",()=>{const v=parse($("mileageInput").value);if(Number.isFinite(v)&&v>=0){state.mileage=v;updateMileage();save()}});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
fill();calc(false);
})();