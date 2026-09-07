"use client";

import { useEffect } from "react";

// PWA kurulabilirliği için servis çalışanını kaydeder (bkz. public/sw.js —
// kasıtlı olarak minimal, sadece statik varlıkları önbellekler, sayfa ve
// API isteklerine dokunmaz). Kayıt başarısız olursa (örn. tarayıcı desteği
// yoksa) sessizce yok sayılır; site servis çalışanı olmadan da normal
// çalışmaya devam eder.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sessizce yok say — servis çalışanı sadece "Ana Ekrana Ekle"
        // deneyimini iyileştiren opsiyonel bir katman.
      });
    }
  }, []);

  return null;
}
