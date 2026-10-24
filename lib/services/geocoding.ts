// lib/services/geocoding.ts
// Layanan pencarian tempat dan alamat di Surabaya

import { BUS_STOPS } from "@/lib/data/stops";

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: "station" | "mall" | "campus" | "landmark" | "stop" | "place";
}

// Tempat-tempat populer di Surabaya (instan offline cache)
export const POPULAR_SURABAYA_PLACES: SearchResult[] = [
  // Halte / Terminal / Transportasi
  {
    id: "pop-purabaya",
    name: "Terminal Purabaya (Bungurasih)",
    address: "Jl. Bungurasih Timur, Waru, Sidoarjo / Surabaya",
    lat: -7.3636,
    lng: 112.7318,
    category: "station",
  },
  {
    id: "pop-gubeng",
    name: "Stasiun Surabaya Gubeng",
    address: "Jl. Gubeng Masjid No.1, Tambaksari",
    lat: -7.2654,
    lng: 112.7521,
    category: "station",
  },
  {
    id: "pop-pasar-turi",
    name: "Stasiun Pasar Turi",
    address: "Jl. Semarang No.1, Gundih, Bubutan",
    lat: -7.2476,
    lng: 112.7314,
    category: "station",
  },
  {
    id: "pop-joyoboyo",
    name: "Terminal Intermoda Joyoboyo (TIJ)",
    address: "Jl. Joyoboyo No.1, Wonokromo",
    lat: -7.3187,
    lng: 112.7265,
    category: "station",
  },

  // Pusat Perbelanjaan / Mall
  {
    id: "pop-tp",
    name: "Tunjungan Plaza (TP)",
    address: "Jl. Jenderal Basuki Rachmat No.8-12, Tegalsari",
    lat: -7.2618,
    lng: 112.7388,
    category: "mall",
  },
  {
    id: "pop-pakuwon",
    name: "Pakuwon Mall (PTC)",
    address: "Jl. Mayjend. Jonosewojo No.2, Babatan, Wiyung",
    lat: -7.2891,
    lng: 112.6756,
    category: "mall",
  },
  {
    id: "pop-galaxy",
    name: "Galaxy Mall Surabaya",
    address: "Jl. Dharmahusada Indah Timur No.35-37",
    lat: -7.2731,
    lng: 112.7824,
    category: "mall",
  },
  {
    id: "pop-royal",
    name: "Royal Plaza Surabaya",
    address: "Jl. Ahmad Yani No.16-18, Wonokromo",
    lat: -7.3093,
    lng: 112.7345,
    category: "mall",
  },
  {
    id: "pop-grand-city",
    name: "Grand City Mall Surabaya",
    address: "Jl. Walikota Mustajab No.1, Ketabang",
    lat: -7.2628,
    lng: 112.7505,
    category: "mall",
  },
  {
    id: "pop-ciputra-world",
    name: "Ciputra World Surabaya",
    address: "Jl. Mayjen Sungkono No.89, Gunung Sari",
    lat: -7.2925,
    lng: 112.7186,
    category: "mall",
  },

  // Kampus / Universitas
  {
    id: "pop-its",
    name: "ITS (Institut Teknologi Sepuluh Nopember)",
    address: "Kampus ITS Sukolilo, Surabaya",
    lat: -7.2818,
    lng: 112.7954,
    category: "campus",
  },
  {
    id: "pop-unair-b",
    name: "Universitas Airlangga (UNAIR) Kampus B",
    address: "Jl. Dharmawangsa Dalam No.28",
    lat: -7.2718,
    lng: 112.7583,
    category: "campus",
  },
  {
    id: "pop-unair-c",
    name: "Universitas Airlangga (UNAIR) Kampus C",
    address: "Jl. Mulyorejo, Sukolilo",
    lat: -7.2709,
    lng: 112.7845,
    category: "campus",
  },
  {
    id: "pop-unesa",
    name: "UNESA Kampus Ketintang",
    address: "Jl. Ketintang, Gayungan",
    lat: -7.3117,
    lng: 112.7239,
    category: "campus",
  },
  {
    id: "pop-petra",
    name: "Universitas Kristen Petra (UK Petra)",
    address: "Jl. Siwalankerto No.121-131, Wonocolo",
    lat: -7.3385,
    lng: 112.7366,
    category: "campus",
  },

  // Landmark & Tempat Wisata
  {
    id: "pop-kbs",
    name: "Kebun Binatang Surabaya (KBS)",
    address: "Jl. Setail No.1, Darmo, Wonokromo",
    lat: -7.2965,
    lng: 112.7362,
    category: "landmark",
  },
  {
    id: "pop-tugu-pahlawan",
    name: "Tugu Pahlawan Surabaya",
    address: "Jl. Pahlawan, Alun-alun Contong, Bubutan",
    lat: -7.2458,
    lng: 112.7378,
    category: "landmark",
  },
  {
    id: "pop-alun-alun",
    name: "Alun-Alun Surabaya (Balai Pemuda)",
    address: "Jl. Gubernur Suryo No.15, Embong Kaliasin",
    lat: -7.2635,
    lng: 112.7445,
    category: "landmark",
  },
  {
    id: "pop-monkasel",
    name: "Monumen Kapal Selam (Monkasel)",
    address: "Jl. Pemuda No.39, Embong Kaliasin",
    lat: -7.2657,
    lng: 112.7503,
    category: "landmark",
  },
  {
    id: "pop-taman-bungkul",
    name: "Taman Bungkul",
    address: "Jl. Raya Darmo, Darmo, Wonokromo",
    lat: -7.2913,
    lng: 112.7397,
    category: "landmark",
  },
  {
    id: "pop-dr-soetomo",
    name: "RSUD Dr. Soetomo",
    address: "Jl. Mayjen Prof. Dr. Moestopo No.6-8",
    lat: -7.2687,
    lng: 112.7588,
    category: "landmark",
  },
  {
    id: "pop-perak",
    name: "Pelabuhan Tanjung Perak",
    address: "Jl. Perak Timur, Pabean Cantian",
    lat: -7.1950,
    lng: 112.7330,
    category: "station",
  },
  {
    id: "pop-romokalisari",
    name: "Romokalisari Adventure Land",
    address: "Jl. Romokalisari No.1, Benowo",
    lat: -7.1970,
    lng: 112.6465,
    category: "landmark",
  },
  {
    id: "pop-tow",
    name: "Terminal Tambak Osowilangun (TOW)",
    address: "Jl. Tambak Osowilangun, Benowo",
    lat: -7.2185,
    lng: 112.6515,
    category: "station",
  },
  {
    id: "pop-pens",
    name: "Politeknik Elektronika Negeri Surabaya (PENS)",
    address: "Jl. Raya ITS, Sukolilo",
    lat: -7.2760,
    lng: 112.7945,
    category: "campus",
  },
];

/**
 * Mencari lokasi berdasarkan teks.
 * Prioritas 1: Cocokkan dengan tempat populer lokal Surabaya
 * Prioritas 2: Cari via OpenStreetMap Nominatim API (dibatasi area Surabaya)
 */
export async function searchPlaces(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  // Filter dari data halte Master Data & tempat populer lokal
  const stopMatches: SearchResult[] = BUS_STOPS
    .filter((s) => s.name.toLowerCase().includes(q) || s.direction.toLowerCase().includes(q))
    .map((s) => ({
      id: `stop-${s.id}`,
      name: s.name,
      address: `${s.direction} • Rute: ${s.routes.join(", ")}`,
      lat: s.lat,
      lng: s.lng,
      category: "stop" as const,
    }));

  const localMatches = [
    ...stopMatches,
    ...POPULAR_SURABAYA_PLACES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    ),
  ];

  // Jika sudah cukup banyak kecocokan lokal, langsung return
  if (localMatches.length >= 4) {
    return localMatches.slice(0, 5);
  }

  // Cari tambahan via OpenStreetMap Nominatim API (area Surabaya & sekitarnya)
  try {
    const viewbox = "112.55,-7.15,112.88,-7.45"; // Bounding box Surabaya
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + " Surabaya"
    )}&format=json&viewbox=${viewbox}&bounded=0&countrycodes=id&limit=5&addressdetails=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "id,en",
        "User-Agent": "SuroboyoBusNavigator/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const onlineResults: SearchResult[] = data.map((item: any, idx: number) => ({
        id: `nom-${item.place_id || idx}`,
        name: item.name || item.display_name.split(",")[0],
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        category: "place" as const,
      }));

      // Gabungkan hasil lokal dan online tanpa duplikat koordinat dekat
      const combined = [...localMatches];
      for (const item of onlineResults) {
        const isDuplicate = combined.some(
          (c) =>
            Math.abs(c.lat - item.lat) < 0.001 &&
            Math.abs(c.lng - item.lng) < 0.001
        );
        if (!isDuplicate) {
          combined.push(item);
        }
      }
      return combined.slice(0, 6);
    }
  } catch {
    // Fallback jika offline/timeout
  }

  return localMatches.slice(0, 5);
}

/**
 * Reverse geocoding sederhana: mendapatkan nama tempat dari koordinat
 */
export function getNearestPlaceName(lat: number, lng: number): string {
  let nearest = POPULAR_SURABAYA_PLACES[0];
  let minDist = Infinity;

  for (const place of POPULAR_SURABAYA_PLACES) {
    const dLat = place.lat - lat;
    const dLng = place.lng - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = place;
    }
  }

  // Jika jarak sangat dekat (< 400m / dist < ~0.000015)
  if (minDist < 0.00002) {
    return `Dekat ${nearest.name}`;
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
