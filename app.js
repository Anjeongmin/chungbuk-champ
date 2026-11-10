(() => {
  const D = window.CB;
  const app = document.getElementById("app");
  const S = { age: null, part: null, symptom: null, ans: {}, picked: new Set(), placeId: null };
  const stack = [];
  const NO = "2026-" + String(1000 + Math.floor(Math.random() * 9000));
  const today = new Date();
  const ymd = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  // ── icons ──
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="#0b2b5e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="#0081ee" stroke-width="2.2" stroke-linejoin="round"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></svg>',
    scissors: '<svg viewBox="0 0 24 24" fill="none" stroke="#8a97a8" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1L20 20M8.1 15.9L20 4"/></svg>',
  };
  const nav = [
    ["진단", '<path d="M7 3v6a5 5 0 0010 0V3M12 14v3a4 4 0 008 0v-2" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="20" cy="13" r="2" fill="currentColor"/>'],
    ["탐험", '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>'],
    ["홈", '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" fill="currentColor"/>'],
    ["내 코스", '<circle cx="5" cy="19" r="2" fill="currentColor"/><path d="M7 19h5a4 4 0 000-8H9a3 3 0 010-6h8" stroke="currentColor" stroke-width="2.2" fill="none" stroke-dasharray="2 3"/><path d="M19 2a3 3 0 013 3c0 2.2-3 5-3 5s-3-2.8-3-5a3 3 0 013-3z" fill="currentColor"/>'],
    ["마이", '<circle cx="12" cy="8" r="4.5" fill="currentColor"/><path d="M3.5 21a8.5 8.5 0 0117 0z" fill="currentColor"/>'],
  ];

  const mole = (cls = "") => `<img class="mole ${cls}" src="assets/mole.png" alt="두더지" draggable="false">`;
  const hill = '<div class="hill"></div>';
  const cloud = (x, y, w) => `<div class="cloud" style="left:${x}px;top:${y}px;width:${w}px;height:${w * 0.42}px"></div>`;
  const dots = (n) => `<div class="dots">${Array.from({ length: 7 }, (_, i) => `<i class="${i + 1 === n ? "on" : ""}"></i>`).join("")}</div>`;
  const top = (n) => `<div class="top"><button class="back-btn" data-act="back" aria-label="뒤로">${I.back}</button>${dots(n)}<span class="count">${n} / 7</span></div>`;
  const bubble = (title, sub, tag = "두더지") => `<div class="bubble"><span class="tagname">${tag}</span><h1>${title}</h1><p>${sub}</p></div>`;
  const sheetHead = (mid = "해당하는 곳에 체크해요") => `<div class="sheet-head"><b>문진표</b><span>${mid}</span><em>NO. ${NO}</em></div>`;

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // ── router ──
  function go(name, opts = {}) {
    if (!opts.replace && stack.length) stack[stack.length - 1].scroll = app.firstElementChild?.scrollTop || 0;
    if (opts.replace) stack.pop();
    stack.push({ name });
    render(name, false);
  }
  function back() {
    if (stack.length <= 1) return;
    stack.pop();
    render(stack[stack.length - 1].name, true);
  }
  function render(name, isBack) {
    clearInterval(render._timer);
    app.innerHTML = screens[name]();
    const el = app.firstElementChild;
    if (isBack) el.classList.add("back");
    after[name]?.(el);
    el.querySelectorAll('[data-act="back"]').forEach((b) => b.addEventListener("click", back));
  }

  // 화면을 393×852 캔버스에 딱 맞추기 (스크롤 없이)
  const fit = (w, h) => { const k = Math.min(393 / w, 852 / h); return `width:${(w * k).toFixed(1)}px;height:${(h * k).toFixed(1)}px`; };
  function scaleApp() {
    const vw = window.visualViewport?.width || innerWidth, vh = window.visualViewport?.height || innerHeight;
    const k = Math.min(vw / 393, vh / 852);
    app.style.transform = `translate(-50%, -50%) scale(${k})`;
  }
  scaleApp(); addEventListener("resize", scaleApp); window.visualViewport?.addEventListener("resize", scaleApp);

  // ── screens ──
  const screens = {
    onboarding: () => `
      <section class="screen shot-screen onb2"><div class="shot" style="${fit(393, 840)}">
        <img src="screens/onboarding.jpg" alt="충북챔 · 나에게 맞는 충북 여행 처방" draggable="false">
        <button class="hot" aria-label="시작" style="inset:0"></button>
        <span class="onb-hint">화면을 눌러 시작하기</span>
      </div></section>`,

    diagnose: () => `
      <section class="screen ${S.done ? "with-nav" : ""}">
        <h1 class="page-title">${S.done ? "진단" : "첫 진단"}</h1>
        <div class="intro">${mole("bob")}${bubble("나의 여행 증상을<br>진단해볼까요?", "질문 7개 · 약 3분 · 코스 5곳")}</div>
        <div class="card">
          <h2>처방은 이렇게 나와요</h2>
          <div class="step"><i style="background:#e6f4ff">📋</i><div><b>① 질문 7개</b><small>가볍게 일곱 가지 질문에 답해요</small></div></div>
          <div class="step"><i style="background:#fff7cf">🩺</i><div><b>② 증상 진단</b><small>내 여행 증상을 찾아내요</small></div></div>
          <div class="step"><i style="background:#ffe9f0">🗺️</i><div><b>③ 충북 코스 처방</b><small>나에게 맞는 코스를 처방해요</small></div></div>
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="begin">진단 시작하기 ${I.chev}</button>
        ${S.done ? `<nav class="nav">${nav.map(([n, p], i) => `<button class="${i === 0 ? "on" : ""}" data-tab="${n}"><svg viewBox="0 0 24 24">${p}</svg>${n}</button>`).join("")}</nav>` : ""}
      </section>`,

    age: () => `
      <section class="screen">${hill}
        ${top(1)}
        ${mole("bob")}
        ${bubble("나이가<br>어떻게 되세요?", "나이에 맞는 처방을 내려드려요")}
        <div class="sheet">${sheetHead()}
          ${D.ages.map((a) => `<button class="opt ${S.age === a.id ? "on" : ""}" data-age="${a.id}"><span class="radio"></span><span><b>${a.label}</b><small>${a.sub}</small></span></button>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="next" ${S.age ? "" : "disabled"}>다음으로</button>
      </section>`,

    body: () => {
      const p = D.bodyParts.find((b) => b.id === S.part);
      const whole = S.part === "whole";
      const title = whole ? "온몸이<br>불편하세요?" : p ? `${p.ask}<br>불편하세요?` : "어디가<br>불편하세요?";
      const sub = S.part ? "맞다면 아래 버튼을 눌러주세요" : "아픈 곳을 직접 눌러보세요";
      // body image box: 147x304 at top 14px, centered in wrap
      const spots = D.bodyParts.flatMap((b) => [b.x, b.x2].filter(Boolean).map((x) =>
        `<button class="spot ${S.part === b.id ? "on" : ""}" data-part="${b.id}" aria-label="${b.label}" style="left:calc(50% - 73.5px + ${x}px);top:${14 + b.y}px"></button>`)).join("");
      const label = p ? `<span class="spot-label" style="${p.x < 74 || p.id === "head" || p.id === "shoulder" ? `left:14px` : `right:14px`};top:${p.y - 4}px">${p.label}</span>` : "";
      return `
      <section class="screen">${hill}
        ${top(2)}
        ${mole("sm bob")}
        ${bubble(title, sub)}
        <div class="sheet">${sheetHead("아픈 곳을 눌러요")}
          <div class="body-wrap ${S.part ? "picked" : ""}">
            <span class="center"></span>
            <img class="body-img" src="assets/body.svg" alt="">
            ${spots}${label}
            <button class="whole ${whole ? "on" : ""}" data-part="whole">✦ 딱히 한 곳이 아니라 온몸이 피곤해요</button>
          </div>
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="next" ${S.part ? "" : "disabled"}>다음으로</button>
      </section>`;
    },

    symptom: () => {
      const a = D.ages.find((x) => x.id === S.age);
      return `
      <section class="screen">${hill}
        ${top(2)}
        ${mole("bob")}
        ${bubble("어떻게<br>불편하세요?", "가장 가까운 증상을 골라주세요")}
        <div class="sheet">${sheetHead()}
          ${a.symptoms.map((s) => `<button class="opt ${S.symptom === s ? "on" : ""}" data-sym="${s}"><span class="radio"></span><span><b>${s}</b></span></button>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="next" ${S.symptom ? "" : "disabled"}>다음으로</button>
      </section>`;
    },

    ...Object.fromEntries(D.questions.map((q, i) => [`q${i + 3}`, () => `
      <section class="screen">${hill}
        ${top(i + 3)}
        ${mole("bob")}
        ${bubble(q.title.replace("\n", "<br>"), q.sub)}
        <div class="sheet">${sheetHead()}
          ${q.options.map((o) => `<button class="opt ${S.ans[q.key] === o ? "on" : ""}" data-ans="${q.key}" data-val="${o}"><span class="radio"></span><span><b>${o}</b></span></button>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="next" ${S.ans[q.key] ? "" : "disabled"}>${i === 4 ? "결과" : "다음으로"}</button>
      </section>`])),

    brewing: () => `
      <section class="screen">${hill}
        ${cloud(40, 90, 56)}${cloud(316, 140, 46)}
        <div style="height:24px"></div>
        ${mole("bob")}
        <div class="bubble" style="margin-top:20px"><span class="tagname">두더지</span><h1>처방전을 조제하는<br>중이에요…</h1><p>사용자님의 맞춤형 진단을<br>분석하고 있어요.</p></div>
        <div class="receipt">
          <div class="receipt-head"><b>처방 접수증</b><small>NO. ${NO}<br>접수 ${ymd}</small></div>
          <div class="row"><span>연령대</span><b>${ageLabel()}</b></div>
          <div class="row"><span>증상</span><b>${S.symptom}</b></div>
          <div class="row"><span>성향</span><b>${S.ans.energy}</b></div>
        </div>
        <div class="spacer"></div>
        <div class="progress"><div><span>조제 중</span><b id="pct">0%</b></div><div class="bar"><i id="barI"></i><em id="barE" style="left:0%">💊</em></div></div>
      </section>`,

    rx: () => {
      const r = rx();
      return `
      <section class="screen rx-screen">
        <div class="rx-top">${mole()}<div class="bubble"><h1>${S.symptom}</h1><p>처방이 나왔어요!</p></div></div>
        <article class="paper" id="paper">
          <div class="paper-head"><div><h2>여행 처방전</h2><small>PRESCRIPTION · 여행 처방</small></div><div class="no"><b>NO. ${NO}</b><span>발급 ${ymd}</span></div></div>
          <div class="table">
            <div><span>연령대</span><b>${ageLabel()}</b></div>
            <div><span>증 상</span><b class="dot">${S.symptom}</b></div>
            <div><span>성 향</span><b>${S.ans.energy}</b></div>
            <div><span>취 향</span><b>${taste()}</b></div>
          </div>
          <h4 class="sec-title">처방 내역 · 근거</h4>
          <div class="rx-list">
            <div><i>1</i>처방 코스: ${r.course} · ${D.places.length}곳</div>
            <div><i>2</i>용법: ${r.how}</div>
            <div><i>3</i>비중: ${S.ans.pick === "검색·후기 상위에서 고름" ? "검증된 명소 + 숨은 명소 섞어서" : "덜 알려진 숨은 명소 ↑"}</div>
          </div>
          <div class="memo"><small>처방 한마디</small><p>${r.line}</p></div>
          <div class="cut">${I.scissors}<span>절취선 · 아래로 내려 도장 받기</span></div>
          <div class="issuer">
            <small>발급처</small><h3>충북챔 여행처방소</h3>
            <div class="barcode"></div><em>${NO}-0042</em>
            <div class="stamp" id="stamp"><small>충북챔</small><b>처방</b><span>여행처방소</span></div>
          </div>
        </article>
        <div class="float-cta"><button class="cta" data-act="places">처방 장소 보기 ${I.arrow}</button></div>
      </section>`;
    },

    places: () => `
      <section class="screen">${hill}
        <div class="title-row"><button class="back-btn" data-act="back" aria-label="뒤로">${I.back}</button><h1>처방 장소 ${D.places.length}곳</h1><span class="pill">${S.picked.size}곳 담음</span></div>
        <div class="say">마음에 드는 곳을<br>눌러 담아요</div>
        <div class="grid">
          ${D.places.map((p) => `
            <div class="pcard ${S.picked.has(p.id) ? "on" : ""}" data-pick="${p.id}" role="button" tabindex="0">
              <span class="rxtag">처방 ${p.id}</span><span class="check">${I.check}</span>
              <div class="thumb" style="background:${p.tone}"><img src="assets/${p.icon}" alt="" onerror="this.remove()"></div>
              <div class="info"><b>${p.name}</b><span>${p.area}</span><br><span class="chip">${p.tag}</span></div>
              <button class="detail-link" data-detail="${p.id}">자세히</button>
            </div>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta between" data-act="save" ${S.picked.size ? "" : "disabled"}><span>${S.picked.size ? `${S.picked.size}곳 코스에 저장하기` : "장소를 담아주세요"}</span>${I.arrow}</button>
      </section>`,

    detail: () => {
      const p = D.places.find((x) => x.id === S.placeId);
      const on = S.picked.has(p.id);
      return `
      <section class="screen">${hill}
        <div class="title-row"><button class="back-btn" data-act="back" aria-label="뒤로">${I.back}</button><h1>여행지 상세</h1>${on ? `<span class="pill"><span class="check" style="display:grid;position:static;width:20px;height:20px">${I.check}</span>담음</span>` : ""}</div>
        <div class="photo"><img src="assets/${p.photo}" alt="${p.name}" onerror="this.remove()"><span class="rxtag">처방 ${p.id}</span>${on ? `<span class="check">${I.check}</span>` : ""}</div>
        <div class="place-name"><h1>${p.name}</h1><span>${p.area}</span></div>
        <span class="chip" style="align-self:flex-start">${p.tag}</span>
        <div class="tip"><span class="av"><img src="assets/mole.png" alt=""></span><div><small>두더지 한마디</small><p>${p.tip}</p></div></div>
        <div class="facts"><div><small>위치</small><b>${p.loc}</b></div><div><small>걷는 시간</small><b>${p.time}</b></div><div><small>난이도</small><b>${p.level}</b></div></div>
        <div class="spacer"></div>
        <div class="bottom-row"><button class="round" data-act="map" aria-label="지도">${I.map}</button><button class="cta ${on ? "ghost" : ""}" data-act="toggle">${on ? "코스에서 빼기" : "코스에 담기"}</button></div>
      </section>`;
    },

    done: () => `
      <section class="screen done">${hill}
        ${cloud(40, 90, 56)}${cloud(300, 160, 46)}
        ${mole("bob")}
        <h1>내 코스에<br>${S.picked.size}곳을 저장했어요!</h1>
        <p>${S.symptom} 처방, 충북에서 받아가세요</p>
        <div class="saved">${[...S.picked].map((id) => { const p = D.places.find((x) => x.id === id); return `<div>${p.name}<span>${p.area}</span></div>`; }).join("")}</div>
        <div class="spacer"></div>
        <button class="cta" data-act="home">홈으로 가기</button>
        <button class="cta ghost" data-act="mycourse" style="margin-top:14px">내 코스 보기</button>
      </section>`,
  };

  // ── 피그마에서 렌더한 화면 (이미지 + 누르는 영역) ──
  // 좌표는 피그마 프레임 기준(pt). go: 이동할 화면 / fn: 동작
  const TAB = (y) => [
    { x: 24, y, w: 70, h: 52, tab: "진단" }, { x: 94, y, w: 70, h: 52, tab: "탐험" },
    { x: 164, y, w: 70, h: 52, tab: "홈" }, { x: 234, y, w: 70, h: 52, tab: "내 코스" }, { x: 304, y, w: 70, h: 52, tab: "마이" },
  ];
  const BACK = { x: 14, y: 46, w: 56, h: 56, back: true };
  const IMG = {
    login: { w: 393, h: 852, hot: [
      { x: 24, y: 550, w: 345, h: 60, go: "terms0" }, { x: 24, y: 618, w: 345, h: 60, go: "terms0" },
      { x: 24, y: 686, w: 345, h: 60, go: "loginEmail" } ] },
    loginEmail: { w: 393, h: 852, hot: [ { ...BACK, x: 12, y: 48 },
      { x: 46, y: 540, w: 301, h: 62, go: "terms0" }, { x: 210, y: 642, w: 80, h: 34, go: "terms0" } ] },
    terms0: { w: 393, h: 840, hot: [
      { x: 49, y: 429, w: 295, h: 56, go: "terms1", replace: true }, { x: 40, y: 515, w: 310, h: 135, go: "terms2", replace: true },
      { x: 40, y: 650, w: 310, h: 40, go: "terms1", replace: true }, { x: 300, y: 86, w: 80, h: 44, go: "diagnose", reset: true } ] },
    terms1: { img: "terms-1", w: 393, h: 840, hot: [
      { x: 49, y: 429, w: 295, h: 56, go: "terms0", replace: true }, { x: 40, y: 515, w: 310, h: 175, go: "terms2", replace: true },
      { x: 24, y: 732, w: 345, h: 64, go: "diagnose", reset: true }, { x: 300, y: 86, w: 80, h: 44, go: "diagnose", reset: true } ] },
    terms2: { img: "terms-2", w: 393, h: 844, hot: [
      { x: 49, y: 429, w: 295, h: 56, go: "terms1", replace: true }, { x: 40, y: 515, w: 310, h: 135, go: "terms0", replace: true },
      { x: 40, y: 650, w: 310, h: 40, go: "terms1", replace: true },
      { x: 24, y: 735, w: 345, h: 64, go: "diagnose", reset: true }, { x: 300, y: 86, w: 80, h: 44, go: "diagnose", reset: true } ] },
    home: { w: 393, h: 852, tab: "홈", hot: [
      { x: 48, y: 440, w: 297, h: 58, go: "cheongju" }, { x: 290, y: 543, w: 90, h: 40, go: "stampbook" },
      { x: 24, y: 590, w: 345, h: 110, go: "stampbook" }, { x: 24, y: 255, w: 345, h: 140, go: "explore" }, ...TAB(770) ] },
    diagAgain: { img: "diag-again", w: 393, h: 891, tab: "진단", hot: [
      { x: 25, y: 416, w: 342, h: 56, fn: "newDiag" }, { x: 24, y: 505, w: 345, h: 110, fn: "showRx" },
      { x: 24, y: 670, w: 345, h: 90, go: "rediag" }, ...TAB(808) ] },
    rediag: { w: 393, h: 878, hot: [ { ...BACK, x: 20, y: 44, w: 48, h: 48 },
      { x: 26, y: 676, w: 342, h: 60, fn: "newDiag" }, { x: 26, y: 748, w: 342, h: 56, go: "home", reset: true } ] },
    explore: { w: 393, h: 852, tab: "탐험", hot: [
      { x: 30, y: 420, w: 100, h: 70, go: "cheongju" }, { x: 20, y: 380, w: 120, h: 50, go: "cheongju" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" }, { x: 30, y: 200, w: 320, h: 180, fn: "fog" },
      { x: 60, y: 490, w: 240, h: 130, fn: "fog" }, ...TAB(780) ] },
    exploreCourse: { img: "explore-course", w: 393, h: 852, tab: "탐험", hot: [
      { x: 30, y: 420, w: 100, h: 70, go: "cheongju" }, { x: 20, y: 380, w: 120, h: 50, go: "cheongju" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" }, { x: 24, y: 632, w: 345, h: 112, go: "coursemap" },
      { x: 30, y: 200, w: 320, h: 180, fn: "fog" }, ...TAB(780) ] },
    cheongju: { w: 388, h: 852, tab: "탐험", hot: [ { x: 20, y: 64, w: 44, h: 46, back: true },
      { x: 56, y: 650, w: 174, h: 58, go: "stampDone" }, { x: 242, y: 650, w: 91, h: 60, fn: "bookmark" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" }, { x: 40, y: 250, w: 280, h: 200, go: "cheongjuSheet" }, ...TAB(778) ] },
    cheongjuSheet: { img: "cheongju-sheet", w: 388, h: 852, hot: [ { x: 20, y: 64, w: 44, h: 46, back: true },
      { x: 56, y: 726, w: 174, h: 58, go: "stampDone" }, { x: 242, y: 726, w: 91, h: 60, fn: "bookmark" },
      { x: 0, y: 120, w: 330, h: 340, back: true } ] },
    stampDone: { img: "stamp-done", w: 393, h: 852, hot: [ { ...BACK, x: 14, y: 48 },
      { x: 20, y: 740, w: 112, h: 56, go: "cheongjuDone", replace: true }, { x: 146, y: 740, w: 227, h: 56, go: "cheongjuDone", replace: true },
      { x: 20, y: 650, w: 353, h: 62, go: "cheongjuDone", replace: true } ] },
    cheongjuDone: { img: "cheongju-done", w: 388, h: 852, tab: "탐험", hot: [ { x: 20, y: 64, w: 44, h: 46, go: "explore", reset: true },
      { x: 56, y: 650, w: 174, h: 58, go: "stampDone" }, { x: 242, y: 650, w: 91, h: 60, fn: "bookmark" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" }, ...TAB(778) ] },
    stampbook: { w: 393, h: 852, hot: [ { ...BACK, x: 14, y: 48 },
      { x: 270, y: 592, w: 100, h: 36, fn: "newDiag" }, { x: 70, y: 575, w: 300, h: 70, fn: "newDiag" } ] },
    mycourse: { w: 393, h: 852, tab: "내 코스", hot: [
      { x: 24, y: 130, w: 345, h: 62, go: "coursemap" }, { x: 24, y: 222, w: 345, h: 140, go: "coursemap" },
      { x: 24, y: 372, w: 345, h: 140, go: "coursemap" }, { x: 24, y: 522, w: 345, h: 140, go: "coursemap" },
      { x: 24, y: 687, w: 345, h: 52, fn: "newDiag" }, ...TAB(770) ] },
    coursemap: { w: 375, h: 917, tab: "내 코스", hot: [ { x: 18, y: 85, w: 52, h: 52, back: true },
      { x: 24, y: 771, w: 242, h: 56, go: "cheongju" }, { x: 278, y: 771, w: 73, h: 56, go: "courseEdit" }, ...TAB(835).map((t) => ({ ...t, x: t.x * 375 / 393, w: 66 })) ] },
    courseEdit: { img: "course-edit", w: 375, h: 879, hot: [ { x: 18, y: 62, w: 52, h: 52, back: true },
      { x: 24, y: 783, w: 117, h: 56, back: true }, { x: 153, y: 783, w: 198, h: 56, fn: "saveOrder" } ] },
    mypage: { w: 393, h: 865, tab: "마이", hot: [
      { x: 320, y: 52, w: 54, h: 54, go: "settings" }, { x: 24, y: 300, w: 345, h: 180, fn: "showRx" },
      { x: 24, y: 496, w: 345, h: 56, go: "mycourse", reset: true }, { x: 40, y: 660, w: 200, h: 60, go: "stampbook" },
      { x: 149, y: 254, w: 96, h: 36, fn: "soon" }, ...TAB(784) ] },
    settings: { w: 375, h: 854, hot: [ { x: 18, y: 52, w: 52, h: 52, back: true },
      { x: 24, y: 175, w: 327, h: 215, fn: "soon" }, { x: 24, y: 475, w: 327, h: 140, fn: "soon" } ] },
  };
  const FILE = { loginEmail: "login-email", terms0: "terms-0", cheongjuSheet: "cheongju-sheet", stampDone: "stamp-done", cheongjuDone: "cheongju-done", courseEdit: "course-edit", exploreCourse: "explore-course", diagAgain: "diag-again" };
  const pct = (v, t) => (v / t * 100).toFixed(3) + "%";
  for (const [name, d] of Object.entries(IMG)) {
    const src = `screens/${d.img || FILE[name] || name}.jpg`;
    screens[name] = () => `
      <section class="screen shot-screen"><div class="shot" style="${fit(d.w, d.h)}">
        <img src="${src}" alt="" draggable="false">
        ${d.hot.map((h, i) => `<button class="hot" data-i="${i}" aria-label="${h.tab || h.go || h.fn || "뒤로"}" style="left:${pct(h.x, d.w)};top:${pct(h.y, d.h)};width:${pct(h.w, d.w)};height:${pct(h.h, d.h)}"></button>`).join("")}
      </div></section>`;
  }
  // 이미지 미리 불러오기 (화면 전환 시 깜빡임 방지)
  window.addEventListener("load", () => setTimeout(() => Object.entries(IMG).forEach(([n, d]) => { new Image().src = `screens/${d.img || FILE[n] || n}.jpg`; }), 800));

  const TABS = { "진단": () => (S.done ? "diagAgain" : "diagnose"), "탐험": () => (S.done ? "exploreCourse" : "explore"), "홈": () => "home", "내 코스": () => "mycourse", "마이": () => "mypage" };
  function tabGo(t) { stack.length = 0; go(TABS[t]()); }
  const FN = {
    newDiag: () => { Object.assign(S, { age: null, part: null, symptom: null, ans: {}, picked: new Set(), placeId: null }); go("age"); },
    showRx: () => {
      if (!S.symptom) Object.assign(S, { age: "40-50", part: "waist", symptom: "허리 뻐근함", ans: { pick: "직접 찾아서 발견함", energy: "걸으며 움직이기", scene: "자연", plan: "대강만 정함", with: "혼자" } });
      go("rx");
    },
    fog: () => toast("안개에 가려진 지역이에요 · 청주를 눌러보세요"),
    bookmark: () => toast("저장했어요"),
    saveOrder: () => { back(); toast("탐험 순서를 저장했어요"); },
    soon: () => toast("준비 중인 기능이에요"),
  };
  function wireImg() { for (const [name, d] of Object.entries(IMG)) {
    after[name] = (el) => el.querySelectorAll(".hot").forEach((b) => (b.onclick = () => {
      const h = d.hot[+b.dataset.i];
      if (h.tab) return tabGo(h.tab);
      if (h.back) return stack.length > 1 ? back() : tabGo("홈");
      if (h.fn) return FN[h.fn]();
      if (h.reset) { stack.length = 0; return go(h.go); }
      go(h.go, { replace: !!h.replace });
    }));
  } }

  const ageLabel = () => D.ages.find((a) => a.id === S.age)?.label.replace("–", "-") || "";
  const rx = () => D.prescriptions[S.symptom] || { course: "맞춤 코스", how: "내 속도대로", line: "오늘은 나를 위한 여행을 떠나요" };
  const taste = () => ({ "직접 찾아서 발견함": "숨은 명소 좋아함", "지인·SNS 추천을 따름": "믿을 만한 추천 좋아함", "검색·후기 상위에서 고름": "검증된 명소 좋아함" })[S.ans.pick] || S.ans.scene;

  const qOrder = ["age", "body", "symptom", "q3", "q4", "q5", "q6", "q7", "brewing"];
  const nextOf = (n) => qOrder[qOrder.indexOf(n) + 1];

  // ── per-screen wiring ──
  const after = {
    onboarding: (el) => {
      let moved = false;
      const next = () => { if (moved) return; moved = true; clearTimeout(t); go("login", { replace: true }); };
      const t = setTimeout(next, 2600);
      el.addEventListener("click", next);
    },
    diagnose: (el) => {
      el.querySelector('[data-act="begin"]').onclick = () => go("age");
      el.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => b.dataset.tab !== "진단" && tabGo(b.dataset.tab)));
    },
    age: (el) => wireOpts(el, "[data-age]", (b) => (S.age = b.dataset.age, S.symptom = null), "age"),
    body: (el) => {
      el.querySelectorAll("[data-part]").forEach((b) => (b.onclick = () => { S.part = b.dataset.part; rerender(el); }));
      el.querySelector('[data-act="next"]').onclick = () => go("symptom");
    },
    symptom: (el) => wireOpts(el, "[data-sym]", (b) => (S.symptom = b.dataset.sym), "symptom"),
    ...Object.fromEntries(["q3", "q4", "q5", "q6", "q7"].map((n) => [n, (el) => wireOpts(el, "[data-ans]", (b) => (S.ans[b.dataset.ans] = b.dataset.val), n)])),
    brewing: () => {
      let v = 0;
      const pct = document.getElementById("pct"), bi = document.getElementById("barI"), be = document.getElementById("barE");
      render._timer = setInterval(() => {
        v = Math.min(100, v + 2 + Math.random() * 3);
        pct.textContent = Math.round(v) + "%"; bi.style.width = v + "%"; be.style.left = v + "%";
        if (v >= 100) { clearInterval(render._timer); setTimeout(() => go("rx", { replace: true }), 400); }
      }, 60);
    },
    rx: (el) => {
      const stamp = el.querySelector("#stamp"), paper = el.querySelector("#paper");
      let done = false;
      const check = () => {
        if (done) return;
        const r = stamp.getBoundingClientRect();
        if (r.top < window.innerHeight - 140) {
          done = true; stamp.classList.add("hit"); paper.classList.add("shake");
          navigator.vibrate?.(40);
        }
      };
      el.addEventListener("scroll", check, { passive: true });
      setTimeout(check, 500);
      el.querySelector('[data-act="places"]').onclick = () => go("places");
    },
    places: (el) => {
      el.querySelectorAll("[data-pick]").forEach((c) => (c.onclick = (e) => {
        const id = +c.dataset.pick;
        if (e.target.closest("[data-detail]")) { S.placeId = id; go("detail"); return; }
        S.picked.has(id) ? S.picked.delete(id) : S.picked.add(id);
        rerender(el);
      }));
      el.querySelector('[data-act="save"]').onclick = () => go("done");
    },
    detail: (el) => {
      el.querySelector('[data-act="toggle"]').onclick = () => {
        const id = S.placeId; S.picked.has(id) ? S.picked.delete(id) : S.picked.add(id);
        toast(S.picked.has(id) ? "코스에 담았어요" : "코스에서 뺐어요"); rerender(el);
      };
      el.querySelector('[data-act="map"]').onclick = () => go("coursemap");
    },
    done: (el) => {
      S.done = true;
      el.querySelector('[data-act="home"]').onclick = () => tabGo("홈");
      el.querySelector('[data-act="mycourse"]').onclick = () => tabGo("내 코스");
    },
  };
  wireImg();

  function wireOpts(el, sel, set, name) {
    el.querySelectorAll(sel).forEach((b) => (b.onclick = () => { set(b); rerender(el); }));
    el.querySelector('[data-act="next"]').onclick = () => go(nextOf(name));
  }
  // re-render same screen without entry animation, keeping scroll
  function rerender(el) {
    const y = el.scrollTop, name = stack[stack.length - 1].name;
    app.innerHTML = screens[name]();
    const n = app.firstElementChild; n.style.animation = "none"; n.scrollTop = y;
    after[name]?.(n);
    n.querySelectorAll('[data-act="back"]').forEach((b) => b.addEventListener("click", back));
  }

  go("onboarding");
})();
