import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const Sidebar = ({ activeTab, setActiveTab, stats }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'calendar', name: 'Kalendari', icon: '📅' },
    { id: 'websites', name: 'Website-et', icon: '🌐' },
    { id: 'posts', name: 'Postimet', icon: '📝' },
    { id: 'content', name: 'Gjenerimi AI', icon: '🤖' },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">SocialManager</h1>
        <p className="text-gray-400 text-sm mt-1">Menaxhoni rrjetet sociale</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {stats && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Statistika të Shpejta</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Website-e:</span>
              <span className="text-blue-400">{stats.total_websites}</span>
            </div>
            <div className="flex justify-between">
              <span>Postime:</span>
              <span className="text-green-400">{stats.total_posts}</span>
            </div>
            <div className="flex justify-between">
              <span>Të planifikuara:</span>
              <span className="text-yellow-400">{stats.scheduled_posts}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ stats }) => (
  <div className="p-6">
    <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center">
          <div className="text-3xl text-blue-500 mr-4">🌐</div>
          <div>
            <p className="text-gray-600 text-sm">Total Website-e</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.total_websites || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="text-3xl text-green-500 mr-4">📝</div>
          <div>
            <p className="text-gray-600 text-sm">Total Postime</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.total_posts || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
        <div className="flex items-center">
          <div className="text-3xl text-yellow-500 mr-4">⏰</div>
          <div>
            <p className="text-gray-600 text-sm">Të Planifikuara</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.scheduled_posts || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
        <div className="flex items-center">
          <div className="text-3xl text-purple-500 mr-4">📅</div>
          <div>
            <p className="text-gray-600 text-sm">Ngjarje Sot</p>
            <p className="text-2xl font-bold text-gray-800">{stats?.today_events || 0}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Aktivitetet e Fundit</h3>
      <p className="text-gray-600">Statistikat e detajuara do të shfaqen këtu pasi të krijoni website-e dhe postime.</p>
    </div>
  </div>
);

const WebsiteManager = ({ websites, setWebsites }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    connected_platforms: []
  });

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'pinterest', label: 'Pinterest', icon: '📌' },
    { value: 'telegram', label: 'Telegram', icon: '✈️' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/websites`, formData);
      setWebsites([...websites, response.data]);
      setFormData({ name: '', url: '', description: '', connected_platforms: [] });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating website:', error);
    }
  };

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      connected_platforms: prev.connected_platforms.includes(platform)
        ? prev.connected_platforms.filter(p => p !== platform)
        : [...prev.connected_platforms, platform]
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Website-et</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Shto Website
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <div key={website.id} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{website.name}</h3>
            <p className="text-blue-600 text-sm mb-3">{website.url}</p>
            {website.description && (
              <p className="text-gray-600 text-sm mb-4">{website.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {website.connected_platforms.map((platform) => {
                const platformInfo = platforms.find(p => p.value === platform);
                return (
                  <span key={platform} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {platformInfo?.icon} {platformInfo?.label}
                  </span>
                );
              })}
            </div>
            
            <div className="text-xs text-gray-500">
              Krijuar: {new Date(website.created_at).toLocaleDateString('sq-AL')}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Shto Website të Ri</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Emri i Website-it *
                </label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  URL *
                </label>
                <input 
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Përshkrimi
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Zgjidhni Platformat Sociale
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => togglePlatform(platform.value)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        formData.connected_platforms.includes(platform.value)
                          ? 'bg-blue-100 border-blue-500 text-blue-800'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">{platform.icon}</div>
                        <div className="text-xs">{platform.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulo
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Krijo Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarView = ({ websites, calendarEvents, setCalendarEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    website_id: '',
    title: '',
    description: '',
    time: '',
    type: 'generation',
    platform: ''
  });

  const eventTypes = [
    { value: 'generation', label: 'Gjenerim Përmbajtjeje', color: 'bg-blue-500' },
    { value: 'posting', label: 'Postim', color: 'bg-green-500' },
    { value: 'monitoring', label: 'Mbikëqyrje', color: 'bg-purple-500' }
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: selectedDate.toISOString().split('T')[0]
      };
      const response = await axios.post(`${API}/calendar`, eventData);
      setCalendarEvents([...calendarEvents, response.data]);
      setFormData({ website_id: '', title: '', description: '', time: '', type: 'generation', platform: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Kalendari i Punës</h2>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            ‹
          </button>
          <h3 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            ›
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-0 bg-gray-50">
          {['Diel', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-gray-700 border-b">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-100'
              }`}
              onClick={() => {
                if (day) {
                  setSelectedDate(day);
                  setShowModal(true);
                }
              }}
            >
              {day && (
                <>
                  <div className="font-semibold text-gray-800 mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {getEventsForDate(day).slice(0, 2).map((event, idx) => {
                      const eventType = eventTypes.find(t => t.value === event.type);
                      return (
                        <div 
                          key={idx}
                          className={`text-xs text-white p-1 rounded ${eventType?.color || 'bg-gray-500'}`}
                        >
                          {event.time} - {event.title}
                        </div>
                      );
                    })}
                    {getEventsForDate(day).length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{getEventsForDate(day).length - 2} më shumë
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Shto Ngjarje - {selectedDate?.toLocaleDateString('sq-AL')}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Website *
                </label>
                <select 
                  value={formData.website_id}
                  onChange={(e) => setFormData({...formData, website_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Zgjidhni Website</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>{website.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Titulli *
                </label>
                <input 
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ora *
                </label>
                <input 
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Lloji *
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Përshkrimi
                </label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulo
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Shto Ngjarje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PostManager = ({ websites, posts, setPosts }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    website_id: '',
    platform: '',
    content: '',
    scheduled_time: '',
    media_urls: []
  });

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/posts`, formData);
      setPosts([...posts, response.data]);
      setFormData({ website_id: '', platform: '', content: '', scheduled_time: '', media_urls: [] });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Menaxhimi i Postimeve</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Krijo Postim
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const website = websites.find(w => w.id === post.website_id);
          const platform = platforms.find(p => p.value === post.platform);
          
          return (
            <div key={post.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{platform?.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{platform?.label}</h3>
                    <p className="text-sm text-gray-600">{website?.name}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{post.content}</p>
              
              <div className="text-sm text-gray-500">
                <p>Planifikuar për: {new Date(post.scheduled_time).toLocaleString('sq-AL')}</p>
                <p>Krijuar: {new Date(post.created_at).toLocaleString('sq-AL')}</p>
                {post.ai_generated && <p className="text-blue-600">✨ Gjeneruar me AI</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Krijo Postim të Ri</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Website *
                </label>
                <select 
                  value={formData.website_id}
                  onChange={(e) => setFormData({...formData, website_id: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Zgjidhni Website</option>
                  {websites.map(website => (
                    <option key={website.id} value={website.id}>{website.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Platforma *
                </label>
                <select 
                  value={formData.platform}
                  onChange={(e) => setFormData({...formData, platform: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Zgjidhni Platformën</option>
                  {platforms.map(platform => (
                    <option key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Përmbajtja *
                </label>
                <textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Data dhe Ora e Postimit *
                </label>
                <input 
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Anulo
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Krijo Postim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ContentGenerator = ({ websites }) => {
  const [formData, setFormData] = useState({
    website_id: '',
    platform: '',
    prompt: '',
    tone: 'professional',
    length: 'medium'
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
  ];

  const tones = [
    { value: 'professional', label: 'Profesional' },
    { value: 'friendly', label: 'Miqësor' },
    { value: 'casual', label: 'Joformale' },
    { value: 'energetic', label: 'Energjik' },
    { value: 'informative', label: 'Informues' }
  ];

  const lengths = [
    { value: 'short', label: 'Shkurt' },
    { value: 'medium', label: 'Mesatar' },
    { value: 'long', label: 'I gjatë' }
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/generate-content`, formData);
      setGeneratedContent(response.data.generated_content);
      setAiReady(response.data.ai_ready);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Gjenerimi i Përmbajtjes me AI</h2>
      
      {!aiReady && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800">OpenAI API Key i nevojshëm</h3>
              <p className="text-yellow-700 text-sm">
                Për të aktivizuar gjenerimin e përmbajtjes, ju lutemi shtoni çelësin OpenAI API në konfigurimin e aplikacionit.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Konfigurimi i Gjenerimit</h3>
          
          <form onSubmit={handleGenerate}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Website *
              </label>
              <select 
                value={formData.website_id}
                onChange={(e) => setFormData({...formData, website_id: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Zgjidhni Website</option>
                {websites.map(website => (
                  <option key={website.id} value={website.id}>{website.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Platforma *
              </label>
              <select 
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Zgjidhni Platformën</option>
                {platforms.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.icon} {platform.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Toni *
              </label>
              <select 
                value={formData.tone}
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {tones.map(tone => (
                  <option key={tone.value} value={tone.value}>{tone.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Gjatësia *
              </label>
              <select 
                value={formData.length}
                onChange={(e) => setFormData({...formData, length: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {lengths.map(length => (
                  <option key={length.value} value={length.value}>{length.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Përshkrimi/Tema *
              </label>
              <textarea 
                value={formData.prompt}
                onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Shkruani temën ose përshkrimin e postimit që doni të gjeneroni..."
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '⏳ Duke gjeneruar...' : '🤖 Gjeneroni Përmbajtjen'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Rezultati i Gjeneruar</h3>
          
          {generatedContent ? (
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <textarea 
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full h-64 p-3 border-none bg-transparent resize-none focus:ring-0"
                  placeholder="Përmbajtja e gjeneruar do të shfaqet këtu..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => navigator.clipboard.writeText(generatedContent)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  📋 Kopjo Tekstin
                </button>
                <button 
                  onClick={() => setGeneratedContent('')}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  🗑️ Pastro
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-600">Plotësoni formularin dhe klikoni "Gjeneroni Përmbajtjen" për të marrë përmbajtje të gjeneruar me AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [websites, setWebsites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [stats, setStats] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load websites
      const websitesResponse = await axios.get(`${API}/websites`);
      setWebsites(websitesResponse.data);

      // Load posts
      const postsResponse = await axios.get(`${API}/posts`);
      setPosts(postsResponse.data);

      // Load calendar events
      const eventsResponse = await axios.get(`${API}/calendar`);
      setCalendarEvents(eventsResponse.data);

      // Load stats
      const statsResponse = await axios.get(`${API}/stats`);
      setStats(statsResponse.data);

    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />;
      case 'calendar':
        return <CalendarView websites={websites} calendarEvents={calendarEvents} setCalendarEvents={setCalendarEvents} />;
      case 'websites':
        return <WebsiteManager websites={websites} setWebsites={setWebsites} />;
      case 'posts':
        return <PostManager websites={websites} posts={posts} setPosts={setPosts} />;
      case 'content':
        return <ContentGenerator websites={websites} />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="App flex min-h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;