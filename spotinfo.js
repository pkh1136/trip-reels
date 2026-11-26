/* 명소 방문 정보: 영문 검색어(en) → "추천 시간대|머무는 시간(시간)|입장|메모"
   추천 시간대: 아침 · 오전 · 오후 · 저녁 · 야간 · 종일(당일치기)
   입장: 무료 · 유료 · 일부 유료 (정확한 요금·운영시간은 바뀌므로 카드의 '운영시간' 링크(Google 지도)로 확인)
   메모: 예약 필수 · 예약 권장 등 */
const SPOT_META = {
  // 도쿄
  "Sensō-ji Asakusa":"아침|1.5|무료|", "Shibuya Crossing":"저녁|1|무료|", "Meiji Shrine":"오전|1|무료|", "Tokyo Tower":"야간|1.5|유료|", "Shinjuku night":"야간|2|무료|", "Mount Fuji Kawaguchiko":"종일|8|무료|", "Kamakura Great Buddha":"종일|6|유료|",
  // 오사카
  "Dotonbori Osaka":"야간|2|무료|", "Osaka Castle":"오전|2|유료|", "Universal Studios Japan":"종일|9|유료|예약 권장", "Fushimi Inari-taisha":"아침|2|무료|", "Kinkaku-ji":"오전|1|유료|", "Kiyomizu-dera":"오후|1.5|유료|", "Nara Park deer":"종일|5|일부 유료|",
  // 후쿠오카
  "Nakasu yatai Fukuoka":"야간|1.5|무료|", "Canal City Hakata":"오후|2|무료|", "Fukuoka Tower":"저녁|1|유료|", "Dazaifu Tenman-gu":"종일|4|무료|", "Yufuin":"종일|5|무료|", "Beppu Jigoku":"종일|3|유료|",
  // 삿포로
  "Odori Park Sapporo":"오후|1|무료|", "Sapporo Clock Tower":"오전|0.5|유료|", "Susukino Sapporo":"야간|2|무료|", "Otaru Canal":"종일|5|무료|", "Blue Pond Biei":"종일|1|무료|", "Furano lavender":"종일|2|무료|7월 개화",
  // 오키나와
  "Kokusai Street Naha":"저녁|2|무료|", "Shuri Castle":"오전|1.5|일부 유료|복원 공사 중", "Okinawa Churaumi Aquarium":"종일|3|유료|", "Cape Manzamo":"종일|0.5|유료|", "Kouri Bridge":"종일|1|무료|",
  // 나고야
  "Nagoya Castle":"오전|2|유료|", "Osu shopping street Nagoya":"오후|2|무료|", "Ghibli Park":"오후|4|유료|예약 필수", "Shirakawa-go":"종일|3|무료|", "Takayama old town":"종일|2|무료|",
  // 파리
  "Eiffel Tower":"야간|2|유료|예약 권장", "Louvre Museum":"오전|3|유료|예약 필수", "Arc de Triomphe Champs-Élysées":"저녁|1.5|일부 유료|", "Montmartre Sacré-Cœur":"오후|2|무료|", "Palace of Versailles":"종일|5|유료|예약 필수", "Mont-Saint-Michel":"종일|4|일부 유료|",
  // 니스
  "Promenade des Anglais Nice":"저녁|1.5|무료|", "Vieux Nice old town":"오전|2|무료|", "Èze village":"종일|2|일부 유료|", "Monaco Monte Carlo":"종일|3|무료|", "Cannes Croisette":"종일|3|무료|",
  // 로마
  "Colosseum Rome":"아침|2|유료|예약 필수", "Trevi Fountain":"아침|0.5|무료|", "Pantheon Rome":"오전|0.5|유료|", "Roman Forum":"오전|1.5|유료|콜로세움 통합권", "St. Peter's Basilica Vatican":"아침|3|일부 유료|박물관 예약 필수", "Florence Cathedral":"종일|2|일부 유료|돔 예약 필수", "Amalfi Coast Positano":"종일|8|무료|",
  // 밀라노
  "Milan Cathedral":"오전|1.5|유료|", "Galleria Vittorio Emanuele II":"오후|1|무료|", "The Last Supper Santa Maria delle Grazie":"오후|0.5|유료|예약 필수", "Lake Como Bellagio":"종일|6|무료|", "Verona Arena":"종일|1|유료|",
  // 베네치아
  "Grand Canal Venice":"저녁|1|일부 유료|수상버스 유료", "Piazza San Marco":"아침|1.5|일부 유료|", "Rialto Bridge":"오전|0.5|무료|", "Burano":"종일|3|무료|", "Dolomites":"종일|8|무료|",
  // 런던
  "Big Ben Westminster":"오전|0.5|무료|", "Tower Bridge London":"저녁|1|일부 유료|", "Buckingham Palace guard":"오전|1|무료|교대식 날짜 확인", "London Eye":"저녁|1|유료|예약 권장", "British Museum":"오후|2.5|무료|", "Stonehenge":"종일|2|유료|예약 권장",
  // 에든버러
  "Edinburgh Castle":"오전|2|유료|예약 권장", "Royal Mile Edinburgh":"오후|1.5|무료|", "Arthur's Seat":"저녁|2|무료|", "Loch Ness":"종일|9|일부 유료|",
  // 바르셀로나
  "Sagrada Família":"오전|1.5|유료|예약 필수", "Park Güell":"아침|1.5|유료|예약 필수", "Casa Batlló":"오후|1|유료|예약 권장", "La Rambla Barcelona":"저녁|1.5|무료|", "Montserrat":"종일|5|일부 유료|",
  // 마드리드
  "Royal Palace of Madrid":"오전|1.5|유료|예약 권장", "Prado Museum":"오후|2.5|유료|저녁 무료 시간 있음", "Puerta del Sol":"저녁|1|무료|", "Toledo Spain":"종일|5|일부 유료|", "Aqueduct of Segovia":"종일|4|무료|",
  // 취리히·스위스
  "Zurich old town":"오후|2|무료|", "Rhine Falls":"종일|2|일부 유료|", "Chapel Bridge Lucerne":"종일|3|무료|", "Jungfraujoch":"종일|7|유료|날씨 확인", "Lauterbrunnen":"종일|2|무료|", "Matterhorn Zermatt":"종일|6|일부 유료|",
  // 제네바
  "Jet d'Eau Geneva":"오후|0.5|무료|", "Geneva old town":"오전|2|무료|", "Chillon Castle":"종일|1.5|유료|", "Lavaux vineyards":"종일|3|무료|",
  // 프라하
  "Charles Bridge Prague":"아침|1|무료|", "Prague Castle":"오전|2.5|유료|", "Prague astronomical clock":"오후|0.5|일부 유료|정각에 인형 시계", "Český Krumlov":"종일|5|일부 유료|", "Kutná Hora Sedlec Ossuary":"종일|3|유료|",
  // 아테네
  "Acropolis of Athens Parthenon":"아침|2.5|유료|예약 권장", "Plaka Athens":"저녁|1.5|무료|", "Temple of Poseidon Sounion":"종일|2|유료|일몰 추천", "Meteora":"종일|8|일부 유료|",
  // 산토리니
  "Oia Santorini":"저녁|2|무료|일몰 1시간 전 도착", "Fira Santorini":"오후|2|무료|", "Red Beach Santorini":"오전|1.5|무료|", "Santorini caldera boat":"오후|5|유료|예약 권장",
  // 이스탄불
  "Hagia Sophia":"아침|1|유료|", "Blue Mosque Istanbul":"오전|0.5|무료|기도 시간 입장 제한", "Grand Bazaar Istanbul":"오후|2|무료|일요일 휴무", "Bosphorus":"저녁|2|유료|", "Galata Tower":"저녁|1|유료|",
  // 카파도키아
  "Cappadocia hot air balloon":"아침|3|유료|예약 필수", "Göreme Open Air Museum":"오전|1.5|유료|", "Uçhisar Castle":"저녁|1|유료|", "Derinkuyu underground city":"오후|1.5|유료|",
  // 안탈리아
  "Kaleiçi Antalya":"저녁|2|무료|", "Düden Waterfalls":"오전|1|유료|", "Konyaaltı Beach":"오후|3|무료|", "Pamukkale":"종일|4|유료|",
  // 뉴욕
  "Times Square":"야간|1|무료|", "Statue of Liberty":"오전|3|유료|예약 권장", "Central Park":"오후|2|무료|", "Brooklyn Bridge":"아침|1|무료|", "Empire State Building":"야간|1.5|유료|예약 권장", "Niagara Falls":"종일|8|일부 유료|",
  // LA
  "Hollywood Sign":"오후|1|무료|", "Santa Monica Pier":"저녁|2|무료|", "Griffith Observatory":"야간|1.5|무료|", "Universal Studios Hollywood":"종일|9|유료|예약 권장", "Grand Canyon":"종일|10|유료|",
  // 샌프란시스코
  "Golden Gate Bridge":"오전|1.5|무료|", "Fisherman's Wharf":"오후|2|무료|", "Alcatraz Island":"오전|3|유료|예약 필수", "San Francisco cable car":"오후|1|유료|", "Yosemite Valley":"종일|10|유료|",
  // 라스베이거스
  "Las Vegas Strip":"야간|3|무료|", "Bellagio fountains":"야간|0.5|무료|", "Antelope Canyon":"종일|2|유료|가이드 투어 필수", "Hoover Dam":"종일|2|일부 유료|",
  // 시애틀
  "Space Needle":"저녁|1|유료|", "Pike Place Market":"오전|1.5|무료|", "Mount Rainier":"종일|8|유료|",
  // 하와이
  "Waikiki Beach":"오후|3|무료|", "Diamond Head":"아침|2|유료|예약 필수", "Hanauma Bay":"오전|3|유료|예약 필수", "North Shore Oahu":"종일|6|무료|",
  // 괌
  "Tumon Bay Guam":"오후|3|무료|", "Two Lovers Point Guam":"저녁|1|유료|", "Ritidian Point":"오전|3|무료|",
  // 밴쿠버
  "Stanley Park Vancouver":"오전|2.5|무료|", "Gastown Vancouver":"저녁|1|무료|", "Granville Island":"오후|2|무료|", "Capilano Suspension Bridge":"오후|2|유료|", "Whistler":"종일|8|일부 유료|",
  // 토론토
  "CN Tower":"저녁|1.5|유료|", "Distillery District Toronto":"오후|1.5|무료|", "Niagara Falls":"종일|8|일부 유료|",
  // 밴프
  "Moraine Lake":"아침|1.5|무료|셔틀 예약 필요", "Lake Louise":"오전|2|무료|", "Banff Avenue":"저녁|2|무료|", "Icefields Parkway":"종일|8|무료|국립공원 입장권",
  // 시드니
  "Sydney Opera House":"저녁|1.5|일부 유료|", "Sydney Harbour Bridge":"오후|1|일부 유료|", "Bondi Beach":"오전|3|무료|", "Blue Mountains Three Sisters":"종일|7|일부 유료|",
  // 멜버른
  "Hosier Lane Melbourne":"오후|0.5|무료|", "Flinders Street Station":"저녁|0.5|무료|", "Twelve Apostles Great Ocean Road":"종일|11|무료|", "Phillip Island penguin parade":"종일|6|유료|예약 권장",
  // 브리즈번
  "South Bank Brisbane":"오후|2|무료|", "Lone Pine Koala Sanctuary":"오전|2.5|유료|", "Surfers Paradise":"종일|5|무료|",
  // 케언즈
  "Great Barrier Reef":"종일|8|유료|투어 예약 필수", "Kuranda Scenic Railway":"종일|6|유료|예약 권장", "Daintree Rainforest":"종일|9|일부 유료|",
  // 방콕
  "Grand Palace Bangkok":"아침|2|유료|긴 옷 필수", "Wat Arun":"저녁|1|유료|", "Wat Pho":"오전|1|유료|", "Chatuchak Weekend Market":"오전|3|무료|주말만", "Ayutthaya":"종일|6|일부 유료|", "Damnoen Saduak Floating Market":"종일|4|일부 유료|아침 일찍",
  // 푸켓
  "Patong Beach":"오후|3|무료|", "Big Buddha Phuket":"오전|1|무료|", "Phuket Old Town":"저녁|2|무료|", "Phi Phi Islands":"종일|8|유료|투어 예약", "Phang Nga Bay James Bond Island":"종일|7|유료|투어 예약",
  // 치앙마이
  "Doi Suthep":"오전|2|유료|", "Wat Chedi Luang":"오후|1|유료|", "Chiang Mai Sunday Walking Street":"야간|2|무료|일요일만", "Wat Rong Khun Chiang Rai":"종일|9|유료|",
  // 다낭
  "My Khe Beach Da Nang":"아침|2|무료|", "Golden Bridge Ba Na Hills":"종일|6|유료|예약 권장", "Marble Mountains Da Nang":"오전|2|유료|", "Dragon Bridge Da Nang":"야간|1|무료|주말 21시 불쇼", "Hoi An ancient town":"종일|4|일부 유료|저녁 등불 추천",
  // 하노이
  "Hanoi Old Quarter":"저녁|2|무료|", "Hoan Kiem Lake":"아침|1|일부 유료|", "Hanoi Train Street":"오후|1|무료|기차 시간 확인", "Ha Long Bay":"종일|10|유료|크루즈 예약", "Trang An Ninh Binh":"종일|9|유료|",
  // 호치민
  "Ben Thanh Market":"오전|1.5|무료|", "Saigon Notre-Dame Cathedral Basilica":"오전|0.5|무료|보수 공사 확인", "Bui Vien Street":"야간|2|무료|", "Mekong Delta":"종일|9|유료|투어 예약", "Cu Chi tunnels":"종일|5|유료|",
  // 나트랑
  "Nha Trang beach":"오후|3|무료|", "VinWonders Nha Trang":"종일|7|유료|", "Po Nagar Cham Towers":"오전|1|유료|", "Hon Mun Island snorkeling":"오전|4|유료|투어 예약",
  // 푸꾸옥
  "Sao Beach Phu Quoc":"오전|3|무료|", "Hon Thom cable car":"오후|4|유료|", "Phu Quoc night market":"야간|1.5|무료|", "Sunset Town Phu Quoc":"저녁|2|무료|",
  // 타이베이
  "Taipei 101":"저녁|1.5|유료|", "Shilin Night Market":"야간|2|무료|", "Chiang Kai-shek Memorial Hall":"오전|1|무료|정각 위병 교대", "Jiufen":"종일|3|무료|저녁 홍등 추천", "Shifen sky lantern":"종일|1.5|일부 유료|", "Yehliu Geopark":"종일|1.5|유료|",
  // 가오슝
  "Pier-2 Art Center":"오후|2|무료|", "Lotus Pond Kaohsiung":"오전|1|무료|", "Cijin Island":"오후|3|무료|", "Kenting":"종일|8|무료|",
  // 싱가포르
  "Marina Bay Sands":"야간|1.5|일부 유료|", "Gardens by the Bay Supertree":"야간|2|일부 유료|19:45·20:45 빛 쇼", "Merlion Park":"저녁|0.5|무료|", "Sentosa Island":"종일|7|일부 유료|", "Chinatown Singapore":"오후|2|무료|",
  // 베이징
  "Forbidden City":"오전|3|유료|예약 필수 · 월요일 휴무", "Tiananmen Square":"아침|1|무료|여권 지참", "Summer Palace Beijing":"오후|3|유료|", "Temple of Heaven":"아침|1.5|유료|", "Great Wall of China Mutianyu":"종일|6|유료|",
  // 상하이
  "The Bund Shanghai":"야간|1.5|무료|", "Yu Garden Shanghai":"오전|1.5|유료|", "Oriental Pearl Tower":"저녁|1.5|유료|", "Zhujiajiao water town":"종일|4|일부 유료|",
  // 장가계
  "Zhangjiajie National Forest Park":"종일|8|유료|2~3일권", "Tianmen Mountain":"오전|5|유료|예약 필수", "Zhangjiajie Glass Bridge":"오후|2|유료|예약 필수", "Fenghuang ancient town":"종일|6|무료|",
  // 광저우
  "Canton Tower":"야간|1.5|유료|", "Shamian Island":"오후|1.5|무료|", "Pearl River Guangzhou night":"야간|1.5|유료|",
  // 발리
  "Tanah Lot":"저녁|2|유료|일몰 추천", "Uluwatu Temple":"저녁|2|유료|께짝 댄스 18시", "Tegallalang Rice Terraces":"아침|2|일부 유료|", "Ubud Monkey Forest":"오전|1.5|유료|소지품 주의", "Nusa Penida Kelingking":"종일|9|유료|투어 예약",
  // 자카르타
  "National Monument Jakarta":"오전|1.5|유료|", "Kota Tua Jakarta":"오후|2|일부 유료|", "Borobudur":"종일|10|유료|예약 필수",
  // 세부
  "Magellan's Cross":"오전|0.5|무료|", "Mactan island hopping":"오전|6|유료|투어 예약", "Oslob whale shark":"종일|8|유료|새벽 출발", "Kawasan Falls":"종일|4|유료|", "Moalboal sardine run":"종일|3|무료|",
  // 마닐라
  "Intramuros Manila":"오전|2.5|일부 유료|", "Rizal Park":"오후|1|무료|", "Manila Bay sunset":"저녁|1|무료|", "Taal Volcano":"종일|6|무료|",
  // 보라카이
  "White Beach Boracay":"저녁|3|무료|", "Puka Beach Boracay":"오전|2|무료|", "Willy's Rock Boracay":"아침|0.5|무료|", "Boracay island hopping":"오후|4|유료|투어 예약",
  // 보홀
  "Chocolate Hills Bohol":"오전|1|유료|", "Philippine tarsier Bohol":"오전|0.5|유료|", "Loboc River":"오후|1.5|유료|", "Balicasag Island":"아침|4|유료|투어 예약",
  // 카이로
  "Giza pyramid complex":"아침|3|유료|", "Great Sphinx of Giza":"오전|1|유료|피라미드 통합권", "Grand Egyptian Museum":"오후|3|유료|예약 권장", "Khan el-Khalili":"저녁|2|무료|", "Karnak Temple Luxor":"종일|3|유료|", "Abu Simbel":"종일|3|유료|",
  // 홍콩
  "Victoria Harbour Hong Kong skyline":"야간|1|무료|", "Symphony of Lights Hong Kong":"야간|0.5|무료|매일 20시", "Star Ferry Hong Kong":"저녁|0.5|유료|", "Victoria Peak Hong Kong":"저녁|2|유료|", "Tian Tan Buddha":"오전|4|일부 유료|", "Macau Ruins of St. Paul's":"종일|6|무료|",
  // 쿠알라룸푸르
  "Petronas Towers":"저녁|1.5|일부 유료|전망대 예약", "Batu Caves":"아침|1.5|무료|긴 옷 필수", "Merdeka Square":"오후|1|무료|", "Jalan Alor":"야간|1.5|무료|", "Malacca":"종일|6|무료|",
  // 코타키나발루
  "Tanjung Aru Beach":"저녁|1.5|무료|일몰 추천", "Tunku Abdul Rahman Park":"오전|5|유료|", "Klias fireflies":"종일|6|유료|투어 예약", "Mount Kinabalu":"종일|9|일부 유료|",
  // 페낭
  "George Town Penang street art":"오전|2.5|무료|", "Penang Hill":"저녁|2|유료|", "Kek Lok Si":"오후|1.5|일부 유료|", "Langkawi Sky Bridge":"종일|8|유료|",
  // 비엔티안
  "Pha That Luang":"오전|1|유료|", "Patuxai":"오후|0.5|유료|", "Buddha Park Vientiane":"오후|1.5|유료|", "Vang Vieng Blue Lagoon":"종일|8|유료|",
  // 루앙프라방
  "Kuang Si Falls":"오후|3|유료|", "Luang Prabang alms giving":"아침|1|무료|05:30 무렵", "Mount Phousi":"저녁|1|유료|일몰 추천", "Wat Xieng Thong":"오전|1|유료|",
  // 울란바토르
  "Ulaanbaatar":"오후|2|무료|", "Gandan Monastery":"오전|1|유료|", "Genghis Khan Equestrian Statue":"종일|1.5|유료|", "Gorkhi-Terelj National Park":"종일|6|일부 유료|", "Gobi Desert":"종일|10|유료|2박 이상 투어",
  // 델리·아그라·자이푸르
  "Red Fort Delhi":"오전|2|유료|월요일 휴무", "India Gate":"저녁|0.5|무료|", "Qutb Minar":"오후|1.5|유료|", "Humayun's Tomb":"오후|1.5|유료|", "Taj Mahal":"종일|3|유료|금요일 휴무", "Hawa Mahal Jaipur":"종일|1|유료|", "Amber Fort":"종일|2.5|유료|",
  // 뭄바이
  "Gateway of India":"저녁|0.5|무료|", "Marine Drive Mumbai":"저녁|1|무료|", "Chhatrapati Shivaji Terminus":"오전|0.5|무료|", "Elephanta Caves":"종일|5|유료|월요일 휴무",
  // 몰디브
  "Maldives beach":"오후|4|무료|", "Maldives coral reef":"오전|2|무료|", "whale shark Maldives":"오전|5|유료|투어 예약",
  // 두바이
  "Burj Khalifa":"저녁|2|유료|예약 권장", "Dubai Fountain":"야간|0.5|무료|18시 이후 30분마다", "Dubai Frame":"오후|1|유료|", "Palm Jumeirah":"오후|3|무료|", "Dubai desert safari":"저녁|6|유료|투어 예약", "Sheikh Zayed Grand Mosque":"종일|2|무료|예약·복장 규정",
  // 아부다비
  "Louvre Abu Dhabi":"오후|2.5|유료|", "Ferrari World Abu Dhabi":"종일|6|유료|", "Corniche Abu Dhabi":"저녁|1.5|무료|",
  // 프랑크푸르트
  "Römerberg Frankfurt":"오후|1|무료|", "Main river Frankfurt skyline":"저녁|1|무료|", "Heidelberg Castle":"종일|3|유료|", "Rhine Valley Lorelei":"종일|7|일부 유료|유람선 유료", "Cologne Cathedral":"종일|1.5|일부 유료|", "Rothenburg ob der Tauber":"종일|5|무료|",
  // 뮌헨
  "Marienplatz Munich":"오전|1|무료|11시 인형 시계", "Hofbräuhaus":"저녁|2|무료|", "Nymphenburg Palace":"오후|2|유료|", "Neuschwanstein Castle":"종일|8|유료|예약 필수",
  // 베를린
  "Brandenburg Gate":"저녁|0.5|무료|", "East Side Gallery Berlin Wall":"오후|1|무료|", "Museum Island Berlin":"오전|3|유료|", "Reichstag dome":"저녁|1|무료|예약 필수", "Sanssouci Palace Potsdam":"종일|5|유료|",
  // 빈
  "Schönbrunn Palace":"오전|3|유료|예약 권장", "St. Stephen's Cathedral Vienna":"오후|1|일부 유료|", "Belvedere Palace":"오후|2|유료|", "Wiener Riesenrad Prater":"저녁|1|유료|", "Hallstatt":"종일|7|무료|",
  // 잘츠부르크
  "Salzburg old town":"오후|2|무료|", "Mirabell Palace gardens":"오전|1|무료|", "Hohensalzburg Fortress":"오전|2|유료|",
  // 부다페스트
  "Hungarian Parliament Building":"야간|1|일부 유료|내부 투어 예약", "Fisherman's Bastion":"아침|1|일부 유료|", "Chain Bridge Budapest":"저녁|0.5|무료|", "Széchenyi thermal bath":"오후|3|유료|", "Szentendre":"종일|4|무료|",
  // 크로아티아
  "St. Mark's Church Zagreb":"오전|0.5|무료|", "Ban Jelačić Square":"저녁|1|무료|", "Plitvice Lakes":"종일|7|유료|예약 필수", "Walls of Dubrovnik":"아침|2|유료|", "Dubrovnik cable car":"저녁|1|유료|", "Lokrum":"오후|3|유료|", "Kotor Montenegro":"종일|8|일부 유료|", "Diocletian's Palace Split":"오전|1.5|일부 유료|", "Hvar":"종일|8|무료|", "Krka National Park":"종일|6|유료|", "Blue Cave Biševo":"종일|9|유료|투어 예약",
  // 암스테르담
  "Amsterdam canal cruise":"저녁|1|유료|", "Rijksmuseum":"오전|3|유료|예약 필수", "Zaanse Schans":"종일|3|일부 유료|", "Kinderdijk windmills":"종일|4|유료|", "Keukenhof":"종일|4|유료|3~5월만 · 예약 필수",
  // 리스본
  "Lisbon tram 28":"아침|1|유료|", "Belém Tower":"오전|1.5|유료|", "São Jorge Castle":"저녁|1.5|유료|", "Pena Palace Sintra":"종일|6|유료|예약 필수", "Cascais":"종일|3|무료|",
  // 포르투
  "Dom Luís I Bridge Porto":"저녁|1|무료|", "Livraria Lello":"아침|0.5|유료|예약 필수", "Ribeira Porto":"오후|2|무료|", "Douro Valley":"종일|9|유료|투어 예약",
  // 아이슬란드
  "Hallgrímskirkja":"오후|1|일부 유료|", "Blue Lagoon Iceland":"오후|3|유료|예약 필수", "Gullfoss":"종일|1|무료|", "Strokkur geyser":"종일|1|무료|", "Seljalandsfoss":"종일|1|무료|주차 유료", "Skógafoss":"종일|1|무료|", "Reynisfjara":"종일|1|무료|파도 주의", "Jökulsárlón":"종일|2|무료|",
  // 오슬로
  "Oslo Opera House":"저녁|1|무료|", "Vigeland Park":"오후|1.5|무료|", "Aker Brygge":"저녁|1.5|무료|", "Flåm Railway":"종일|8|유료|예약 권장",
  // 베르겐
  "Bryggen Bergen":"오전|1.5|무료|", "Mount Fløyen":"저녁|1.5|유료|", "Geirangerfjord":"종일|10|유료|", "Preikestolen":"종일|8|무료|왕복 4시간 하이킹",
  // 트롬쇠
  "Tromsø aurora":"야간|5|유료|투어 · 9~3월", "Arctic Cathedral Tromsø":"오후|0.5|유료|", "Tromsø dog sledding":"오전|4|유료|예약 필수", "Lofoten":"종일|10|무료|",
  // 오클랜드
  "Sky Tower Auckland":"저녁|1|유료|", "Waiheke Island":"종일|7|일부 유료|", "Hobbiton":"종일|8|유료|예약 필수", "Rotorua":"종일|8|일부 유료|", "Waitomo Glowworm Caves":"종일|6|유료|예약 권장",
  // 퀸스타운
  "Skyline Queenstown gondola":"저녁|2|유료|", "Kawarau Bridge Bungy":"오후|2|유료|예약 필수", "Milford Sound":"종일|12|유료|크루즈 예약", "That Wanaka Tree":"종일|3|무료|",
  // 크라이스트처치
  "Christchurch Botanic Gardens":"오후|1.5|무료|", "Lake Tekapo":"종일|4|무료|밤하늘 투어 추천", "Aoraki Mount Cook":"종일|6|무료|", "Kaikoura whale watching":"종일|7|유료|예약 필수",
  // 멕시코시티
  "Zócalo Mexico City":"오전|1.5|무료|", "Frida Kahlo Museum":"오후|1.5|유료|예약 필수 · 월요일 휴무", "Xochimilco":"오후|2|유료|주말이 활기", "Teotihuacan":"종일|5|유료|아침 일찍",
  // 칸쿤
  "Cancún beach":"오후|3|무료|", "Isla Mujeres":"종일|6|일부 유료|", "Chichen Itza":"종일|10|유료|", "Tulum ruins":"종일|3|유료|", "Cenote Yucatan":"종일|2|유료|",
  // 리마
  "Miraflores Lima":"저녁|2|무료|", "Historic Centre of Lima":"오전|2.5|무료|", "Huacachina":"종일|9|일부 유료|", "Nazca Lines":"종일|8|유료|경비행기 예약",
  // 쿠스코
  "Plaza de Armas Cusco":"저녁|1.5|무료|", "Sacsayhuamán":"오전|1.5|유료|", "Sacred Valley Peru":"종일|9|유료|", "Machu Picchu":"종일|10|유료|입장권 예약 필수", "Vinicunca Rainbow Mountain":"종일|12|유료|새벽 출발 · 고산 주의"
};

/* 명소 좌표 [위도, 경도] — 지도 핀과 이동시간(직선거리 기반 대략치) 계산용. Wikipedia 좌표를 가져와 도시에서 너무 먼 값은 직접 고침 */
const SPOT_GEO = {"Sensō-ji Asakusa":[35.71472,139.79675],"Shibuya Crossing":[35.6595,139.70056],"Meiji Shrine":[35.67611,139.69917],"Tokyo Tower":[35.65861,139.74556],"Shinjuku night":[35.69389,139.70472],"Mount Fuji Kawaguchiko":[35.49833,138.76861],"Kamakura Great Buddha":[35.31686,139.53572],"Dotonbori Osaka":[34.66871,135.50131],"Osaka Castle":[34.68722,135.52583],"Universal Studios Japan":[34.66472,135.43306],"Fushimi Inari-taisha":[34.96722,135.77278],"Kinkaku-ji":[35.0395,135.7285],"Kiyomizu-dera":[34.995,135.785],"Nara Park deer":[34.685,135.85],"Nakasu yatai Fukuoka":[33.59365,130.40529],"Canal City Hakata":[33.59111,130.41056],"Fukuoka Tower":[33.59325,130.35147],"Dazaifu Tenman-gu":[33.52139,130.535],"Yufuin":[33.26262,131.35509],"Beppu Jigoku":[33.28472,131.49139],"Odori Park Sapporo":[43.05972,141.34639],"Sapporo Clock Tower":[43.0626,141.35368],"Susukino Sapporo":[43.05528,141.35381],"Otaru Canal":[43.18333,141],"Blue Pond Biei":[43.49358,142.61403],"Furano lavender":[43.35,142.38333],"Kokusai Street Naha":[26.21222,127.67917],"Shuri Castle":[26.21703,127.71948],"Okinawa Churaumi Aquarium":[26.69439,127.87794],"Cape Manzamo":[26.47944,127.92778],"Kouri Bridge":[26.6889,127.9926],"Nagoya Castle":[35.18556,136.89861],"Osu shopping street Nagoya":[35.18333,136.9],"Ghibli Park":[35.1725,137.0898],"Shirakawa-go":[36.27094,136.89856],"Takayama old town":[36.14603,137.25217],"Eiffel Tower":[48.85822,2.2945],"Louvre Museum":[48.8611,2.3358],"Arc de Triomphe Champs-Élysées":[48.87378,2.29503],"Montmartre Sacré-Cœur":[48.88694,2.34111],"Palace of Versailles":[48.8047,2.1203],"Mont-Saint-Michel":[48.636,-1.511],"Promenade des Anglais Nice":[43.6936,7.2557],"Vieux Nice old town":[43.7034,7.2663],"Èze village":[43.7286,7.3617],"Monaco Monte Carlo":[43.73861,7.41917],"Cannes Croisette":[43.54917,7.02667],"Colosseum Rome":[41.8903,12.4922],"Trevi Fountain":[41.90083,12.48306],"Pantheon Rome":[41.8986,12.4768],"Roman Forum":[41.8922,12.4852],"St. Peter's Basilica Vatican":[41.90222,12.45333],"Florence Cathedral":[43.77306,11.25694],"Amalfi Coast Positano":[40.63333,14.48333],"Milan Cathedral":[45.46417,9.19139],"Galleria Vittorio Emanuele II":[45.46556,9.19],"The Last Supper Santa Maria delle Grazie":[45.46667,9.17083],"Lake Como Bellagio":[45.98333,9.25],"Verona Arena":[45.43889,10.99444],"Grand Canal Venice":[45.438,12.3358],"Piazza San Marco":[45.43389,12.33806],"Rialto Bridge":[45.438,12.336],"Burano":[45.486,12.417],"Dolomites":[46.43333,11.85],"Big Ben Westminster":[51.5007,-0.1245],"Tower Bridge London":[51.5056,-0.0753],"Buckingham Palace guard":[51.50083,-0.14194],"London Eye":[51.5033,-0.1194],"British Museum":[51.5194,-0.1269],"Stonehenge":[51.17889,-1.82611],"Edinburgh Castle":[55.94861,-3.20083],"Royal Mile Edinburgh":[55.95056,-3.18556],"Arthur's Seat":[55.94417,-3.16194],"Loch Ness":[57.3,-4.45],"Sagrada Família":[41.40369,2.17433],"Park Güell":[41.41361,2.15278],"Casa Batlló":[41.39158,2.16492],"La Rambla Barcelona":[41.3758,2.17776],"Montserrat":[41.5933,1.8375],"Royal Palace of Madrid":[40.41806,-3.71417],"Prado Museum":[40.4139,-3.6922],"Puerta del Sol":[40.41694,-3.70361],"Toledo Spain":[39.85667,-4.02444],"Aqueduct of Segovia":[40.9479,-4.1178],"Zurich old town":[47.37,8.542],"Rhine Falls":[47.67722,8.61583],"Chapel Bridge Lucerne":[47.05167,8.3075],"Jungfraujoch":[46.54722,7.98056],"Lauterbrunnen":[46.595,7.90745],"Matterhorn Zermatt":[45.97639,7.65861],"Jet d'Eau Geneva":[46.20722,6.15611],"Geneva old town":[46.201,6.148],"Chillon Castle":[46.41417,6.9275],"Lavaux vineyards":[46.49194,6.74611],"Charles Bridge Prague":[50.08639,14.41194],"Prague Castle":[50.09,14.4],"Prague astronomical clock":[50.08701,14.42092],"Český Krumlov":[48.81111,14.31528],"Kutná Hora Sedlec Ossuary":[49.96194,15.28833],"Acropolis of Athens Parthenon":[37.97167,23.72611],"Plaka Athens":[37.97222,23.73056],"Temple of Poseidon Sounion":[37.6502,24.02455],"Meteora":[39.71417,21.63111],"Oia Santorini":[36.46667,25.36667],"Fira Santorini":[36.42,25.43167],"Red Beach Santorini":[36.34732,25.39459],"Santorini caldera boat":[36.415,25.4325],"Hagia Sophia":[41.00833,28.98],"Blue Mosque Istanbul":[41.00539,28.97682],"Grand Bazaar Istanbul":[41.01058,28.96793],"Bosphorus":[41.11944,29.07528],"Galata Tower":[41.02278,28.975],"Cappadocia hot air balloon":[38.6431,34.8289],"Göreme Open Air Museum":[38.64306,34.82889],"Uçhisar Castle":[38.62889,34.80333],"Derinkuyu underground city":[38.3735,34.7351],"Kaleiçi Antalya":[36.88694,30.70333],"Düden Waterfalls":[36.8486,30.7806],"Konyaaltı Beach":[36.83889,30.48111],"Pamukkale":[37.92389,29.12333],"Times Square":[40.7575,-73.9858],"Statue of Liberty":[40.68917,-74.04444],"Central Park":[40.78222,-73.96528],"Brooklyn Bridge":[40.7057,-73.9964],"Empire State Building":[40.7483,-73.9856],"Niagara Falls":[43.0799,-79.0747],"Hollywood Sign":[34.13406,-118.32159],"Santa Monica Pier":[34.00861,-118.49861],"Griffith Observatory":[34.11833,-118.30033],"Universal Studios Hollywood":[34.13652,-118.35605],"Grand Canyon":[36.3,-112.75],"Golden Gate Bridge":[37.81972,-122.47861],"Fisherman's Wharf":[37.80833,-122.41556],"Alcatraz Island":[37.82667,-122.42278],"San Francisco cable car":[37.79467,-122.4114],"Yosemite Valley":[37.72167,-119.64639],"Las Vegas Strip":[36.10995,-115.16217],"Bellagio fountains":[36.1129,-115.17387],"Antelope Canyon":[36.86196,-111.37434],"Hoover Dam":[36.01556,-114.73778],"Space Needle":[47.6204,-122.3491],"Pike Place Market":[47.60944,-122.34167],"Mount Rainier":[46.8517,-121.7603],"Waikiki Beach":[21.2752,-157.8312],"Diamond Head":[21.26194,-157.80556],"Hanauma Bay":[21.27139,-157.69444],"North Shore Oahu":[21.6197,-158.0856],"Tumon Bay Guam":[13.5173,144.8074],"Two Lovers Point Guam":[13.53499,144.80245],"Ritidian Point":[13.65056,144.86056],"Stanley Park Vancouver":[49.3,-123.14],"Gastown Vancouver":[49.28469,-123.11095],"Granville Island":[49.27083,-123.13417],"Capilano Suspension Bridge":[49.34287,-123.11513],"Whistler":[50.11667,-122.95417],"CN Tower":[43.64256,-79.38708],"Distillery District Toronto":[43.6503,-79.3596],"Moraine Lake":[51.3225,-116.18556],"Lake Louise":[51.41167,-116.22806],"Banff Avenue":[51.17778,-115.57361],"Icefields Parkway":[51.5,-116],"Sydney Opera House":[-33.85681,151.21514],"Sydney Harbour Bridge":[-33.85222,151.21056],"Bondi Beach":[-33.89111,151.27417],"Blue Mountains Three Sisters":[-33.62,150.46],"Hosier Lane Melbourne":[-37.8164,144.9692],"Flinders Street Station":[-37.81808,144.96681],"Twelve Apostles Great Ocean Road":[-38.73383,143.68727],"Phillip Island penguin parade":[-38.48333,145.23333],"South Bank Brisbane":[-27.4787,153.0229],"Lone Pine Koala Sanctuary":[-27.53293,152.9693],"Surfers Paradise":[-28,153.4166],"Great Barrier Reef":[-16.4,145.8],"Kuranda Scenic Railway":[-16.8849,145.70194],"Daintree Rainforest":[-16.2,145.4],"Grand Palace Bangkok":[13.7501,100.492],"Wat Arun":[13.74361,100.48889],"Wat Pho":[13.74639,100.49361],"Chatuchak Weekend Market":[13.80083,100.55139],"Ayutthaya":[14.34778,100.56056],"Damnoen Saduak Floating Market":[13.5193,99.9592],"Patong Beach":[7.89306,98.29833],"Big Buddha Phuket":[7.8276,98.31285],"Phuket Old Town":[7.88571,98.38756],"Phi Phi Islands":[7.73333,98.76667],"Phang Nga Bay James Bond Island":[8.28333,98.6],"Doi Suthep":[18.81278,98.89361],"Wat Chedi Luang":[18.78694,98.98639],"Chiang Mai Sunday Walking Street":[18.79528,98.99861],"Wat Rong Khun Chiang Rai":[19.82467,99.76333],"My Khe Beach Da Nang":[16.06944,108.20972],"Golden Bridge Ba Na Hills":[15.99556,107.99417],"Marble Mountains Da Nang":[16.02594,108.25347],"Dragon Bridge Da Nang":[16.06111,108.22667],"Hoi An ancient town":[15.87972,108.33194],"Hanoi Old Quarter":[21.0345,105.8505],"Hoan Kiem Lake":[21.02889,105.8525],"Hanoi Train Street":[21.0283,105.8436],"Ha Long Bay":[20.9,107.2],"Trang An Ninh Binh":[20.25,105.83333],"Ben Thanh Market":[10.77252,106.69802],"Saigon Notre-Dame Cathedral Basilica":[10.77972,106.69917],"Bui Vien Street":[10.76742,106.69398],"Mekong Delta":[10.04,105.8],"Cu Chi tunnels":[11.06083,106.52861],"Nha Trang beach":[12.245,109.19167],"VinWonders Nha Trang":[12.2186,109.2421],"Po Nagar Cham Towers":[12.26528,109.19556],"Hon Mun Island snorkeling":[12.1667,109.3],"Sao Beach Phu Quoc":[10.0567,104.0362],"Hon Thom cable car":[10.0287,104.0081],"Phu Quoc night market":[10.21556,103.95806],"Sunset Town Phu Quoc":[10.0167,104.015],"Taipei 101":[25.0336,121.5647],"Shilin Night Market":[25.0866,121.5254],"Chiang Kai-shek Memorial Hall":[25.03444,121.52167],"Jiufen":[25.107,121.843],"Shifen sky lantern":[25.04097,121.77506],"Yehliu Geopark":[25.2131,121.698],"Pier-2 Art Center":[22.61989,120.28172],"Lotus Pond Kaohsiung":[22.68506,120.2974],"Cijin Island":[22.56167,120.307],"Kenting":[21.98,120.797],"Marina Bay Sands":[1.2825,103.86],"Gardens by the Bay Supertree":[1.28472,103.865],"Merlion Park":[1.28683,103.85453],"Sentosa Island":[1.248,103.83],"Chinatown Singapore":[1.28361,103.84417],"Forbidden City":[39.91583,116.39083],"Tiananmen Square":[39.90333,116.39167],"Summer Palace Beijing":[39.9975,116.2689],"Temple of Heaven":[39.8822,116.4066],"Great Wall of China Mutianyu":[40.43802,116.5619],"The Bund Shanghai":[31.23803,121.48614],"Yu Garden Shanghai":[31.22917,121.4875],"Oriental Pearl Tower":[31.24167,121.49472],"Zhujiajiao water town":[31.11278,121.05028],"Zhangjiajie National Forest Park":[29.34992,110.43515],"Tianmen Mountain":[29.04988,110.47889],"Zhangjiajie Glass Bridge":[29.3987,110.6982],"Fenghuang ancient town":[27.949,109.604],"Canton Tower":[23.10889,113.31889],"Shamian Island":[23.10944,113.23944],"Pearl River Guangzhou night":[23.13,113.26],"Tanah Lot":[-8.62107,115.08716],"Uluwatu Temple":[-8.82889,115.08528],"Tegallalang Rice Terraces":[-8.43333,115.28333],"Ubud Monkey Forest":[-8.51882,115.25838],"Nusa Penida Kelingking":[-8.73333,115.53333],"National Monument Jakarta":[-6.17539,106.82714],"Kota Tua Jakarta":[-6.135,106.81306],"Borobudur":[-7.608,110.204],"Magellan's Cross":[10.29354,123.90195],"Mactan island hopping":[10.20278,124.01972],"Oslob whale shark":[9.55,123.4],"Kawasan Falls":[9.8,123.36667],"Moalboal sardine run":[9.95,123.4],"Intramuros Manila":[14.59147,120.97356],"Rizal Park":[14.5825,120.97833],"Manila Bay sunset":[14.53472,120.97972],"Taal Volcano":[14.01,120.9975],"White Beach Boracay":[11.96889,121.92389],"Puka Beach Boracay":[11.9942,121.9161],"Willy's Rock Boracay":[11.97,121.9238],"Boracay island hopping":[11.96889,121.92389],"Chocolate Hills Bohol":[9.91667,124.16667],"Philippine tarsier Bohol":[9.9,124.2],"Loboc River":[9.63,124.03],"Balicasag Island":[9.517,123.685],"Giza pyramid complex":[29.97611,31.13278],"Great Sphinx of Giza":[29.97526,31.13758],"Grand Egyptian Museum":[29.995,31.1193],"Khan el-Khalili":[30.0475,31.26222],"Karnak Temple Luxor":[25.7,32.63917],"Abu Simbel":[22.33694,31.62556],"Victoria Harbour Hong Kong skyline":[22.29,114.17],"Symphony of Lights Hong Kong":[22.28775,114.17362],"Star Ferry Hong Kong":[22.294,114.16857],"Victoria Peak Hong Kong":[22.27556,114.14389],"Tian Tan Buddha":[22.25411,113.90514],"Macau Ruins of St. Paul's":[22.1975,113.54056],"Petronas Towers":[3.1578,101.7117],"Batu Caves":[3.2374,101.6839],"Merdeka Square":[3.1478,101.6935],"Jalan Alor":[3.14668,101.71119],"Malacca":[2.2,102.25],"Tanjung Aru Beach":[5.94556,116.05028],"Tunku Abdul Rahman Park":[5.96667,116],"Klias fireflies":[5.29,115.66],"Mount Kinabalu":[6.075,116.55861],"George Town Penang street art":[5.41827,100.34314],"Penang Hill":[5.42444,100.26892],"Kek Lok Si":[5.39952,100.27373],"Langkawi Sky Bridge":[6.35,99.8],"Pha That Luang":[17.97617,102.63425],"Patuxai":[17.97056,102.61861],"Buddha Park Vientiane":[17.91229,102.7654],"Vang Vieng Blue Lagoon":[18.92667,102.44944],"Kuang Si Falls":[19.74917,101.99167],"Luang Prabang alms giving":[19.89,102.13472],"Mount Phousi":[19.89028,102.13694],"Wat Xieng Thong":[19.8975,102.14306],"Ulaanbaatar":[47.92194,106.91528],"Gandan Monastery":[47.92306,106.895],"Genghis Khan Equestrian Statue":[47.80806,107.52975],"Gorkhi-Terelj National Park":[48.1502,107.57601],"Gobi Desert":[42.59,103.43],"Red Fort Delhi":[28.65583,77.24083],"India Gate":[28.61286,77.22931],"Qutb Minar":[28.52435,77.18525],"Humayun's Tomb":[28.59328,77.25069],"Taj Mahal":[27.175,78.0419],"Hawa Mahal Jaipur":[26.9239,75.8267],"Amber Fort":[26.9859,75.8507],"Gateway of India":[18.92198,72.83466],"Marine Drive Mumbai":[18.944,72.823],"Chhatrapati Shivaji Terminus":[18.93985,72.83544],"Elephanta Caves":[18.96333,72.93139],"Maldives beach":[4.18,73.51],"Maldives coral reef":[4.3,73.55],"whale shark Maldives":[3.55,72.85],"Burj Khalifa":[25.1972,55.2742],"Dubai Fountain":[25.19518,55.27506],"Dubai Frame":[25.23548,55.30034],"Palm Jumeirah":[25.11806,55.13333],"Dubai desert safari":[25.1775,55.4494],"Sheikh Zayed Grand Mosque":[24.412,54.474],"Louvre Abu Dhabi":[24.533,54.40001],"Ferrari World Abu Dhabi":[24.4838,54.607],"Corniche Abu Dhabi":[24.46667,54.36667],"Römerberg Frankfurt":[50.11028,8.68222],"Main river Frankfurt skyline":[50.107,8.68],"Heidelberg Castle":[49.41667,8.71667],"Rhine Valley Lorelei":[50.13944,7.72889],"Cologne Cathedral":[50.94139,6.95833],"Rothenburg ob der Tauber":[49.38333,10.18333],"Marienplatz Munich":[48.1373,11.5755],"Hofbräuhaus":[48.1376,11.5797],"Nymphenburg Palace":[48.15806,11.50361],"Neuschwanstein Castle":[47.5575,10.74944],"Brandenburg Gate":[52.5163,13.3777],"East Side Gallery Berlin Wall":[52.50444,13.44111],"Museum Island Berlin":[52.52139,13.39556],"Reichstag dome":[52.51861,13.37611],"Sanssouci Palace Potsdam":[52.40326,13.03863],"Schönbrunn Palace":[48.18452,16.31187],"St. Stephen's Cathedral Vienna":[48.2085,16.373],"Belvedere Palace":[48.19417,16.38028],"Wiener Riesenrad Prater":[48.21665,16.39595],"Hallstatt":[47.562,13.649],"Salzburg old town":[47.8,13.045],"Mirabell Palace gardens":[47.80556,13.04194],"Hohensalzburg Fortress":[47.795,13.04722],"Hungarian Parliament Building":[47.50694,19.04556],"Fisherman's Bastion":[47.5027,19.0344],"Chain Bridge Budapest":[47.49889,19.04361],"Széchenyi thermal bath":[47.51861,19.08194],"Szentendre":[47.7044,19.06858],"St. Mark's Church Zagreb":[45.81639,15.97389],"Ban Jelačić Square":[45.81306,15.97722],"Plitvice Lakes":[44.88056,15.61611],"Walls of Dubrovnik":[42.64028,18.10833],"Dubrovnik cable car":[42.6415,18.1135],"Lokrum":[42.63333,18.11667],"Kotor Montenegro":[42.43,18.77],"Diocletian's Palace Split":[43.50833,16.44],"Hvar":[43.17,16.44],"Krka National Park":[43.80194,15.97278],"Blue Cave Biševo":[42.98,16.03],"Amsterdam canal cruise":[52.37278,4.89361],"Rijksmuseum":[52.36,4.8853],"Zaanse Schans":[52.47389,4.81639],"Kinderdijk windmills":[51.8825,4.64944],"Keukenhof":[52.27126,4.54636],"Lisbon tram 28":[38.72528,-9.15],"Belém Tower":[38.69167,-9.21611],"São Jorge Castle":[38.71389,-9.13361],"Pena Palace Sintra":[38.78778,-9.39056],"Cascais":[38.7,-9.41667],"Dom Luís I Bridge Porto":[41.13986,-8.60934],"Livraria Lello":[41.14694,-8.61472],"Ribeira Porto":[41.1407,-8.613],"Douro Valley":[41.16,-7.79],"Hallgrímskirkja":[64.1417,-21.9266],"Blue Lagoon Iceland":[63.8799,-22.4481],"Gullfoss":[64.32611,-20.12111],"Strokkur geyser":[64.31306,-20.30056],"Seljalandsfoss":[63.61583,-19.99278],"Skógafoss":[63.53211,-19.51114],"Reynisfjara":[63.4035,-19.0474],"Jökulsárlón":[64.07028,-16.21167],"Oslo Opera House":[59.90694,10.75361],"Vigeland Park":[59.92667,10.70139],"Aker Brygge":[59.90972,10.72667],"Flåm Railway":[60.77,7.1],"Bryggen Bergen":[60.39722,5.32306],"Mount Fløyen":[60.38944,5.33],"Geirangerfjord":[62.121,7.129],"Preikestolen":[58.98666,6.18748],"Tromsø aurora":[69.6517,18.9556],"Arctic Cathedral Tromsø":[69.6482,18.9871],"Tromsø dog sledding":[69.65,18.96],"Lofoten":[68.33333,14.66667],"Sky Tower Auckland":[-36.84847,174.76231],"Waiheke Island":[-36.80833,175.08528],"Hobbiton":[-37.8575,175.67972],"Rotorua":[-38.13778,176.25139],"Waitomo Glowworm Caves":[-38.2608,175.1036],"Skyline Queenstown gondola":[-45.0312,168.6563],"Kawarau Bridge Bungy":[-45.0101,168.8977],"Milford Sound":[-44.64806,167.90556],"That Wanaka Tree":[-44.6983,169.1175],"Christchurch Botanic Gardens":[-43.53,172.62],"Lake Tekapo":[-43.88333,170.51667],"Aoraki Mount Cook":[-43.595,170.14194],"Kaikoura whale watching":[-42.4,173.68],"Zócalo Mexico City":[19.43278,-99.13306],"Frida Kahlo Museum":[19.35514,-99.16253],"Xochimilco":[19.285,-99.102],"Teotihuacan":[19.6925,-98.84389],"Cancún beach":[21.13,-86.75],"Isla Mujeres":[21.23333,-86.73333],"Chichen Itza":[20.68306,-88.56861],"Tulum ruins":[20.21472,-87.42889],"Cenote Yucatan":[20.6612,-88.5512],"Miraflores Lima":[-12.1175,-77.04306],"Historic Centre of Lima":[-12.05139,-77.04306],"Huacachina":[-14.0875,-75.76333],"Nazca Lines":[-14.6975,-75.135],"Plaza de Armas Cusco":[-13.5163,-71.9781],"Sacsayhuamán":[-13.50778,-71.98222],"Sacred Valley Peru":[-13.33333,-72.08333],"Machu Picchu":[-13.16333,-72.54556],"Vinicunca Rainbow Mountain":[-13.87023,-71.30295]};

/* 도시(공항)별 먹거리: "food" = 대표 음식|설명;…  "street" = 먹자 거리|설명|지도 검색어;… */
const CITY_FOOD = {
  HND:{food:"스시|츠키지 장외시장의 아침 스시;라멘|신주쿠·이케부쿠로 라멘 골목;몬자야키|츠키시마의 도쿄식 철판 요리;텐동|아사쿠사 노포의 튀김덮밥", street:"츠키지 장외시장|해산물 아침 식사|Tsukiji Outer Market;오모이데요코초|신주쿠 꼬치구이 골목|Omoide Yokocho;아메요코|우에노 시장 먹거리|Ameyoko"},
  KIX:{food:"타코야키|도톤보리 명물 문어 풀빵;오코노미야키|오사카식 철판 부침;쿠시카츠|신세카이 꼬치 튀김;교토 유도후|교토 사찰 두부 요리", street:"도톤보리|간판 아래 먹자골목|Dotonbori food;구로몬 시장|'오사카의 부엌' 해산물 시장|Kuromon Market;신세카이|쿠시카츠 거리|Shinsekai Osaka"},
  FUK:{food:"하카타 돈코츠 라멘|진한 돼지뼈 국물;모츠나베|곱창 전골;멘타이코|명란젓 정식;미즈타키|닭 백숙 전골", street:"나카스 야타이|강변 포장마차|Nakasu yatai;텐진 야타이|번화가 포장마차|Tenjin yatai;야나기바시 시장|해산물 시장|Yanagibashi Rengo Market"},
  CTS:{food:"수프 카레|홋카이도식 채소 카레;미소 라멘|삿포로 라멘의 원조;징기스칸|양고기 철판구이;카이센동|게·성게 해산물 덮밥", street:"라멘 요코초|스스키노 라멘 골목|Ganso Ramen Yokocho;니조 시장|해산물 아침 덮밥|Nijo Market Sapporo;오타루 스시 거리|스시 가게 밀집|Otaru sushi street"},
  OKA:{food:"오키나와 소바|가다랑어 국물 면;고야 찬푸루|여주 볶음;라후테|돼지 삼겹 조림;타코라이스|오키나와식 타코 덮밥", street:"국제거리|기념품과 식당|Kokusai Street;마키시 공설시장|생선을 골라 2층에서 조리|Makishi Public Market;아메리칸 빌리지|해변 레스토랑|American Village Chatan"},
  NGO:{food:"히쓰마부시|장어덮밥 세 가지 방식;미소카츠|된장 소스 돈가스;테바사키|매콤 닭날개;키시멘|넓적한 우동", street:"오스 상점가|길거리 음식 골목|Osu shopping street;사카에|번화가 맛집|Sakae Nagoya restaurants"},
  CDG:{food:"크루아상·바게트|동네 불랑제리;에스카르고|버터 마늘 달팽이 요리;스테이크 프리트|비스트로 정식;마카롱|라뒤레·피에르 에르메", street:"마레 지구|팔라펠과 비스트로|Le Marais restaurants;생제르맹|카페 드 플로르 등 노천 카페|Saint-Germain cafe;몽마르트르|언덕 위 비스트로|Montmartre restaurants"},
  NCE:{food:"소카|병아리콩 전병;살라드 니수아즈|니스식 샐러드;피살라디에르|양파 타르트;부야베스|지중해 생선 스튜", street:"살레야 시장|꽃·먹거리 시장|Cours Saleya;니스 구시가|소카 노점|Vieux Nice food"},
  FCO:{food:"카르보나라|로마식 계란 파스타;카초 에 페페|치즈 후추 파스타;피자 알 탈리오|조각 피자;젤라토|트레비 근처 젤라테리아", street:"트라스테베레|골목 트라토리아|Trastevere restaurants;캄포 데 피오리|시장과 와인 바|Campo de' Fiori;테스타초 시장|로마 서민 음식|Testaccio Market"},
  MXP:{food:"밀라노식 리조또|사프란 리조또;코톨레타|밀라노식 돈가스;파네토네|크리스마스 빵;아페리티보|저녁 전 칵테일과 안주", street:"나빌리 운하|아페리티보 거리|Navigli Milan;브레라|감성 레스토랑 골목|Brera restaurants"},
  VCE:{food:"치케티|베네치아식 타파스;오징어 먹물 파스타|네로 디 세피아;프리토 미스토|해산물 튀김;스프리츠|오렌지빛 식전주", street:"리알토 시장 주변|바카로(선술집) 골목|Rialto bacaro;칸나레조|현지인 식당가|Cannaregio restaurants"},
  LHR:{food:"피시 앤 칩스|대구 튀김과 감자;애프터눈 티|스콘과 홍차;선데이 로스트|일요일 구이 요리;잉글리시 브렉퍼스트|든든한 아침", street:"버로우 마켓|런던 대표 식품 시장|Borough Market;코벤트 가든|레스토랑 밀집|Covent Garden restaurants;브릭 레인|커리와 베이글|Brick Lane"},
  EDI:{food:"해기스|스코틀랜드 전통 순대;스카치 위스키|증류소 투어;컬렌 스킨크|훈제 생선 수프;쇼트브레드|버터 쿠키", street:"그래스마켓|펍 거리|Grassmarket pubs;로열 마일|전통 펍|Royal Mile pubs"},
  BCN:{food:"빠에야|해산물 쌀요리;타파스|작은 접시 요리 바;하몬|스페인 생햄;추로스 콘 초콜라테|진한 초콜릿 찍먹", street:"보케리아 시장|람블라스의 대표 시장|La Boqueria;엘 보른|타파스 바 골목|El Born tapas;바르셀로네타|해변 해산물|Barceloneta seafood"},
  MAD:{food:"보카디요 데 칼라마레스|오징어 튀김 샌드위치;코시도 마드릴레뇨|병아리콩 스튜;추로스|산 히네스 초콜라테리아;하몬 타파스|이베리코 생햄", street:"산 미겔 시장|타파스 미식 시장|Mercado de San Miguel;라 라티나|주말 타파스 거리|La Latina tapas"},
  ZRH:{food:"치즈 퐁듀|녹인 치즈에 빵 찍기;라클렛|녹인 치즈와 감자;뢰스티|스위스식 감자전;취르허 게슈네첼테스|송아지 크림 요리", street:"니더도르프|구시가 식당 골목|Niederdorf Zurich restaurants;취리히 중앙역|푸드코트·마트|Zurich HB food"},
  GVA:{food:"치즈 퐁듀|스위스 대표 요리;페르슈 필레|호수 농어 튀김;스위스 초콜릿|쇼콜라티에 투어;라클렛|녹인 치즈 요리", street:"카루주|이탈리아풍 골목 식당|Carouge restaurants;구시가 부르 드 푸르 광장|노천 카페|Place du Bourg-de-Four"},
  PRG:{food:"꼴레뇨|체코식 족발;굴라쉬|빵에 담은 스튜;뜨르들로|굴뚝빵;필스너 맥주|맥주의 본고장", street:"구시가 광장 주변|전통 레스토랑|Old Town Square restaurants;말라 스트라나|분위기 있는 맥주집|Mala Strana pub"},
  ATH:{food:"수블라키·기로스|꼬치·피타 랩;무사카|가지 그라탱;그릭 샐러드|페타 치즈 샐러드;루쿠마데스|그리스 도넛", street:"모나스티라키|수블라키 거리|Monastiraki souvlaki;플라카|타베르나 골목|Plaka taverna"},
  JTR:{food:"파바|산토리니 노란 완두콩 퓌레;토마토 케프테데스|토마토 튀김;해산물 그릴|항구 타베르나;빈산토 와인|산토리니 디저트 와인", street:"이아|석양뷰 레스토랑|Oia restaurants;암무디 베이|절벽 아래 해산물 식당|Ammoudi Bay"},
  IST:{food:"케밥|되네르·이스켄데르;고등어 케밥|에미뇌뉘 생선 샌드위치;바클라바|견과류 페이스트리;튀르키예식 아침|카흐발트 한 상", street:"카라쾨이|바클라바·카페|Karakoy restaurants;이스티클랄 거리|번화가 먹거리|Istiklal Avenue food;카드쾨이 시장|아시아 쪽 먹자골목|Kadikoy market"},
  ASR:{food:"항아리 케밥|토기에 익힌 고기 스튜;괴즐레메|튀르키예식 얇은 부침;카파도키아 와인|화산 토양 와인;만트|튀르키예식 만두", street:"괴레메 중심가|동굴 레스토랑|Goreme restaurants;위르귀프|와이너리·식당|Urgup restaurants"},
  AYT:{food:"피야즈|안탈리아식 콩 샐러드;생선 구이|지중해 해산물;되네르|튀르키예 대표 케밥;돈두르마|쫀득한 아이스크림", street:"칼레이치|항구 레스토랑|Kaleici restaurants;라라 해변|해변 식당|Lara Antalya restaurants"},
  JFK:{food:"뉴욕 피자|얇은 조각 피자;베이글|크림치즈 베이글;파스트라미 샌드위치|카츠 델리;스테이크|뉴욕 스테이크하우스", street:"첼시 마켓|실내 푸드홀|Chelsea Market;리틀 이탈리·차이나타운|이탈리안·딤섬|Chinatown Manhattan;스모가스버그|주말 야외 푸드마켓|Smorgasburg"},
  LAX:{food:"인앤아웃 버거|캘리포니아 버거;타코|LA 타코 트럭;K-타운 BBQ|코리아타운;아사이 볼|건강식 카페", street:"그랜드 센트럴 마켓|다운타운 푸드홀|Grand Central Market;코리아타운|한식·바|Koreatown LA restaurants"},
  SFO:{food:"클램 차우더|사워도우 빵 그릇 수프;던저니스 크랩|게 요리;미션 부리토|대형 부리토;기라델리 초콜릿|선데 아이스크림", street:"페리 빌딩|로컬 푸드 마켓|Ferry Building Marketplace;미션 디스트릭트|부리토·타코|Mission District food"},
  LAS:{food:"뷔페|호텔 뷔페;스테이크|셀럽 셰프 스테이크하우스;수제 버거|스트립의 버거 맛집;브런치|호텔 브런치", street:"스트립 호텔 푸드홀|호텔 내 레스토랑|Las Vegas Strip restaurants;프리몬트 거리|다운타운 먹거리|Fremont Street food"},
  SEA:{food:"클램 차우더|파이크 플레이스 명물;연어 요리|태평양 연어;스타벅스 1호점|원조 매장;굴 요리|퓨젯 사운드 굴", street:"파이크 플레이스 마켓|해산물 시장|Pike Place Market food;캐피톨 힐|힙한 식당가|Capitol Hill Seattle restaurants"},
  HNL:{food:"포케|하와이식 회 덮밥;로코모코|밥 위 햄버그와 달걀;갈릭 쉬림프|노스쇼어 새우 트럭;셰이브 아이스|하와이식 빙수", street:"와이키키|해변 레스토랑|Waikiki restaurants;할레이바|노스쇼어 푸드 트럭|Haleiwa food trucks"},
  GUM:{food:"차모로 BBQ|레드라이스와 바비큐;켈라구엔|레몬 양념 닭·생선;스테이크|투몬 스테이크하우스;열대 과일|코코넛·망고", street:"차모로 빌리지 야시장|수요일 야시장|Chamorro Village Night Market;투몬|레스토랑 밀집|Tumon restaurants"},
  YVR:{food:"연어 요리|BC주 자연산 연어;스시|북미 최고 수준의 스시;푸틴|감자튀김 그레이비;나나이모 바|밴쿠버 디저트", street:"그랜빌 아일랜드 마켓|실내 시장|Granville Island Public Market;리치먼드|아시아 음식 거리|Richmond BC restaurants"},
  YYZ:{food:"피밀 베이컨 샌드위치|토론토 명물;푸틴|감자튀김 그레이비;메이플 디저트|메이플 시럽 간식;딤섬|차이나타운", street:"세인트 로렌스 마켓|역사적 실내 시장|St. Lawrence Market;켄싱턴 마켓|다국적 먹자골목|Kensington Market"},
  YYC:{food:"앨버타 소고기|스테이크;버팔로 버거|로키식 버거;비버테일|캐나다 튀김 과자;크래프트 맥주|밴프 양조장", street:"밴프 애비뉴|레스토랑 거리|Banff Avenue restaurants;캔모어 시내|로컬 맛집|Canmore restaurants"},
  SYD:{food:"피시 앤 칩스|본다이·왓슨스 베이;플랫 화이트|호주식 커피;미트 파이|호주 국민 간식;오이스터|시드니 록 오이스터", street:"피시 마켓|시드니 수산시장|Sydney Fish Market;더 록스|주말 마켓|The Rocks Markets;서리 힐스|카페 거리|Surry Hills cafes"},
  MEL:{food:"브런치 카페|멜버른 커피 문화;딤섬|차이나타운;티라미수 젤라토|이탈리안 거리;미트 파이|퀸 빅토리아 마켓", street:"퀸 빅토리아 마켓|야시장과 먹거리|Queen Victoria Market;디그레이브스 거리|골목 카페|Degraves Street;라이곤 거리|이탈리안 거리|Lygon Street"},
  BNE:{food:"모레톤 베이 벅|브리즈번 대표 갑각류;브런치|사우스뱅크 카페;바비큐|공원 바비큐;열대 과일|망고·리치", street:"사우스뱅크|강변 레스토랑|South Bank restaurants;이글 스트리트 피어|강변 다이닝|Eagle Street Pier"},
  CNS:{food:"열대 과일|망고·패션프루트;크로커다일 요리|호주 이색 요리;해산물 플래터|산호해 해산물;바라문디|호주 흰살 생선", street:"케언즈 나이트 마켓|야시장|Cairns Night Markets;에스플러네이드|해안 레스토랑|Cairns Esplanade restaurants"},
  BKK:{food:"팟타이|태국식 볶음 쌀국수;똠얌꿍|새콤매콤 새우 수프;카오 만 까이|닭고기 덮밥;망고 스티키 라이스|망고 찰밥", street:"야와랏 차이나타운|길거리 음식 성지|Yaowarat street food;짜뚜짝 시장|주말 시장 먹거리|Chatuchak food;조드 페어 야시장|야시장 먹거리|Jodd Fairs"},
  HKT:{food:"뿌 팟퐁 커리|게 커리;해산물 바비큐|빠통 해산물;마사만 커리|남부식 커리;로띠|태국식 팬케이크", street:"반잔 시장|빠통 해산물 시장|Banzaan Market;푸켓 올드타운 선데이 마켓|일요 야시장|Phuket Walking Street"},
  CNX:{food:"카오 소이|치앙마이 코코넛 커리 국수;사이 우아|북부 허브 소시지;깽 항레|버마식 돼지고기 커리;남프릭 눔|풋고추 딥", street:"선데이 워킹 스트리트|일요 야시장|Chiang Mai Sunday Walking Street;님만해민|카페 거리|Nimmanhaemin cafes;와로롯 시장|로컬 시장|Warorot Market"},
  DAD:{food:"미꽝|꽝남식 비빔 국수;반쎄오|베트남식 부침;해산물|미케 해변 해산물 식당;반미|베트남 샌드위치", street:"한 시장|다낭 중심 시장|Han Market Da Nang;헬리오 야시장|야시장 먹거리|Helio Night Market;호이안 올드타운|까오러우·화이트로즈|Hoi An food"},
  HAN:{food:"쌀국수(퍼)|하노이식 소고기 쌀국수;분짜|숯불 돼지고기와 국수;에그 커피|달걀 크림 커피;반미|바게트 샌드위치", street:"구시가 맥주 거리|따히엔 거리|Ta Hien beer street;동쑤언 시장|현지 시장|Dong Xuan Market"},
  SGN:{food:"껌땀|부서진 쌀 덮밥;반미|사이공 반미;퍼|남부식 쌀국수;베트남 커피|연유 아이스커피", street:"벤탄 시장|시장 먹거리|Ben Thanh Market food;부이비엔 거리|여행자 거리|Bui Vien Street food"},
  CXR:{food:"해산물 바비큐|나트랑 해산물;반깐|나트랑식 미니 부침;분짜까|생선 어묵 국수;넴느엉|구운 돼지고기 쌈", street:"쩌담 시장|로컬 시장|Dam Market Nha Trang;나트랑 야시장|해변 야시장|Nha Trang Night Market"},
  PQC:{food:"해산물 바비큐|야시장 해산물;꽁깐 수프|푸꾸옥 피시 소스 국수;성게 구이|성게 그릴;느억맘|푸꾸옥 명물 피시소스", street:"즈엉동 야시장|해산물 야시장|Phu Quoc Night Market;함닌 어촌|게 요리 마을|Ham Ninh fishing village"},
  TPE:{food:"우육면|대만식 소고기 국수;샤오롱바오|딘타이펑 원조 만두;버블티|타피오카 밀크티;지파이|거대 닭튀김", street:"스린 야시장|대만 최대 야시장|Shilin Night Market;라오허제 야시장|후추빵 맛집|Raohe Night Market;융캉제|우육면·망고빙수|Yongkang Street"},
  KHH:{food:"해산물|치진 섬 해산물;파파야 우유|가오슝 명물 음료;관차이반|관 모양 빵;단짜이면|담백한 국수", street:"루이펑 야시장|로컬 야시장|Ruifeng Night Market;류허 야시장|관광 야시장|Liuhe Night Market"},
  SIN:{food:"칠리크랩|매콤달콤 게 요리;하이난 치킨라이스|싱가포르 국민 음식;락사|코코넛 커리 국수;카야 토스트|아침 세트", street:"맥스웰 호커센터|치킨라이스 맛집|Maxwell Food Centre;라우파삿|사테 거리|Lau Pa Sat;뉴턴 호커센터|야간 호커|Newton Food Centre"},
  PEK:{food:"베이징 덕|오리구이;자장면|베이징식 짜장면;양꼬치|야시장 꼬치;훠궈|베이징식 샤브샤브", street:"왕푸징 먹자골목|간식 거리|Wangfujing snack street;난뤄구샹|후퉁 골목 카페|Nanluoguxiang;구이제|훠궈·마라 거리|Guijie Beijing"},
  PVG:{food:"샤오롱바오|상하이식 소룡포;성지엔바오|바닥 구운 만두;홍샤오러우|상하이식 돼지고기 조림;털게|가을 상하이 털게", street:"예원 상가|소룡포 노포|Yu Garden food;우장루 먹자거리|간식 거리|Wujiang Road food street"},
  DYG:{food:"상채(후난 요리)|매운 후난 요리;삼하 요리|장가계 토가족 요리;훈제 고기|후난식 라러우;토가족 요리|소수민족 음식", street:"장가계 시내|후난 요리 식당|Zhangjiajie restaurants;우링위안|숙소가 맛집|Wulingyuan restaurants"},
  CAN:{food:"딤섬|광둥식 얌차;차시우|광둥식 바비큐 돼지고기;완탄면|새우 완탕면;창펀|쌀 롤", street:"베이징루|보행자 먹거리 거리|Beijing Road food;상하주 거리|노포 딤섬|Shangxiajiu Street"},
  DPS:{food:"나시 짬뿌르|발리식 백반;바비 굴링|발리식 통돼지 구이;사테|꼬치구이;미 고렝|볶음면", street:"짐바란 해변|해산물 바비큐|Jimbaran seafood;스미냑|레스토랑·비치클럽|Seminyak restaurants;우붓 시장|로컬 먹거리|Ubud Market"},
  CGK:{food:"나시 고렝|인도네시아 볶음밥;소토 아얌|닭고기 수프;르당|코코넛 소고기 조림;마르타박|두툼한 부침", street:"사방 거리|야간 노점|Jalan Sabang Jakarta;블록 M|먹자골목|Blok M food"},
  CEB:{food:"레촌|세부식 통돼지 구이;시시그|돼지고기 철판;칼라만시 주스|필리핀 라임 음료;망고|세부 망고", street:"SM 시티 세부|쇼핑몰 맛집|SM City Cebu restaurants;라르사 야시장|수그보 메르카도|Sugbo Mercado"},
  MNL:{food:"아도보|간장 식초 조림;시니강|새콤한 수프;할로할로|필리핀 빙수;졸리비|필리핀 국민 패스트푸드", street:"비논도|세계에서 가장 오래된 차이나타운|Binondo food;BGC|레스토랑 거리|BGC restaurants"},
  KLO:{food:"해산물 그릴|디몰 해산물;망고 셰이크|보라카이 명물;레촌|통돼지 구이;칼라마레스|오징어 튀김", street:"디몰|보라카이 중심 먹자거리|D'Mall Boracay;디탈리팝파 시장|해산물 골라 조리|D'Talipapa"},
  TAG:{food:"해산물|알로나 해변 식당;우베 디저트|보라색 고구마 간식;칼라마이|보홀 전통 과자;레촌|통돼지 구이", street:"알로나 비치|해변 레스토랑|Alona Beach restaurants;로복 강 뷔페|크루즈 점심|Loboc River cruise lunch"},
  CAI:{food:"코샤리|쌀·면·렌틸 비빔;풀 메담마스|잠두콩 스튜;타메야|이집트식 팔라펠;오리|비둘기·오리 구이", street:"칸 엘 칼릴리|시장 카페|Khan el-Khalili cafe;자말렉|레스토랑 거리|Zamalek restaurants"},
  HKG:{food:"딤섬|얌차 문화;완탕면|새우 완탕면;로스트 구스|광둥식 거위 구이;에그타르트|홍콩식 에그타르트", street:"몽콕|길거리 간식|Mong Kok street food;템플 스트리트 야시장|밤 노점|Temple Street Night Market;셩완|노포 식당|Sheung Wan restaurants"},
  KUL:{food:"나시 르막|코코넛 밥 정식;사테|땅콩 소스 꼬치;바쿠테|약재 돼지갈비탕;로티 차나이|인도식 팬케이크", street:"잘란 알로|야시장 먹자골목|Jalan Alor;페탈링 거리|차이나타운|Petaling Street food"},
  BKI:{food:"해산물|필리핀 시장 해산물;사바 차|사바 홍차;낙시 람박|코타키나발루 볶음밥;린기스 국수|사바식 면", street:"필리피노 마켓|해산물 야시장|Filipino Market Kota Kinabalu;가야 스트리트|일요 시장|Gaya Street Sunday Market"},
  PEN:{food:"차 퀘이 테오|볶음 쌀국수;아삼 락사|새콤한 생선 국수;첸돌|팥빙수 디저트;나시 칸다르|페낭식 백반", street:"거니 드라이브|호커센터|Gurney Drive Hawker;출리아 거리|야간 노점|Chulia Street hawker"},
  VTE:{food:"랍|라오스식 고기 샐러드;까오 삐약|라오스 쌀국수;찹쌀밥|카오 니아오;비어 라오|라오스 맥주", street:"메콩 강변 야시장|노점 먹거리|Vientiane night market;딸랏 사오|아침 시장|Talat Sao"},
  LPQ:{food:"오람|루앙프라방 스튜;까이 펜|메콩 김 튀김;카오 소이|라오스식 면;라오스 커피|남부 커피", street:"루앙프라방 야시장|뷔페 골목|Luang Prabang night market food;메콩 강변|강뷰 레스토랑|Luang Prabang riverside restaurants"},
  UBN:{food:"허르헉|돌로 익힌 양고기;보즈|몽골식 만두;호쇼르|튀긴 만두;수테차|몽골식 밀크티", street:"서울의 거리|울란바토르 식당가|Seoul Street Ulaanbaatar;샹그릴라 몰|몰 식당가|Shangri-La Mall Ulaanbaatar"},
  DEL:{food:"버터 치킨|델리 원조 커리;차트|새콤달콤 길거리 간식;비리야니|향신료 볶음밥;라씨|요거트 음료", street:"찬드니 촉|올드 델리 먹자골목|Chandni Chowk food;하우즈 카스|카페 거리|Hauz Khas Village"},
  BOM:{food:"바다 파브|뭄바이 감자 버거;파브 바지|채소 커리와 빵;해산물 커리|말바니 요리;이라니 카페|짜이와 빵", street:"초우파티 해변|길거리 간식|Chowpatty Beach food;콜라바 코즈웨이|카페 거리|Colaba Causeway"},
  MLE:{food:"마스 후니|참치 코코넛 무침;가루디야|참치 수프;해산물 그릴|리조트 디너;로시|몰디브식 플랫브레드", street:"리조트 레스토랑|리조트 내 식당|Maldives resort restaurant;말레 어시장|현지 시장|Male Fish Market"},
  DXB:{food:"샤와르마|중동식 랩;마크부스|향신료 볶음밥;루카이마트|꿀 도넛;대추야자|두바이 명물", street:"알 파히디|구시가 전통 식당|Al Fahidi restaurants;알 리가|레바논 식당 거리|Al Rigga restaurants;두바이 몰|대형 푸드코트|Dubai Mall restaurants"},
  AUH:{food:"마크부스|향신료 볶음밥;후무스|병아리콩 딥;샤와르마|중동식 랩;아랍 커피|가와와 대추야자", street:"코르니쉬|해안 레스토랑|Corniche Abu Dhabi restaurants;야스 베이|워터프런트 다이닝|Yas Bay Waterfront"},
  FRA:{food:"애플 와인|프랑크푸르트 사과주;그뤼네 조세|일곱 허브 소스;프랑크푸르터 소시지|원조 소시지;슈니첼|독일식 돈가스", street:"작센하우젠|사과주 선술집 거리|Sachsenhausen apple wine;클라인마르크트할레|실내 시장|Kleinmarkthalle"},
  MUC:{food:"슈바인스학세|독일식 족발;바이스부어스트|흰 소시지와 프레첼;맥주|비어가르텐;아펠슈트루델|사과 파이", street:"빅투알리엔 시장|노천 시장·비어가르텐|Viktualienmarkt;호프브로이하우스|맥주홀|Hofbrauhaus"},
  BER:{food:"커리부어스트|카레 소시지;되너 케밥|베를린식 케밥;아이스바인|족발 요리;베를리너|잼 도넛", street:"마르크트할레 노인|목요일 스트리트 푸드|Markthalle Neun;크로이츠베르크|다국적 식당|Kreuzberg restaurants"},
  VIE:{food:"비너 슈니첼|송아지 커틀릿;자허토르테|초콜릿 케이크;아펠슈트루델|사과 파이;비엔나 커피|멜랑주", street:"나슈마르크트|빈 최대 시장|Naschmarkt;카페 자허·첸트랄|전통 카페|Cafe Central Vienna"},
  SZG:{food:"잘츠부르거 노케를|수플레 디저트;모차르트 쿠겔|초콜릿 과자;슈니첼|오스트리아 커틀릿;맥주|아우구스티너 양조장", street:"게트라이데 거리|구시가 식당|Getreidegasse restaurants;아우구스티너 브로이|수도원 맥주홀|Augustiner Braeu Salzburg"},
  BUD:{food:"굴라시|헝가리식 소고기 수프;랑고시|튀긴 빵 피자;퀴르퇴시칼라치|굴뚝빵;토카이 와인|헝가리 디저트 와인", street:"중앙 시장|빨간 파프리카 시장|Great Market Hall Budapest;카진치 거리|루인바·식당|Kazinczy Street"},
  ZAG:{food:"슈트루클리|치즈 파이;체바피|크로아티아식 미니 소시지;부레크|패스트리;크로아티아 와인|내륙 와인", street:"돌라츠 시장|빨간 파라솔 시장|Dolac Market;트칼치체바 거리|카페 거리|Tkalciceva Street"},
  DBV:{food:"검은 리소토|오징어 먹물 리소토;굴|스톤 굴;해산물 그릴|아드리아해 생선;로잣|크로아티아식 푸딩", street:"스트라둔|구시가 메인 거리|Stradun restaurants;구 항구|해산물 식당|Dubrovnik Old Port restaurants"},
  SPU:{food:"파시차다|달마티아식 소고기 조림;해산물 그릴|아드리아해 생선;페카|철 뚜껑 구이 (예약);부자라|와인 해산물 요리", street:"리바 산책로|해안 카페|Riva Split;피아차 시장|시장과 식당|Split Green Market"},
  AMS:{food:"스트룹와플|캐러멜 와플;하링|청어 절임;크로켓|자판기 크로켓;더치 팬케이크|팬케이크", street:"알버트 카입 시장|길거리 간식 시장|Albert Cuyp Market;푸드할렌|실내 푸드홀|Foodhallen Amsterdam"},
  LIS:{food:"파스텔 드 나타|에그타르트;바칼라우|대구 요리;정어리 구이|6월 축제 별미;비파나|돼지고기 샌드위치", street:"타임아웃 마켓|리스본 푸드홀|Time Out Market Lisbon;벨렝|원조 에그타르트|Pasteis de Belem;알파마|파두 레스토랑|Alfama restaurants"},
  OPO:{food:"프란세지냐|포르투식 샌드위치;포트와인|강 건너 와이너리;바칼라우|대구 요리;파스텔 드 나타|에그타르트", street:"볼량 시장|전통 시장|Bolhao Market;히베이라|강변 식당|Ribeira Porto restaurants;빌라 노바 드 가이아|포트와인 셀러|Vila Nova de Gaia port cellars"},
  KEF:{food:"랍스터 수프|아이슬란드 랑구스틴 수프;양고기 수프|전통 수프;핫도그|바이자린스 핫도그;스퀴르|아이슬란드 요거트", street:"레이캬비크 시내|레스토랑 거리|Reykjavik restaurants;그란디 항구|해산물·아이스크림|Grandi Reykjavik"},
  OSL:{food:"연어 요리|노르웨이 연어;피스케수페|생선 크림 수프;브라운 치즈|브루노스트;시나몬 번|카넬불레", street:"마타렌|실내 푸드홀|Mathallen Oslo;아케르 브뤼게|항구 레스토랑|Aker Brygge restaurants"},
  BGO:{food:"어시장 해산물|킹크랩·새우;피스케수페|베르겐식 생선 수프;연어|훈제 연어;스킬링스볼레|베르겐 시나몬 번", street:"베르겐 어시장|해산물 시장|Bergen Fish Market;브뤼겐|전통 레스토랑|Bryggen restaurants"},
  TOS:{food:"킹크랩|북극해 킹크랩;순록 요리|북부 전통 요리;대구 요리|스크레이 대구;북극 맥주|맥 양조장", street:"트롬쇠 시내|레스토랑 거리|Tromso restaurants;맥 양조장|북극 맥주집|Mack Brewery Tromso"},
  AKL:{food:"양고기|뉴질랜드 램;그린 홍합|뉴질랜드 홍합 요리;미트 파이|국민 간식;플랫 화이트|커피", street:"바이어덕트 하버|항구 레스토랑|Viaduct Harbour restaurants;폰손비 거리|카페 거리|Ponsonby Road"},
  ZQN:{food:"퍼그버거|퀸스타운 명물 버거;양고기|램 스테이크;센트럴 오타고 와인|피노 누아;호키 포키|뉴질랜드 아이스크림", street:"퀸스타운 시내|레스토랑 거리|Queenstown restaurants;애로우타운|골드러시 마을 식당|Arrowtown restaurants"},
  CHC:{food:"양고기|캔터베리 램;크레이피시|카이코우라 랍스터;미트 파이|국민 간식;연어|마운트쿡 알파인 연어", street:"리버사이드 마켓|실내 푸드마켓|Riverside Market Christchurch;뉴 리젠트 거리|파스텔 거리 식당|New Regent Street"},
  MEX:{food:"타코 알 파스토르|돼지고기 타코;몰레|초콜릿 소스 요리;추로스|추레리아 엘 모로;메스칼|아가베 증류주", street:"로마·콘데사|레스토랑 거리|Roma Norte restaurants;메르카도 산 후안|미식 시장|Mercado San Juan"},
  CUN:{food:"코치니타 피빌|유카탄식 돼지고기;세비체|해산물 라임 절임;피시 타코|생선 타코;마가리타|칵테일", street:"파르케 데 라스 팔라파스|현지 야간 먹거리|Parque de las Palapas;플라야 델 카르멘 5번가|보행자 식당 거리|Quinta Avenida Playa del Carmen"},
  LIM:{food:"세비체|페루 국민 요리;로모 살타도|소고기 볶음;피스코 사워|페루 칵테일;안티쿠초|소 심장 꼬치", street:"미라플로레스|미식 레스토랑|Miraflores restaurants;바랑코|예술가 동네 식당|Barranco restaurants"},
  CUZ:{food:"꾸이|기니피그 구이;알파카 스테이크|안데스 고기;코카 차|고산병 완화 차;치차 모라다|보라 옥수수 음료", street:"산 페드로 시장|현지 시장|San Pedro Market Cusco;아르마스 광장|레스토랑 밀집|Plaza de Armas Cusco restaurants"}
};
