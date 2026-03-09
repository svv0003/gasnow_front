// 네비게이션 - 모바일 반응형 js 추가
document.querySelector('li > a[href="/jido"]').classList.add('active1');

const username = document.querySelector("#registerForm input[name=username]");
const userId = document.querySelector("#registerForm input[name=userId]");
const userPw = document.querySelector("#registerForm input[name=userPassword]");
const userPwChk = document.querySelector("#registerForm input[name=userPasswordCheck]");
const userEmail = document.querySelector("#registerForm input[name=userEmail]");
const sendAuthKeyBtn = document.querySelector("#sendAuthKeyBtn");
const inputAuthKey = document.querySelector("#registerForm input[name=inputAuthKey]");
const checkAuthBtn = document.querySelector("#checkAuthKeyBtn");
const countdown = document.querySelector("#countdown");
const userPhone = document.querySelector("#userPhone");
const registerBtn = document.querySelector("#registerBtn");
const chkObj = {
    "username": false,
    "userId": false,
    "userIdDblChk": false,
    "userPw": false,
    "userPwChk": false,
    "userEmail": false,
    "inputAuthKey": false,
    "userPhone": false,
}
// 인증번호 시간 관련
const initMin = 4;
const initSec = 59;
const initTime = "05:00";
let authTimer; // setInterval 저장
let min = initMin;
let sec = initSec;

// 네비게이션 - 모바일 반응형 js 추가
document.querySelector('li > a[href="/jido"]').classList.add('active1');

// 이름 확인
username.addEventListener("input", () => {
    const nameAlert = document.querySelector("#nameAlert");
    if(username.value.trim() === '') {
        nameAlert.innerHTML = `<div class="alert error">이름은 비워둘 수 없습니다.</div>`
    } else {
        nameAlert.innerHTML = '';
        chkObj.username = true;
    }
})


// 아이디 유효성 검사
const idAlert = document.querySelector("#idAlert");
userId.addEventListener("input", async () => {
    if (userId.value.trim() === '') {
        idAlert.innerHTML = `<div class="alert error">아이디는 비워둘 수 없습니다.</div>`
    } else if (userId.value.trim().length < 6) {
        idAlert.innerHTML = `<div class="alert error">아이디는 최소 6글자 이상이어야 합니다.</div>`
    } else {
        idAlert.innerText = '';
    }
});

// 아이디 중복확인
const idDblChkBtn = document.querySelector("#idDblChkBtn");
idDblChkBtn.addEventListener("click", async () => {
    const res = await fetch(`/api/check-userid?userId=${encodeURIComponent(userId.value)}`, {
        method: "GET",
        headers: {"Content-Type" : "application/json"},
    })
    const isDuplicateId = await res.json();
    if(!isDuplicateId) {  // 아이디 중복
        idAlert.innerHTML = `<div class="alert error">이미 사용 중인 아이디입니다.</div>`
        userId.value = '';  // 입력창 비우기
        userId.focus();
    } else {
        idAlert.innerHTML = `<div class="alert confirm">사용 가능한 아이디입니다.</div>`
        chkObj.userId = true;
        chkObj.userIdDblChk = true;
    }
});

// 비밀번호 유효성 검사
userPw.addEventListener("input", () => {
    const pwAlert = document.querySelector("#pwAlertItem");
    const pw = userPw.value;

    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]).{8,16}$/;

    if (!pwRegex.test(pw)) {
        pwAlert.classList.remove("confirm");
        pwAlert.classList.add("error");
    } else {
        pwAlert.classList.remove("error");
        pwAlert.classList.add("confirm");
        pwAlert.innerText = "사용 가능한 비밀번호입니다.";
        chkObj.userPw = true;
    }

})

// 비밀번호 확인
userPwChk.addEventListener("input", () => {
    const pwChkAlert = document.querySelector("#pwChkAlert");
    if(!(userPw.value.trim() === (userPwChk.value.trim()))) {
        pwChkAlert.innerHTML = `<div class="alert error">비밀번호가 일치하지 않습니다.</div>`
        userPwChk.focus();
    } else {
        pwChkAlert.innerHTML = `<div class="alert confirm">비밀번호가 일치합니다.</div>`
        chkObj.userPwChk = true;
    }
})

// 이메일 인증번호 발송
sendAuthKeyBtn.addEventListener("click", async () => {
    const emailAlert = document.querySelector("#emailAlert");

    chkObj.inputAuthKey = false;
    document.querySelector("#authAlert").innerText = '';

    min = initMin;
    clearInterval(authTimer);
    chkObj.inputAuthKey = false;

    if(userEmail.value.trim() === '') {
        alert("이메일을 입력해주세요.");
        return;
    } else {
        chkObj.userEmail = true;
    }

    try {
        const res = await fetch("/api/send-email-code", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({userEmail: userEmail.value}),
        });

        if (res.ok) {
            // console.log("인증번호 발송 성공");
        }else {
            // console.log("인증번호 발송 실패");
        }
        countdown.innerText = initTime;  // 시간 세팅
        emailAlert.classList.remove("confirm", "error");

        const result = await res.text();
        alert("인증번호가 발송되었습니다.");
        // console.log("result: ", result);

        // 제한시간 5분
        authTimer = setInterval(() => {
            countdown.innerText = `${zeroplus(min)}:${zeroplus(sec)}`;
            if(min == 0 && sec == 0) {
                chkObj.inputAuthKey = false;
                clearInterval(authTimer);
                countdown.classList.add("error");
                countdown.classList.remove("confirm");
            }
            if(sec == 0) {
                sec = 60;
                min--;
            }
            sec--;
        }, 1000);
    } catch(err) {
        emailAlert.innerHTML = `<div class="alert error">오류: ${err.message}</div>`
        console.error("Fetch error:", err);
    }
})

function zeroplus(number) {
    if(number < 10) return "0" + number;
    else return number;
}

// 이메일 인증번호 일치 확인
checkAuthBtn.addEventListener("click", async () => {
    const authAlert = document.querySelector("#authAlert");

    if(min === 0 && sec === 0) {
        alert("인증번호 입력 제한시간을 초과하였습니다.");
        return;
    }

    if(inputAuthKey.value.length < 7) {
        alert("인증번호를 정확히 입력해주세요.");
    }

    try{
        const res = await fetch("/api/verify-email-code", {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({"userEmail": userEmail.value, "inputCode": inputAuthKey.value}),
        })
        const result = await res.text();

        if(result == 0) {
            authAlert.innerHTML = `<div class="alert error">인증번호가 일치하지 않습니다.</div>`
            chkObj.inputAuthKey = false;
            // console.log("검증 실패");
        } else {
            clearInterval(authTimer);
            authAlert.innerHTML = `<div class="alert confirm">인증번호가 일치합니다.</div>`
            // console.log("검증 성공");

            authAlert.classList.remove("error");
            authAlert.classList.add("confirm");
            chkObj.inputAuthKey = true;
        }
    } catch (err) {
        console.error(err);
        alert("인증 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
})

// 연락처 유효성검사
const phoneAlert = document.querySelector("#phoneAlert");
userPhone.addEventListener("input", async () => {
    if (userPhone.value.trim() === '') {
        phoneAlert.innerHTML = `<div class="alert error">연락처는 비워둘 수 없습니다.</div>`;
    } else {
        phoneAlert.innerHTML = '';
    }

    // console.log("연락처 유효성 검사 완료");
});

// 연락처 중복 확인
const phoneDblChkBtn = document.querySelector("#phoneDblChkBtn");
phoneDblChkBtn.addEventListener("click", async () => {
    const res = await fetch(`/api/check-phone?userPhone=${encodeURIComponent(userPhone.value)}`)
    const isDuplicatePhone = await res.json();

    if(!isDuplicatePhone) {  // 연락처 중복
        phoneAlert.innerHTML = `<div class="alert error">이미 등록된 연락처입니다.</div>`;
        userPhone.value = '';
        userPhone.focus();
    } else {
        phoneAlert.innerHTML = `<div class="alert confirm">사용 가능한 연락처입니다.</div>`
        chkObj.userPhone = true;
    }
    // console.log("연락처 중복확인 완료");
});

// 회원가입
const registerForm = document.querySelector("#registerForm")
registerForm.addEventListener("submit", async e => {
    e.preventDefault();

    if(Object.values(chkObj).every( v => v === true)){
        // console.log("모든 항목이 true");
        const body = {
            userId: userId.value.trim(),
            userName: username.value.trim(),
            userPassword: userPw.value.trim(),
            userEmail: userEmail.value.trim(),
            userPhone: userPhone.value.trim()
        }

        const res = await fetch("/api/register", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
        });

        if(!res.ok) {
            const errorText = await res.text();
            console.error("서버 오류 응답: ", errorText);
            alert("회원가입 중 서버 오류 발생");
            return;
        }

        const result = await res.json();

        if(result === 1) {
            // console.log("회원가입 성공");
            alert("회원가입이 완료되었습니다.");
            window.location.href = "login";
        } else {
            // console.log("회원가입 실패");
            alert("회원가입 실패");
        }
    }
});