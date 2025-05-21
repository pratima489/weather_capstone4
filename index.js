require("dotenv").config();
console.log("Loaded API Key:", process.env.API_KEY); // Debugging line

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
 // Allow PORT from .env

// Set view engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get("/", (req, res) => {
    res.render("index", { error: null });
});

// Weather Route
app.post("/weather", async (req, res) => {
    const city = req.body.city?.trim(); // Trim whitespace
    const apiKey = process.env.API_KEY; // Use correct key name
    

    if (!city) {
        return res.render("index", { error: "Please enter a city name." });
    }

    try {
        console.log(`Fetching data for: ${city}`);

        // Get latitude & longitude of the city
        const geoResponse = await axios.get("http://api.openweathermap.org/geo/1.0/direct", {
            params: { q: city, limit: 1, appid: apiKey },
        });

        if (!geoResponse.data.length) {
            return res.render("index", { error: "City not found. Try again." });
        }

        const { lat, lon } = geoResponse.data[0];

        // Get weather forecast
        const weatherResponse = await axios.get("https://api.openweathermap.org/data/2.5/forecast", {
            params: { lat, lon, appid: apiKey, units: "metric" },
        });

        const forecast = weatherResponse.data.list;
        if (!forecast) {
            return res.render("index", { error: "Weather data not available." });
        }

        // Find tomorrow's forecast
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().split("T")[0];

        const rainForecast = forecast.some(item =>
            item.dt_txt.startsWith(dateString) && item.weather.some(w => w.main.toLowerCase().includes("rain"))
        );

        res.render("result", { city, rainForecast });
    } catch (error) {
        console.error("Error fetching weather:", error.response?.data || error.message);
        res.render("index", { error: "Error fetching weather. Try again." });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
