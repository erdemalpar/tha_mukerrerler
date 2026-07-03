import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import DataUploader from './components/DataUploader';
import DataTable from './components/DataTable';
import RightPanelMap, { type MapFeature } from './components/RightPanelMap';
import SqlModal from './components/SqlModal';
import * as turf from '@turf/turf';
import { parse } from 'wellknown';
import { parseCSVString } from './utils/dataParsers';
import type { ThaRecord, MukerrerRecord, ViewTab, MapBaseLayer } from './types';
import './App.css';

const getWktArea = (wkt: string | undefined): string | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const area = turf.area(turf.feature(geo as any));
      return `${Math.round(area).toLocaleString('tr-TR')} m²`;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const getWktCentroid = (wkt: string | undefined): [number, number] | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const center = turf.centroid(turf.feature(geo as any));
      return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
    }
  } catch (e) { }
  return undefined;
};

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('mukerrer');
  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>('google_satellite');

  const [thaData, setThaData] = useState<ThaRecord[]>([]);
  const [mukerrerData, setMukerrerData] = useState<MukerrerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllGeometries, setShowAllGeometries] = useState(false);

  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Load default datasets
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const [thaRes, mukerrerRes] = await Promise.all([
          fetch(import.meta.env.BASE_URL + 'Tescil_THA.csv'),
          fetch(import.meta.env.BASE_URL + 'MukerrerParseller.csv')
        ]);

        if (thaRes.ok) {
          const thaText = await thaRes.text();
          const parsedTha = await parseCSVString<ThaRecord>(thaText);
          const dataWithIds = parsedTha.map((row, i) => ({ ...row, id: `tha-${i}` }));
          setThaData(dataWithIds);
        }

        if (mukerrerRes.ok) {
          const mukerrerText = await mukerrerRes.text();
          const parsedMukerrer = await parseCSVString<MukerrerRecord>(mukerrerText);
          const dataWithIds = parsedMukerrer.map((row, i) => ({ ...row, id: `muk-${i}` }));
          setMukerrerData(dataWithIds);
        }
      } catch (err) {
        console.error("Default veri yüklenemedi", err);
      }
    };

    loadDefaults();
  }, []);

  const filteredThaData = useMemo(() => {
    if (!searchQuery) return thaData;
    const lowerQuery = searchQuery.toLowerCase();
    return thaData.filter(row =>
      Object.values(row).some(val => val != null && String(val).toLowerCase().includes(lowerQuery))
    );
  }, [thaData, searchQuery]);

  const filteredMukerrerData = useMemo(() => {
    if (!searchQuery) return mukerrerData;
    const lowerQuery = searchQuery.toLowerCase();
    return mukerrerData.filter(row =>
      Object.values(row).some(val => val != null && String(val).toLowerCase().includes(lowerQuery))
    );
  }, [mukerrerData, searchQuery]);

  const allFeatures = useMemo(() => {
    let features: MapFeature[] = [];
    thaData.forEach(row => {
      if (row.geom) features.push({ wkt: row.geom, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${row.adano}/${row.parselno}`, areaText: getWktArea(row.geom), centroid: getWktCentroid(row.geom) });
    });

    mukerrerData.forEach(row => {
      let mukerrerWkt = row.mukerrer_parsel_geom;
      let thaWkt = row.tha_geom;

      if (mukerrerWkt) {
        features.push({ wkt: mukerrerWkt, color: '#9333ea', label: 'Mükerrer Parsel', adaParsel: `${row.mukerrer_adano}/${row.mukerrer_parselno}`, areaText: getWktArea(mukerrerWkt), centroid: getWktCentroid(mukerrerWkt) });
      }
      if (thaWkt) {
        features.push({ wkt: thaWkt, color: '#ea580c', label: 'THA (Mükerrer Tablo)', adaParsel: `${row.tha_ihdas_adano}/${row.tha_ihdas_parselno}`, areaText: getWktArea(thaWkt), centroid: getWktCentroid(thaWkt) });
      } else {
        const match = thaData.find(t => t.adano == row.tha_ihdas_adano && t.parselno == row.tha_ihdas_parselno);
        if (match && match.geom) {
          thaWkt = match.geom;
        }
      }

      // Compute Intersection
      if (mukerrerWkt && thaWkt) {
        try {
          const geo1 = parse(mukerrerWkt);
          const geo2 = parse(thaWkt);
          if (geo1 && geo2) {
            const poly1 = turf.feature(geo1 as any);
            const poly2 = turf.feature(geo2 as any);
            const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
            if (intersection) {
              const displayArea = row.kesisen_alan_m2 != null && String(row.kesisen_alan_m2).trim() !== ''
                ? `${Number(row.kesisen_alan_m2).toLocaleString('tr-TR')} m²`
                : `${Math.round(turf.area(intersection)).toLocaleString('tr-TR')} m²`;
              const center = turf.centroid(intersection);
              features.push({
                geoJson: intersection.geometry,
                color: '#3b82f6',
                isHatched: true,
                areaText: displayArea,
                centroid: [center.geometry.coordinates[1], center.geometry.coordinates[0]] as [number, number]
              });
            }
          }
        } catch (e) {
          console.error("Intersection failed", e);
        }
      }
    });
    return features;
  }, [thaData, mukerrerData]);

  const handleRowCheck = (row: any, checked: boolean) => {
    const rowKey = String(row.id);
    const newChecked = new Set(checkedRowIds);
    if (checked) {
      newChecked.add(rowKey);
      setIsMapPanelOpen(true);
    } else {
      newChecked.delete(rowKey);
      if (newChecked.size === 0) setIsMapPanelOpen(false);
    }
    setCheckedRowIds(newChecked);
  };

  const handleRowsCheck = (rows: any[], checked: boolean) => {
    const newChecked = new Set(checkedRowIds);
    rows.forEach(row => {
      const rowKey = String(row.id);
      if (checked) newChecked.add(rowKey);
      else newChecked.delete(rowKey);
    });

    if (newChecked.size > 0) setIsMapPanelOpen(true);
    else setIsMapPanelOpen(false);
    setCheckedRowIds(newChecked);
  };

  useEffect(() => {
    if (checkedRowIds.size === 0) {
      setMapFeatures([]);
      return;
    }

    let features: MapFeature[] = [];
    const currentData = activeTab === 'tha' ? thaData : mukerrerData;

    checkedRowIds.forEach(rowId => {
      const row = currentData.find((r: any) => String(r.id) === rowId) as any;
      if (!row) return;

      if (activeTab === 'tha') {
        if (row.geom) {
          try {
            if (parse(row.geom)) {
              features.push({ wkt: row.geom, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${row.adano}/${row.parselno}`, areaText: getWktArea(row.geom), centroid: getWktCentroid(row.geom) }); // Green for THA
            } else { console.warn(`Tescilli THA geometri bozuk/eksik: ${row.id}`); }
          } catch (e) { console.warn(`Tescilli THA parse edilemedi: ${row.id}`); }
        }

        // Find matching mukerrer geometries
        const match = mukerrerData.filter(m => String(m.tha_ihdas_adano).trim() === String(row.adano).trim() && String(m.tha_ihdas_parselno).trim() === String(row.parselno).trim());
        match.forEach(m => {
          if (m.mukerrer_parsel_geom) {
            try {
              if (parse(m.mukerrer_parsel_geom)) {
                features.push({ wkt: m.mukerrer_parsel_geom, color: '#9333ea', label: 'Mükerrer Parsel', adaParsel: `${m.mukerrer_adano}/${m.mukerrer_parselno}`, areaText: getWktArea(m.mukerrer_parsel_geom), centroid: getWktCentroid(m.mukerrer_parsel_geom) });

                const geo1 = parse(row.geom);
                const geo2 = parse(m.mukerrer_parsel_geom);
                if (geo1 && geo2) {
                  const poly1 = turf.feature(geo1 as any);
                  const poly2 = turf.feature(geo2 as any);
                  const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
                  if (intersection) {
                    const center = turf.centroid(intersection);
                    const displayArea = m.kesisen_alan_m2 != null && String(m.kesisen_alan_m2).trim() !== ''
                      ? `${Number(m.kesisen_alan_m2).toLocaleString('tr-TR')} m²`
                      : `${Math.round(turf.area(intersection)).toLocaleString('tr-TR')} m²`;

                    features.push({
                      geoJson: intersection.geometry,
                      color: '#3b82f6',
                      isHatched: true,
                      areaText: displayArea,
                      centroid: [center.geometry.coordinates[1], center.geometry.coordinates[0]] as [number, number]
                    });
                  }
                }
              } else { console.warn(`Mükerrer geometri bozuk/eksik: ${m.id}`); }
            } catch (e) { console.warn(`Mükerrer geometri parse edilemedi: ${m.id}`); }
          }
        });
      } else if (activeTab === 'mukerrer') {
        let mukerrerWkt = row.mukerrer_parsel_geom;
        let thaWkt = row.tha_geom;
        let tescilliThaWkt = null;

        if (mukerrerWkt) {
          try {
            if (parse(mukerrerWkt)) {
              features.push({ wkt: mukerrerWkt, color: '#9333ea', label: 'Mükerrer Parsel', adaParsel: `${row.mukerrer_adano}/${row.mukerrer_parselno}`, areaText: getWktArea(mukerrerWkt), centroid: getWktCentroid(mukerrerWkt) }); // Purple for Mukerrer
            } else { console.warn(`Mükerrer geometri bozuk/eksik: ${row.id}`); }
          } catch (e) { console.warn(`Mükerrer geometri parse edilemedi: ${row.id}`); }
        }

        if (thaWkt) {
          try {
            if (parse(thaWkt)) {
              features.push({ wkt: thaWkt, color: '#ea580c', label: 'THA (Mükerrer Tablo)', adaParsel: `${row.tha_ihdas_adano}/${row.tha_ihdas_parselno}`, areaText: getWktArea(thaWkt), centroid: getWktCentroid(thaWkt) });
            }
          } catch (e) { }
        }

        // Tescilli THA sayfasından da bulmayı dene
        const match = thaData.find(t => String(t.adano).trim() === String(row.tha_ihdas_adano).trim() && String(t.parselno).trim() === String(row.tha_ihdas_parselno).trim());
        if (match && match.geom) {
          tescilliThaWkt = match.geom;
          try {
            if (parse(tescilliThaWkt)) {
              features.push({ wkt: tescilliThaWkt, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${match.adano}/${match.parselno}`, areaText: getWktArea(tescilliThaWkt), centroid: getWktCentroid(tescilliThaWkt) }); // Green for THA
            }
          } catch (e) { }
        }

        let intersectionTargetWkt = tescilliThaWkt || thaWkt;

        // Compute Intersection
        if (mukerrerWkt && intersectionTargetWkt) {
          try {
            const geo1 = parse(mukerrerWkt);
            const geo2 = parse(intersectionTargetWkt);
            if (geo1 && geo2) {
              const poly1 = turf.feature(geo1 as any);
              const poly2 = turf.feature(geo2 as any);
              const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
              if (intersection) {
                const center = turf.centroid(intersection);
                const displayArea = row.kesisen_alan_m2 != null && String(row.kesisen_alan_m2).trim() !== ''
                  ? `${Number(row.kesisen_alan_m2).toLocaleString('tr-TR')} m²`
                  : `${Math.round(turf.area(intersection)).toLocaleString('tr-TR')} m²`;

                features.push({
                  geoJson: intersection.geometry,
                  color: '#3b82f6',
                  isHatched: true,
                  areaText: displayArea,
                  centroid: [center.geometry.coordinates[1], center.geometry.coordinates[0]] as [number, number]
                });
              }
            }
          } catch (e) {
            console.error("Intersection failed", e);
          }
        }

        // Mükerrer parselle kesişen diğer THA parsellerini bul
        if (mukerrerWkt) {
          try {
            const mGeo = parse(mukerrerWkt);
            if (mGeo) {
              const mPoly = turf.feature(mGeo as any);
              thaData.forEach(t => {
                if (String(t.adano).trim() === String(row.tha_ihdas_adano).trim() && String(t.parselno).trim() === String(row.tha_ihdas_parselno).trim()) {
                  return;
                }
                if (t.geom) {
                  const tGeo = parse(t.geom);
                  if (tGeo) {
                    const tPoly = turf.feature(tGeo as any);
                    const isIntersecting = turf.intersect(turf.featureCollection([mPoly, tPoly]));
                    if (isIntersecting) {
                      features.push({ wkt: t.geom, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${t.adano}/${t.parselno}`, areaText: getWktArea(t.geom), centroid: getWktCentroid(t.geom) });
                    }
                  }
                }
              });
            }
          } catch (e) {
            console.error("Diger THA kesişimleri bulunurken hata", e);
          }
        }
      }
    });

    setMapFeatures(features);
  }, [checkedRowIds, activeTab, thaData, mukerrerData]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setIsMapPanelOpen(false);
    setMapFeatures([]);
    setCheckedRowIds(new Set());
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        baseLayer={baseLayer}
        setBaseLayer={setBaseLayer}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      <main className="main-content">
        <div className="content-area">
          {activeTab === 'upload' && (
            <DataUploader
              onThaUpload={(data) => { setThaData(data); setActiveTab('tha'); }}
              onMukerrerUpload={(data) => { setMukerrerData(data); setActiveTab('mukerrer'); }}
            />
          )}

          {activeTab === 'tha' && (
            <DataTable
              type="tha"
              data={filteredThaData}
              checkedRowIds={checkedRowIds}
              onRowCheck={handleRowCheck}
              onRowsCheck={handleRowsCheck}
            />
          )}

          {activeTab === 'mukerrer' && (
            <DataTable
              type="mukerrer"
              data={filteredMukerrerData}
              checkedRowIds={checkedRowIds}
              onRowCheck={handleRowCheck}
              onRowsCheck={handleRowsCheck}
            />
          )}
        </div>

        <RightPanelMap
          isOpen={isMapPanelOpen}
          features={showAllGeometries ? allFeatures : mapFeatures}
          focusFeatures={mapFeatures}
          baseLayer={baseLayer}
          showAllGeometries={showAllGeometries}
          setShowAllGeometries={setShowAllGeometries}
          onClose={() => setIsMapPanelOpen(false)}
        />
      </main>
      <footer className="app-footer">CBS Şube Müdürlüğü @2026</footer>
      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </div>
  );
}

export default App;
