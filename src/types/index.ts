export interface ThaRecord {
  id?: string; // Generated internally
  ilad: string;
  ilcead: string;
  mahallead: string;
  adano: string | number;
  parselno: string | number;
  yuzolcum: string | number;
  kad_basvuruno: string;
  kad_basvurualinmatarihi: string;
  kad_fenkayitno: string;
  kad_fenkayittarih: string;
  tapu_tesciltarih: string;
  tapu_tescilyevmiyeno: string;
  geom: string;
}

export interface MukerrerRecord {
  id?: string; // Generated internally
  ilad: string;
  ilcead: string;
  mahallead: string;
  tha_ihdas_adano: string | number;
  tha_ihdas_parselno: string | number;
  mukerrer_adano: string | number;
  mukerrer_parselno: string | number;
  kesisen_alan_m2: string | number;
  kad_basvuruno: string;
  kad_basvuru_olusturmatarihi: string;
  kad_fenkayitno: string;
  kad_fenkayittarih: string;
  tescilyevmiyeno: string;
  tesciltarih: string;
  olusanparselid: string;
  tha_geom: string;
  mukerrer_parsel_durum: string;
  mukerrer_parsel_onaydurum: string;
  mukerrer_parsel_geom: string;
}

export type ViewTab = 'upload' | 'tha' | 'mukerrer';

export type MapBaseLayer = 'osm' | 'google_satellite' | 'google_hybrid' | 'yandex';
