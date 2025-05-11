window.addEventListener("DOMContentLoaded", () => {
    console.log("✅ Autofill geladen");
  });
  
  const mapping = {
    NAME_SCHULDNER: 'schuldner-name',
    ADRESSE: 'schuldner-adresse',
    MANDANT: 'schuldner-mandant',
    UNTERNEHMEN: 'schuldner-unternehmen',
    PRODUKT: 'schuldner-produkt',
    RECHNUNGSDATUM: 'schuldner-rechnung',
    BETRAG: 'schuldner-betrag',
    MAHNSTATUS_MANDANT: 'schuldner-mahn-mandant',
    MAHNSTATUS_INKASSO: 'schuldner-mahn-inkasso',
    WUNSCHRATE: 'schuldner-wunschrate',
    WUNSCHRATE_PLUS20: 'schuldner-wunschrate-plus20',
    FRISTTAG: 'schuldner-fristtag',
    ZAHLUNGSTERMIN: 'schuldner-zahlungstermin',
    GEBURTSDATUM: 'schuldner-geburtsdatum',
    GEBURTSORT: 'schuldner-geburtsort'
  };
  
  window.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const schuldnerId = params.get("schuldner");
  
    if (schuldnerId) {
      try {
        const res = await fetch("/data/muster-schuldner.json");
        const list = await res.json();
        const person = list.find(p => p.id === schuldnerId);
  
        if (person) {
          for (const key in person) {
            const inputId = mapping[key];
            if (inputId) {
              const input = document.getElementById(inputId);
              if (input) input.value = person[key];
            }
          }
        }
      } catch (err) {
        console.error("Fehler beim Laden der Schuldnerdaten:", err);
      }
    }
  });
  