(() => {
  "use strict";

  const button = document.getElementById("openEnbwButton");
  if (!button) return;

  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    button.href = "https://apps.apple.com/de/app/enbw-mobility-e-auto-laden/id1232210521";
  } else if (isAndroid) {
    button.href = "https://play.google.com/store/apps/details?id=com.enbw.ev";
  } else {
    button.href = "https://www.enbw.com/elektromobilitaet/produkte/mobilityplus-app";
  }
})();
