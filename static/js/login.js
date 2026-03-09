// 네비게이션 - 모바일 반응형 js 추가
document.querySelector('li > a[href="/jido"]').classList.add('active1');

const getCookie = (key) => {
    const cookies = document.cookie;
    // console.log("cookies: ", cookies);
    const cookieList = cookies.split(";").map(el => el.trim().split("="));
    // console.log("cookieList: ", cookieList);

    const obj = {};

    for(let i=0; i<cookieList.length; i++) {
        const k = cookieList[i][0]; // key
        const v = cookieList[i][1]; // value
        obj[k] = v;
    }

    // console.log("obj: ", obj);
    return obj[key];
}

const loginId = document.querySelector("#userId");
const saveIdChk = document.querySelector("#saveId");

if(loginId != null) {
    const saveId = getCookie("saveId");
    // console.log("saveId 단계 확인");

    if(saveId != undefined) {
        loginId.value = saveId;  // 쿠키에 저장된 값으로 채워놓기
        saveIdChk.checked = true;
    }
}

// 유효성 검사
const loginForm = document.querySelector("#loginForm");
const loginPw = document.querySelector("#userPw");
const loginBtn = document.querySelector("#loginBtn")

if(loginForm != null) {
    loginBtn.addEventListener("click", async () => {
        // console.log("폼 가로채기 성공!");

        if(loginId.value.trim().length === 0) {
            alert("아이디를 작성해주세요.");
            loginId.focus();
            return;
        }

        if(loginPw.value.trim().length === 0) {
            alert("비밀번호를 작성해주세요.");
            loginPw.focus();
            return;
        }

        const saveIdValue = saveIdChk.checked ? "on" : "off";
        // console.log("saveIdChk: ", saveIdChk.checked);
        // console.log("saveIdValue: ", saveIdValue);

        const body = {
            userId: loginId.value.trim(),
            userPassword: loginPw.value.trim(),
        }

        try {
            const res = await fetch(`/api/login?saveId=${encodeURIComponent(saveIdValue)}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
                credentials: "include",
            })

            if(!res.ok) {
                throw new Error(`서버 오류: ${res.status}`);
            }

            const result = await res.json();

            if(result.ok === "true") {
                alert("로그인되었습니다.");

                if(saveIdChk.checked) {
                    document.cookie = `saveId=${loginId.value.trim()};`
                }

                window.location.href = result.redirect;
            } else {
                alert(result.message);
                // console.log("아이디: ", loginId);
                // console.log("비밀번호: ", loginPw)
            }

        } catch(err) {
            console.error(err);
            alert("로그인 요청 중 오류가 발생했습니다.");
        }
    })
}