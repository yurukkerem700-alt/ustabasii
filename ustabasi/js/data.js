// Demo modu verileri + ortak sabitler (Supabase bağlıyken kategoriler DB'den gelir)
export const ICONS = {
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  drop:'<path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z"/>',
  snow:'<path d="M12 2v20M4 6l16 12M20 6 4 18M9 3l3 2 3-2M9 21l3-2 3 2"/>',
  brush:'<path d="M18 3 9 12l3 3 9-9zM8 13c-3 0-4 2-4 4 0 2-1 3-2 4 4 1 8 0 8-4"/>',
  hammer:'<path d="m14 6 4 4M3 21l9-9M12 6l3-3 6 6-3 3z"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  spark:'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
  truck:'<path d="M2 6h12v10H2zM14 10h4l4 3v3h-8zM6 19a2 2 0 1 0 0-.01M18 19a2 2 0 1 0 0-.01"/>',
  window:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/>',
  wrench:'<path d="M14 6a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/>',
  play:'<path d="M8 5v14l11-7z" fill="currentColor"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6M16 5a3.5 3.5 0 0 1 0 7M18 14c2 .5 3.200 2.500 3.500 6"/>',
  star:'<path d="m12 3 2.700 5.600 6.200.9-4.500 4.300 1.100 6.100L12 17l-5.500 2.900 1.100-6.100L3.100 9.500l6.200-.9z"/>',
  heart:'<path d="M12 21s-8-5.500-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.500-8 11-8 11z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  check:'<path d="m5 12 5 5 9-10"/>'
};
export const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.wrench}</svg>`;

export const CITIES = ["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Gaziantep","Kocaeli","Samsun","Tokat","Trabzon","Eskişehir","Diyarbakır","Mersin","Kayseri","Denizli","Diğer"];

export const CATEGORIES = [
  {id:"elektrik",name:"Elektrik",icon:"bolt",description:"Arıza, tesisat yenileme, aydınlatma ve pano montajı.",sort:1},
  {id:"tesisat",name:"Su Tesisatı",icon:"drop",description:"Kaçak tespiti, tıkanıklık açma, batarya ve boru işleri.",sort:2},
  {id:"klima-kombi",name:"Klima & Kombi",icon:"snow",description:"Periyodik bakım, montaj ve arıza giderme.",sort:3},
  {id:"boya-badana",name:"Boya & Badana",icon:"brush",description:"İç/dış cephe boya, alçı ve dekoratif uygulamalar.",sort:4},
  {id:"marangoz",name:"Marangoz",icon:"hammer",description:"Dolap, kapı, mutfak ve özel ahşap işleri.",sort:5},
  {id:"cilingir",name:"Çilingir",icon:"key",description:"Kapı açma, kilit değişimi ve çelik kapı servisi.",sort:6},
  {id:"temizlik",name:"Temizlik",icon:"spark",description:"Ev, ofis ve inşaat sonrası detaylı temizlik.",sort:7},
  {id:"nakliyat",name:"Nakliyat",icon:"truck",description:"Evden eve ve ofis taşıma, asansörlü nakliyat.",sort:8},
  {id:"cam-dograma",name:"Cam & Doğrama",icon:"window",description:"PVC, alüminyum doğrama ve cam balkon işleri.",sort:9},
  {id:"tadilat",name:"Tadilat & Montaj",icon:"wrench",description:"Anahtar teslim tadilat, mobilya ve beyaz eşya montajı.",sort:10}
];

const uid = (n) => `demo-${n}`;
export const DEMO_USTALAR = [
  {id:uid(1),full_name:"Mehmet Yıldız",title:"Elektrik Ustası",category_id:"elektrik",city:"İstanbul",district:"Kadıköy",bio:"15 yıldır konut ve iş yeri elektrik tesisatı. Panolama, kaçak akım ve aydınlatma projeleri.",experience_years:15,hourly_rate:450,verified:true,rating_avg:4.9,rating_count:128},
  {id:uid(2),full_name:"Ayşe Demir",title:"Boya & Dekorasyon Ustası",category_id:"boya-badana",city:"Ankara",district:"Çankaya",bio:"Temiz işçilik, zamanında teslim. Alçı, saten ve dekoratif duvar kaplamaları.",experience_years:9,hourly_rate:380,verified:true,rating_avg:4.8,rating_count:76},
  {id:uid(3),full_name:"Hasan Kaya",title:"Tesisat Ustası",category_id:"tesisat",city:"İzmir",district:"Karşıyaka",bio:"Kaçak tespiti cihazlı, kırmadan müdahale. Kombi ve kalorifer tesisatı.",experience_years:12,hourly_rate:420,verified:true,rating_avg:4.7,rating_count:94},
  {id:uid(4),full_name:"Burak Şahin",title:"Klima & Kombi Teknisyeni",category_id:"klima-kombi",city:"Bursa",district:"Nilüfer",bio:"Tüm marka klima ve kombi bakım, gaz dolumu ve montaj. Yetkili servis tecrübesi.",experience_years:8,hourly_rate:400,verified:true,rating_avg:4.8,rating_count:61},
  {id:uid(5),full_name:"Kemal Arslan",title:"Marangoz",category_id:"marangoz",city:"Tokat",district:"Merkez",bio:"Ölçüye özel mutfak ve gardırop imalatı. Masif ve MDF uygulamalar.",experience_years:20,hourly_rate:500,verified:false,rating_avg:4.6,rating_count:33},
  {id:uid(6),full_name:"Selim Çelik",title:"Çilingir",category_id:"cilingir",city:"İstanbul",district:"Üsküdar",bio:"7/24 kapı açma, çelik kapı kilit sistemleri ve kasa servisi.",experience_years:11,hourly_rate:350,verified:true,rating_avg:4.7,rating_count:150},
  {id:uid(7),full_name:"Zeynep Öztürk",title:"Temizlik Uzmanı",category_id:"temizlik",city:"Antalya",district:"Muratpaşa",bio:"İnşaat sonrası ve taşınma temizliği, buharlı koltuk ve halı yıkama.",experience_years:6,hourly_rate:300,verified:true,rating_avg:4.9,rating_count:58},
  {id:uid(8),full_name:"Oğuz Tekin",title:"Nakliyat Ustabaşı",category_id:"nakliyat",city:"Kocaeli",district:"İzmit",bio:"Sigortalı evden eve nakliyat, paketleme ve asansörlü taşıma.",experience_years:14,hourly_rate:600,verified:true,rating_avg:4.5,rating_count:47},
  {id:uid(9),full_name:"Fatma Güneş",title:"Tadilat Ustası",category_id:"tadilat",city:"Konya",district:"Selçuklu",bio:"Banyo, mutfak ve komple daire tadilatı. Keşif ücretsiz.",experience_years:10,hourly_rate:480,verified:false,rating_avg:4.4,rating_count:21}
].map(u => ({status:"approved",created_at:"2026-01-15T10:00:00Z",demo:true,...u}));

export const DEMO_REVIEWS = [
  {id:"r1",usta_id:uid(1),rating:5,comment:"Panoyu baştan yaptı, çok temiz ve düzgün çalıştı. Kesinlikle tavsiye ederim.",author_name:"Murat K.",created_at:"2026-08-02T09:00:00Z"},
  {id:"r2",usta_id:uid(1),rating:5,comment:"Aynı gün geldi, arızayı 30 dakikada çözdü.",author_name:"Elif S.",created_at:"2026-07-11T09:00:00Z"},
  {id:"r3",usta_id:uid(3),rating:4,comment:"Kaçağı duvarı kırmadan buldu. Fiyat makuldü.",author_name:"Can T.",created_at:"2026-06-21T09:00:00Z"}
];

export const DEMO_GALLERY = [
  {id:"g1",title:"Villa Elektrik Yenileme",category_id:"elektrik",description:"3 katlı villada komple pano ve kablolama yenilemesi.",c1:"#19d3ff",c2:"#2f6bff",icon:"bolt",h:260},
  {id:"g2",title:"Salon Boya & Alçı",category_id:"boya-badana",description:"Saten boya ve dekoratif duvar uygulaması.",c1:"#8b5cf6",c2:"#2f6bff",icon:"brush",h:200},
  {id:"g3",title:"Banyo Tadilatı",category_id:"tadilat",description:"Anahtar teslim banyo yenileme, 6 günde teslim.",c1:"#2f6bff",c2:"#19d3ff",icon:"drop",h:300},
  {id:"g4",title:"Ölçüye Özel Mutfak",category_id:"marangoz",description:"Masif ceviz kapaklı mutfak dolapları.",c1:"#ff9f43",c2:"#8b5cf6",icon:"hammer",h:230},
  {id:"g5",title:"Klima Montajı",category_id:"klima-kombi",description:"Ofis katında 12 adet klima montajı.",c1:"#19d3ff",c2:"#8b5cf6",icon:"snow",h:210},
  {id:"g6",title:"Çelik Kapı Kilit Sistemi",category_id:"cilingir",description:"Çok noktalı kilit sistemi değişimi.",c1:"#2ee59d",c2:"#2f6bff",icon:"key",h:270}
];

export const DEMO_VIDEOS = [
  {id:"v1",title:"Elektrik panosu nasıl okunur?",description:"Evinizdeki sigorta panosunu tanıyın.",youtube_id:"",c1:"#19d3ff",c2:"#2f6bff"},
  {id:"v2",title:"Su kaçağını erken fark etmenin 5 yolu",description:"Faturanız artmadan önce önlem alın.",youtube_id:"",c1:"#2f6bff",c2:"#8b5cf6"},
  {id:"v3",title:"Klima bakımı kendi başınıza ne kadar yapılır?",description:"Filtre temizliği ve sezon öncesi kontrol listesi.",youtube_id:"",c1:"#8b5cf6",c2:"#19d3ff"}
];
