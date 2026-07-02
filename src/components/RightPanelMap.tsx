import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Tooltip, Popup, Polyline, Marker, LayersControl, LayerGroup } from 'react-leaflet';
import { X } from 'lucide-react';
import type { MapBaseLayer } from '../types';
import { parse } from 'wellknown';
import 'leaflet/dist/leaflet.css';
import './RightPanelMap.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapFeature {
  wkt?: string;
  geoJson?: any;
  color: string;
  label?: string;
  adaParsel?: string;
  isHatched?: boolean;
  areaText?: string;
  centroid?: [number, number];
}

interface RightPanelMapProps {
  isOpen: boolean;
  onClose: () => void;
  features: MapFeature[];
  focusFeatures?: MapFeature[];
  baseLayer: MapBaseLayer;
}

const ZoomTracker = ({ onZoomChange }: { onZoomChange: (z: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onZoomChange(map.getZoom()),
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  return null;
};

const parseWKT = (wkt: string) => {
  try {
    return parse(wkt);
  } catch (e) {
    console.error("Geometri parse edilemedi", e);
    return null;
  }
};

const MapController = ({ focusFeatures }: { focusFeatures?: { geoJson: any }[] }) => {
  const map = useMap();
  useEffect(() => {
    if (focusFeatures && focusFeatures.length > 0) {
      try {
        const bounds = L.geoJSON(focusFeatures[0].geoJson).getBounds();
        for (let i = 1; i < focusFeatures.length; i++) {
          bounds.extend(L.geoJSON(focusFeatures[i].geoJson).getBounds());
        }
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (err) {
        console.error("Error calculating bounds", err);
      }
    }
  }, [map, focusFeatures]);
  return null;
};

const RightPanelMap: React.FC<RightPanelMapProps> = ({ isOpen, features, focusFeatures, baseLayer, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(40);
  const [parsedFeatures, setParsedFeatures] = useState<{geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number]}[]>([]);
  const [parsedFocusFeatures, setParsedFocusFeatures] = useState<{geoJson: any}[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(6);

  const handleZoomChange = React.useCallback((z: number) => {
    setCurrentZoom(z);
  }, []);

  useEffect(() => {
    if (isOpen && features.length > 0) {
      const parsed: {geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number]}[] = [];
      features.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsed.push({ 
            geoJson, 
            color: f.color,
            label: f.label,
            adaParsel: f.adaParsel,
            isHatched: f.isHatched,
            areaText: f.areaText,
            centroid: f.centroid
          });
        }
      });
      setParsedFeatures(parsed);
    } else if (!isOpen) {
      setParsedFeatures([]);
    }
  }, [isOpen, features]);

  useEffect(() => {
    if (isOpen && focusFeatures && focusFeatures.length > 0) {
      const parsedFocus: {geoJson: any}[] = [];
      focusFeatures.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsedFocus.push({ geoJson });
        }
      });
      setParsedFocusFeatures(parsedFocus);
    } else if (!isOpen) {
      setParsedFocusFeatures([]);
    }
  }, [isOpen, focusFeatures]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        if (target.closest('.app-header')) return;
        if (target.closest('.map-icon-btn')) return;
        if (target.closest('.resizer')) return; // Ignore resizer clicks
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = panelRef.current ? panelRef.current.getBoundingClientRect().width : 0;
    const startX = mouseDownEvent.clientX;

    const doDrag = (dragEvent: MouseEvent) => {
      const diffX = startX - dragEvent.clientX;
      const newWidthPx = startWidth + diffX;
      const windowWidth = window.innerWidth;
      const newWidthPercent = (newWidthPx / windowWidth) * 100;
      setPanelWidth(Math.min(Math.max(20, newWidthPercent), 90));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, []);

  const tileUrls: Record<MapBaseLayer, string> = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    google_satellite: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
    google_hybrid: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
    yandex: 'https://core-sat.maps.yandex.net/tiles?l=sat&v=3.1023.0&x={x}&y={y}&z={z}&scale=1&lang=tr_TR'
  };

  const attributions: Record<MapBaseLayer, string> = {
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    google_satellite: 'Map data &copy; Google',
    google_hybrid: 'Map data &copy; Google',
    yandex: 'Map data &copy; Yandex'
  };

  const renderFeature = (f: any, idx: number) => {
    const scale = currentZoom >= 18 ? 1 : Math.pow(2, currentZoom - 18);
    const showCard = currentZoom >= 16;

    let offsetLatLng: [number, number] | null = null;
    if (f.centroid) {
      if (f.isHatched) {
         offsetLatLng = [f.centroid[0] + 0.0003, f.centroid[1] + 0.0008];
      } else {
         offsetLatLng = f.centroid;
      }
    }

    return (
      <React.Fragment key={idx}>
        <GeoJSON 
          data={f.geoJson} 
          pathOptions={{ 
            color: f.color, 
            weight: f.isHatched ? 2 : 3, 
            opacity: 0.8, 
            fillColor: f.isHatched ? 'url(#hatchPattern)' : f.color, 
            fillOpacity: f.isHatched ? 0.8 : 0.2 
          }} 
        >
          <Tooltip direction="top" offset={[0, -10]} className="custom-map-label" sticky>
            <div className="tooltip-content">
              {f.isHatched ? (
                <>
                  <div className="tooltip-title">Kesişen Alan</div>
                  {f.areaText && <div className="tooltip-desc">{f.areaText}</div>}
                </>
              ) : (
                <>
                  {f.label && <div className="tooltip-title">{f.label}</div>}
                  {f.adaParsel && <div className="tooltip-desc">{f.adaParsel}</div>}
                  {f.areaText && <div className="tooltip-area" style={{ marginTop: '4px', fontSize: '11px', fontWeight: 600, color: '#4b5563', padding: '2px 4px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>{f.areaText}</div>}
                </>
              )}
            </div>
          </Tooltip>
          <Popup className="custom-map-popup">
            <div className="tooltip-content" style={{ margin: 0, padding: '4px', textAlign: 'center' }}>
              {f.isHatched ? (
                <>
                  <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '4px' }}>Kesişen Alan</div>
                  {f.areaText && <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{f.areaText}</div>}
                </>
              ) : (
                <>
                  {f.label && <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '2px' }}>{f.label}</div>}
                  {f.adaParsel && <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{f.adaParsel}</div>}
                  {f.areaText && <div className="tooltip-area" style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, color: '#4b5563', padding: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>{f.areaText}</div>}
                </>
              )}
            </div>
          </Popup>
        </GeoJSON>
        
        {offsetLatLng && (
          <>
            {showCard ? (
              <>
                {f.isHatched && <Polyline positions={[f.centroid!, offsetLatLng]} color="#3b82f6" weight={2} dashArray="4" />}
                <Marker 
                  position={offsetLatLng} 
                  icon={L.divIcon({ 
                    className: 'area-label-icon', 
                    html: `
                      <div class="area-text-box" style="transform: scale(${scale}); transform-origin: ${f.isHatched ? 'top left' : 'center center'}; transition: transform 0.2s ease; border-color: ${f.color}; color: ${f.color};">
                        <span style="font-size: 9px; color: #6b7280; text-transform: uppercase;">${f.label || (f.isHatched ? 'Kesişen Alan' : '')}</span>
                        <strong style="display: block; font-size: 12px; color: #111827; margin-top: 1px;">${f.adaParsel || ''}</strong>
                        ${f.areaText ? `<div style="font-size: 10px; margin-top: 2px;">${f.areaText}</div>` : ''}
                      </div>`,
                    iconSize: [100, 32]
                  })} 
                />
              </>
            ) : (
              <Marker 
                position={f.centroid!} 
                icon={L.divIcon({ 
                  className: 'custom-small-pin', 
                  html: `<div style="width: 14px; height: 14px; background: ${f.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: scale(${Math.max(0.3, currentZoom / 15)}); transform-origin: center;"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                })} 
              />
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  // Group features
  const tescilliFeatures = parsedFeatures.filter(f => f.label === 'Tescilli THA');
  const mukerrerFeatures = parsedFeatures.filter(f => f.label === 'Mükerrer Parsel');
  const thaMukerrerFeatures = parsedFeatures.filter(f => f.label === 'THA (Mükerrer Tablo)');
  const kesisenFeatures = parsedFeatures.filter(f => f.isHatched);

  return (
    <div 
      ref={panelRef} 
      className={`right-panel-map ${isOpen ? 'open' : ''}`}
      style={{ width: isOpen ? `${panelWidth}%` : '40%' }}
    >
      <div className="resizer" onMouseDown={startResizing} />
      
      <div className="panel-header">
        <h3>Harita Görünümü</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="map-container">
        {isOpen && (
          <MapContainer 
            center={[39.92077, 32.85411]} 
            zoom={6} 
            maxZoom={22}
            zoomDelta={0.5}
            zoomSnap={0.5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              key={baseLayer}
              url={tileUrls[baseLayer]}
              attribution={attributions[baseLayer]}
              maxNativeZoom={18}
              maxZoom={22}
            />
            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
              <defs>
                <pattern id="hatchPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#3b82f6" strokeWidth="4" />
                </pattern>
              </defs>
            </svg>
            <MapController focusFeatures={parsedFocusFeatures} />
            <ZoomTracker onZoomChange={handleZoomChange} />
            <div className="zoom-indicator" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#374151', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 1000, border: '1px solid rgba(0,0,0,0.1)' }}>
              Zoom: {currentZoom.toFixed(1)}
            </div>

            <LayersControl position="topright" collapsed={false}>
              {tescilliFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#16a34a' style='color: #16a34a; font-weight: 600;'>Tescilli THA</span>">
                  <LayerGroup>
                    {tescilliFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {mukerrerFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#9333ea' style='color: #9333ea; font-weight: 600;'>Mükerrer Parsel</span>">
                  <LayerGroup>
                    {mukerrerFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {thaMukerrerFeatures.length > 0 && (
                <LayersControl.Overlay name="<span class='layer-lbl' data-color='#ea580c' style='color: #ea580c; font-weight: 600;'>THA (Mükerrer Tablo)</span>">
                  <LayerGroup>
                    {thaMukerrerFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {kesisenFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#3b82f6' style='color: #3b82f6; font-weight: 600;'>Kesişen Alan</span>">
                  <LayerGroup>
                    {kesisenFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
            </LayersControl>
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default RightPanelMap;
