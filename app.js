'use strict';

const $ = (id) => document.getElementById(id);
const INPUT_IDS = ['odoInput','fuelLevel','batteryLevel','tankSize','batteryCapacity','km','ep','bp','ek','bl','hk','hl','lv'];

function num(id) {
  const value = Number.parseFloat($(id)?.value);
  return Number.isFinite(value) ? value : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function money(value, digits = 2) {
  return Number.isFinite(value)
    ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '–';
}

function number(value, digits = 0) {
  return Number.isFinite(value)
    ? value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '–';
}

function saveInputs() {
  const values = Object.fromEntries(INPUT_IDS.map((id) => [id, $(id).value]));
  localStorage.setItem('glcManualInputsV61', JSON.stringify(values));
}

function loadInputs() {
  try {
    const values = JSON.parse(localStorage.getItem('glcManualInputsV61'));
    Object.entries(values || {}).forEach(([id, value]) => {
      if ($(id)) $(id).value = value;
    });
  } catch (error) {
    console.warn('Gespeicherte Werte konnten nicht geladen werden.', error);
  }
}

function calculate() {
  const electricityPrice = Math.max(0, num('ep'));
  const petrolPrice = Math.max(0, num('bp'));
  const chargingFactor = 1 + clamp(num('lv'), 0, 50) / 100;
  const annualKm = Math.max(0, num('km'));

  const electricConsumption = Math.max(0, num('ek'));
  const petrolConsumption = Math.max(0, num('bl'));
  const hybridElectric = Math.max(0, num('hk'));
  const hybridPetrol = Math.max(0, num('hl'));

  const costs = {
    Elektrisch: electricConsumption * chargingFactor * electricityPrice,
    Hybrid: hybridElectric * chargingFactor * electricityPrice + hybridPetrol * petrolPrice,
    Benzin: petrolConsumption * petrolPrice
  };

  const sorted = Object.entries(costs).sort((a, b) => a[1] - b[1]);
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const saving100 = runnerUp[1] - winner[1];
  const annualSaving = saving100 * annualKm / 100;

  $('winner').textContent = winner[0];
  $('saving').textContent = `${money(saving100)} günstiger als Platz 2`;
  $('electricCost').textContent = money(costs.Elektrisch);
  $('hybridCost').textContent = money(costs.Hybrid);
  $('petrolCost').textContent = money(costs.Benzin);

  $('recommendation').innerHTML = `<strong>${winner[0]} ist mit den aktuellen Eingaben am günstigsten.</strong><span>Gegenüber dem zweitbesten Fahrmodus sparst du rund ${money(saving100)} je 100 km beziehungsweise ${money(annualSaving)} pro Jahr.</span>`;

  const rows = {
    electric: costs.Elektrisch,
    hybrid: costs.Hybrid,
    petrol: costs.Benzin
  };
  Object.entries(rows).forEach(([key, cost100]) => {
    $(`${key}100`).textContent = money(cost100);
    $(`${key}Km`).textContent = money(cost100 / 100, 3);
    $(`${key}Year`).textContent = money(cost100 * annualKm / 100);
  });

  const fuelLevel = clamp(num('fuelLevel'), 0, 100);
  const batteryLevel = clamp(num('batteryLevel'), 0, 100);
  const tankSize = Math.max(0, num('tankSize'));
  const batteryCapacity = Math.max(0, num('batteryCapacity'));

  const litresRemaining = tankSize * fuelLevel / 100;
  const batteryRemaining = batteryCapacity * batteryLevel / 100;
  const petrolRange = petrolConsumption > 0 ? litresRemaining / petrolConsumption * 100 : 0;
  const electricRange = electricConsumption > 0 ? batteryRemaining / electricConsumption * 100 : 0;
  const totalRange = petrolRange + electricRange;

  $('odo').textContent = `${number(Math.max(0, num('odoInput')))} km`;
  $('fuelLitres').textContent = `${number(litresRemaining, 1)} l (${number(fuelLevel)} %)`;
  $('batteryKwh').textContent = `${number(batteryRemaining, 1)} kWh (${number(batteryLevel)} %)`;
  $('electricRange').textContent = `${number(electricRange)} km`;
  $('petrolRange').textContent = `${number(petrolRange)} km`;
  $('totalRange').textContent = `${number(totalRange)} km`;
  $('fuelValue').textContent = money(litresRemaining * petrolPrice);
  $('batteryValue').textContent = money(batteryRemaining * chargingFactor * electricityPrice);

  $('fullChargeCost').textContent = money(batteryCapacity * chargingFactor * electricityPrice);
  $('fullTankCost').textContent = money(tankSize * petrolPrice);

  const breakEvenElectricity = electricConsumption > 0
    ? costs.Benzin / (electricConsumption * chargingFactor)
    : NaN;
  const breakEvenPetrol = petrolConsumption > 0
    ? costs.Elektrisch / petrolConsumption
    : NaN;

  $('breakEvenElectricity').textContent = Number.isFinite(breakEvenElectricity)
    ? `${money(breakEvenElectricity)}/kWh`
    : '–';
  $('breakEvenPetrol').textContent = Number.isFinite(breakEvenPetrol)
    ? `${money(breakEvenPetrol)}/l`
    : '–';

  saveInputs();
}

loadInputs();
INPUT_IDS.forEach((id) => {
  $(id)?.addEventListener('input', calculate);
  $(id)?.addEventListener('change', calculate);
});
$('calcBtn')?.addEventListener('click', calculate);
calculate();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js?v=6.1').catch(() => {});
}
