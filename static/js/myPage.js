// 네비게이션 - 모바일 반응형 js 추가
document.querySelector('li > a[href="/jido"]').classList.add('active1');

// 네비게이션 - 현재 페이지 클릭 표시
document.querySelector('a[href="/mypage"]').classList.add('active');

// 아코디언 메뉴 열리는 효과
let col1 = document.getElementsByClassName("collapsible");
let i;

for (i=0; i<col1.length; i++) {
    col1[i].addEventListener("click", function() {
        this.classList.toggle("open");
        let content = this.nextElementSibling;
        if(content.style.maxHeight) {
            content.style.maxHeight = null;
            // content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    })
}

window.addEventListener("load", () => {
    // console.log("리소스 로딩 시작");
    // 리뷰 목록 기능
    showReviewList();

    // 보유 포인트 조회 기능
    showCurrentPoint();

    // 포인트 변동 내역 조회 기능
    showPointHistory();

    // 회원정보 조회 기능
    showUserInfo();

})

// 리뷰 목록 기능
async function showReviewList() {
    const res = await fetch("/api/mypage/reviews", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
    })

    if(res.status === 401) {
        alert("로그인이 필요합니다.")
        location.href = "/login";
        return;
    }

    const result = await res.json();
    // console.log("리뷰 목록: ", result);

    const reviewList = document.querySelector("#reviewList");  // <ul> 태그
    if(!Array.isArray(result) || result.length === 0) {
        reviewList.innerHTML = `<li>작성한 리뷰가 없습니다.</li>`
        return;
    }

    reviewList.innerHTML = result.map(item => `
            <li class="review-item">
                <div id="reviewDate">${item.createdAt.split(" ")[0]}</div>
                <div id="reviewStation">${item.stationName}</div>
                <div id="reviewRating">${renderStars(item.ratingScore)}</div>
            </li>
        `).join("");
}

// 별점 아이콘 반환 기능
function renderStars(score) {
    const fullStar = `<i class="fa-solid fa-star star-icon"></i>`
    const halfStar = `<i class="fa-solid fa-star-half-stroke star-icon"></i>`
    const emptyStar = `<i class="fa-regular fa-star star-icon"></i>`

    // console.log("평점: ", score);

    const num = Number(score);
    const rounded = Math.round(num * 2) / 2;

    const full = Math.floor(rounded); // 정수
    const hasHalf = rounded - full === 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    return (
        fullStar.repeat(full) +
        (hasHalf ? halfStar : '') +
            emptyStar.repeat(empty)
    );
}

// 보유 포인트 조회 기능
async function showCurrentPoint() {
    const res = await fetch("/api/mypage/point", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
    })

    const result = await res.json();
    // console.log("현재 포인트: ", result.currentPoint);

    const totalPoint = document.querySelector("#totalPoint");
    totalPoint.innerHTML = `${result.currentPoint}`;
}

// 포인트 변동 모달팝업 작업
const pointModal = document.querySelector("#pointModal");
const modalBackground = document.querySelector("#pointModal .modal-background");
const pointModalOpen = document.querySelector("#pointListBtn");
const pointModalClose = document.querySelector("#pointModalBtn");

pointModalOpen.addEventListener("click", () => {
    // console.log("버튼 클릭 이벤트 발생")
    pointModal.classList.add("on");
});

pointModalClose.addEventListener("click", () => {
    // console.log("닫기 버튼 클릭")
    pointModal.classList.remove("on");
})

pointModal.addEventListener("click", (e) => {
    if(e.target === pointModal) {

            // console.log("배경 클릭으로 모달 닫기")
            pointModal.classList.remove("on");
    }
})

// 포인트 변동 내역 조회 기능
async function showPointHistory() {
    const res = await fetch("api/mypage/point/detail", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
    })

    const result = await res.json();
    // console.log("포인트 변동 이력: ", result);

    const modalUserName = document.querySelector("#modalUserName");
    const historyList = document.querySelector(".history-list");

    modalUserName.innerHTML = `${result[0].userId}`;
    historyList.innerHTML = result.map(item => {
        const description = item.description;
        const changeNum = Number(item.pointChange);  // 받아온 문자열을 숫자로 형변환
        const changeNumType = description === "리뷰 작성" ? -changeNum : changeNum;
        const isNegative = changeNumType < 0;
        const colorClass = isNegative ? "font-red" : "font-green";
        const displayValue = changeNumType > 0 ? `+${changeNum}` : `${changeNum}`;

        return `
            <div class="history-content">
                <div class="content-item">
                    <div class="content-description font-bold">${item.description}</div>
                    <div class="content-date font-gray2">${item.createdAt.split(" ")[0]}</div>
                </div>
                <div class="content-item">
                    <div class="content-point font-bold ${colorClass}">${displayValue} P</div>
                </div>
            </div>
        `}).join("");
}

// 회원정보 조회 기능
async function showUserInfo() {
    const res = await fetch("/api/mypage/info", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
    })

    const result = await res.json();
    // console.log("회원 정보: ", result);

    const userInfoList = document.querySelector("#userInfoList");
    userInfoList.innerHTML = `
            <li class="userInfoItem">
                <div class="info-gap"></div>
                <div class="info-title">
                    이름
                </div>
                <div class="info-cell">
                    ${result.userName}
               </div>
            </li>
            <li class="userInfoItem">
                <div class="info-gap"></div>
                <div class="info-title">
                    이메일
                </div>
                <div class="info-cell">
                    ${result.userEmail}
                </div>
            </li>
            <li class="userInfoItem">
                <div class="info-gap"></div>
                <div class="info-title">
                    연락처 
                </div>
                <div class="info-cell">
                    ${result.userPhone}
                </div>
            </li>
        `;
}

// 비밀번호 변경 모달팝업 작업
const pwmodal = document.querySelector("#pwModal");
const pwModalOpen = document.querySelector("#pwChangeBtn");
const pwModalClose = document.querySelector("#pwModalBtn");

pwModalOpen.addEventListener("click", () => {
    // console.log("버튼 클릭 이벤트 발생")
    pwmodal.classList.add("on");
});

// pwModalClose.addEventListener("click", () => {
//     // console.log("닫기 버튼 클릭")
//     pwmodal.classList.remove("on");
// })

pwmodal.addEventListener("click", (e) => {
    if(e.target === pwmodal) {
        // console.log("배경 클릭으로 모달 닫기")
        pwmodal.classList.remove("on");
    }
})

// 비밀번호 변경
const pwModalBtn = document.querySelector("#pwModalBtn");
pwModalBtn.addEventListener("click", async () => {
    const oldPw = document.querySelector("#currentPw");
    const newPw = document.querySelector("#newPw");
    const newPwChk = document.querySelector("#newPwChk");
    const oldVal = oldPw.value.trim();
    const newVal = newPw.value.trim();
    const newChkVal = newPwChk.value.trim();


    // 빈 칸 체크
    if(!oldVal || !newVal || !newChkVal) {
        alert("모든 항목을 입력해주세요.");
        return;
    }

    // 새로운 비밀번호 유효성 검사
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]).{8,16}$/;
    if(!pwRegex.test(newVal)) {
        alert("비밀번호는 영문, 숫자, 특수문자를 조합하여 입력해야 합니다. (8-16자)")
        newPw.focus();
    }

    // 비밀번호 확인 일치 검사
    if(newVal !== newChkVal) {
        alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        newPwChk.focus();
        return;
    }

    if (oldVal === newVal) {
        alert("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        return;
    }

    try {
        const res = await fetch("/api/mypage/password", {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({
                oldPassword: oldVal,
                newPassword: newVal,
                newPasswordCheck: newChkVal,
            }),
        })

        const result = await res.json()
        // console.log("비밀번호 변경 응답: ", result)
        alert(result.message || (res.ok ? "비밀번호가 변경되었습니다." : "비밀번호 변경에 실패했습니다."));

        if(res.ok) {
            oldPw.value = "";
            newPw.value = "";
            newPwChk.value = "";

            location.href = "/login";
        }
    } catch(err) {
        console.error("비밀번호 변경 요청 중 오류: ", err);
        alert("네트워크 오류로 비밀번호 변경에 실패했습니다.");
    }

    if(oldVal === newVal) {
        alert("기존 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.");
        newPw.focus();
        return;
    }
})

// 로그아웃 기능
const logoutBtn = document.querySelector("#logoutBtn");
logoutBtn.addEventListener("click", async () => {
    try{
        const res = await fetch("/api/logout", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
        })

        const result = await res.json();
        // console.log("로그아웃: ", result)

        if(res.ok) {
            alert("로그아웃 되었습니다.");
            location.href = "/";
        } else {
            alert(data.message || "로그아웃에 실패했습니다.")
        }
    } catch (err) {
        console.error("로그아웃 요청 중 오류: ", err);
        alert("네트워크 오류로 로그아웃에 실패했습니다.");
    }
})

// 회원탈퇴 기능
const withdrawBtn = document.querySelector("#withdrawBtn");
withdrawBtn.addEventListener("click", async () => {
    if(confirm("회원탈퇴를 진행하시겠습니까?")) {
        try{
            // console.log("회원탈퇴 시작");
            const res = await fetch("/api/mypage/withdraw", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            })

            const result = await res.json();
            // console.log("회원 탈퇴: ", result);

            if(res.ok) {
                alert("탈퇴가 완료되었습니다.")
                // console.log("회원탈퇴 완료");
                location.href = "/";
            } else {
                alert("회원 탈퇴에 실패하였습니다. 다시 시도해주세요.")
            }
        } catch(err) {
            console.error("회원탈퇴 요청 중 오류: ", err);
            alert("네트워크 오류로 회원탈퇴에 실패했습니다.");
        }
    } else {
        // console.log("회원탈퇴 취소");
    }

})