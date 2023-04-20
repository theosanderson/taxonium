import countries from "../countries.json";

export const getUniqueCoordinates = (nodes) => {
  const countryNodes = nodes
    .filter((node) => node.meta_country)
    .map((node) => {
      return node.meta_country;
    });

  const uniqueCountries = new Set(countryNodes);

  const newCountryMap = {};
  for (const country of countries) {
    newCountryMap[country.name] = {
      latitude: country.latitude,
      longitude: country.longitude,
    };
  }

  newCountryMap["England"] = newCountryMap["United Kingdom"];
  newCountryMap["Wales"] = newCountryMap["United Kingdom"];
  newCountryMap["Scotland"] = newCountryMap["United Kingdom"];
  newCountryMap["Northern Ireland"] = newCountryMap["United Kingdom"];
  newCountryMap["Northern_Ireland"] = newCountryMap["United Kingdom"];
  newCountryMap["USA"] = newCountryMap["United States"];
  newCountryMap["Viet Nam"] = newCountryMap["Vietnam"];
  newCountryMap["West Bank"] = newCountryMap["Palestinian Territories"];

  const coords = [];
  for (const country of uniqueCountries) {
    if (newCountryMap[country]) {
      coords.push(newCountryMap[country]);
    } else {
      console.log("not found: ", country);
    }
  }

  return coords;
};

export const getCountryCounts = (nodes) => {
  const countryNodes = nodes
    .filter((node) => node.meta_country)
    .map((node) => {
      return node.meta_country;
    });

  const counts = {};

  for (const country of countryNodes) {
    counts[country] ? counts[country]++ : (counts[country] = 1);
  }

  const consolidateCounts = (counts, correct_name, wrong_names) => {
    if (!counts[correct_name]) {
      counts[correct_name] = 0;
    }
    for (const wrong of wrong_names) {
      if (counts[wrong]) {
        counts[correct_name] += counts[wrong];
        delete counts[wrong];
      }
    }
  };

  consolidateCounts(counts, "Vietnam", ["Viet Nam"]);

  consolidateCounts(counts, "United Kingdom", [
    "England",
    "Wales",
    "Scotland",
    "Northern_Ireland",
    "Northern Ireland",
  ]);

  consolidateCounts(counts, "United States of America", ["USA"]);

  return counts;
};

export const calculateBoundingBox = (coords) => {
  let min_lat = 90;
  let min_lon = 180;
  let max_lat = -90;
  let max_lon = -180;
  for (const coord of coords) {
    const lat = coord.latitude;
    const lon = coord.longitude;
    if (lat > max_lat) max_lat = lat;
    if (lat < min_lat) min_lat = lat;
    if (lon > max_lon) max_lon = lon;
    if (lon < min_lon) min_lon = lon;
  }
  return [min_lat, max_lat, min_lon, max_lon];
};
