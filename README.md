# Tescil Harici Alanlar (THA) Mükerrer Parsel Analizi

Bu proje, tescil harici alanlar (THA) ile mükerrer parsellerin coğrafi analizlerini yapmak, kesişim alanlarını (intersection) hesaplamak ve sonuçları harita üzerinde interaktif olarak görüntülemek amacıyla geliştirilmiştir.

<div align="center">
  <br/>
  <a href="https://erdemalpar.github.io/tha_mukerrerler/">
    <img src="https://img.shields.io/badge/🚀_Canlı_Demo-Görüntüle-2563eb?style=for-the-badge&logo=react" alt="Demo Butonu" />
  </a>
  <br/><br/>
</div>

## Özellikler

- **Katman (Layer) Kontrolü:** Tescilli THA, Mükerrer Parsel ve kesişim alanlarının harita üzerinden kolaylıkla açılıp kapatılabilmesi.
- **Kesişim Hesaplamaları:** Geometrik wkt verilerinden anlık kesişim (intersection) alanı hesaplanması ve harita üzerinde taralı (hatch) desenle belirginleştirilmesi.
- **İnteraktif Veri Tablosu:** Yüklenen verilerin listelenmesi, hızlı arama, filtreleme ve doğrudan haritadaki ilgili parsele odaklanma (zoom) imkanı.
- **Özelleştirilebilir Harita Görünümü:** Esnek (genişletilebilir) harita paneli ve farklı altlık harita seçenekleri (Google, Yandex, OSM).

## Geliştirme ve Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz:

```bash
# Repoyu klonlayın (veya indirin)
# Proje dizinine gidin ve bağımlılıkları yükleyin:
npm install

# Geliştirme (dev) sunucusunu başlatın:
npm run dev
```

> **Not:** Demo linki şu an temsilidir. Eğer bir GitHub Pages veya Vercel bağlantınız varsa, `README.md` dosyasındaki `href="#"` kısmını kendi URL'niz ile güncelleyebilirsiniz.
