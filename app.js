(() => {
  "use strict";

  const defaults = {
    electricityPrice: 0.41,
    fuelPrice: 1.90,
    electricConsumption: 23.0,
    fuelConsumption: 8.7,
    hybridElectricConsumption: 11.5,
    hybridFuelConsumption: 3.8,
    chargingLoss: 10,
    annualDistance: 15000,
    batteryHealth: 97
  };

  const fieldIds = {
    electricityPrice: "electricity-price",
    fuelPrice: "fuel-price",
    electricConsumption: "electric-consumption",
    fuelConsumption: "fuel-consumption",
    hybridElectricConsumption: "hybrid-electric-consumption",
    hybridFuelConsumption: "hybrid-fuel-consumption",
    chargingLoss: "charging-loss",
    annualDistance: "annual-distance",
    batteryHealth: "battery-health"
  };

  const modeElements = {
    electric: {
      card: document.querySelector('[data-mode="electric"]'),
      cost: document.getElementById("electric-cost"),
      perKm: document.getElementById("electric-km"),
      year: document.getElementById("electric-year"),
      rank: document.getElementById("electric-rank")
    },
    hybrid: {
      card: document.querySelector('[data-mode="hybrid"]'),
      cost: document.getElementById("hybrid-cost"),
      perKm: document.getElementById("hybrid-km"),
      year: document.getElementById("hybrid-year"),
      rank: document.getElementById("hybrid-rank")
    },
    fuel: {
      card: document.querySelector('[data-mode="fuel"]'),
      cost: document.getElementById("fuel-cost"),
      perKm: document.getElementById("fuel-km"),
      year: document.getElementById("fuel-year"),
      rank: document.getElementById("fuel-rank")
    }
  };

  const form = document.getElementById("calculator-form");
  const resetButton = document.getElementById("reset-button");
  const errorMessage = document.getElementById("error-message");

  const parseNumber = (value) => {
    const normalized = String(value)
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");
    return Number(normalized);
  };

  const euro = (value) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

  const decimal = (value, digits = 2) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);

  const integer = (value) =>
    new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 0
    }).format(value);

  const getValues = () => {
    const values = {};
    for (const [key, id] of Object.entries(fieldIds)) {
      values[key] = parseNumber(document.getElementById(id).value);
    }
    return values;
  };

  const validate = (values) => {
    const labels = {
      electricityPrice: "Strompreis",
      fuelPrice: "Benzinpreis",
      electricConsumption: "elektrischer Verbrauch",
      fuelConsumption: "Benzinverbrauch",
      hybridElectricConsumption: "kombinierter Stromverbrauch",
      hybridFuelConsumption: "kombinierter Benzinverbrauch",
      chargingLoss: "Ladeverluste",
      annualDistance: "Jahresfahrleistung",
      batteryHealth: "Akkuzustand"
    };

    for (const [key, value] of Object.entries(values)) {
      if (!Number.isFinite(value)) {
        return `Bitte für „${labels[key]}“ eine gültige Zahl eingeben.`;
      }
      if (value < 0) {
        return `Der Wert für „${labels[key]}“ darf nicht negativ sein.`;
      }
    }

    if (values.electricConsumption <= 0 || values.fuelConsumption <= 0) {
      return "Die Verbräuche für Elektro und Benzin müssen größer als null sein.";
    }

    if (values.annualDistance <= 0) {
      return "Die Jahresfahrleistung muss größer als null sein.";
    }

    if (values.batteryHealth > 100) {
      return "Der Akkuzustand darf maximal 100 % betragen.";
    }

    return "";
  };

  const saveValues = (values) => {
    try {
      localStorage.setItem(
        "michelles-glc-costpilot-v1.1",
        JSON.stringify(values)
      );
    } catch (_) {}
  };

  const loadValues = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("michelles-glc-costpilot-v1.1")
      );

      if (saved && typeof saved === "object") {
        return { ...defaults, ...saved };
      }
    } catch (_) {}

    return defaults;
  };

  const fillForm = (values) => {
    for (const [key, id] of Object.entries(fieldIds)) {
      document.getElementById(id).value =
        String(values[key]).replace(".", ",");
    }
  };

  const setInvalidState = (message) => {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  };

  const clearInvalidState = () => {
    errorMessage.hidden = true;
    errorMessage.textContent = "";
  };

  const updateBatteryDisplay = (batteryHealth) => {
    const formatted = `${decimal(batteryHealth, 0)} %`;
    document.getElementById("battery-badge").textContent = formatted;
    document.getElementById("battery-tile").textContent = formatted;
    document.getElementById("battery-health-result").textContent = formatted;

    let description = "Sehr guter Akkuzustand.";
    if (batteryHealth < 90) description = "Guter, aber bereits messbar reduzierter Akkuzustand.";
    if (batteryHealth < 80) description = "Deutlich reduzierter Akkuzustand; die elektrische Reichweite kann spürbar sinken.";

    document.getElementById("battery-health-description").textContent =
      `${description} Er beeinflusst primär die Reichweite, nicht unmittelbar den Verbrauch pro 100 km.`;
  };

  const updateRanking = (modes) => {
    Object.values(modeElements).forEach((entry) => {
      entry.card.classList.remove("is-best");
    });

    modes.forEach((mode, index) => {
      const entry = modeElements[mode.key];
      entry.rank.textContent =
        index === 0 ? "Günstigster" : `${index + 1}. Platz`;

      if (index === 0) {
        entry.card.classList.add("is-best");
      }
    });
  };

  const render = (values, shouldScroll = false) => {
    const chargingFactor = 1 + values.chargingLoss / 100;

    const electric =
      values.electricConsumption *
      chargingFactor *
      values.electricityPrice;

    const hybrid =
      values.hybridElectricConsumption *
        chargingFactor *
        values.electricityPrice +
      values.hybridFuelConsumption *
        values.fuelPrice;

    const fuel =
      values.fuelConsumption *
      values.fuelPrice;

    const modes = [
      { key: "electric", name: "Rein elektrisch", shortName: "Elektro", cost: electric },
      { key: "hybrid", name: "Kombiniert", shortName: "Kombiniert", cost: hybrid },
      { key: "fuel", name: "Rein Benzin", shortName: "Benzin", cost: fuel }
    ].sort((a, b) => a.cost - b.cost);

    const cheapest = modes[0];
    const second = modes[1];
    const savingPer100 = second.cost - cheapest.cost;
    const annualSaving = savingPer100 * values.annualDistance / 100;
    const bestAnnualCost = cheapest.cost * values.annualDistance / 100;
    const bestMonthlyCost = bestAnnualCost / 12;

    modeElements.electric.cost.textContent =
      `${euro(electric)} / 100 km`;
    modeElements.hybrid.cost.textContent =
      `${euro(hybrid)} / 100 km`;
    modeElements.fuel.cost.textContent =
      `${euro(fuel)} / 100 km`;

    modeElements.electric.perKm.textContent =
      `${euro(electric / 100)} je km`;
    modeElements.hybrid.perKm.textContent =
      `${euro(hybrid / 100)} je km`;
    modeElements.fuel.perKm.textContent =
      `${euro(fuel / 100)} je km`;

    modeElements.electric.year.textContent =
      `${euro(electric * values.annualDistance / 100)} pro Jahr`;
    modeElements.hybrid.year.textContent =
      `${euro(hybrid * values.annualDistance / 100)} pro Jahr`;
    modeElements.fuel.year.textContent =
      `${euro(fuel * values.annualDistance / 100)} pro Jahr`;

    updateRanking(modes);
    updateBatteryDisplay(values.batteryHealth);

    document.getElementById("recommendation-title").textContent =
      `Heute lohnt sich: ${cheapest.name}`;

    document.getElementById("recommendation-text").textContent =
      `Gegenüber ${second.name} sparst du ${euro(savingPer100)} je 100 km.`;

    document.getElementById("recommendation-annual-saving").textContent =
      euro(annualSaving);

    document.getElementById("quick-recommendation").textContent =
      cheapest.shortName;

    document.getElementById("quick-saving").textContent =
      `${euro(savingPer100)} Vorteil / 100 km`;

    const breakEven =
      (values.fuelConsumption * values.fuelPrice) /
      (values.electricConsumption * chargingFactor);

    const breakEvenText = `${decimal(breakEven, 2)} €/kWh`;

    document.getElementById("break-even-price").textContent =
      breakEvenText;
    document.getElementById("quick-break-even").textContent =
      breakEvenText;

    document.getElementById("monthly-best-cost").textContent =
      euro(bestMonthlyCost);

    document.getElementById("monthly-best-description").textContent =
      `${cheapest.name} bei durchschnittlich ${integer(values.annualDistance / 12)} km pro Monat.`;

    document.getElementById("annual-saving").textContent =
      euro(annualSaving);

    document.getElementById("saving-description").textContent =
      `Mögliche Ersparnis gegenüber ${second.name} bei ${integer(values.annualDistance)} km pro Jahr.`;

    const distances = [
      50,
      100,
      250,
      500,
      1000,
      5000,
      values.annualDistance
    ].filter((distance, index, all) => all.indexOf(distance) === index);

    document.getElementById("distance-table").innerHTML =
      distances.map((distance) => `
        <tr>
          <td>${integer(distance)} km</td>
          <td>${euro(electric * distance / 100)}</td>
          <td>${euro(hybrid * distance / 100)}</td>
          <td>${euro(fuel * distance / 100)}</td>
        </tr>
      `).join("");

    saveValues(values);

    if (shouldScroll) {
      document.getElementById("results").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  const calculate = (shouldScroll = false) => {
    const values = getValues();
    const error = validate(values);

    if (error) {
      setInvalidState(error);
      return false;
    }

    clearInvalidState();
    render(values, shouldScroll);
    return true;
  };

  let liveTimer;

  const scheduleLiveCalculation = () => {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      calculate(false);
    }, 220);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate(true);
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", scheduleLiveCalculation);
    input.addEventListener("change", () => calculate(false));
  });

  resetButton.addEventListener("click", () => {
    fillForm(defaults);
    clearInvalidState();

    try {
      localStorage.removeItem("michelles-glc-costpilot-v1.1");
    } catch (_) {}

    calculate(false);
  });

  fillForm(loadValues());
  calculate(false);
})();
