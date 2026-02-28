import React, { useState, useEffect } from 'react';

export default function App() {
  // --- 1. STATE ---
  // We initialize 'city' by checking LocalStorage first!
  const [history, setHistory] = useState(() => {
  const saved = localStorage.getItem('searchHistory');
  return saved ? JSON.parse(saved) : [];
});
  const [city, setCity] = useState(() => localStorage.getItem('lastCity') || "Lagos");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]); // New state for the 5-day list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = "55599130eb33d03c91703b23a901ea0c";

  // --- 2. THE MULTI-FETCH ENGINE ---
  const fetchAllWeatherData = async () => {
    if (!city) return;
    setLoading(true);
    setError(null);

    try {
      // Save city to localStorage immediately
      localStorage.setItem('lastCity', city);

      // We fetch Current Weather AND Forecast at the same time
      const [currRes, foreRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`)
      ]);

      if (!currRes.ok || !foreRes.ok) throw new Error("Location not found");

      const currData = await currRes.json();
      // Add city to history if it's not already there
if (!history.includes(currData.name)) {
  const newHistory = [currData.name, ...history].slice(0, 5); // Keep only the last 5
  setHistory(newHistory);
  localStorage.setItem('searchHistory', JSON.stringify(newHistory));
}
      const foreData = await foreRes.json();

      setWeather(currData);
      
      // Update browser tab title
      document.title = `${Math.round(currData.main.temp)}°C in ${currData.name}`;

      // The forecast API gives data every 3 hours. 
      // We filter it to get one reading per day (at 12:00 PM).
      const dailyData = foreData.list.filter(reading => reading.dt_txt.includes("12:00:00"));
      setForecast(dailyData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWeatherData();
  }, []);

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '20px', boxSizing: 'border-box'
    }}>
      
      {/* SEARCH BOX */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
        <input 
          value={city} 
          onChange={(e) => setCity(e.target.value)} 
          style={{ padding: '12px', borderRadius: '25px', border: 'none', flex: 1, outline: 'none', fontSize: '1rem' }}
          placeholder="Enter city..."
        />
        <button onClick={fetchAllWeatherData} style={{ 
          padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: '#f39c12', color: 'white', cursor: 'pointer', fontWeight: 'bold' 
        }}>Search</button>
      </div>
      {/* RECENT SEARCHES */}
<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', justifyContent: 'center' }}>
  {history.map((hCity) => (
    <button 
      key={hCity}
      onClick={() => { setCity(hCity); fetchAllWeatherData(); }}
      style={{
        background: 'rgba(255,255,255,0.2)',
        border: '1px solid white',
        color: 'white',
        padding: '5px 12px',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '0.8rem'
      }}
    >
      {hCity}
    </button>
  ))}
</div>

      {loading && <p style={{ color: 'white' }}>Updating forecast... ⏳</p>}
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}

      {/* MAIN CURRENT WEATHER CARD */}
      {weather && !loading && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)',
          padding: '30px', borderRadius: '20px', color: 'white', textAlign: 'center', width: '100%', maxWidth: '450px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ margin: 0 }}>{weather.name}</h2>
          <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} alt="icon" style={{ width: '120px' }} />
          <h1 style={{ fontSize: '4rem', margin: '0' }}>{Math.round(weather.main.temp)}°C</h1>
          <p style={{ textTransform: 'capitalize', fontSize: '1.2rem' }}>{weather.weather[0].description}</p>
          
          {/* 5-DAY FORECAST SECTION */}
          <div style={{ 
            marginTop: '30px', display: 'flex', justifyContent: 'space-between', 
            borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px', overflowX: 'auto' 
          }}>
            {forecast.map((day, index) => (
              <div key={index} style={{ padding: '10px', minWidth: '60px' }}>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  {new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="mini-icon" />
                <p style={{ fontWeight: 'bold', margin: 0 }}>{Math.round(day.main.temp)}°</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}