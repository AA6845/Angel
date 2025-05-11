window.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Autofill geladen");

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

  try {
    const res = await fetch("/data/muster-schuldner.json");
    const list = await res.json();

    const person = list[Math.floor(Math.random() * list.length)];

    if (person) {
      for (const key in mapping) {
        const input = document.getElementById(mapping[key]);
        if (input && person[key]) {
          input.value = person[key];
        }
      }
    }
  } catch (err) {
    console.error("Fehler beim Laden der Schuldnerdaten:", err);
  }
});
