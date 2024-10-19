import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Moon } from 'lucide-react';

const WeatherDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bgImage, setBgImage] = useState('');

    useEffect(() => {
        const fetchWeatherData = async (lat, lon) => {
            const apiKey = 'd0f2f4dbecc043e78d6123135212408';
            const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5&aqi=no&alerts=no&lang=en`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('Weather data not available');
                }
                const data = await response.json();
                setWeatherData(data);

                // Fetch background image based on current weather condition
                await fetchBackgroundImage(data.current);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchBackgroundImage = async (currentWeather) => {
            const unsplashApiKey = 'sSOljG3KGF_hNFB3r9lG5LC4ah97td7Xf8_3pA7HUEc'; // Replace with your Unsplash API key
            const isDay = currentWeather.is_day === 1; // 1 if it's daytime
            const weatherCondition = currentWeather.condition.text.toLowerCase();

            // Determine appropriate query for Unsplash based on weather and day/night status
            let query;
            if (isDay) {
                query = weatherCondition.includes("clear") ? "clear sky" : weatherCondition;
            } else {
                query = weatherCondition.includes("clear") ? "night sky" : `night ${weatherCondition}`;
            }

            // Request HD image
            const unsplashApiUrl = `https://api.unsplash.com/photos/random?query=${query}&client_id=${unsplashApiKey}&w=1920&h=1080&fit=crop`;

            try {
                const response = await fetch(unsplashApiUrl);
                if (!response.ok) {
                    throw new Error('Background image not available');
                }
                const data = await response.json();
                setBgImage(data.urls.regular); // Set the background image URL
            } catch (err) {
                console.error(err);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeatherData(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    setError("Unable to retrieve your location. Please allow location access.");
                }
            );
        } else {
            setError("Geolocation is not supported by your browser.");
        }
    }, []);
    const getWeatherIcon = (code, isDay) => {
        if (code === 1000) return isDay ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />;
        if (code >= 1063 && code <= 1201) return <CloudRain className="w-6 h-6" />;
        return <Cloud className="w-6 h-6" />;
    };

    if (loading) return <div className="flex items-center justify-center h-screen text-white"><div class="loader"></div>
    </div>;
    if (error) return <div className="flex items-center justify-center h-screen text-white">Error: {error}</div>;
    if (!weatherData) return null;

    console.log(weatherData)

    return (
        <div className="min-h-screen bg-cover bg-center p-6 m-auto flex items-center justify-center" style={{ backgroundImage: `url(${bgImage || "/api/placeholder/1920/1080?text=Raindrop+Background"})` }}>
            <div className="container mx-auto bg-black bg-opacity-50 rounded-3xl p-8 backdrop-blur-lg text-white">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">weather.com</h1>
                </header>

                <main className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <div className="mb-8">
                            <h2 className="text-7xl font-bold">{weatherData.current.temp_c.toFixed(1)}°C</h2>
                            <p className="text-3xl">{weatherData.location.name}</p>
                            <p className="text-sm opacity-75">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} |
                                H:{Math.round(weatherData.forecast.forecastday[0].day.maxtemp_c)}°
                                L:{Math.round(weatherData.forecast.forecastday[0].day.mintemp_c)}°
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between">
                            {weatherData.forecast.forecastday[0].hour
                                .filter((_, index) => index % 4 === 0 || index === 23)
                                .slice(0, 6)
                                .map((hour, index) => {
                                    const isDay = hour.is_day === 1; // Use the is_day from the hourly data
                                    const formattedHour = new Date(hour.time).toLocaleTimeString([], { hour: 'numeric', hour12: true });
                                    return (
                                        <div key={hour.time} className="text-center">
                                            <p className="mb-2">{index === 0 ? 'Now' : formattedHour}</p>
                                            {getWeatherIcon(hour.condition.code, isDay)} {/* Pass isDay to the function */}
                                            <p className="mt-2">{Math.round(hour.temp_c)}°</p>
                                        </div>
                                    );
                                })}
                        </div>

                        {weatherData.forecast.forecastday.map((day, index) => (
                            <div key={day.date} className="flex items-center mb-4">
                                <p className="w-20">
                                    {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                {getWeatherIcon(day.day.condition.code)}

                                <div className="flex-1 mx-4 h-1 bg-gray-600 rounded">
                                    <div
                                        className="h-1 bg-blue-400 rounded"
                                        style={{
                                            width: `${((weatherData.current.temp_c - day.day.mintemp_c) / (day.day.maxtemp_c - day.day.mintemp_c)) * 100}%`,
                                            marginLeft: `${((day.day.mintemp_c - day.day.mintemp_c) / (day.day.maxtemp_c - day.day.mintemp_c)) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                                <p>{Math.round(day.day.mintemp_c)}°</p>
                                <p className="w-8 text-right">{Math.round(day.day.maxtemp_c)}°</p>
                            </div>
                        ))}


                    </div>
                </main>
            </div>
        </div>
    );
};

export default WeatherDashboard;
