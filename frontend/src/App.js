import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Audio player component
const AudioPlayer = ({ streamUrl, isPlaying, onPlayPause, currentProgram }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          console.log("Autoplay blocked by browser");
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={streamUrl} preload="none" />
      
      <div className="player-info">
        <div className="station-name">RTV El-Kalem</div>
        <div className="current-program">{currentProgram || "Radio Islam në Shqip"}</div>
      </div>
      
      <div className="player-controls">
        <button 
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={onPlayPause}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>
      
      <div className="volume-control">
        <span>🔊</span>
      </div>
    </div>
  );
};

// Prayer times component
const PrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    fetchPrayerTimes();
    const interval = setInterval(updateNextPrayer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await axios.get(`${API}/prayer-times?lat=${latitude}&lng=${longitude}`);
            setPrayerTimes(response.data);
            updateNextPrayer(response.data);
          },
          async () => {
            // Fallback to default location (Pristina)
            const response = await axios.get(`${API}/prayer-times`);
            setPrayerTimes(response.data);
            updateNextPrayer(response.data);
          }
        );
      } else {
        const response = await axios.get(`${API}/prayer-times`);
        setPrayerTimes(response.data);
        updateNextPrayer(response.data);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    }
  };

  const updateNextPrayer = (times = prayerTimes) => {
    if (!times) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Sabahu', time: times.fajr, arabic: 'الفجر' },
      { name: 'Dielli', time: times.sunrise, arabic: 'الشروق' },
      { name: 'Dreka', time: times.dhuhr, arabic: 'الظهر' },
      { name: 'Ikindia', time: times.asr, arabic: 'العصر' },
      { name: 'Akshami', time: times.maghrib, arabic: 'المغرب' },
      { name: 'Jacia', time: times.isha, arabic: 'العشاء' }
    ];

    for (let prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        const remainingMinutes = prayerTime - currentTime;
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        
        setNextPrayer({
          ...prayer,
          remaining: `${remainingHours}:${remainingMins.toString().padStart(2, '0')}`
        });
        return;
      }
    }
    
    // If no prayer found for today, set first prayer for tomorrow
    setNextPrayer({
      ...prayers[0],
      remaining: "Nesër"
    });
  };

  if (!prayerTimes) {
    return (
      <div className="prayer-times loading">
        <div className="loading-spinner">🕌</div>
        <p>Duke ngarkuar orët e namazit...</p>
      </div>
    );
  }

  return (
    <div className="prayer-times">
      <div className="prayer-header">
        <h3>🕌 Orët e Namazit</h3>
        <div className="hijri-date">📅 {prayerTimes.date}</div>
      </div>
      
      {nextPrayer && (
        <div className="next-prayer">
          <div className="next-prayer-name">
            {nextPrayer.name} <span className="arabic">{nextPrayer.arabic}</span>
          </div>
          <div className="next-prayer-time">{nextPrayer.time}</div>
          <div className="next-prayer-remaining">
            {nextPrayer.remaining !== "Nesër" ? `${nextPrayer.remaining} mbetur` : nextPrayer.remaining}
          </div>
        </div>
      )}
      
      <div className="prayer-grid">
        <div className="prayer-time">
          <span className="prayer-name">Sabahu</span>
          <span className="time">{prayerTimes.fajr}</span>
        </div>
        <div className="prayer-time">
          <span className="prayer-name">Dielli</span>
          <span className="time">{prayerTimes.sunrise}</span>
        </div>
        <div className="prayer-time">
          <span className="prayer-name">Dreka</span>
          <span className="time">{prayerTimes.dhuhr}</span>
        </div>
        <div className="prayer-time">
          <span className="prayer-name">Ikindia</span>
          <span className="time">{prayerTimes.asr}</span>
        </div>
        <div className="prayer-time">
          <span className="prayer-name">Akshami</span>
          <span className="time">{prayerTimes.maghrib}</span>
        </div>
        <div className="prayer-time">
          <span className="prayer-name">Jacia</span>
          <span className="time">{prayerTimes.isha}</span>
        </div>
      </div>
    </div>
  );
};

// Qibla Compass Component
const QiblaCompass = () => {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    fetchQiblaDirection();
    requestOrientationPermission();
  }, []);

  const fetchQiblaDirection = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await axios.get(`${API}/qibla-direction?lat=${latitude}&lng=${longitude}`);
            setQiblaDirection(response.data);
          },
          async () => {
            const response = await axios.get(`${API}/qibla-direction`);
            setQiblaDirection(response.data);
          }
        );
      }
    } catch (error) {
      console.error('Error fetching qibla direction:', error);
    }
  };

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setPermission(response);
        if (response === 'granted') {
          startCompass();
        }
      } catch (error) {
        console.error('Error requesting orientation permission:', error);
      }
    } else {
      startCompass();
    }
  };

  const startCompass = () => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  };

  const handleOrientation = (event) => {
    let heading = event.alpha;
    if (heading !== null) {
      setDeviceHeading(360 - heading);
    }
  };

  if (!qiblaDirection) {
    return (
      <div className="qibla-compass loading">
        <div className="loading-spinner">🧭</div>
        <p>Duke ngarkuar drejtimin e Kiblës...</p>
      </div>
    );
  }

  const qiblaAngle = qiblaDirection.qibla_direction - deviceHeading;

  return (
    <div className="qibla-compass">
      <div className="compass-header">
        <h3>🧭 Drejtimi i Kiblës</h3>
        <div className="distance">📍 {qiblaDirection.distance_km} km</div>
      </div>
      
      <div className="compass-container">
        <div className="compass-face">
          <div 
            className="compass-needle"
            style={{ transform: `rotate(${qiblaAngle}deg)` }}
          >
            <div className="needle-point">🕋</div>
          </div>
          
          <div className="compass-directions">
            <div className="direction north">V</div>
            <div className="direction east">L</div>
            <div className="direction south">J</div>
            <div className="direction west">P</div>
          </div>
          
          <div className="compass-center"></div>
        </div>
        
        <div className="compass-info">
          <div className="qibla-degree">{Math.round(qiblaDirection.qibla_direction)}°</div>
          <div className="compass-instruction">
            Drejtoni telefonin deri sa shigja të tregojë 🕋
          </div>
        </div>
      </div>
      
      {permission === 'denied' && (
        <div className="permission-warning">
          Lejoni aksesi për orientim për një kompas më preciz
        </div>
      )}
    </div>
  );
};

// Dhikr Counter Component
const DhikrCounter = () => {
  const [dhikrList, setDhikrList] = useState([]);
  const [selectedDhikr, setSelectedDhikr] = useState(null);
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(33);

  useEffect(() => {
    fetchDhikr();
  }, []);

  const fetchDhikr = async () => {
    try {
      const response = await axios.get(`${API}/dhikr`);
      setDhikrList(response.data);
      if (response.data.length > 0) {
        setSelectedDhikr(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching dhikr:', error);
    }
  };

  const incrementCount = () => {
    setCount(prevCount => prevCount + 1);
    
    // Haptic feedback on mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const resetCount = () => {
    setCount(0);
  };

  const isComplete = count >= targetCount;

  return (
    <div className="dhikr-counter">
      <div className="dhikr-header">
        <h3>📿 Numëruesi i Dhikrit</h3>
        <select 
          value={selectedDhikr?.id || ''} 
          onChange={(e) => {
            const dhikr = dhikrList.find(d => d.id === e.target.value);
            setSelectedDhikr(dhikr);
            setCount(0);
          }}
          className="dhikr-selector"
        >
          {dhikrList.map(dhikr => (
            <option key={dhikr.id} value={dhikr.id}>
              {dhikr.transliteration}
            </option>
          ))}
        </select>
      </div>

      {selectedDhikr && (
        <div className="dhikr-content">
          <div className="dhikr-text">
            <div className="arabic">{selectedDhikr.arabic}</div>
            <div className="transliteration">{selectedDhikr.transliteration}</div>
            <div className="translation">{selectedDhikr.translation}</div>
          </div>

          <div className="counter-display">
            <div className={`count-circle ${isComplete ? 'complete' : ''}`}>
              <div className="count-number">{count}</div>
              <div className="count-target">/ {targetCount}</div>
            </div>
          </div>

          <div className="counter-controls">
            <button className="count-btn" onClick={incrementCount}>
              {isComplete ? '✅ Përfunduar' : '📿 Numëro'}
            </button>
            
            <div className="counter-actions">
              <button onClick={resetCount} className="reset-btn">🔄 Rivendose</button>
              <select 
                value={targetCount} 
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="target-selector"
              >
                <option value={33}>33 herë</option>
                <option value={99}>99 herë</option>
                <option value={100}>100 herë</option>
                <option value={1000}>1000 herë</option>
              </select>
            </div>
          </div>

          <div className="dhikr-benefit">
            <strong>Përfitimi:</strong> {selectedDhikr.benefit}
          </div>
        </div>
      )}
    </div>
  );
};

// Articles Component
const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(`${API}/articles?limit=20`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  if (selectedArticle) {
    return (
      <div className="article-view">
        <div className="article-header">
          <button 
            className="back-btn" 
            onClick={() => setSelectedArticle(null)}
          >
            ← Kthehu
          </button>
          <div className="article-meta">
            <span className="category">{selectedArticle.category}</span>
            <span className="author">nga {selectedArticle.author}</span>
          </div>
        </div>

        <div className="article-content">
          <h1>{selectedArticle.title}</h1>
          <div className="article-body">
            <p>{selectedArticle.content}</p>
          </div>
          <div className="article-date">
            {new Date(selectedArticle.created_at).toLocaleDateString('sq-AL')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="articles">
      <div className="articles-header">
        <h3>📚 Artikuj Edukativë</h3>
      </div>

      <div className="articles-list">
        {articles.map(article => (
          <div 
            key={article.id} 
            className={`article-card ${article.featured ? 'featured' : ''}`}
            onClick={() => setSelectedArticle(article)}
          >
            {article.featured && <div className="featured-badge">⭐ I veçantë</div>}
            
            <div className="article-info">
              <h4>{article.title}</h4>
              <p className="article-excerpt">
                {article.content.substring(0, 100)}...
              </p>
              <div className="article-meta">
                <span className="category">{article.category}</span>
                <span className="author">{article.author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Schedule Component
const Schedule = () => {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`${API}/schedule`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const dayNames = ['Hënë', 'Martë', 'Mërkurë', 'Enjte', 'Premte', 'Shtunë', 'Diel'];

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h3>📅 Programi i Transmetimeve</h3>
      </div>

      <div className="schedule-list">
        {schedule.map(item => (
          <div key={item.id} className="schedule-item">
            <div className="schedule-time">
              <div className="day">{dayNames[item.day_of_week]}</div>
              <div className="time">{item.time_start} - {item.time_end}</div>
            </div>
            <div className="schedule-program">
              <h4>{item.program_name}</h4>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('radio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamData, setStreamData] = useState(null);

  useEffect(() => {
    fetchStreamData();
  }, []);

  const fetchStreamData = async () => {
    try {
      const response = await axios.get(`${API}/radio-stream`);
      setStreamData(response.data);
    } catch (error) {
      console.error('Error fetching stream data:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const tabs = [
    { id: 'radio', name: 'Radio', icon: '📻' },
    { id: 'prayer', name: 'Namazi', icon: '🕌' },
    { id: 'qibla', name: 'Kibla', icon: '🧭' },
    { id: 'dhikr', name: 'Dhikr', icon: '📿' },
    { id: 'articles', name: 'Artikuj', icon: '📚' },
    { id: 'schedule', name: 'Programi', icon: '📅' }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'prayer':
        return <PrayerTimes />;
      case 'qibla':
        return <QiblaCompass />;
      case 'dhikr':
        return <DhikrCounter />;
      case 'articles':
        return <Articles />;
      case 'schedule':
        return <Schedule />;
      default:
        return (
          <div className="radio-tab">
            <div className="welcome-section">
              <div className="logo-container">
                <div className="logo">🕌</div>
                <h1>RTV El-Kalem</h1>
                <p className="tagline">زكي قلبك - Zgjoje zemrën tënde</p>
              </div>
              
              <div className="live-status">
                <div className="live-dot"></div>
                Radio Islam në Shqip
              </div>
            </div>

            {streamData && (
              <AudioPlayer 
                streamUrl={streamData.url}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                currentProgram={streamData.current_program}
              />
            )}

            <div className="features-grid">
              <div className="feature-card" onClick={() => setActiveTab('prayer')}>
                <div className="feature-icon">🕌</div>
                <h3>Orët e Namazit</h3>
                <p>Oraret e sakta të namazeve për vendndodhjen tuaj</p>
              </div>

              <div className="feature-card" onClick={() => setActiveTab('qibla')}>
                <div className="feature-icon">🧭</div>
                <h3>Drejtimi i Kiblës</h3>
                <p>Gjeni drejtimin e saktë të Kiblës me kompas</p>
              </div>

              <div className="feature-card" onClick={() => setActiveTab('dhikr')}>
                <div className="feature-icon">📿</div>
                <h3>Numëruesi i Dhikrit</h3>
                <p>Numëroni dhikrin dhe lutjet tuaja</p>
              </div>

              <div className="feature-card" onClick={() => setActiveTab('articles')}>
                <div className="feature-icon">📚</div>
                <h3>Artikuj Edukativë</h3>
                <p>Lexoni artikuj dhe mësime fetare në shqip</p>
              </div>
            </div>

            <div className="social-links">
              <h4>Na ndiqni në rrjetet sociale:</h4>
              <div className="social-buttons">
                <a href="https://www.facebook.com/RtvElkalem" target="_blank" rel="noopener noreferrer">
                  📘 Facebook
                </a>
                <a href="https://www.youtube.com/c/RtvElKalem" target="_blank" rel="noopener noreferrer">
                  📺 YouTube
                </a>
                <a href="https://www.instagram.com/rtvelkalem/" target="_blank" rel="noopener noreferrer">
                  📷 Instagram
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App islamic-app">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-logo">🕌</div>
            <div className="app-title">
              <h1>RTV El-Kalem</h1>
              <p>Radio Islam në Shqip</p>
            </div>
          </div>
          <div className="header-right">
            {streamData && (
              <div className="header-player">
                <button 
                  className={`mini-play-btn ${isPlaying ? 'playing' : ''}`}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="mini-live">
                  <span className="live-dot"></span>
                  LIVE
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;