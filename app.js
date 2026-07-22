(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const defaults = {
    electricityPrice: .41, fuelPrice: 1.90, electricConsumption: 23,
    fuelConsumption: 8.7, hybridElectric: 11.5, hybridFuel: 3.8,
    chargingLoss: 10, annualDistance: 15000, batteryHealth: 97, mileage: 45680
  };
  const ids = {
    electricityPrice:"electricity-price", fuelPrice:"fuel-price",
    electricConsumption:"electric-consumption", fuelConsumption:"fuel-consumption",
    hybridElectric:"hybrid-electric", hybridFuel:"hybrid-fuel",
    chargingLoss:"charging-loss", annualDistance:"annual-distance",
    batteryHealth:"battery-health"
  };
  const parse = value => Number(String(value).trim().replace(/\s/g,"").replace(",","."));
  const euro = value => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(value);
  const number = value => new Intl.NumberFormat("de-DE",{maximumFractionDigits:0}).format(value);
  const decimal = (value,d=2) => new Intl.NumberFormat("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d}).format(value);

  let state = load();
  function load(){
    try { return {...defaults,...JSON.parse(localStorage.getItem("glc-v2"))}; }
    catch(e){ return {...defaults}; }
  }
  function save(){ try{ localStorage.setItem("glc-v2",JSON.stringify(state)); }catch(e){} }
  function fill(){
    Object.entries(ids).forEach(([key,id]) => $(id).value=String(state[key]).replace(".",","));
    $("mileage-input").value=state.mileage;
    updateMileage();
  }
  function values(){
    const v={}; Object.entries(ids).forEach(([key,id])=>v[key]=parse($(id).value)); return v;
  }
  function validate(v){
    if(Object.values(v).some(n=>!Number.isFinite(n))) return "Bitte in allen Feldern gültige Zahlen eintragen.";
    if(Object.values(v).some(n=>n<0)) return "Negative Werte sind nicht zulässig.";
    if(v.electricConsumption<=0||v.fuelConsumption<=0||v.annualDistance<=0) return "Verbrauch und Jahresfahrleistung müssen größer als null sein.";
    if(v.batteryHealth>100) return "Der Akkuzustand darf maximal 100 % betragen.";
    return "";
  }
  function updateMileage(){ $("mileage-display").textContent=number(state.mileage)+" km"; }

  function calculate(scroll=false){
    const v=values(), err=validate(v);
    if(err){ $("error").hidden=false; $("error").textContent=err; return; }
    $("error").hidden=true;
    const factor=1+v.chargingLoss/100;
    const costs={
      electric:v.electricConsumption*factor*v.electricityPrice,
      hybrid:v.hybridElectric*factor*v.electricityPrice+v.hybridFuel*v.fuelPrice,
      fuel:v.fuelConsumption*v.fuelPrice
    };
    const names={electric:"Elektrisch fahren",hybrid:"Kombiniert fahren",fuel:"Rein mit Benzin"};
    const labels={electric:"Elektrisch",hybrid:"Kombiniert",fuel:"Benzin"};
    const sorted=Object.entries(costs).map(([key,cost])=>({key,cost})).sort((a,b)=>a.cost-b.cost);
    const best=sorted[0], second=sorted[1];
    const saving100=second.cost-best.cost, savingYear=saving100*v.annualDistance/100;

    $("best-mode").textContent=names[best.key];
    $("best-description").textContent="ist bei den aktuellen Preisen die günstigste Wahl.";
    $("saving-100").textContent=euro(saving100)+" / 100 km";
    $("saving-year").textContent=euro(savingYear)+" pro Jahr";
    $("ranking").innerHTML=sorted.map((m,i)=>`<li><span>${i+1}. ${labels[m.key]}</span><strong>${euro(m.cost)} / 100 km</strong></li>`).join("");

    for(const key of ["electric","hybrid","fuel"]){
      $(key+"-cost").textContent=euro(costs[key]);
      $(key+"-detail").textContent=euro(costs[key]/100)+" pro km";
      $(key+"-month").textContent=euro(costs[key]*v.annualDistance/1200);
      $(key+"-year").textContent=euro(costs[key]*v.annualDistance/100);
      document.querySelector(`[data-mode="${key}"]`).classList.toggle("best",key===best.key);
    }

    const breakEven=v.fuelConsumption*v.fuelPrice/(v.electricConsumption*factor);
    $("break-even").textContent=decimal(breakEven)+" €/kWh";
    $("best-monthly").textContent=euro(best.cost*v.annualDistance/1200);
    $("best-monthly-text").textContent=labels[best.key]+" bei "+number(v.annualDistance/12)+" km pro Monat.";
    $("total-saving").textContent=euro(savingYear)+" / Jahr";
    $("total-saving-text").textContent="gegenüber "+labels[second.key]+" bei "+number(v.annualDistance)+" km.";

    const distances=[50,100,250,500,1000,5000,v.annualDistance].filter((d,i,a)=>a.indexOf(d)===i);
    $("distance-table").innerHTML=distances.map(d=>`<tr><td>${number(d)} km</td><td>${euro(costs.electric*d/100)}</td><td>${euro(costs.hybrid*d/100)}</td><td>${euro(costs.fuel*d/100)}</td></tr>`).join("");

    $("battery-display").textContent=decimal(v.batteryHealth,0)+" %";
    $("battery-bar").style.width=Math.min(100,v.batteryHealth)+"%";
    state={...state,...v}; save();
    if(scroll) $("comparison").scrollIntoView({behavior:"smooth"});
  }

  $("calculator").addEventListener("submit",e=>{e.preventDefault();calculate(true)});
  let timer;
  Object.values(ids).forEach(id=>$(id).addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>calculate(false),180)}));
  $("reset").addEventListener("click",()=>{state={...defaults};fill();calculate(false)});
  $("menu-button").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  document.querySelectorAll("nav a").forEach(a=>a.addEventListener("click",()=>$("sidebar").classList.remove("open")));

  const dialog=$("mileage-dialog");
  $("edit-mileage").addEventListener("click",()=>dialog.showModal());
  $("save-mileage").addEventListener("click",()=>{
    const value=parse($("mileage-input").value);
    if(Number.isFinite(value)&&value>=0){state.mileage=value;updateMileage();save()}
  });

  if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
  fill(); calculate(false);
})();