let API_KEY = null;

// 먼저 API 키를 받아오기
fetch('/api/config/key')
    .then(response => response.json())
    .then(data => {
        API_KEY = data.apiKey;


    })
    .catch(err => console.error("API Key 불러오기 실패:", err));




const API_BASE_URL1 = "/api";
    // --- 1. 카카오맵 생성 ---

    // 마커들을 담을 배열입니다
    var selectedMarker = null;
    var gasStationMarkers = [];
    var map; // map 변수를 전역에서 접근할 수 있도록 바깥으로 빼냅니다.
    var cur_lat;
    var cur_lon;

    // 빈 배열 객체 하나 선언
    kakao.maps.load(function () {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
    cur_lat = position.coords.latitude;
    cur_lon = position.coords.longitude;

    wgsToKatec(cur_lon, cur_lat, true);

    // 지도 생성
    var mapContainer = document.getElementById('map');
    var mapOption = {
    center: new kakao.maps.LatLng(cur_lat, cur_lon),
    level: 5
};
    map = new kakao.maps.Map(mapContainer, mapOption); // 전역 map 변수에 할당

    // 현 위치 마커 생성
    var imageSrc = './icon_map/current_loc.png',
    imageSize = new kakao.maps.Size(30, 30),
    imageOption = {offset: new kakao.maps.Point(15, 15)};
    var markerPosition = new kakao.maps.LatLng(cur_lat, cur_lon),
    markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
    var marker = new kakao.maps.Marker({
    position: markerPosition,
    image: markerImage
});
    marker.setMap(map);

    // 지도 중심 변경 이벤트


    // "현재 지도 중심 변환" 버튼 클릭 이벤트 수정
    $("#convertnow").on("click", function () {
    const centerLatLng = map.getCenter();
    const centerLon = centerLatLng.getLng();
    const centerLat = centerLatLng.getLat();

    $("#curr_map_katec").html("중심 좌표 변환 중...");

    // 1. 지도 중심 WGS84 -> KATEC 변환
    $.ajax({
    method: "GET",
    url: `${API_BASE_URL}/wgs84-to-katec`,
    data: {"lon": centerLon, "lat": centerLat},
    success: function (response) {
    const katecResultX = response.x;
    const katecResultY = response.y;
    $("#curr_map_katec").html(`<b>현재 지도 중심 KATEC 좌표:</b> X=${katecResultX.toFixed(2)}, Y=${katecResultY.toFixed(2)}`);

},
    error: function (jqXHR) {
    let errorMessage = jqXHR.responseJSON?.detail || "Unknown error";
    $("#curr_map_katec").html(`<p style="color:red;"><b>❌ 변환 실패:</b> ${errorMessage}</p>`);
}
});
});

    // 현재 위치로 돌아가기
    $("#whereami").on("click", function panTo() {
    var moveLatLon = new kakao.maps.LatLng(cur_lat, cur_lon);
    map.panTo(moveLatLon);
});


    kakao.maps.event.addListener(map, 'click', function () {
    // 1. 이전에 선택된 마커가 있는지 확인합니다 (null이 아닌지).
    if (selectedMarker) {

    // 2. 선택된 마커가 있다면, 이미지를 'normalImage'로 되돌립니다.
    selectedMarker.setImage(selectedMarker.normalImage);
    selectedMarker.setZIndex(0);
    // 3. 선택된 마커 변수를 다시 null로 초기화합니다.
    selectedMarker = null;
}
});

    kakao.maps.event.addListener(map, 'click', function () {
    // 1. 이전에 선택된 마커가 있는지 확인합니다 (null이 아닌지).
    if (selectedMarker) {

    // 2. 선택된 마커가 있다면, 이미지를 'normalImage'로 되돌립니다.
    selectedMarker.setImage(selectedMarker.normalImage);
    selectedMarker.setZIndex(0);
    // 3. 선택된 마커 변수를 다시 null로 초기화합니다.
    selectedMarker = null;
}
});
});
} else {
    console.log("GPS error");
}


});

    // --- 2. API 호출 함수들 ---
    const API_BASE_URL = "https://axis-convert-new.vercel.app";

    function haversineDistance(coords1, coords2) {
    const R = 6371e3; // Earth's radius in metres
    const lat1 = coords1.latitude * Math.PI / 180;
    const lat2 = coords2.latitude * Math.PI / 180;
    const deltaLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const deltaLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.floor(R * c); // distance in metres
}

    // 여기에 DB 조회 로직 추가

    function getDetailById(uid) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/api/detail-by-id`,
        data: {
            api_key: API_KEY,
            uid: uid
        },
        success: function (response) {
            const xmlText = response.xml_data;
            const xmlDoc = $.parseXML(xmlText);
            const $xml = $(xmlDoc); // XML 문서를 jQuery 객체로 감쌉니다.

            // find()를 사용하여 원하는 태그를 찾습니다.
            const $station = $xml.find('OIL');


            // 1. 주유소 기본 정보를 객체에 저장합니다.
            const stationInfo = {
                id: $station.find('UNI_ID').text(),
                name: $station.find('OS_NM').text(),
                brand: $station.find('POLL_DIV_CO').text(),
                tel: $station.find('TEL').text(),
                address: $station.find('NEW_ADR').text(),
                sigunCd: $station.find('SIGUNCD').text(),
                // 'Y'/'N' 값을 boolean(true/false)으로 변환하면 사용하기 편리합니다.
                hasCarWash: $station.find('CAR_WASH_YN').text() === 'Y',
                hasCvs: $station.find('CVS_YN').text() === 'Y',
                prices: {} // 유가 정보를 담을 객체를 미리 생성합니다.
            };
            const sido = stationInfo.sigunCd.substring(0, 2);

            // 2. 여러 개의 유가 정보를 반복문으로 처리합니다.
            $station.find('OIL_PRICE').each(function () {
                const $priceInfo = $(this); // 현재 반복 중인 OIL_PRICE 태그

                const productCode = $priceInfo.find('PRODCD').text();
                const price = $priceInfo.find('PRICE').text();

                // stationInfo 객체의 prices 속성에 유종 코드(PRODCD)를 key로 가격을 저장합니다.
                // ex) prices['B027'] = 1989
                stationInfo.prices[productCode] = parseInt(price, 10); // 문자열을 숫자로 변환
            });

            // 3. 최종적으로 파싱된 데이터를 확인합니다.
            //console.log(stationInfo);
            document.getElementById("info-gsName").innerText = stationInfo.name ? stationInfo.name  : 'X';
            document.getElementById("gs-address").innerText = stationInfo.address ? stationInfo.address  : 'X';
            document.getElementById("gs-number").innerText = stationInfo.tel ? stationInfo.tel  : 'X';

            // 상제정보 가격 넣기
            document.getElementById("oil-diesel-price1").innerText = stationInfo.prices['D047'] ? `${stationInfo.prices['D047']}원`  : 'X';
            document.getElementById("oil-gasoline-price1").innerText = stationInfo.prices['B027'] ? `${stationInfo.prices['B027']}원` : 'X';
            document.getElementById("oil-premiumGasoline-price1").innerText = stationInfo.prices['B034'] ? `${stationInfo.prices['B034']}원` : 'X';
            document.getElementById("oil-kerosene-price1").innerText = stationInfo.prices['C004'] ? `${stationInfo.prices['C004']}원` : 'X';
            document.getElementById("oil-lpg-price1").innerText = stationInfo.prices['K015'] ? `${stationInfo.prices['K015']}원` : 'X';
            // 이제 stationInfo 객체를 사용하여 화면에 정보를 표시할 수 있습니다.
            // 예: $('#station-name').text(stationInfo.name);
            // 예: $('#gasoline-price').text(stationInfo.prices['B027']);
            getAreaAvg(sido, stationInfo.sigunCd);

        }
    })
}

    var petro_name;
    let station_a = [];
    let totalStations = 0;
    let completed = 0;
    let oilAvgPrice = 0;
    let stationId;
    // ✅ 마커 표시용 KATEC -> WGS84 변환 함수 추가
    function katecToWgsForMarker(katecX, katecY, name, price, brand, uni_id) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/katec-to-wgs84`,
        data: {"x": katecX, "y": katecY},
        success: function (response) {
            const lat = response.lat;
            const lon = response.lon;
            const target_ll = {latitude: lat, longitude: lon};
            const curr_ll = {latitude: cur_lat, longitude: cur_lon};
            const distanceInMeters = haversineDistance(target_ll, curr_ll);
            /* 윤선 -----------------------------------------*/

            if (station_a && Array.isArray(station_a)) {
                station_a.push({
                    name,
                    price,
                    distance: distanceInMeters,
                    brand,
                    uni_id,
                    lat,
                    lon
                });
            }

            completed++;

            // 모든 요청이 끝났을 때만 실행
            if (completed === totalStations) {
                oilAvgPrice = getAveragePrice();
                //console.log("최종 평균:", oilAvgPrice);
                // 여기서 값 넣기
                document.getElementById('avg-price').innerText = oilAvgPrice;

            }

            /* ----------------------------------------윤선*/
            var imageSrc = './icon_map/fav.png';
            const newListItem =$(`
                    <div class="favorite-item" data-station-id="${uni_id}">
                        <i class="fa-solid fa-star gold-star"></i> ${name}
                    </div>
                `);

            newListItem.on('click', function() {
                // 2-1. 클릭된 아이템의 ID 가져오기
                stationId = $(this).attr('data-station-id');

                // 2-2. gasStationMarkers 배열에서 일치하는 마커 찾기
                const targetMarker = gasStationMarkers.find(m => m.gs_id == stationId);

                if (targetMarker) {
                    // 2-3. 해당 마커의 'click' 이벤트 강제 실행
                    kakao.maps.event.trigger(targetMarker, 'click');
                } else {
                    // [실패] 디버깅 로그 출력
                    console.error(`--- [DEBUG] 마커 찾기 실패 ---`);
                    console.warn(`[1] 찾으려는 ID: ${stationId} (타입: ${typeof stationId})`);

                    //console.log(`[2] 현재 'gasStationMarkers' 배열:`);
                    //console.log(gasStationMarkers); // 배열 전체 객체 출력

                    // 배열에 저장된 ID 목록만 따로 추출
                    const allMarkerIds = gasStationMarkers.map(m => {
                        return `ID: ${m.gs_id} (타입: ${typeof m.gs_id})`;
                    });
                    //console.log(`[3] 배열에 저장된 ID 목록:`, allMarkerIds);
                    console.error(`------------------------------`);
                    console.warn(`ID(${stationId})와 일치하는 마커를 찾을 수 없습니다.`);
                }
            });
            $("#favorites-list-container").append(newListItem);
            var imageSize = new kakao.maps.Size(35, 35),
                imageOption = {offset: new kakao.maps.Point(17, 17)};

            // 클릭시 크기 키우기
            var clickedWidth = 50;
            var clickedHeight = 50;
            var clickedSize = new kakao.maps.Size(clickedWidth, clickedHeight);
            var clickedOption = {
                offset: new kakao.maps.Point(25, 25)
            };
            var clickedImage = new kakao.maps.MarkerImage(imageSrc, clickedSize, clickedOption);

            var normalImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
            var marker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(lat, lon),
                title: name,
                image: normalImage,
                clickable: true,
            });
            marker.normalImage = normalImage;
            marker.clickedImage = clickedImage;
            marker.gs_id = uni_id;
            gasStationMarkers.push(marker); // 배열에 마커 추가

            // 인포윈도우를 생성합니다
            var infowindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;width:150px;"><strong>${name}</strong><br>거리: ${distanceInMeters < 1000 ? distanceInMeters.toFixed(0) + 'm' : (distanceInMeters / 1000).toFixed(2) + 'km'}</div>`
            });

            // 마커에 마우스오버 이벤트를 등록합니다
            kakao.maps.event.addListener(marker, 'mouseover', function () {
                infowindow.open(map, marker);
            });

            // 마커에 마우스아웃 이벤트를 등록합니다
            kakao.maps.event.addListener(marker, 'mouseout', function () {
                infowindow.close();
            });

            // 마커에 마우스클릭 이벤트를 등록합니다 (상세정보 페이지)
            kakao.maps.event.addListener(marker, 'click', function () {
                if (selectedMarker && selectedMarker !== marker) {
                    selectedMarker.setImage(selectedMarker.normalImage);
                    selectedMarker.setZIndex(0);
                }

                marker.setImage(marker.clickedImage);
                marker.setZIndex(100);
                selectedMarker = marker;
                map.panTo(marker.getPosition());

                if (window.innerWidth <= 768) {
                    const mapHeight = window.innerHeight;
                    const offset = mapHeight * 0.1;

                    map.panBy(0, offset);
                }
                getDetailById(uni_id);
                $('.gs-detail').css('display', 'block');
                stationId = uni_id;
                isFav(stationId);
                // getGsInfo(uni_id);
            })

        }
        // 변환 실패는 콘솔에만 로그를 남기고 무시
    });
}

    // ✅ 기존 주유소 마커를 지우는 함수 추가
    function clearGasStationMarkers() {
    for (var i = 0; i < gasStationMarkers.length; i++) {
    gasStationMarkers[i].setMap(null);
}
    gasStationMarkers = [];
}

    // (기존 katecToWgs, wgsToKatec 함수 및 버튼 이벤트 핸들러는 그대로 유지)
    function katecToWgs(katecX, katecY) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/katec-to-wgs84`,
        data: {"x": katecX, "y": katecY},
        success: function (response) {
            const lat = response.lat;
            const lon = response.lon;
            $("#result_wgs").html(`<p style="color:blue;"><b>✅ 변환 성공</b></p><p><b>원본 KATEC:</b> X=${katecX}, Y=${katecY}</p><p><b>변환된 WGS84:</b> 위도=${lat}, 경도=${lon}</p>`);
        },
        error: function (jqXHR) {
            let errorMessage = jqXHR.responseJSON?.detail || "Unknown error";
            $("#result_wgs").html(`<p style="color:red;"><b>❌ 변환 실패:</b> ${errorMessage}</p>`);
        }
    });
}

    function wgsToKatec(wgsLon, wgsLat, isInitial = false) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/wgs84-to-katec`,
        data: {"lon": wgsLon, "lat": wgsLat},
        success: function (response) {
            const katecResultX = response.x;
            const katecResultY = response.y;
            if (isInitial) {
                //console.log("현재 위치 KATEC 변환 결과:", {x: katecResultX, y: katecResultY});
                $("#curr_loc").html(`<b>현재 위치 KATEC 좌표:</b> X=${katecResultX.toFixed(2)}, Y=${katecResultY.toFixed(2)}`);
            } else {
                $("#result_katec").html(`<p style="color:blue;"><b>✅ 변환 성공</b></p><p><b>원본 WGS84:</b> 경도=${wgsLon}, 위도=${wgsLat}</p><p><b>변환된 KATEC:</b> X=${katecResultX}, Y=${katecResultY}</p>`);
            }

        },
        error: function (jqXHR) {
            let errorMessage = jqXHR.responseJSON?.detail || "Unknown error";
            if (!isInitial) {
                $("#result_katec").html(`<p style="color:red;"><b>❌ 변환 실패:</b> ${errorMessage}</p>`);
            }
        }
    });
}

    $("#convert_to_wgs").on("click", function () {
    const katecX = parseFloat($("#katec_x").val());
    const katecY = parseFloat($("#katec_y").val());
    if (isNaN(katecX) || isNaN(katecY)) {
    $("#result_wgs").html("<p style='color:red;'>올바른 숫자 좌표를 입력해주세요.</p>");
    return;
}
    $("#result_wgs").html("<p>변환 중...</p>");
    katecToWgs(katecX, katecY);
});

    $("#convert_to_katec").on("click", function () {
    const wgsLon = parseFloat($("#wgs_lon").val());
    const wgsLat = parseFloat($("#wgs_lat").val());
    if (isNaN(wgsLon) || isNaN(wgsLat)) {
    $("#result_katec").html("<p style='color:red;'>올바른 숫자 좌표를 입력해주세요.</p>");
    return;
}
    $("#result_katec").html("<p>변환 중...</p>");
    wgsToKatec(wgsLon, wgsLat);
});



    //     윤선 ------------------------------------------------------------




    document.addEventListener("DOMContentLoaded", function () {
    const desktopBtn = document.querySelector(".list-hide-desktop");
    const mobileBtn = document.querySelector(".list-hide-mobile");
    const gasList = document.querySelector(".gas-info");

    // 데스크탑 버튼 클릭 이벤트
    if (desktopBtn) {
    desktopBtn.addEventListener("click", function () {
    gasList.classList.toggle("hidden");

    if (gasList.classList.contains("hidden")) {
    desktopBtn.style.right = "0";
    desktopBtn.textContent = "|||";
} else {
    desktopBtn.style.right = "25vw";
    desktopBtn.textContent = "|||";
}
});
}

    // 모바일 버튼 클릭 이벤트
    if (mobileBtn) {
    mobileBtn.addEventListener("click", function () {
    gasList.classList.toggle("hidden");

    if (gasList.classList.contains("hidden")) {
    mobileBtn.style.bottom = "0";
    mobileBtn.textContent = "=";
} else {
    mobileBtn.style.bottom = "50vh";
    mobileBtn.textContent = "=";
}
});
}
});

    favList();

    async function favList() {
    // [수정] 1. 기존 마커 제거
    clearGasStationMarkers(); // line 747에 이미 정의된 함수 호출
    $('#favorites-list-container').empty();

    // 2. API 호출 (세션 기반)
    try {
    const response = await fetch(`${API_BASE_URL1}/favList`, {
    method: "GET",
    credentials: "include" // 세션 쿠키 전송
});

    if (!response.ok) {
    if (response.status === 401) {
    alert("로그인이 필요합니다.");
    window.location.href = './login';
}
    throw new Error("서버 요청 실패");
}

    const favoriteList = await response.json(); // ["A00001", "A00002"]
    //console.log("즐겨찾기한 주유소 ID:", favoriteList); // 정상 작동 확인

    // [수정] 3. ID 목록을 순회하며 마커 생성 함수 호출
    favoriteList.forEach(gsId => {
    getGsInfoAndDrawMarker(gsId); // 각 ID로 상세정보 조회 및 마커 생성
});

} catch (error) {
    console.error(error);
}
}



    // [추가된 함수]
    // gsId를 받아 상세 정보를 조회하고 마커를 그립니다.
    function getGsInfoAndDrawMarker(uid) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/api/detail-by-id`, // jido.html (935번째 줄)과 동일한 API
        data: {
            api_key: API_KEY,
            uid: uid
        },
        success: function (response) {
            const xmlText = response.xml_data;
            const xmlDoc = $.parseXML(xmlText);
            const $xml = $(xmlDoc);

            const $station = $xml.find('OIL'); // 주유소 정보

            // 마커 표시에 필요한 정보 추출
            const name = $station.find('OS_NM').text();
            const brand = $station.find('POLL_DIV_CO').text();
            const oilKatecX = parseFloat($station.find('GIS_X_COOR').text());
            const oilKatecY = parseFloat($station.find('GIS_Y_COOR').text());
            const uni_id = $station.find('UNI_ID').text();
            // 가격 정보 (katecToWgsForMarker는 가격 파라미터가 필요합니다)
            // 여기서는 휘발유(B027) 가격을 기본값으로 전달해 보겠습니다.
            let price = 'X'; // 기본값
            $station.find('OIL_PRICE').each(function () {
                const $priceInfo = $(this);
                if ($priceInfo.find('PRODCD').text() === 'B027') { // B027 = 휘발유
                    price = parseInt($priceInfo.find('PRICE').text(), 10);
                    return false; // each 루프 중단
                }
            });

            // favorites.html에 이미 있는 katecToWgsForMarker 함수(661번째 줄)를 호출하여 마커를 그립니다.
            katecToWgsForMarker(oilKatecX, oilKatecY, name, price, brand, uni_id);
        },
        error: function(err) {
            console.error(`Failed to get gas station info for ${uid}:`, err);
        }
    });
}

    window.addEventListener("DOMContentLoaded", () => {
    isFav(stationId);
});

    async function isFav(stationId) {
    const gsId = stationId;

    // 2. API 호출 (세션 기반)
    try {
    const response = await fetch(`${API_BASE_URL1}/isFav?gsId=${gsId}`, {
    method: "GET",
    credentials: "include"  // 세션 쿠키 전송
});

    if (!response.ok) {
    throw new Error("서버 요청 실패: " + response.status);
}

    // 3. 결과값 받기
    const isFav = (await response.text()).trim();

    // 4. 결과 화면에 표시
    if (Number(isFav) === 0) {
    document.getElementById("fav-unFilled").style.display = "inline-block";
    document.getElementById("fav-filled").style.display = "none";
} else {
    document.getElementById("fav-unFilled").style.display = "none";
    document.getElementById("fav-filled").style.display = "inline-block";
}
} catch (error) {
    console.error(error);
}
}


    async function addFav(stationId) {
    const gsId = stationId;

    // 2. API 호출 (세션 기반)
    try {
    const response = await fetch(`${API_BASE_URL1}/addFav`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
},
    credentials: "include", // 세션 쿠키 전송
    body: JSON.stringify({
    gsId: gsId
})
});

    if (response.ok) {
    // 즐겨찾기 상태 갱신
    isFav(stationId);
    favList();

} else if (response.status === 401) {
    alert("로그인이 필요합니다.");
} else {
    alert("등록 실패: " + response.status);
}
} catch (error) {
    console.error(error);
}
}

    document.getElementById("fav-unFilled").addEventListener("click", function(){
    addFav(stationId);

});
    document.getElementById("fav-filled").addEventListener("click",function() {
    addFav(stationId);
});

    window.addEventListener("DOMContentLoaded", () => {
    isFav(stationId);
});





    // 평점 입력하는것 관련
    const stars = document.querySelectorAll('.star');
    let currentScore = 0; // 클릭 후 저장된 점수

    function updateStars(idx, isHalf, permanent = false) {
    stars.forEach((star, i) => {
        star.classList.remove('filled', 'half');

        if (permanent) {
            // 클릭 후 유지할 때
            if (i + 1 <= currentScore) star.classList.add('filled');
            else if (i + 0.5 === currentScore) star.classList.add('half');
        } else {
            // hover 시
            if (i < idx) star.classList.add('filled');
            if (i === idx) {
                if (isHalf) star.classList.add('half');
                else star.classList.add('filled');
            }
        }
    });
}

    // hover 이벤트
    stars.forEach((star, idx) => {
    star.addEventListener('mousemove', e => {
        const rect = star.getBoundingClientRect();
        const isHalf = (e.clientX - rect.left) < rect.width / 2;
        updateStars(idx, isHalf);
    });

    // 마우스 떠날 때 클릭 점수 유지
    star.addEventListener('mouseleave', () => {
    updateStars(0, false, true);
});

    // 클릭 이벤트
    star.addEventListener('click', e => {
    const rect = star.getBoundingClientRect();
    const isHalf = (e.clientX - rect.left) < rect.width / 2;
    currentScore = idx + (isHalf ? 0.5 : 1);
    updateStars(0, false, true);

    document.getElementById('myScore').innerText = `${currentScore}`;
});
});

    // 확인 버튼 클릭 시 점수 알림
    document.getElementById('giveRating').addEventListener('click', function() {

    addRating(stationId, currentScore).then(() => {
        // 서버 반영 끝나고
        $('.rating-info').css('display', 'none');
        gsRatingScore();
        ratingCount();
    }).catch(err => console.error(err));
});

    $('#outInfo').on('click', function () {
    // .gs-detail을 안보이게
    $('.gs-detail').css('display', 'none');

});

    $('#rating-btn').on('click', function () {
    // .rating-info을 보여주기
    $('.rating-info').css('display', 'block');


});

    $('#outRating').on('click', function () {
    // .rating-info을 안보이게
    $('.rating-info').css('display', 'none');

});

    // 선택한 주유소 속한 지역 평균가 구하기
    function getAreaAvg(sido, sigun) {
    $.ajax({
        method: "GET",
        url: `${API_BASE_URL}/api/avg-sigun-price`,
        data: {
            api_key: API_KEY,
            sido: sido,
            sigun: sigun
        },
        success: function(response) {
            const xmlText = response.xml_data;
            const xmlDoc = $.parseXML(xmlText);
            const $xml = $(xmlDoc);

            // 지역 이름은 중복이므로 하나만 가져오기
            const areaName = $xml.find('SIGUNNM').first().text();

            // 제품 코드와 가격 객체
            const products = {};

            $xml.find('OIL').each(function() {
                const $oil = $(this);
                const prodCd = $oil.find('PRODCD').text();
                const price = parseFloat($oil.find('PRICE').text());

                // 객체에 key-value 형태로 저장
                products[prodCd] = price;
            });

            // 결과 객체
            const areaData = {
                area: areaName,
                products: products
            };

            gsRatingScore();
            ratingCount();
            //console.log(areaData);

            // 주유소 이름, 주소, 전화번호 넣기
            document.getElementById("oil-info-area").innerText = `${areaName} 평균`;
            document.getElementById("oil-diesel-price2").innerText = areaData.products['D047'] ? `${Math.round(areaData.products['D047'])}원`  : 'X';
            document.getElementById("oil-gasoline-price2").innerText = areaData.products['B027'] ? `${Math.round(areaData.products['B027'])}원`  : 'X';
            document.getElementById("oil-premiumGasoline-price2").innerText = areaData.products['B034'] ? `${Math.round(areaData.products['B034'])}원`  : 'X';
            document.getElementById("oil-kerosene-price2").innerText = areaData.products['C004'] ? `${Math.round(areaData.products['C004'])}원`  : 'X';
            document.getElementById("oil-lpg-price2").innerText = areaData.products['K015'] ? `${Math.round(areaData.products['K015'])}원`  : 'X';



        },
        error: function(err) {
            console.error("API 호출 실패:", err);
        }
    });
}



    // ---------------------------- rating 관련 js
    async function gsRatingScore() {
    const gsId = stationId

    // 2. API 호출
    try {
    const response = await fetch(`${API_BASE_URL1}/getRating?gsId=${gsId}`);

    if (!response.ok) {
    throw new Error("서버 요청 실패");
}

    // 3. 결과값 받기
    const avgRating = await response.text(); // 백엔드가 double 반환하므로 text()로 받음
   // console.log(avgRating);

    // 4. 결과 화면에 표시
    document.getElementById("result-score").innerText = `${avgRating}`;

} catch (error) {
    console.error(error);
}


}

    async function ratingCount() {
    const gsId = stationId

    // 2. API 호출
    try {
    const response = await fetch(`${API_BASE_URL1}/ratingCount?gsId=${gsId}`);

    if (!response.ok) {
    throw new Error("서버 요청 실패");
}

    // 3. 결과값 받기
    const ratingCount = await response.text(); // 백엔드가 double 반환하므로 text()로 받음

    // 4. 결과 화면에 표시
    document.getElementById("count-rating").innerText = `${ratingCount}`;
} catch (error) {
    console.error(error);
}


}




    async function addRating(stationId, currentScore) {
    const gsId = stationId;
    const rating = currentScore;
    //console.log("주유소Id : " + stationId, "평점" + currentScore);
    try {
    const response = await fetch(`${API_BASE_URL1}/addRating`, {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
},
    credentials: "include", // 세션 쿠키를 함께 보내도록
    body: JSON.stringify({
    gsId: gsId,
    rating: rating  // userId 제거
}),
});

    if (response.ok) {
    const result = await response.text();
    alert(result);
} else if (response.status === 401) {
    alert("로그인이 필요합니다.");
} else {
    const errorText = await response.text();
    alert("등록 실패: " + errorText);
}
} catch (error) {
    console.error("에러 발생:", error);
}
}


    document.getElementById('go-fav').classList.add('active');
    document.getElementById('go-jido').classList.remove('active');

    document.getElementById('go-jido').addEventListener('click', function() {
    window.location.href = '/jido';
});

// 모든 메뉴에서 active 제거
document.querySelectorAll('li > a').forEach(a => a.classList.remove('active'));

// 특정 메뉴에 active 추가
document.querySelector('li > a[href="/favorites"]').classList.add('active');

document.querySelector('li > a[href="/jido"]').classList.add('active1');

    /* ----------------------------윤선1 */
    //     -----------------------------------------------------------윤선
