import { state } from "./state.js";
import { initMap, setLocation, plotAllOccurrences, showPlantOnMap } from "./map.js";
import { renderDeck } from "./deck.js";
import { initSpecimen, openSpecimen } from "./specimen.js";
import { initRiskModal } from "./risk.js";

async function loadPlants(){
  document.getElementById("hudMode").textContent = "Loading data…";

  const res = await fetch("data/plants.json", { cache: "no-store" });
  if(!res.ok) throw new Error("Failed to load data/plants.json");

  const data = await res.json();
  state.region = data.region || null;

  state.plants = (data.plants || []).map(p => ({
    ...p,
    frequency: (p.occurrences || []).length
  }));

  document.getElementById("regionPill").textContent = `Region: ${state.region?.name || "Local Starter Pack"}`;
  document.getElementById("hudMode").textContent = "Mock GBIF-like occurrences (MVP)";
}

function locate(){
  if(!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLocation(pos.coords.latitude, pos.coords.longitude);
      renderDeck({ onSelectPlant });
    },
    () => {},
    { enableHighAccuracy:true, timeout: 8000, maximumAge: 60000 }
  );
}

function onSelectPlant(plant){
  showPlantOnMap(plant);
  openSpecimen(plant);
}

function wireButtons(){
  document.getElementById("btnLocate").addEventListener("click", locate);
  document.getElementById("btnAll").addEventListener("click", plotAllOccurrences);
  document.getElementById("btnResort").addEventListener("click", () => renderDeck({ onSelectPlant }));
}

async function main(){
  initMap();
  initSpecimen();
  initRiskModal();
  wireButtons();

  try{
    await loadPlants();

    // Center on region if provided
    if(state.region?.center && typeof state.region.center.lat === "number" && typeof state.region.center.lon === "number"){
      setLocation(state.region.center.lat, state.region.center.lon);
    }

    plotAllOccurrences();
    renderDeck({ onSelectPlant });
    locate(); // try to override with real GPS after initial load
  } catch(e){
    console.error(e);
    document.getElementById("hudMode").textContent = "Missing data file: data/plants.json";
    document.getElementById("regionPill").textContent = "Region: Error";
  }
}

main();
