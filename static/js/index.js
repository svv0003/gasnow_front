document.querySelector('li > a[href="/jido"]').classList.add('active1');

/*================================================================================================
전역 변수, 객체, 배열
================================================================================================*/
// const API_KEY = "F251114133";
let API_KEY = null;                                               // config-properties opinet.api.key
const DB_URL = "http://localhost:8080/api";                     // DB URL
const API_BASE_URL = "https://axis-convert-new.vercel.app";     // API 중계 URL

/*=================================================
시도별 유종별 현재가
${API_BASE_URL}/api/avg-sido-price
<RESULT>
  <OIL>
    <SIDOCD>01</SIDOCD>
    <SIDONM>서울</SIDONM>
    <PRODCD>B034</PRODCD>
    <PRICE>1910.12</PRICE>
    <DIFF>1910.12</DIFF>
  </OIL>
</RESULT>
=================================================*/
let allOilPrice = [];                            // 시도별 유종별 현재가 API 데이터를 저장할 배열
let API_SIDOCD_SIDONM_Map = new Map();  // API SIDOCD SIDONM Map
let yesterdayPricesMap = new Map();     // 전날 평균가 Map

let selectedOil = "B027";       // 선택 유종 변수 (기본값 = 휘발유)
let selectedArea = "01";        // 선택 지역 변수 (기본값 = 서울)
let selectedPeriod = "week";    // 선택 기간 변수 (기본값 = 일주일)
const defaultDiffArea = "00";   // 고정 지역 변수 (전일대비등락률 => 전국 기준)

/*=================================================
HTML
<path>    id="KR11"       Seoul
<text>    id="label-KR11" Seoul
<button>  id="B027"       휘발유

API
<SIDOCD>      01          Seoul
<PRODCD>      B027        휘발유
=================================================*/
const PRODCD_to_Korean = {
    B034: "고급휘발유",
    B027: "휘발유",
    D047: "경유",
    C004: "등유",
    K015: "LPG",
};          // API PRODCD : PRODNM
const pathId_to_SIDOCD = {
    KR11: "01", // 서울
    KR26: "10", // 부산
    KR27: "14", // 대구
    KR28: "15", // 인천
    KR29: "16", // 광주
    KR30: "17", // 대전
    KR31: "18", // 울산
    KR41: "02", // 경기
    KR42: "03", // 강원
    KR43: "04", // 충북
    KR44: "05", // 충남
    KR45: "06", // 전북
    KR46: "07", // 전남
    KR47: "08", // 경북
    KR48: "09", // 경남
    KR49: "11", // 제주
    KR50: "19", // 세종
};      // Path id : API AREACD
const SIDOCD_to_pathId = {};                     // API 지역 코드 : Path id

let chart = null;                              // Chart
const areaCodeToName = {
    "01" : "서울",
    "02" : "경기",
    "03" : "강원",
    "04" : "충북",
    "05" : "충남",
    "06" : "전북",
    "07" : "전남",
    "08" : "경북",
    "09" : "경남",
    "10" : "부산",
    "11" : "제주",
    "14" : "대구",
    "15" : "인천",
    "16" : "광주",
    "17" : "대전",
    "18" : "울산",
    "19" : "세종"
};      // Chart 지역 매핑 객체

let currentTickerIndex = 0;             // 티커 현재 idx
const tickerItemHeight = 40;            // 티커 높이 -> CSS에서 .diff-box 높이와 일치하도록 작성한다.
const tickerTransitionTime = 500;       // 티커 전환 = 0.5초 (CSS transition 시간)
const $tickerList = $("#tickerList");             // HTML <ul> id
let totalTickerItems = 0;              //


/*================================================================================================
페이지 로드 시 실행되는 메인 함수
1. 이벤트 리스너 설정
2. 로그인 상태 확인
3. API, DB 데이터 호출
4. UI 렌더링


1. 페이지 로드 시 API 요청하고, 응답을 확인한다.
   ${API_BASE_URL}/api/avg-sido-price
2. 요청 성공 시 API 데이터 (XML 문자열)를 XML 문서 객체로 파싱하여 저장한다.
3. 파싱된 XML 문서를 jQuery 객체러 감싸서 탐색이 쉽도록 한다.
4. <OIL> 태그를 모두 찾아서 순회하도록 한다. (each)
5. <OIL> 태그 내부의 데이터를 추출하여 객체에 저장한다.
6. 객체에 저장된 데이터를 allOilPrice 배열에 저장한다.
7. API_SIDOCD_SIDONM_Map
8. 초기 렌더링 후 기본값인 휘발유 가격을 표시한다.
================================================================================================*/
$(document).ready(initializeApp);

async function initializeApp() {
    // console.log("페이지 초기화 시작...");
    setupEventListeners();                                  // 클릭 이벤트 핸들러부터 설정
    checkLoginStatus();                                     // 로그인 상태 확인
    try {                                                   // 데이터 호출 (API 키, 유가 정보, DB 정보)
        API_KEY = await fetchApiKey();                      // API Key 조회
        // console.log("API Key 조회 성공: ", API_KEY);
        const xmlData = await fetchOilPriceData(API_KEY);   // API Key 사용해서 Opinet 유가 정보 조회
        // console.log("Opinet 유가 정보 조회 성공");
        parsePriceData(xmlData);                    // 가져온 XML 데이터 파싱 후 전역 변수 저장
        // console.log("XML 파싱 및 데이터 저장 완료");
        updateMapPrices(selectedOil);                       // 지도 <text> 가격 업데이트
        await initializePriceTickers(defaultDiffArea);      // 상단 가격 정보 및 티커 초기화
        await updateChart();                                // 기본값 (서울, 휘발유, 주간)으로 차트 렌더링
        // console.log("페이지 렌더링 성공");
        // setTimeout(startAutoCycle, 2000);                // 슬라이드 시작
    } catch (error) {
        console.error("페이지 초기화 실패:", error);        // 초기화 과정에서 오류 발생
        alert("데이터 로드 실패. 페이지를 새로고침 해주세요.");
    }
}

document.querySelector('li > a[href="/"]').classList.add('active');

/*================================================================================================
모든 이벤트 리스너 함수
================================================================================================*/
function setupEventListeners() {
    /*================================================================================================
    지도 지역 클릭 시
    1. 모든 지역에서 .on 클래스를 제거하고,
       클릭한 지역에 .on 클래스를 추가한다.
    2. selectedArea 변수에 pathId_to_SIDOCD 객체에서 조회한 API SIDOCD를 저장한다.
    3. selectedArea 변수를 매개변수로 차트 그래프에 사용할 예정이다.
    ================================================================================================*/
    $(".region").on("click", function () {
        $(".region").removeClass("on");
        $(this).addClass("on");
        selectedArea = pathId_to_SIDOCD[$(this).attr("id")];
        // console.log("지역 선택 (SVG pathId):", pathId);
        // console.log("지역 선택 (API SIDOCD):", selectedArea);
        // stopAutoCycle();
        updateChart();
    });

    /*================================================================================================
    유종 버튼 클릭 시
    1. 모든 유종 버튼에서 .on 클래스를 제거하고,
       클릭한 버튼에 .on 클래스를 추가한다.
    2. selectedOil 변수에 해당 버튼의 id를 할당한다.
    3. selectedOil 변수를 매개변수로 updateDisplay 함수를 호출한다.
    ================================================================================================*/
    $(".oil-btn").on("click", function () {
        $(".oil-btn").removeClass("on");
        $(".diff-box").removeClass("on");
        const btnId = $(this).attr("id");
        const btnOil = btnId.replace("Btn", "");
        $(this).addClass("on");
        $("#" + btnOil + "DiffBox").addClass("on");
        selectedOil = btnOil;
        updateMapPrices(selectedOil);                               // 지도 가격 업데이트
        // console.log("유종 선택:", selectedOil);
        // stopAutoCycle();
        updateChart();
    });

    /*================================================================================================
    유종 박스 클릭 시
    ================================================================================================*/
    $(".diff-box").on("click", function () {
        $(".oil-btn").removeClass("on");
        $(".diff-box").removeClass("on");
        const boxId = $(this).attr("id");
        const boxOil = boxId.replace("DiffBox", "");
        $("#" + boxOil + "Btn").addClass("on");
        $("#" + boxOil + "DiffBox").addClass("on");
        selectedOil = boxOil;
        updateMapPrices(selectedOil);                               // 지도 가격 업데이트
        // console.log(boxOil);
        // console.log($("#" + "btn-" + boxOil).attr("class"));
        // stopAutoCycle();
        updateChart();
    });


    /*================================================================================================
    기간 버튼 클릭 시
    ================================================================================================*/
    $(".period-btn").on("click", function () {
        $(".period-btn").removeClass("on");
        $(this).addClass("on");
        selectedPeriod = $(this).attr("id");
        // console.log(selectedPeriod);
        // stopAutoCycle();
        updateChart();
    });

    /*================================================================================================
    로그인, 회원가입 버튼 => loginPageLink(), registerPageLink() 함수로 대체
    ================================================================================================*/

    /*================================================================================================
    모바일 환경 지도/차트 토글
    ================================================================================================*/
    $("#showMapBtn").on("click", function () {
        $(".toggle-btn").removeClass("on");
        $(this).addClass("on");
        $(".chart-container").removeClass("on");
        $(".map-container").addClass("on");
    });

    $("#showChartBtn").on("click", function () {
        $(".toggle-btn").removeClass("on");
        $(this).addClass("on");
        $(".map-container").removeClass("on");
        $(".chart-container").addClass("on");
        setTimeout(() => {
            if (chart) {
                chart.resize();
            }
        }, 10);
    });
}

/*================================================================================================
API Key 호출 함수
================================================================================================*/
async function fetchApiKey() {
    const response = await fetch('/api/config/key');
    if (!response.ok) {
        throw new Error('API 키 응답이 올바르지 않습니다.');
    }
    const data = await response.json();
    if (!data.apiKey) {
        throw new Error('API 키 값이 비어있습니다.');
    }
    return data.apiKey;
}


/*================================================================================================
Opinet API 프록시에서 유가 데이터 조회
================================================================================================*/
function fetchOilPriceData(apiKey) {
    // jQuery.ajax는 Promise를 반환하므로 async/await와 호환됩니다.
    return new Promise((resolve, reject) => {
        $.ajax({
            method: "GET",
            url: `${API_BASE_URL}/api/avg-sido-price`,
            data: {
                api_key: apiKey,
            },
            success: function (data) {
                if (data && data.xml_data) {
                    // console.log("API 전체 응답:", data);
                    resolve(data.xml_data); // XML 문자열만 반환
                } else {
                    console.error("API 응답에 xml_data가 없습니다:", data);
                    reject(new Error("API 응답 형식이 올바르지 않습니다."));
                }
            },
            error: function (xhr, status, error) {
                console.error("API 호출 실패:", error);
                reject(new Error("데이터를 불러오는 데 실패했습니다."));
            },
        });
    });
}

/*================================================================================================
MySQL DB 전일 평균가 데이터 조회
1. Fetch 사용해서 DB endpoint 경로 GET 요청한다.
2. 서버 응답 예외 처리한다. (404, 500 등)
3. JSON 데이터를 JavaScript 객체로 변환하여 반환한다.
================================================================================================*/
async function fetchYesterdayData() {
    const res = await fetch("/api/chart/yesterday");
    if (!res.ok) {
        throw new Error("서버 응답 오류 (yesterday): " + res.status);
    }
    return await res.json();
}

/*================================================================================================
fetchOilPriceData 함수로 가져온 XML 문자열을 파싱 후
전역 변수 allOilPrice, API_SIDOCD_SIDONM_Map 저장
================================================================================================*/
function parsePriceData(xmlData) {
    try {
        const xmlDoc = $.parseXML(xmlData);
        const $xml = $(xmlDoc);

        $xml.find("OIL").each(function () {
            const $oil = $(this);
            const oilData = {
                SIDOCD: $oil.find("SIDOCD").text(),
                SIDONM: $oil.find("SIDONM").text(),
                PRODCD: $oil.find("PRODCD").text(),
                PRICE: $oil.find("PRICE").text(),
            };
            allOilPrice.push(oilData);

            if (!API_SIDOCD_SIDONM_Map.has(oilData.SIDOCD)) {
                API_SIDOCD_SIDONM_Map.set(oilData.SIDOCD, oilData.SIDONM);
            }
        });

        // console.log("XML 파싱 후 allOilPrice:", allOilPrice);
        if (allOilPrice.length === 0) {
            // alert("데이터 파싱에 성공했으나, 유가 정보가 없습니다.");
            console.warn("데이터 파싱에 성공했으나, 유가 정보가 없습니다.");
        }
    } catch (parseError) {
        console.error("XML 파싱 중 오류 발생:", parseError);
        throw new Error("XML 데이터를 파싱하는 데 실패했습니다.");
    }
}

/*================================================================================================
SVG 지도 내부 <text> 가격 업데이트


1. API_SIDOCD_SIDONM_Map에 저장된 모든 지역을 순회한다.
   forEach -> SIDOCD: '01', SIDONM: '서울'
2. SIDOCD_to_pathId 객체에서 SIDOCD로 pathId를 조회한다.
3. 조회되지 않는 pathId는 건너뛰고,
4. allOilPrice 배열에서 각 요소의 SIDOCD, PRODCD가
   API_SIDOCD_SIDONM_Map을 순회하여 조회된 SIDOCD와 동일하고,
   selectedOil 변수와 동일한 요소만 조회한다.
5. 조회한 요소에서 PRICE만 정수로 표현하여 해당 지역의 <text> 태그 내용으로 업데이트한다.
================================================================================================*/
function updateMapPrices(selectedOil) {
    API_SIDOCD_SIDONM_Map.forEach((sidonm, sidocd) => {
        const path_id = SIDOCD_to_pathId[sidocd];
        if (!path_id) return;                        // "전국(00)" 등 맵핑 안된 지역 건너뛰기

        const priceData = allOilPrice.find(
            (item) => item.SIDOCD === sidocd && item.PRODCD === selectedOil
        );

        let displayText = "";
        if (priceData && priceData.PRICE) {
            const formattedPrice = Math.floor(priceData.PRICE).toLocaleString("ko-KR");
            displayText = `${formattedPrice}원`;
        }

        $("#label-" + path_id).text(displayText);
    });
}

/*================================================================================================
전일대비등락률 및 티커 초기화
================================================================================================*/
async function initializePriceTickers(defaultDiffArea) {
    // 1. DB에서 어제자 가격 가져오기
    try {
        const chartData = await fetchYesterdayData(); // (getData -> fetchYesterdayData)
        chartData.forEach((item) => {
            yesterdayPricesMap.set(item.oilCategory, item.avgPrice);
        });
        // console.log("yesterdayPricesMap:", yesterdayPricesMap);
    } catch (e) {
        console.error("DB (어제자) 데이터 조회 실패:", e);
        // 실패해도 API 데이터만이라도 보여주기 위해 중단하지 않습니다.
    }

    // 2. Opinet API 데이터 (전국) 필터링
    const nationalPrice = allOilPrice.filter(
        (item) => item.SIDOCD === defaultDiffArea
    );

    $tickerList.empty(); // <ul> 비우기

    // 3. HTML 생성 및 삽입
    nationalPrice.forEach((priceData) => {
        const prodcd = priceData.PRODCD;
        const currentPriceStr = priceData.PRICE;
        let formattedPrice = "";

        if (currentPriceStr) {
            formattedPrice = parseFloat(currentPriceStr).toLocaleString("ko-KR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }) + "원";
        }

        // (기존) .diff-price 업데이트
        $("#" + prodcd + "DiffPrice").text(formattedPrice);

        // (공통) 전일 대비 계산
        const yesterdayPriceStr = yesterdayPricesMap.get(prodcd);
        const diffData = calculateDiff(prodcd, currentPriceStr, yesterdayPriceStr); // (showDiff -> calculateDiff)

        // (신규) .ticker-box <li> 생성
        const oilName = PRODCD_to_Korean[prodcd] || prodcd;
        const liHtml = `
          <li class="ticker-box ${diffData.className}">
            <div class="ticker-oil">${oilName}</div>
            <div class="ticker-price">${formattedPrice}</div>
            <div class="ticker-percent">${diffData.displayText}</div>
          </li>`;
        $tickerList.append(liHtml);
    });

    // 4. 티커 롤링 준비
    totalTickerItems = nationalPrice.length;
    if (totalTickerItems > 0) {
        // 첫 번째 항목 복제
        const $firstItemClone = $tickerList.children().first().clone();
        $tickerList.append($firstItemClone);

        // 4초마다 티커 실행
        setInterval(runTickerLoop, 4000);
    }
}

/**
 * 전일 대비 가격 변동을 계산하고, .diff-percent 영역 업데이트
 * (기존 showDiff 함수에서 계산 로직과 HTML 반환 로직을 분리)
 */
function calculateDiff(prodcd, currentPriceStr, yesterdayPriceStr) {
    const diff_percent_id = $("#" + prodcd + "DiffPercent"); // (기존 .diff-percent 업데이트용)
    const currentPrice = parseFloat(currentPriceStr);
    const yesterdayPrice = parseFloat(yesterdayPriceStr);

    if (!yesterdayPrice || yesterdayPrice === 0) {
        diff_percent_id.text("-").removeClass("up down");
        return { displayText: "-", className: "" };
    }

    const calPrice = currentPrice - yesterdayPrice;
    const calPercent = (calPrice / yesterdayPrice) * 100;

    let displayText = "";
    let className = "";

    if (calPrice > 0) {
        displayText = `▲${calPrice.toLocaleString("ko-KR")}원(${calPercent.toFixed(2)}%)`;
        className = "up";
    } else if (calPrice < 0) {
        displayText = `▼${Math.abs(calPrice).toLocaleString("ko-KR")}원(${Math.abs(calPercent).toFixed(2)}%)`;
        className = "down";
    } else {
        displayText = `0원(0.00%)`;
        className = "";
    }

    // (기존 .diff-percent 업데이트)
    diff_percent_id.text(displayText).removeClass("up down").addClass(className);

    // 티커용 데이터 반환
    return { displayText: displayText, className: className };
}



/**
 * 티커 롤링 애니메이션을 실행
 */
function runTickerLoop() {
    currentTickerIndex++;

    $tickerList.css('transform', `translateY(-${currentTickerIndex * tickerItemHeight}px)`);

    if (currentTickerIndex === totalTickerItems) {
        setTimeout(() => {
            $tickerList.css('transition', 'none');
            $tickerList.css('transform', 'translateY(0)');
            currentTickerIndex = 0;

            setTimeout(() => {
                $tickerList.css('transition', `transform ${tickerTransitionTime}ms ease`);
            }, 50);
        }, tickerTransitionTime);
    }
}


/*================================================================================================
차트 데이터 요청 후 <canvas> 업데이트


1. HTML에서 지역 <path> 기간 <button> 선택 값을 변수에 저장한다.
2. JS에서 RestController GetMapping endpoint API를 Fetch로 데이터 요청을 보낸다.
3. RestController에서 전달 받은 선택 값을 파라미터로, DB 데이터를 조회하는 Mapper를 호출한다.
4. Spring Boot가 DB 조회 결과 (List<Chart>)를 JSON 배열로 변환하여 응답한다.
5. fetch의 .then() (또는 await 이후)에서 이 JSON 배열을 Chart.js가 요구하는 포맷(labels 배열, data 배열)으로 변환한다.
6. 변환된 데이터로 Chart.js 차트를 그리거나 업데이트합니다.
================================================================================================*/
async function updateChart() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const tabs = document.getElementById('tabs');
    const chartContainer = document.getElementById('chartContainer');
    const legend = document.getElementById('legend');
    const localAreaName = document.getElementById('localAreaName');

    // 초기화
    loading.style.display = 'block';
    error.textContent = '';
    error.style.display = 'none';
    tabs.style.display = 'none';
    chartContainer.style.display = 'none';
    legend.style.display = 'none';

    const selectedKoreanArea = areaCodeToName[selectedArea];
    if (!selectedKoreanArea) {
        loading.style.display = 'none';
        error.textContent = '지역을 선택해주세요.';
        error.style.display = 'block';
        return;
    }

    $("#localName").text(selectedKoreanArea); // jQuery 사용
    const chartURL = `/api/chart/data?oilCategory=${selectedOil}&areaName=${selectedKoreanArea}&period=${selectedPeriod}`;
    // console.log("차트 요청 URL:", chartURL);

    try {
        const res = await fetch(chartURL); // (localhost:8080 제거 - 상대 경로 사용)
        if (!res.ok) {
            throw new Error(`서버 오류: ${res.status}`);
        }

        const chartData = await res.json();
        // console.log("서버 응답 데이터:", chartData);

        if (!chartData || typeof chartData !== 'object') {
            throw new Error("응답 데이터가 비어 있습니다.");
        }

        const periodKey = selectedPeriod;
        if (!chartData[periodKey]) {
            throw new Error(`기간 데이터 없음: ${periodKey}`);
        }

        const periodData = chartData[periodKey];
        if (!periodData.labels || !periodData.전국 || !periodData[selectedKoreanArea]) {
            throw new Error("차트 필수 데이터 누락");
        }

        // UI 보이기
        loading.style.display = 'none';
        tabs.style.display = 'flex';
        chartContainer.style.display = 'block';
        legend.style.display = 'flex';
        if (localAreaName) localAreaName.textContent = selectedKoreanArea;

        // 차트 렌더링
        renderChart(chartData, selectedArea, periodKey);

        setTimeout(() => {
            if (chart) chart.resize();
        }, 100);

    } catch (err) {
        loading.style.display = 'none';
        error.textContent = err.message || '데이터를 불러오는데 실패했습니다.';
        error.style.display = 'block';
        console.error("차트 에러:", err);
    }
}

/*================================================================================================
Chart.js 객체를 제거 후 재생성
================================================================================================*/
function renderChart(data, areaCode, periodKey) {
    // console.log("renderChart 시작");

    const canvas = document.getElementById('priceChart');
    if (!canvas) {
        console.error("캔버스 요소 없음! #priceChart 확인");
        return;
    }
    const ctx = canvas.getContext('2d');

    if (chart) {
        // console.log("기존 차트 제거");
        chart.destroy();
    }

    const chartData = data[periodKey];
    const koreanArea = areaCodeToName[areaCode];
    if (!koreanArea || !chartData[koreanArea]) {
        console.error("차트 렌더링 데이터 없음:", koreanArea);
        return;
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + context.parsed.y + '원';
                    }
                }
            }
        },
        scales: {
            y: {
                ticks: {
                    font: { size: 11 },
                    color: 'black'
                },
                grid: { color: '#cccccc' },
                grace: '10%',
            },
            x: {
                type: 'category',
                ticks: {
                    font: { size: 11 },
                    maxRotation: 45,
                    minRotation: 45,
                    color: 'black'
                },
                grid: { display: false }
            }
        }
    };

    try {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: '전국',
                        data: chartData['전국'] || [],
                        borderColor: '#0d47a1',
                        backgroundColor: '#0d47a1',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#0d47a1',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        fill: false
                    },
                    {
                        label: koreanArea,
                        data: chartData[koreanArea] || [],
                        borderColor: '#ff0055',
                        backgroundColor: '#ff0055',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#ff0055',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: chartOptions
        });
        // console.log("차트 생성 성공!");
    } catch (err) {
        console.error("Chart.js 생성 실패:", err);
    }
}


/*================================================================================================
로그인 / 로그아웃 버튼
로그인 상태 확인 후 UI 업데이트
================================================================================================*/
function registerPageLink() {
    window.location.href = "register";
}

function loginPageLink() {
    window.location.href = "login";
}

function myPageLink() {
    window.location.href = "mypage";
}

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/mypage/info');
        if (response.ok) {
            const user = await response.json();
            // console.log('로그인된 사용자:', user.userName);
            $("#welcomeBtn").text(`${user.userName}님, 환영합니다!`);
            $("#welcomeBtn").addClass("on");
            $("#registerBtn").removeClass("on");
            $("#loginBtn").removeClass("on");

        } else {
            // console.log('로그인 상태가 아닙니다.');
            $("#registerBtn").addClass("on");
            $("#loginBtn").addClass("on");
            $("#welcomeBtn").removeClass("on");
        }
    } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        $("#registerBtn").addClass("on");
        $("#loginBtn").addClass("on");
        $("#welcomeBtn").removeClass("on");
    }
}

$("#mapImg").on("click", function () {
    window.location.href = "jido";
})

$("#mypageImg").on("click", function () {
    window.location.href = "login";
})





/*================================================================================================
.diff-price 내용 업데이트
1. allOilPrice 배열에서 SIDOCD가 "00"인 요소만 필터링한다.
2. 필터링된 요소를 순회하면서 유종과 가격을 변수에 할당한다.
3. 조회한 가격과 유종을 해당 유종 현재가 <div> 태그 내용으로 업데이트한다.
4. showDiff 함수에 사용될 DB 데이터를 Map에 저장한다.
5. Map에서 유종별로 조회한 전날 평균가와 현재가를 매개변수로 showDiff 함수를 호출한다.

async function showPrice(defaultDiffArea) {
  try {
    const chartData = await getData();
    chartData.forEach((item) => {
      yesterdayPricesMap.set(item.OIL_CATEGORY, item.AVG_PRICE);
    });
    console.log("yesterdayPricesMap:", yesterdayPricesMap);
  } catch (e) {
    console.error("DB 데이터 조회 실패:", e);
  }
  const nationalPrice = allOilPrice.filter(
    (item) => item.SIDOCD === defaultDiffArea
  );
  nationalPrice.forEach((priceData) => {
    const prodcd = priceData.PRODCD;
    const currentPriceStr = priceData.PRICE;
    let displayText = "";
    if (currentPriceStr) {
      displayText =
        parseFloat(currentPriceStr).toLocaleString("ko-KR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }) + "원";
        console.log(displayText);
    }
    const diff_price_id = $("#" + prodcd + "DiffPrice");
    diff_price_id.text(displayText);
    const yesterdayPriceStr = yesterdayPricesMap.get(prodcd);
    showDiff(prodcd, currentPriceStr, yesterdayPriceStr);
  });
}
================================================================================================*/


/*================================================================================================
.diff-percent 내용 업데이트
1. 매개변수로 받은 현재가와 전날 평균가를 숫자로 변환한다.
2. 전날 평균가가 없다면 종료하고, 있다면 차익과 백분율을 계산한다.

function showDiff(prodcd, currentPriceStr, yesterdayPriceStr) {
  const diff_percent_id = $("#" + prodcd + "DiffPercent");
  const currentPrice = parseFloat(currentPriceStr);
  const yesterdayPrice = parseFloat(yesterdayPriceStr);
  if (!yesterdayPrice || yesterdayPrice === 0) {
    diff_percent_id.text("-");
    diff_percent_id.removeClass("up down");
    return;
  }
  const calPrice = currentPrice - yesterdayPrice;
  const calPercent = (calPrice / yesterdayPrice) * 100;
  diff_percent_id.removeClass("up down");
  let displayText = "";
  if (calPrice > 0) {
    displayText = `▲${calPrice.toLocaleString(
      "ko-KR"
    )}원 (+${calPercent.toFixed(2)}%)`;
    diff_percent_id.addClass("up");
  } else if (calPrice < 0) {
    displayText = `▼${Math.abs(calPrice).toLocaleString(
      "ko-KR"
    )}원 (${calPercent.toFixed(2)}%)`;
    diff_percent_id.addClass("down");
  } else {
    displayText = `0원 (0.00%)`;
  }
  diff_percent_id.text(displayText);
}
================================================================================================*/



/*===============================================================================================
차트 슬라이드 기능
- 타이머 기능으로 순차적으로 다음 지역 데이터를 호출해서 렌더링한다.
- 지역, 기간, 유종 등을 클릭 시 슬라이드 기능 중지된다.
- 더블 클릭 시 슬라이드 기능 다시 시작한다.
// 1. 순회할 모든 지역 코드
const allAreaCodes = ["01","02","03","04","05","06","07","08","09","10","11","14","15","16","17","18","19"];
// 2. 타이머 ID를 저장할 변수
let autoCycleTimer = null;
// 3. 현재 순회 중인 지역 인덱스
let currentAreaIndex = 0;

function startAutoCycle() {
    stopAutoCycle();
    console.log("슬라이드");
    autoCycleTimer = setInterval(() => {
        selectedArea = allAreaCodes[currentAreaIndex];
        updateChart();
        currentAreaIndex++;
        if (currentAreaIndex >= allAreaCodes.length+2) {
            currentAreaIndex = 0;
        }
    }, 5000);
}

function stopAutoCycle() {
    if (autoCycleTimer) {
        clearInterval(autoCycleTimer);
        autoCycleTimer = null;
        currentAreaIndex = 0;
        console.log("자동 순회 중지.");
    }
}

$('#chartContainer').on('dblclick', function() {
    console.log("차트 더블클릭 감지");
    startAutoCycle();
});
================================================================================================*/




/*================================================================================================
<Path> id와 API <SIDOCD> 매핑한 객체를 Key와 Value를 반대로 다른 객체에 저장한다.
================================================================================================*/
for (const svgId in pathId_to_SIDOCD) {
    const apiCode = pathId_to_SIDOCD[svgId];
    SIDOCD_to_pathId[apiCode] = svgId;
}
// console.log("pathId_to_SIDOCD", pathId_to_SIDOCD);
// console.log("SIDOCD_to_pathId", SIDOCD_to_pathId);





