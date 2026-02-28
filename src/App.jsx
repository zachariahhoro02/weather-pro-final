import React, { useState, useEffect } from 'react';

export default function App() {
  // --- 1. STATE MANAGEMENT ---
  // We initialize the city and history from LocalStorage so it never "forgets"
  const [city, setCity] = useState(() => localStorage.getItem('lastCity') || "Lagos");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = "55599130eb33d03c91703b23a901ea0c";

  // --- 2. DATA FETCHING LOGIC ---
  const fetchAllWeatherData = async (searchCity = city) => {
    if (!searchCity) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch both Current and Forecast data at once
      const [currRes, foreRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&units=metric&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&units=metric&appid=${API_KEY}`)
      ]);

      if (!currRes.ok || !foreRes.ok) throw new Error("City not found");

      const currData = await currRes.json();
      const foreData = await foreRes.json();

      // Update state with results
      setWeather(currData);
      const dailyData = foreData.list.filter(reading => reading.dt_txt.includes("12:00:00"));
      setForecast(dailyData);

      // --- 3. PERSISTENCE LOGIC ---
      localStorage.setItem('lastCity', currData.name);
      document.title = `${Math.round(currData.main.temp)}°C in ${currData.name}`;

      // Update history list (avoiding duplicates)
      setHistory(prev => {
        if (prev.includes(currData.name)) return prev;
        const newHistory = [currData.name, ...prev].slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        return newHistory;
      });

    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Run on first load
  useEffect(() => {
    fetchAllWeatherData();
  }, []);

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '20px', boxSizing: 'border-box'
    }}>
      
      <div style={{ width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', marginBottom: '20px' }}>Weather Pro</h1>

        {/* --- SEARCH SECTION --- */}
        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <input 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && fetchAllWeatherData()} // THE ENTER KEY FIX
            style={{ padding: '12px', borderRadius: '25px', border: 'none', flex: 1, outline: 'none' }}
            placeholder="Search city..."
          />
          <button onClick={() => fetchAllWeatherData()} style={{ 
            padding: '10px 20px', borderRadius: '25px', border: 'none', backgroundColor: '#f39c12', color: 'white', cursor: 'pointer', fontWeight: 'bold' 
          }}>Search</button>
        </div>

        {/* --- HISTORY BUTTONS --- */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', justifyContent: 'center' }}>
          {history.map((hCity) => (
            <button 
              key={hCity}
              onClick={() => { setCity(hCity); fetchAllWeatherData(hCity); }}
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {hCity}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'white' }}>Updating skies... ☁️</p>}
        {error && <p style={{ color: '#ff6b6b' }}>⚠️ {error}</p>}

        {/* --- MAIN WEATHER CARD --- */}
        {weather && !loading && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)',
            padding: '30px', borderRadius: '30px', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>{weather.name}</h2>
            <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} alt="icon" style={{ width: '120px' }} />
            <h1 style={{ fontSize: '4.5rem', margin: '-10px 0' }}>{Math.round(weather.main.temp)}°C</h1>
            <p style={{ textTransform: 'capitalize', fontSize: '1.2rem', opacity: 0.9 }}>{weather.weather[0].description}</p>
            
            {/* --- FORECAST ROW --- */}
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
              {forecast.map((day, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>{new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <img src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} alt="mini" style={{ width: '35px' }} />
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{Math.round(day.main.temp)}°</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}