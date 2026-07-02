import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseFile } from '../utils/dataParsers';
import type { ThaRecord, MukerrerRecord } from '../types';
import './DataUploader.css';

interface DataUploaderProps {
  onThaUpload: (data: ThaRecord[]) => void;
  onMukerrerUpload: (data: MukerrerRecord[]) => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onThaUpload, onMukerrerUpload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'tha' | 'mukerrer') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (type === 'tha') {
        const data = await parseFile<ThaRecord>(file);
        // Add internally generated ID to ensure unique keys in react lists
        const dataWithIds = data.map((item, index) => ({...item, id: `tha-${index}`}));
        onThaUpload(dataWithIds);
      } else {
        const data = await parseFile<MukerrerRecord>(file);
        const dataWithIds = data.map((item, index) => ({...item, id: `muk-${index}`}));
        onMukerrerUpload(dataWithIds);
      }
    } catch (err: any) {
      setError(err.message || 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
      // Reset input value so same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  return (
    <div className="uploader-container">
      <div className="uploader-header">
        <h2>Veri Yükleme</h2>
        <p>Tescil Harici Alanlar ve Mükerrer Parsel oluşumları verilerini sisteme yükleyin.</p>
      </div>

      {error && (
        <div className="error-modal-overlay">
          <div className="error-modal glass-panel">
            <div className="error-modal-header">
              <div className="error-icon">
                <AlertTriangleIcon />
              </div>
              <h3>Yükleme Hatası</h3>
              <button className="close-btn" onClick={() => setError(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="error-modal-body">
              <p>{error}</p>
            </div>
            <div className="error-modal-footer">
              <button className="upload-btn primary" onClick={() => setError(null)}>Tamam</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="upload-cards">
        <div className="upload-card glass-panel">
          <div className="card-icon blue">
            <DatabaseIcon />
          </div>
          <h3>Tescil Edilen THA'lar</h3>
          <p>Tescil edilen Tescil Harici Alanlar tablosunu CSV veya Excel olarak yükleyin.</p>
          <div className="upload-btn-wrapper">
            <button className="upload-btn primary" disabled={loading}>
              <UploadCloud size={18} />
              {loading ? 'Yükleniyor...' : 'Dosya Seç (CSV/Excel)'}
            </button>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={(e) => handleFileUpload(e, 'tha')}
              disabled={loading}
            />
          </div>
        </div>

        <div className="upload-card glass-panel">
          <div className="card-icon green">
            <AlertTriangleIcon />
          </div>
          <h3>Mükerrer Parseller</h3>
          <p>Mükerrer parsel tespit tablosunu CSV veya Excel formatında sisteme aktarın.</p>
          <div className="upload-btn-wrapper">
            <button className="upload-btn secondary" disabled={loading}>
              <UploadCloud size={18} />
              {loading ? 'Yükleniyor...' : 'Dosya Seç (CSV/Excel)'}
            </button>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={(e) => handleFileUpload(e, 'mukerrer')}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted SVGs to avoid unused imports
const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>
);

export default DataUploader;
