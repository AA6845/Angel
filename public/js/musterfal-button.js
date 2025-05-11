document.querySelector(".schuldner-card button").addEventListener("click", async () => {
  const schuldnerId = "hanno"; // Oder dynamisch aus einer Auswahl

  try {
    const res = await fetch("/data/muster-schuldner.json");
    const list = await res.json();
    const person = list.find(p => p.id === schuldnerId);

    if (person) {
      for (const key in person) {
        const input = document.getElementById("schuldner-" + key.toLowerCase());
        if (input) {
          input.value = person[key];
        }
      }
    }
  } catch (err) {
    console.error("Fehler beim Laden des Musterfalls:", err);
  }
});