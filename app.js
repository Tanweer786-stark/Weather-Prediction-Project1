// ====== CONFIG ======
const API_KEY = "735b384d7e24488fb6b50538253008"; // Replace with your real WeatherAPI key
const DEFAULT_LOCATION = "London";

// ====== ELEMENTS ======
const el = {
  locationInput: document.getElementById("locationInput"),
  searchBtn: document.getElementById("searchBtn"),
  locName: document.getElementById("locName"),
  lastUpdated: document.getElementById("lastUpdated"),
  tempC: document.getElementById("tempC"),
  condText: document.getElementById("condText"),
  condIcon: document.getElementById("condIcon"),
  summaryText: document.getElementById("summaryText"),
  localTime: document.getElementById("localTime"),
  feelsLike: document.getElementById("feelsLike"),
  precip: document.getElementById("precip"),
  visibility: document.getElementById("visibility"),
  humidity: document.getElementById("humidity"),
  dewPoint: document.getElementById("dewPoint"),
  airQuality: document.getElementById("airQuality"),
  currentDetails: document.getElementById("currentDetails"),
  uvpos: document.getElementById("uvpos"),
  uvVal: document.getElementById("uvVal"),
  uvAdvice: document.getElementById("uvAdvice"),
  windSpeed: document.getElementById("windSpeed"),
  windGust: document.getElementById("windGust"),
  windDirText: document.getElementById("windDirText"),
  windArrow: document.getElementById("windArrow"),
  trendText: document.getElementById("trendText")
};

// ====== UTIL ======
function q(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error("Network error");
    return r.json();
  });
}

function mapWindDirToDeg(dir) {
  const m = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5
  };
  return m[dir] ?? 0;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ====== RENDERERS ======
function renderCurrent(data) {
  const loc = data.location;
  const cur = data.current;

  el.locName.textContent = `${loc.name}, ${loc.region || loc.country || ""}`.replace(/, $/, '');
  el.lastUpdated.textContent = `Updated ${cur.last_updated}`;
  el.tempC.textContent = Math.round(cur.temp_c) + "°";
  el.condText.textContent = cur.condition.text;
  el.condIcon.src = cur.condition.icon.startsWith("http") ? cur.condition.icon : "https:" + cur.condition.icon;
  el.condIcon.alt = cur.condition.text;
  el.summaryText.textContent = `Today: ${cur.condition.text}. Wind ${cur.wind_kph} kph, humidity ${cur.humidity}%`;
  el.localTime.textContent = `Local time: ${loc.localtime}`;

  el.feelsLike.textContent = Math.round(cur.feelslike_c) + "°";
  el.precip.textContent = (cur.precip_mm != null ? cur.precip_mm + " mm" : "0 mm");
  el.visibility.textContent = `${cur.vis_km} km (${cur.vis_miles} mi)`;
  el.humidity.textContent = `${cur.humidity}%`;
  el.dewPoint.textContent = `Dew point: ${cur.dewpoint_c ?? '--'}°`;

  // wind
  el.windSpeed.textContent = `${cur.wind_kph} kph`;
  el.windGust.textContent = `Gusts: ${cur.gust_kph} kph`;
  el.windDirText.textContent = `Dir: ${cur.wind_dir || '—'}`;
  const deg = (cur.wind_degree != null) ? cur.wind_degree : mapWindDirToDeg(cur.wind_dir);
  el.windArrow.style.transform = `rotate(${deg}deg)`;

  // UV
  const uv = cur.uv != null ? cur.uv : 0;
  const uvPercent = clamp((uv / 11) * 100, 0, 100);
  el.uvpos.style.width = uvPercent + "%";
  el.uvVal.textContent = `${uv} (${uvLabel(uv)})`;
  el.uvAdvice.textContent = uvAdvice(uv);

  // Air Quality
  if (data.current.air_quality) {
    const aqi = data.current.air_quality;
    const aqiIndex = aqi['us-epa-index'] || 0;
    el.airQuality.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center">
        <div style="flex:1">
          <div style="font-weight:700; font-size:24px">${aqiIndex} (${getAQILabel(aqiIndex)})</div>
          <div style="color:var(--muted); font-size:13px; margin-top:4px">
            CO: ${aqi.co?.toFixed(1) || 0} • NO2: ${aqi.no2?.toFixed(1) || 0} • O3: ${aqi.o3?.toFixed(1) || 0}
          </div>
        </div>
      </div>
    `;
  } else {
    el.airQuality.innerHTML = '<div style="color:var(--muted)">Air quality data not available</div>';
  }

  // Current Details
  el.currentDetails.innerHTML = `
    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px">
      <div>
        <div style="font-size:13px; color:var(--muted)">Pressure</div>
        <div style="font-weight:700">${cur.pressure_mb} mb</div>
      </div>
      <div>
        <div style="font-size:13px; color:var(--muted)">Cloud Cover</div>
        <div style="font-weight:700">${cur.cloud}%</div>
      </div>
    </div>
  `;

  el.trendText.textContent = `Humidity ${cur.humidity}% • Wind ${cur.wind_kph}kph • ${cur.condition.text}`;
  document.title = `${Math.round(cur.temp_c)}° ${cur.condition.text} — ${loc.name}`;
}

function uvLabel(v) {
  if (v <= 2) return "Low";
  if (v <= 5) return "Moderate";
  if (v <= 7) return "High";
  if (v <= 10) return "Very high";
  return "Extreme";
}

function uvAdvice(v) {
  if (v <= 2) return "Minimal protection required.";
  if (v <= 5) return "Use sunscreen if outside.";
  if (v <= 7) return "Cover up and use SPF.";
  if (v <= 10) return "Extra protection: avoid midday sun.";
  return "Take all precautions.";
}

function getAQILabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// ====== FETCH AND RENDER ======
async function fetchAndRender(location) {
  const query = encodeURIComponent(location);
  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${query}&aqi=yes`;
  try {
    el.airQuality.innerHTML = `<div style="color:var(--muted)">Loading weather data...</div>`;
    const data = await q(url);
    renderCurrent(data);
  } catch (err) {
    console.error(err);
    el.airQuality.innerHTML = `<div style="color:red">❌ Failed to load data. Check location and try again.</div>`;
  }
}

// ====== EVENTS ======
el.searchBtn.addEventListener("click", () => {
  const v = el.locationInput.value.trim();
  if (!v) {
    alert("Please enter a location");
    return;
  }
  fetchAndRender(v);
});

el.locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") el.searchBtn.click();
});

// ====== INIT ======
(function init() {
  el.locationInput.value = DEFAULT_LOCATION;
  fetchAndRender(DEFAULT_LOCATION);
})();
