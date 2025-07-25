const API_KEY = "e802641ccd353b1b8f2da8722abc74c7"; // <-- Put your OpenWeatherMap API KEY here



// Lottie file map (relative to /assets/lottie/)

function getWeatherLottie(main) {

  main = main.toLowerCase();

  if (main.includes("clear")) return "sunny.json";

  if (main.includes("cloud")) return "Weather-cloudy(night).json";

  if (main.includes("storm")) return "Weather-storm.json";

  if (main.includes("rain")) return "Weather-storm.json";

  if (main.includes("wind")) return "Weather-windy.json";

  return "sunny.json";

}



const cityInput = document.getElementById("city-input");

const searchBtn = document.getElementById("search-btn");

const mainCard = document.getElementById("main-card");

const forecastScroll = document.getElementById("forecast-scroll");

const loader = document.getElementById("loader");

const recentRow = document.getElementById("recent-row");

let recentCities = JSON.parse(localStorage.getItem("recentCities") || "[]");



function showLoader(show=true) { loader.style.display = show ? "block":"none"; }

function showMainCard(show=true) { mainCard.style.display = show ? "block":"none"; }



function updateRecent() {

  recentRow.innerHTML = '';

  if (recentCities.length) {

    recentRow.innerHTML = "Recent: ";

    recentCities.slice(-5).reverse().forEach(city => {

      const chip = document.createElement('span');

      chip.className = "recent-chip";

      chip.innerText = city;

      chip.onclick = ()=> fetchWeather(city);

      recentRow.appendChild(chip);

    });

    // Clear recents button

    const clearBtn = document.createElement('button');

    clearBtn.className = 'clear-recents-btn';

    clearBtn.innerText = 'Clear Recents';

    clearBtn.onclick = () => {

      recentCities = [];

      localStorage.setItem("recentCities", "[]");

      updateRecent();

    };

    recentRow.appendChild(clearBtn);

  }

}



// 5-day forecast: picks first data point per new day

function renderForecast(forecastData) {

  forecastScroll.innerHTML = "";

  const dailyData = [];

  let lastDate = "";

  forecastData.list.forEach(item => {

    const date = new Date(item.dt * 1000);

    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (lastDate !== dayStr) {

      dailyData.push(item);

      lastDate = dayStr;

    }

  });



  for (let i = 0; i < Math.min(dailyData.length, 5); i++) {

    const item = dailyData[i];

    const date = new Date(item.dt * 1000);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    const weatherLottie = getWeatherLottie(item.weather[0].main);

    const temp = Math.round(item.main.temp);

    const card = document.createElement('div');

    card.className = "forecast-card" + (i === 0 ? " selected" : "");

    card.innerHTML = `

      <div class="day">${dayName}</div>

      <div class="icon"><lottie-player class="mini-lottie" src="assets/lottie/${weatherLottie}" background="transparent" speed="1" loop autoplay></lottie-player></div>

      <div class="temp">${temp}°</div>

      <div class="precip">${item.main.humidity}%</div>

    `;

    forecastScroll.appendChild(card);

  }

}



async function fetchWeather(city) {

  showLoader(true); showMainCard(false);

  try {

    const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);

    if (!resp.ok) throw new Error("City not found");

    const data = await resp.json();



    document.getElementById("city-name").innerText = `${data.name}, ${data.sys.country}`;

    document.getElementById("main-temp-val").innerText = Math.round(data.main.temp);

    const weatherLottie = getWeatherLottie(data.weather[0].main);

    document.getElementById("main-temp-icon").innerHTML =

      `<lottie-player class="main-lottie" src="assets/lottie/${weatherLottie}" background="transparent" speed="1" loop autoplay></lottie-player>`;

    document.getElementById("main-cond").innerText = data.weather[0].description.replace(/\b\w/g, c => c.toUpperCase());

    document.getElementById("feels-like").innerText = `Feels like ${Math.round(data.main.feels_like)}°`;

    document.getElementById("high-low").innerText = `High ${Math.round(data.main.temp_max)}° · Low ${Math.round(data.main.temp_min)}°`;

    // Animated metrics: Humidity, Wind, UV

    document.getElementById("humidity-icon").innerHTML =

      `<lottie-player class="mini-lottie" src="assets/lottie/humidity.json" background="transparent" speed="1" loop autoplay></lottie-player>`;

    document.getElementById("humidity-val").innerText = `${data.main.humidity}%`;

    document.getElementById("wind-icon").innerHTML =

      `<lottie-player class="mini-lottie" src="assets/lottie/Windblow.json" background="transparent" speed="1" loop autoplay></lottie-player>`;

    document.getElementById("wind-val").innerText = `${data.wind.speed} m/s`;

    document.getElementById("uv-icon").innerHTML =

      `<lottie-player class="mini-lottie" src="assets/lottie/uv index.json" background="transparent" speed="1" loop autoplay></lottie-player>`;

    // UV Index is not available for free API, so display "N/A"

    document.getElementById("uv-val").innerText = "N/A";



    // Add to recent

    if (!recentCities.includes(data.name)) {

      recentCities.push(data.name);

      if (recentCities.length > 8) recentCities = recentCities.slice(-8);

      localStorage.setItem("recentCities", JSON.stringify(recentCities));

    }

    updateRecent();



    // 5-day forecast

    const forecastResp = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);

    const forecastData = await forecastResp.json();

    renderForecast(forecastData);



    showLoader(false); showMainCard(true);

  } catch (err) {

    showLoader(false); showMainCard(false);

    alert("City not found or API error.");

  }

}



// Geolocation on first load

function fetchWeatherByCoords(lat, lon) {

  showLoader(true); showMainCard(false);

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)

    .then(resp => resp.json())

    .then(data => {

      fetchWeather(data.name);

    })

    .catch(() => {

      showLoader(false);

      showMainCard(false);

    });

}



function autoDetectLocationWeather() {

  if (navigator.geolocation) {

    navigator.geolocation.getCurrentPosition(

      position => {

        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);

      },

      error => {

        // On permission denied, fallback to default city

        fetchWeather("Delhi");

      }

    );

  } else {

    fetchWeather("Delhi");

  }

}



// Event handlers

searchBtn.onclick = () => {

  const city = cityInput.value.trim();

  if (city) fetchWeather(city);

};



cityInput.addEventListener("keypress", e => {

  if (e.key === "Enter") searchBtn.click();

});



// On load: show last recent, else auto-detect location

updateRecent();

if (recentCities.length) {

  fetchWeather(recentCities[recentCities.length - 1]);

} else {

  autoDetectLocationWeather();

}