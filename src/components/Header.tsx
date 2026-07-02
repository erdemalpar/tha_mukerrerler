import React, { useState, useRef, useEffect } from 'react';
import type { ViewTab, MapBaseLayer } from '../types';
import { Layers, Upload, Database, ChevronDown, Search, Code } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import './Header.css';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  baseLayer: MapBaseLayer;
  setBaseLayer: (layer: MapBaseLayer) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSqlModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, baseLayer, setBaseLayer, searchQuery, setSearchQuery, onOpenSqlModal }) => {
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLayersMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const layers: { id: MapBaseLayer; name: string }[] = [
    { id: 'osm', name: 'OpenStreetMap' },
    { id: 'google_satellite', name: 'Google Uydu' },
    { id: 'google_hybrid', name: 'Google Hybrid' },
    { id: 'yandex', name: 'Yandex Harita' },
  ];

  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <AnimatedLogo direction="right" />
        <h1>Tescil Harici Alanlar</h1>
        <AnimatedLogo direction="left" />
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${activeTab === 'mukerrer' ? 'active' : ''}`}
          onClick={() => setActiveTab('mukerrer')}
        >
          <Database size={18} />
          Mükerrer Parseller
        </button>
        <button
          className={`nav-btn ${activeTab === 'tha' ? 'active' : ''}`}
          onClick={() => setActiveTab('tha')}
        >
          <Database size={18} />
          Tescil Edilen THA'lar
        </button>
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          Veri Yükleme
        </button>
        <button
          className="nav-btn"
          onClick={onOpenSqlModal}
        >
          <Code size={18} />
          SQL Sorguları
        </button>
      </nav>

      <div className="header-actions">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tüm tablolarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="global-search-input"
          />
        </div>

        <div className="layers-dropdown" ref={menuRef}>
          <button
            className="action-btn"
            onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
          >
            <Layers size={18} />
            Katmanlar
            <ChevronDown size={14} className={`chevron ${isLayersMenuOpen ? 'open' : ''}`} />
          </button>

          {isLayersMenuOpen && (
            <div className="dropdown-menu glass-panel">
              <div className="dropdown-title">Harita Altlıkları</div>
              {layers.map(layer => (
                <div
                  key={layer.id}
                  className={`dropdown-item ${baseLayer === layer.id ? 'selected' : ''}`}
                  onClick={() => {
                    setBaseLayer(layer.id);
                    setIsLayersMenuOpen(false);
                  }}
                >
                  {layer.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
