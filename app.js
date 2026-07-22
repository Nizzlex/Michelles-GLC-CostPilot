(function(){
"use strict";
const $=id=>document.getElementById(id);
const parse=v=>Number(String(v).trim().replace(/\s/g,"").replace(",","."));
const euro=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(v);
const integer=v=>new Intl.NumberFormat("de-DE",{maximumFractionDigits:0}).format(v);
const ids=["ep","bp","ec","fc","hc","hf","loss","annual"];

function values(){
 const o={}; ids.forEach(id=>o[id]=parse($(id).value)); return o;
}
function validate(v){
 if(Object.values(v).some(n=>!Number.isFinite(n))) return "Bitte in allen Feldern gültige Zahlen eingeben.";
 if(Object.values(v).some(n=>n<0)) return "Negative Werte sind nicht zulässig.";
 if(v.ec===0||v.fc===0||v.annual===0) return "Verbrauch und Jahresfahrleistung müssen größer als null sein.";
 return "";
}
function save(v){try{localStorage.setItem("glc-costpilot",JSON.stringify(v));}catch(e){}}
function load(){try{const v=JSON.parse(localStorage.getItem("glc-costpilot"));if(v)ids.forEach(id=>{if(v[id]!==undefined)$(id).value=String(v[id]).replace(".",",")});}catch(e){}}

$("calc-form").addEventListener("submit",function(ev){
 ev.preventDefault();
 const v=values(), err=validate(v);
 if(err){$("error").textContent=err;$("error").hidden=false;$("results").hidden=true;return;}
 $("error").hidden=true;
 const factor=1+v.loss/100;
 const electric=v.ec*factor*v.ep;
 const hybrid=v.hc*factor*v.ep+v.hf*v.bp;
 const fuel=v.fc*v.bp;
 const modes=[{name:"Rein elektrisch",cost:electric},{name:"Kombiniert",cost:hybrid},{name:"Rein Benzin",cost:fuel}].sort((a,b)=>a.cost-b.cost);
 const best=modes[0], next=modes[1], saving100=next.cost-best.cost, annualSaving=saving100*v.annual/100;

 $("electric").textContent=euro(electric)+" / 100 km";
 $("hybrid").textContent=euro(hybrid)+" / 100 km";
 $("fuel").textContent=euro(fuel)+" / 100 km";
 $("electric-year").textContent=euro(electric*v.annual/100)+" pro Jahr";
 $("hybrid-year").textContent=euro(hybrid*v.annual/100)+" pro Jahr";
 $("fuel-year").textContent=euro(fuel*v.annual/100)+" pro Jahr";
 $("recommendation").textContent="Heute lohnt sich: "+best.name;
 $("recommendation-detail").textContent="Ersparnis gegenüber "+next.name+": "+euro(saving100)+" je 100 km.";
 $("break-even").textContent=(v.fc*v.bp/(v.ec*factor)).toFixed(2).replace(".",",")+" €/kWh";
 $("saving").textContent=euro(annualSaving);
 $("saving-text").textContent="gegenüber "+next.name+" bei "+integer(v.annual)+" km/Jahr";

 const distances=[50,100,250,500,1000,5000,v.annual].filter((n,i,a)=>a.indexOf(n)===i);
 $("distance-table").innerHTML=distances.map(d=>"<tr><td>"+integer(d)+" km</td><td>"+euro(electric*d/100)+"</td><td>"+euro(hybrid*d/100)+"</td><td>"+euro(fuel*d/100)+"</td></tr>").join("");
 $("results").hidden=false;
 save(v);
 $("results").scrollIntoView({behavior:"smooth",block:"start"});
});
load();
})();