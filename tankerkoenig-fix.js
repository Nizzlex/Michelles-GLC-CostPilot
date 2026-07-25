/* Michie's GLC Organizer – Tankerkönig Korrektur v6.2
   Zweck:
   - Tankerkönig list.php liefert bei type=e10 den Preis als station.price
   - bei type=all liegt E10 typischerweise in station.e10
   - dieser Patch normalisiert beide Varianten, ohne andere App-Funktionen zu verändern
*/
(() => {
  "use strict";

  const originalFetch = window.fetch.bind(window);

  function toNumber(value) {
    if (value === null || value === undefined || value === false || value === "") return null;
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function normalizeStation(station) {
    if (!station || typeof station !== "object") return station;

    const price = toNumber(station.price);
    const e10 = toNumber(station.e10);
    const normalizedE10 = e10 ?? price;

    // Beide Felder setzen, damit alter und neuer Renderer funktionieren.
    if (normalizedE10 !== null) {
      station.e10 = normalizedE10;
      station.price = normalizedE10;
    } else {
      station.e10 = null;
      station.price = null;
    }

    return station;
  }

  function normalizeTankerkönigPayload(data) {
    if (!data || typeof data !== "object") return data;

    if (Array.isArray(data.stations)) {
      data.stations = data.stations.map(normalizeStation);
    }

    // Auch price.php/Detail-Antworten robust halten.
    if (data.prices && typeof data.prices === "object") {
      for (const value of Object.values(data.prices)) {
        if (value && typeof value === "object") {
          const e10 = toNumber(value.e10 ?? value.price);
          if (e10 !== null) {
            value.e10 = e10;
            value.price = e10;
          }
        }
      }
    }
    return data;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const requestUrl =
        typeof args[0] === "string" ? args[0] :
        args[0] && args[0].url ? args[0].url : "";

      if (!/tankerkoenig|creativecommons\.tankerkoenig\.de/i.test(requestUrl)) {
        return response;
      }

      const clone = response.clone();
      const data = await clone.json();
      const normalized = normalizeTankerkönigPayload(data);

      return new Response(JSON.stringify(normalized), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (err) {
      console.warn("[GLC] Tankerkönig-Normalisierung übersprungen:", err);
      return response;
    }
  };

  // Helfer für bestehende oder künftige UI-Funktionen.
  window.GLC_TANKERKOENIG = Object.freeze({
    getE10Price(station) {
      return toNumber(station?.e10 ?? station?.price);
    },
    formatE10Price(station) {
      const price = toNumber(station?.e10 ?? station?.price);
      return price === null
        ? "Kein E10-Preis"
        : `${price.toLocaleString("de-DE", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          })} €/l`;
    }
  });

  console.info("[GLC] Tankerkönig-Korrektur v6.2 aktiv.");
})();
