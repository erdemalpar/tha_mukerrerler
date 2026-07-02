import { useState, useMemo } from 'react';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './DataTable.css';

interface DataTableProps {
  type: 'tha' | 'mukerrer';
  data: any[];
  checkedRowIds: Set<string>;
  onRowCheck: (row: any, checked: boolean) => void;
  onRowsCheck?: (rows: any[], checked: boolean) => void;
}

const DataTable: React.FC<DataTableProps> = ({ type, data, checkedRowIds, onRowCheck, onRowsCheck }) => {
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const totalPages = Math.ceil(data.length / pageSize);

  // Calculate current data chunk
  const currentData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return data.slice(startIdx, startIdx + pageSize);
  }, [data, currentPage, pageSize]);

  const handleRowClick = (e: React.MouseEvent, row: any, idx: number) => {
    const globalIdx = (currentPage - 1) * pageSize + idx;
    const rowKey = String(row.id || globalIdx);
    const isChecked = checkedRowIds.has(rowKey);

    if (e.shiftKey && lastSelectedIndex !== null && onRowsCheck) {
      const start = Math.min(lastSelectedIndex, globalIdx);
      const end = Math.max(lastSelectedIndex, globalIdx);
      const rowsInRange = data.slice(start, end + 1);

      onRowsCheck(rowsInRange, true);
    } else {
      onRowCheck(row, !isChecked);
    }
    setLastSelectedIndex(globalIdx);
  };

  // Handle Page Changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const thaColumns = [
    { key: 'ilad', label: 'İl' },
    { key: 'ilcead', label: 'İlçe' },
    { key: 'mahallead', label: 'Mahalle' },
    { key: 'adano', label: 'Ada No' },
    { key: 'parselno', label: 'Parsel No' },
    { key: 'yuzolcum', label: 'Yüzölçüm' },
    { key: 'kad_basvuruno', label: 'Kad. Başvuru No' },
    { key: 'kad_basvurualinmatarihi', label: 'Kad. Başvuru Tarihi' },
    { key: 'kad_fenkayitno', label: 'Kad. Fen Kayıt No' },
    { key: 'kad_fenkayittarih', label: 'Kad. Fen Kayıt Tarihi' },
    { key: 'tapu_tesciltarih', label: 'Tescil Tarihi' },
    { key: 'tapu_tescilyevmiyeno', label: 'Tescil Yevmiye No' }
  ];

  const mukerrerColumns = [
    { key: 'ilad', label: 'İl' },
    { key: 'ilcead', label: 'İlçe' },
    { key: 'mahallead', label: 'Mahalle' },
    { key: 'tha_ihdas_adano', label: 'THA Ada' },
    { key: 'tha_ihdas_parselno', label: 'THA Parsel' },
    { key: 'mukerrer_adano', label: 'Mükerrer Ada' },
    { key: 'mukerrer_parselno', label: 'Mükerrer Parsel' },
    { key: 'kesisen_alan_m2', label: 'Kesişen Alan (m²)' },
    { key: 'kad_basvuruno', label: 'Kad. Başvuru No' },
    { key: 'kad_basvuru_olusturmatarihi', label: 'Kad. Başvuru Tarihi' },
    { key: 'kad_fenkayitno', label: 'Kad. Fen Kayıt No' },
    { key: 'kad_fenkayittarih', label: 'Kad. Fen Kayıt Tarihi' },
    { key: 'tescilyevmiyeno', label: 'Tescil Yevmiye No' },
    { key: 'tesciltarih', label: 'Tescil Tarihi' },
    { key: 'olusanparselid', label: 'Oluşan Parsel ID' },
    { key: 'mukerrer_parsel_durum', label: 'Durum' },
    { key: 'mukerrer_parsel_onaydurum', label: 'Onay Durumu' }
  ];

  const columns = type === 'tha' ? thaColumns : mukerrerColumns;

  const isAllCurrentPageChecked = currentData.length > 0 && currentData.every((r, i) => {
    const rowKey = String(r.id || (currentPage - 1) * pageSize + i);
    return checkedRowIds.has(rowKey);
  });

  const handleSelectAllCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (onRowsCheck) {
      onRowsCheck(currentData, checked);
    } else {
      currentData.forEach(row => onRowCheck(row, checked));
    }
  };

  if (data.length === 0) {
    return (
      <div className="empty-state glass-panel">
        <p>Henüz veri yüklenmedi. Lütfen 'Veri Yükleme' sekmesinden veri yükleyin.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container glass-panel">
      <div className="table-header-controls">
        <div className="table-title">
          <h3>{type === 'tha' ? "Tescil Edilen THA'lar" : "Mükerrer Parseller"}</h3>
          <span className="badge">{data.length} Kayıt</span>
        </div>

        <div className="page-size-selector">
          <label>Kayıt Sayısı: </label>
          <select value={pageSize} onChange={handlePageSizeChange}>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="action-col">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageChecked}
                    onChange={handleSelectAllCurrentPage}
                    title="Sayfadaki tümünü seç"
                  />
                  <span>Harita</span>
                </div>
              </th>
              {columns.map(col => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, idx) => {
              // Priority for geometry: mukerrer_parsel_geom, tha_geom, geom
              const geomStr = row.mukerrer_parsel_geom || row.tha_geom || row.geom;
              const rowKey = String(row.id || idx);
              const isRowActive = checkedRowIds.has(rowKey);

              return (
                <tr
                  key={rowKey}
                  className={isRowActive ? 'active-row' : ''}
                  onClick={(e) => handleRowClick(e, row, idx)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="action-col" onClick={(e) => e.stopPropagation()}>
                    {geomStr ? (
                      <input
                        type="checkbox"
                        checked={isRowActive}
                        onChange={(e) => onRowCheck(row, e.target.checked)}
                        className="row-checkbox"
                      />
                    ) : (
                      <span className="no-geom">-</span>
                    )}
                  </td>
                  {columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination-info">
          Gösterilen: {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.length)} / Toplam: {data.length}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => goToPage(1)}><ChevronsLeft size={16} /></button>
            <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}><ChevronLeft size={16} /></button>
            <span className="page-indicator">Sayfa {currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}><ChevronRight size={16} /></button>
            <button disabled={currentPage === totalPages} onClick={() => goToPage(totalPages)}><ChevronsRight size={16} /></button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DataTable;
