import { app } from "@azure/functions";
import { ok, fail } from "../http.js";

// Helper: WMO code to UI condition and icon mapping for Open-Meteo
const mapWmoCodeToCondition = (code) => {
  if (code === 0) return { condition: "Sunny", icon: "sunny" };
  if ([1, 2].includes(code)) return { condition: "Partly Cloudy", icon: "partly-cloudy" };
  if (code === 3) return { condition: "Cloudy", icon: "cloudy" };
  if ([45, 48].includes(code)) return { condition: "Foggy", icon: "cloudy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", icon: "rain" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rainy", icon: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snowy", icon: "partly-cloudy" };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", icon: "partly-cloudy" };
  return { condition: "Partly Cloudy", icon: "partly-cloudy" };
};

// Helper: Azure Maps icon code mapping
const mapAzureIconCode = (iconCode) => {
  if ([1, 2, 3, 4, 5, 33, 34].includes(iconCode)) return { condition: "Sunny", icon: "sunny" };
  if ([6, 7, 8, 9, 10, 11, 35, 36, 37, 38].includes(iconCode)) return { condition: "Partly Cloudy", icon: "partly-cloudy" };
  if ([12, 13, 14, 39, 40, 41, 42, 43, 44].includes(iconCode)) return { condition: "Cloudy", icon: "cloudy" };
  if ([15, 16, 17, 18, 19, 20, 21, 29, 30, 31].includes(iconCode)) return { condition: "Rainy", icon: "rain" };
  return { condition: "Partly Cloudy", icon: "partly-cloudy" };
};

// Translator for Open-Meteo API
const translateOpenMeteo = (data, lat, lon, locationName) => {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  const currentCondition = mapWmoCodeToCondition(current.weather_code);

  const hourlyList = [];
  for (let i = 0; i < 12; i++) {
    const timeVal = new Date(hourly.time[i]);
    let timeLabel = timeVal.toLocaleTimeString("en-US", { hour: "numeric" }).toLowerCase().replace(" ", "");
    if (i === 0) timeLabel = "Now";

    const cond = mapWmoCodeToCondition(hourly.weather_code[i]);
    hourlyList.push({
      time: timeLabel,
      temp: Math.round(hourly.temperature_2m[i]),
      icon: cond.icon,
      rain: hourly.precipitation_probability[i] || 0
    });
  }

  const dailyList = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const dateVal = new Date(daily.time[i]);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    
    let dayLabel = daysOfWeek[dateVal.getDay()];
    if (isToday) dayLabel = "Today";
    if (isTomorrow) dayLabel = "Tomorrow";

    const dateLabel = dateVal.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const cond = mapWmoCodeToCondition(daily.weather_code[i]);

    dailyList.push({
      day: dayLabel,
      date: dateLabel,
      icon: cond.icon,
      low: Math.round(daily.temperature_2m_min[i]),
      high: Math.round(daily.temperature_2m_max[i]),
      rain: daily.precipitation_probability_max[i] || 0
    });
  }

  const advisories = [];
  const maxRainProb = Math.max(...daily.precipitation_probability_max.slice(0, 3));
  if (maxRainProb > 50) {
    advisories.push({
      type: "warn",
      title: "Heavy rain forecast: secure crops",
      text: "Significant rain is expected. Delay chemical spraying, harvesting, and sowing. Protect grain stores."
    });
  } else if (current.wind_speed_10m < 15) {
    advisories.push({
      type: "tip",
      title: "Favorable spraying conditions",
      text: "Wind speed is low (${Math.round(current.wind_speed_10m)} km/h) and no major rain is expected. Ideal for fertilizer/drone actions."
    });
  }

  const maxTemp = Math.max(...daily.temperature_2m_max.slice(0, 3));
  if (maxTemp > 35) {
    advisories.push({
      type: "warn",
      title: "High heat index alert",
      text: "Daily maximum temperature will reach ${maxTemp}°C. We recommend watering crops in the early morning to cut evaporation loss."
    });
  } else {
    advisories.push({
      type: "info",
      title: "Stable seasonal temperatures",
      text: "Temperatures are standard. Good time for regular soil health checks or weeding."
    });
  }

  advisories.push({
    type: "tip",
    title: "Monitor moisture levels",
    text: "Moderate humidity levels (${Math.round(current.relative_humidity_2m)}%) can encourage pest growth. Inspect crop leaf bases regularly."
  });

  return {
    location: locationName || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
    current: {
      temp: Math.round(current.temperature_2m),
      condition: currentCondition.condition,
      feelsLike: Math.round(current.apparent_temperature),
      icon: currentCondition.icon,
      humidity: Math.round(current.relative_humidity_2m),
      wind: Math.round(current.wind_speed_10m),
      rainProb: daily.precipitation_probability_max[0] || 0,
      uv: 5
    },
    hourly: hourlyList,
    daily: dailyList,
    advisory: advisories
  };
};

// Translator for Azure Maps Weather Service
const translateAzureMaps = (currentData, dailyData, hourlyData, lat, lon, locationName) => {
  const cur = currentData.results[0];
  const forecasts = dailyData.forecasts;
  
  const currentMapped = mapAzureIconCode(cur.iconCode);

  const hourlyList = hourlyData.slice(0, 12).map((h, i) => {
    const timeVal = new Date(h.date);
    let timeLabel = timeVal.toLocaleTimeString("en-US", { hour: "numeric" }).toLowerCase().replace(" ", "");
    if (i === 0) timeLabel = "Now";
    const mapped = mapAzureIconCode(h.iconCode);
    return {
      time: timeLabel,
      temp: Math.round(h.temperature.value),
      icon: mapped.icon,
      rain: h.precipitationProbability || 0
    };
  });

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyList = forecasts.slice(0, 7).map((d, i) => {
    const dateVal = new Date(d.date);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    
    let dayLabel = daysOfWeek[dateVal.getDay()];
    if (isToday) dayLabel = "Today";
    if (isTomorrow) dayLabel = "Tomorrow";

    const dateLabel = dateVal.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const mapped = mapAzureIconCode(d.day.iconCode);

    return {
      day: dayLabel,
      date: dateLabel,
      icon: mapped.icon,
      low: Math.round(d.temperature.minimum.value),
      high: Math.round(d.temperature.maximum.value),
      rain: d.day.precipitationProbability || 0
    };
  });

  const advisories = [];
  const maxRain = Math.max(...dailyList.slice(0, 3).map(x => x.rain));
  if (maxRain > 50) {
    advisories.push({
      type: "warn",
      title: "Heavy rain forecast: secure crops",
      text: "Significant rain is expected. Delay chemical spraying, harvesting, and sowing. Protect grain stores."
    });
  } else if (cur.wind.speed.value < 15) {
    advisories.push({
      type: "tip",
      title: "Favorable spraying conditions",
      text: "Wind speed is low (${Math.round(cur.wind.speed.value)} km/h) and no major rain is expected. Ideal for fertilizer/drone actions."
    });
  }

  const maxTemp = Math.max(...dailyList.slice(0, 3).map(x => x.high));
  if (maxTemp > 35) {
    advisories.push({
      type: "warn",
      title: "High heat index alert",
      text: "Daily maximum temperature will reach ${maxTemp}°C. We recommend watering crops in the early morning to cut evaporation loss."
    });
  } else {
    advisories.push({
      type: "info",
      title: "Stable seasonal temperatures",
      text: "Temperatures are standard. Good time for regular soil health checks or weeding."
    });
  }

  advisories.push({
    type: "tip",
    title: "Monitor moisture levels",
    text: "Moderate humidity levels (${Math.round(cur.relativeHumidity)}%) can encourage pest growth. Inspect crop leaf bases regularly."
  });

  return {
    location: locationName || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
    current: {
      temp: Math.round(cur.temperature.value),
      condition: cur.phrase,
      feelsLike: Math.round(cur.realFeelTemperature.value),
      icon: currentMapped.icon,
      humidity: Math.round(cur.relativeHumidity),
      wind: Math.round(cur.wind.speed.value),
      rainProb: forecasts[0]?.day.precipitationProbability || 0,
      uv: cur.uvIndex || 5
    },
    hourly: hourlyList,
    daily: dailyList,
    advisory: advisories
  };
};

app.http("weather", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "weather",
  handler: async (request) => {
    try {
      const latParam = request.query.get("latitude");
      const lonParam = request.query.get("longitude");
      const locationName = request.query.get("location") || "";

      // Default fallback: Hanamkonda / Warangal (17.9689, 79.5941)
      const lat = latParam ? parseFloat(latParam) : 17.9689;
      const lon = lonParam ? parseFloat(lonParam) : 79.5941;

      if (isNaN(lat) || isNaN(lon)) {
        return ok({ error: "Invalid coordinate values." }, 400);
      }

      const azureKey = process.env.AZURE_MAPS_SUBSCRIPTION_KEY;

      if (azureKey) {
        try {
          const currentUrl = `https://atlas.microsoft.com/weather/currentConditions/json?api-version=1.0&query=${lat},${lon}&subscription-key=${azureKey}`;
          const dailyUrl = `https://atlas.microsoft.com/weather/forecast/daily/json?api-version=1.0&query=${lat},${lon}&subscription-key=${azureKey}&duration=7`;
          const hourlyUrl = `https://atlas.microsoft.com/weather/forecast/hourly/json?api-version=1.0&query=${lat},${lon}&subscription-key=${azureKey}&duration=12`;

          const [currentRes, dailyRes, hourlyRes] = await Promise.all([
            fetch(currentUrl),
            fetch(dailyUrl),
            fetch(hourlyUrl)
          ]);

          if (currentRes.ok && dailyRes.ok && hourlyRes.ok) {
            const currentData = await currentRes.json();
            const dailyData = await dailyRes.json();
            const hourlyData = await hourlyRes.json();

            const weather = translateAzureMaps(currentData, dailyData, hourlyData, lat, lon, locationName);
            return ok(weather);
          }
          console.warn("Azure Maps Weather Service failed. Falling back to Open-Meteo.");
        } catch (e) {
          console.error("Failed fetching Azure Maps Weather, falling back to Open-Meteo:", e);
        }
      }

      // Zero-config open meteo fallback
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const response = await fetch(openMeteoUrl);
      if (!response.ok) {
        throw new Error(`Open-Meteo returned status ${response.status}`);
      }
      const data = await response.json();
      const weather = translateOpenMeteo(data, lat, lon, locationName);
      return ok(weather);
    } catch (error) {
      return fail(error, "Unable to load live weather forecast.");
    }
  },
});
