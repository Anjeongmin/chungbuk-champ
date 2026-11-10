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

  const mole = (cls = "", v = "") => `<img class="mole ${cls}" src="assets/mole${v ? "-" + v : ""}.png" alt="두더지" draggable="false">`;
  const hill = '<div class="hill"></div>';
  const cloud = (x, y, w) => `<div class="cloud" style="left:${x}px;top:${y}px;width:${w}px;height:${w * 0.42}px"></div>`;
  const STEPS = 2 + window.CB.questions.length; // 나이 + 아픈 곳 + 질문들
  const dots = (n) => `<div class="dots">${Array.from({ length: STEPS }, (_, i) => `<i class="${i + 1 === n ? "on" : ""}"></i>`).join("")}</div>`;
  const top = (n) => `<div class="top"><button class="back-btn" data-act="back" aria-label="뒤로">${I.back}</button>${dots(n)}<span class="count">${n} / ${STEPS}</span></div>`;
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
    clearInterval(render._timer); clearTimeout(render._timer);
    app.innerHTML = screens[name]();
    const el = app.firstElementChild;
    if (isBack) el.classList.add("back");
    after[name]?.(el);
    el.querySelectorAll('[data-act="back"]').forEach((b) => b.addEventListener("click", back));
    setBackdrop(el); fitScreen(el); refit(el);
  }
  function fitScreen(el) {
    const ft = el?.querySelector(".shot-top[data-focus]");
    if (ft) requestAnimationFrame(() => { ft.scrollTop = Math.max(0, +ft.dataset.focus - ft.clientHeight / 2); });
    if (!el || el.classList.contains("shot-screen")) return;
    el.style.zoom = ""; el.style.width = ""; el.style.height = ""; el.style.inset = ""; el.classList.remove("scrolly");
    const need = el.scrollHeight, have = el.clientHeight;
    if (need <= have + 2) return;
    // 조금 넘치면 살짝 축소, 많이 넘치면 축소 + 스크롤
    const z = el.classList.contains("rx-screen") ? Math.max(0.8, have / need) : 1; // 처방전만 살짝 축소, 나머지는 원래 크기 + 스크롤
    Object.assign(el.style, { zoom: z, inset: "0 auto auto 0", width: 393 / z + "px", height: APPH / z + "px" });
    if (need * z > have + 2) el.classList.add("scrolly");
  }
  // 이미지가 늦게 로드되면 높이가 바뀌니 한 번 더 맞춤
  function refit(el) {
    if (!el || el.classList.contains("shot-screen")) return;
    el.querySelectorAll("img").forEach((im) => { if (!im.complete) im.addEventListener("load", () => el.isConnected && fitScreen(el), { once: true }); });
    document.fonts?.ready.then(() => el.isConnected && fitScreen(el));
  }
  function setBackdrop(el) {
    const bd = document.getElementById("backdrop"); if (!bd) return;
    const im = el.querySelector(".shot > img");
    bd.style.backgroundImage = im ? `url("${im.getAttribute("src")}")` : "";
    if (im) el.style.setProperty("--shotbg", `url("${im.getAttribute("src")}")`);
  }

  // 화면을 393×852 캔버스에 딱 맞추기 (스크롤 없이)
  // 휴대폰 폭에 꽉 맞추고, 높이는 휴대폰 화면 높이만큼 (데스크톱은 폰 프레임)
  let APPH = 852;
  const fit = (w, h) => { const k = Math.min(393 / w, APPH / h); return `width:${(w * k).toFixed(1)}px;height:${(h * k).toFixed(1)}px`; };
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top)";
  document.body.appendChild(probe);
  function scaleApp() {
    const vw = innerWidth, vh = innerHeight;
    let k, h;
    if (vw >= 500) { // 데스크톱: 가운데 폰 프레임
      k = Math.min(vw / 393, vh / 852, 1.2); h = 852;
      Object.assign(app.style, { left: "50%", top: "50%", transformOrigin: "center center", transform: `translate(-50%, -50%) scale(${k})` });
    } else { // 휴대폰: 폭·높이 꽉 채우기 (상단 상태바 영역만 비워둠)
      const safe = parseFloat(getComputedStyle(probe).paddingTop) || 0;
      k = vw / 393; h = Math.round((vh - safe) / k);
      Object.assign(app.style, { left: "0", top: safe + "px", transformOrigin: "0 0", transform: Math.abs(k - 1) < 0.01 ? "none" : `scale(${k})` });
    }
    const changed = Math.abs(h - APPH) > 4; APPH = h;
    app.classList.toggle("short", false);
    app.style.height = h + "px";
    if (changed && stack.length) rerender(app.firstElementChild);
  }
  addEventListener("resize", () => scaleApp()); window.visualViewport?.addEventListener("resize", () => scaleApp());

  // ── screens ──
  const TERMS = [["필수", "서비스 이용약관"], ["필수", "개인정보 수집·이용 동의"], ["필수", "위치기반서비스 이용약관"], ["선택", "마케팅 정보 수신 동의"]];
  S.terms = [false, false, false, false];
  const ck = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const screens = {
    terms: () => {
      const all = S.terms.every(Boolean), req = S.terms.slice(0, 3).every(Boolean);
      return `
      <section class="screen terms">${hill}
        ${cloud(28, 52, 46)}${cloud(290, 92, 58)}
        <button class="skip" data-act="skip">건너뛰기</button>
        ${mole("terms-mole", "clip")}
        <div class="bubble center"><h1>시작하기 전에<br>약관을 확인해 주세요</h1></div>
        <div class="tcard">
          <button class="tall ${all ? "on" : ""}" data-t="all"><i class="tck">${ck}</i><b>전체 동의 (선택 항목 포함)</b></button>
          <hr>
          ${TERMS.map(([k, t], i) => `<button class="trow ${S.terms[i] ? "on" : ""}" data-t="${i}"><i class="tck">${ck}</i><span><em class="${k === "필수" ? "req" : "sel"}">[${k}]</em>${t}</span><svg class="chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c4cfdc" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="agree" ${req ? "" : "disabled"}>동의하고 시작하기 ${req ? I.chev : ""}</button>
      </section>`;
    },
    onboarding: () => `
      <section class="screen shot-screen onb2"><div class="shot" style="width:393px;height:${APPH}px">
        <img src="screens/onboarding.jpg" style="width:393px;height:100%;object-fit:cover;object-position:50% 40%" alt="충북챔 · 나에게 맞는 충북 여행 처방" draggable="false">
        <button class="hot" aria-label="시작" style="inset:0"></button>
        <span class="onb-hint">화면을 눌러 시작하기</span>
      </div></section>`,

    diagnose: () => `
      <section class="screen ${S.done ? "with-nav" : ""}">
        <h1 class="page-title">${S.done ? "진단" : "첫 진단"}</h1>
        <div class="intro">${mole("bob")}${bubble("나의 여행 증상을<br>진단해볼까요?", `질문 ${STEPS}개 · 약 2분 · 코스 5곳`)}</div>
        <div class="card">
          <h2>처방은 이렇게 나와요</h2>
          <div class="step"><i style="background:#e6f4ff">📋</i><div><b>① 질문 ${STEPS}개</b><small>가볍게 ${STEPS}가지 질문에 답해요</small></div></div>
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
        ${mole("bob", "q")}
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
        ${mole("sm bob", "lens")}
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
        ${mole("bob", "clip")}
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
        ${mole("bob", "q")}
        ${bubble(q.title.replace("\n", "<br>"), q.sub)}
        <div class="sheet">${sheetHead()}
          ${q.options.map((o) => `<button class="opt ${S.ans[q.key] === o ? "on" : ""}" data-ans="${q.key}" data-val="${o}"><span class="radio"></span><span><b>${o}</b></span></button>`).join("")}
        </div>
        <div class="spacer"></div>
        <button class="cta" data-act="next" ${S.ans[q.key] ? "" : "disabled"}>${i === D.questions.length - 1 ? "결과" : "다음으로"}</button>
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
      { x: 24, y: 550, w: 345, h: 60, go: "terms" }, { x: 24, y: 618, w: 345, h: 60, go: "terms" },
      { x: 24, y: 686, w: 345, h: 60, go: "loginEmail" } ] },
    loginEmail: { w: 393, h: 852, hot: [ { ...BACK, x: 12, y: 48 },
      { x: 46, y: 540, w: 301, h: 62, go: "terms" }, { x: 210, y: 642, w: 80, h: 34, go: "terms" } ] },
    home: { w: 393, h: 852, tab: "홈", hot: [
      { x: 48, y: 440, w: 297, h: 58, go: "cheongju" }, { x: 290, y: 543, w: 90, h: 40, go: "stampbook" },
      { x: 24, y: 590, w: 345, h: 110, go: "stampbook" }, { x: 24, y: 255, w: 345, h: 140, go: "explore" }, ...TAB(770) ] },
    diagAgain: { img: "diag-again", w: 393, h: 891, tab: "진단", hot: [
      { x: 25, y: 416, w: 342, h: 56, fn: "newDiag" }, { x: 24, y: 505, w: 345, h: 110, fn: "showRx" },
      { x: 24, y: 670, w: 345, h: 90, go: "rediag" }, ...TAB(808) ] },
    rediag: { w: 393, h: 878, hot: [ { ...BACK, x: 20, y: 44, w: 48, h: 48 },
      { x: 26, y: 676, w: 342, h: 60, fn: "newDiag" }, { x: 26, y: 748, w: 342, h: 56, go: "home", reset: true } ] },
    explore: { w: 393, h: 852, tab: "탐험", hot: [
      { x: 30, y: 230, w: 320, h: 160, fn: "fog" }, { x: 60, y: 470, w: 240, h: 150, fn: "fog" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" },
      { x: 22, y: 392, w: 112, h: 98, fn: "zoomCheongju" }, { x: 100, y: 345, w: 106, h: 76, fn: "zoomGoesan" }, ...TAB(780) ] },
    exploreCourse: { img: "explore-course", w: 393, h: 852, tab: "탐험", hot: [
      { x: 30, y: 230, w: 320, h: 160, fn: "fog" }, { x: 60, y: 470, w: 240, h: 140, fn: "fog" },
      { x: 317, y: 61, w: 52, h: 52, go: "stampbook" }, { x: 24, y: 632, w: 345, h: 112, go: "coursemap" },
      { x: 22, y: 392, w: 112, h: 92, fn: "zoomCheongju" }, { x: 100, y: 345, w: 106, h: 76, fn: "zoomGoesan" }, ...TAB(780) ] },
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
  const FILE = { loginEmail: "login-email", cheongjuSheet: "cheongju-sheet", stampDone: "stamp-done", cheongjuDone: "cheongju-done", courseEdit: "course-edit", exploreCourse: "explore-course", diagAgain: "diag-again" };
  const pct = (v, t) => (v / t * 100).toFixed(3) + "%";
  // 이미지 위쪽 상태바(시간·배터리) 38pt 잘라냄 → 좌표도 같이 이동
  const CUT = 38, META = { "cheongju-done": 814, "cheongju-sheet": 814, cheongju: 814, "course-edit": 841, coursemap: 878.7, "diag-again": 853, "explore-course": 814, explore: 814, home: 814, "login-email": 788, login: 788, mycourse: 814, mypage: 827, rediag: 840, settings: 816, "stamp-done": 814, stampbook: 814 };
  for (const [name, d] of Object.entries(IMG)) { const f = d.img || FILE[name] || name; d.h = META[f] || d.h - CUT; d.hot.forEach((h) => { h.y -= CUT; if (h.y < 0) { h.h += h.y; h.y = 0; } }); }
  // 화면 분할: split 아래(버튼·카드·탭바)는 화면 바닥에 고정, 위쪽은 폭에 꽉 맞춤
  // mode "clip" = 지도처럼 위쪽을 잘라서 보여줌, "scroll" = 필요하면 위쪽만 살짝 스크롤
  const SPLIT = { login: [360, "clipb"], home: [770], diagAgain: [808], rediag: [660], explore: [771, "map", 116, 380], exploreCourse: [771, "map", 116, 400],
    cheongju: [521, "map", 114, 300], cheongjuDone: [535, "map", 114, 300], cheongjuSheet: [466, "map", 114, 300], stampDone: [628], mycourse: [770], coursemap: [760, "map", 272, 460],
    courseEdit: [770], mypage: [774] };
  IMG.exploreCourse.mapImg = "screens/explore-course-map.jpg";
  IMG.exploreCourse.card = { y0: 630 - CUT, y1: 754 - CUT, x0: 22, x1: 371, r: 26 };
  IMG.mypage.toggle = { x: 299 , y: 590 - CUT, w: 36, h: 20, label: "나만 보기" };
  for (const [n, [y, m, hd, fy]] of Object.entries(SPLIT)) { Object.assign(IMG[n], { split: y - CUT, mode: m || "scroll", head: hd ? hd - CUT : 0, focus: fy ? fy - CUT : 0 }); }
  const hotBtn = (h, i, k, oy = 0) => `<button class="hot" data-i="${i}" aria-label="${h.tab || h.go || h.fn || "뒤로"}" style="left:${(h.x * k).toFixed(1)}px;top:${((h.y - oy) * k).toFixed(1)}px;width:${(h.w * k).toFixed(1)}px;height:${(h.h * k).toFixed(1)}px"></button>`;
  for (const [name, d] of Object.entries(IMG)) {
    const file = d.img || FILE[name] || name, src = `screens/${file}.jpg`;
    screens[name] = () => {
      const k = 393 / d.w, sp = d.split || d.h, hd = d.head || 0, cd = d.card;
      const all = d.hot.map((h, i) => [h, i]);
      const inCard = (h) => cd && h.y >= cd.y0 && h.y < cd.y1;
      const head = all.filter(([h]) => h.y < hd), foot = all.filter(([h]) => h.y >= sp);
      const card = all.filter(([h]) => inCard(h)), top = all.filter(([h]) => h.y >= hd && h.y < sp && !inCard(h));
      const footH = (d.h - sp) * k, clipH = Math.max(120, APPH - footH), clip = d.mode === "clipb" ? `max-height:${clipH}px;` : "";
      const off = d.mode === "clipb" ? Math.min(0, clipH - sp * k) : 0;
      // 목록 화면: 조금 넘치면 통째로 살짝 줄여서 한 화면에 (양옆은 배경색으로 이어짐)
      let s = 1;
      if (d.mode === "scroll" && !hd) { const f = (APPH - footH) / (sp * k); if (f < 1 && f >= 0.98) s = f; } // 원래 크기 유지 (넘치면 스크롤)
      const K = k * s, topH = (sp - hd) * K;
      const tg = d.toggle ? `<button class="tgl ${S.toggles?.[name] ? "on" : ""}" data-tgl="${name}" aria-label="${d.toggle.label}" style="left:${(d.toggle.x * K).toFixed(1)}px;top:${((d.toggle.y - hd) * K).toFixed(1)}px;width:${(d.toggle.w * K).toFixed(1)}px;height:${(d.toggle.h * K).toFixed(1)}px;--kn:${(d.toggle.h * K * 0.76).toFixed(1)}px"><i></i></button>` : "";
      return `
      <section class="screen shot-screen ${d.mode || ""}">
        ${hd ? `<div class="shot-head" style="height:${(hd * k).toFixed(1)}px">
          <img src="${src}" alt="" draggable="false">
          ${head.map(([h, i]) => hotBtn(h, i, k)).join("")}
        </div>` : ""}
        <div class="shot-top" ${d.focus ? `data-focus="${((d.focus - hd) * k).toFixed(0)}"` : ""} style="${s < 1 ? `background:url('screens/edge/${file}.png') 0 0 / 100% ${(d.h * K).toFixed(0)}px no-repeat` : ""}"><div class="shot" style="width:${(393 * s).toFixed(1)}px;height:${topH.toFixed(1)}px;margin:0 auto;${clip}">
          <img src="${d.mapImg || src}" alt="" draggable="false" style="width:${(393 * s).toFixed(1)}px;height:auto;top:${(off - hd * K).toFixed(1)}px">
          ${top.map(([h, i]) => hotBtn(h, i, K, hd - off / K)).join("")}${tg}
        </div></div>
        ${cd ? `<div class="shot-card" style="bottom:${(footH + (sp - cd.y1) * k).toFixed(1)}px;height:${((cd.y1 - cd.y0) * k).toFixed(1)}px;clip-path:inset(0 ${((393 / k - cd.x1) * k).toFixed(1)}px 0 ${(cd.x0 * k).toFixed(1)}px round ${cd.r}px)">
          <img src="${src}" alt="" draggable="false" style="top:${(-cd.y0 * k).toFixed(1)}px">
          ${card.map(([h, i]) => hotBtn(h, i, k, cd.y0)).join("")}
        </div>` : ""}
        ${d.split ? `<div class="shot-foot" style="height:${footH.toFixed(1)}px">
          <img src="${src}" alt="" draggable="false" style="top:${(-sp * k).toFixed(1)}px">
          ${foot.map(([h, i]) => hotBtn(h, i, k, sp)).join("")}
        </div>` : ""}
      </section>`;
    };
  }
  // 이미지 미리 불러오기 (화면 전환 시 깜빡임 방지)
  window.addEventListener("load", () => setTimeout(() => Object.entries(IMG).forEach(([n, d]) => { new Image().src = `screens/${d.img || FILE[n] || n}.jpg`; }), 800));

  const TABS = { "진단": () => (S.done ? "diagAgain" : "diagnose"), "탐험": () => (S.done ? "exploreCourse" : "explore"), "홈": () => "home", "내 코스": () => "mycourse", "마이": () => "mypage" };
  function tabGo(t) { stack.length = 0; go(TABS[t]()); }
  const FN = {
    newDiag: () => { Object.assign(S, { age: null, part: null, symptom: null, ans: {}, picked: new Set(), placeId: null }); go("age"); },
    showRx: () => {
      if (!S.symptom) Object.assign(S, { age: "40-50", part: "waist", symptom: "허리 뻐근함", ans: { energy: "걸으며 움직이기", scene: "자연", with: "혼자" } });
      go("rx");
    },
    fog: () => toast("안개에 가려진 지역이에요 · 청주나 괴산을 눌러보세요"),
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

  const qNames = D.questions.map((_, i) => `q${i + 3}`);
  const qOrder = ["age", "body", ...qNames, "brewing"];
  // 아픈 곳 → 증상 (증상 고르는 화면 없이 자동으로)
  const PART_SYM = { head: "눈의 피로", neck: "목 결림", shoulder: "어깨 결림", waist: "허리 뻐근함", knee: "관절 뻐근함" };
  const WHOLE_SYM = { "10-30": "수면 부족", "40-50": "만성 피로", "60-70": "기력 저하" };
  const nextOf = (n) => qOrder[qOrder.indexOf(n) + 1];

  // ── per-screen wiring ──
  const after = {
    terms: (el) => {
      el.querySelectorAll("[data-t]").forEach((b) => (b.onclick = (e) => {
        if (e.target.closest(".chev")) return toast("약관 내용은 준비 중이에요");
        const t = b.dataset.t;
        if (t === "all") { const v = !S.terms.every(Boolean); S.terms = S.terms.map(() => v); }
        else S.terms[+t] = !S.terms[+t];
        rerender(el);
      }));
      el.querySelector('[data-act="agree"]').onclick = () => { stack.length = 0; go("diagnose"); };
      el.querySelector('[data-act="skip"]').onclick = () => { stack.length = 0; go("diagnose"); };
    },
    onboarding: (el) => {
      let moved = false;
      const next = () => { if (moved) return; moved = true; clearTimeout(t); go("terms", { replace: true }); };
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
      el.querySelector('[data-act="next"]').onclick = () => { S.symptom = PART_SYM[S.part] || WHOLE_SYM[S.age] || "만성 피로"; go("q3"); };
    },
    symptom: (el) => wireOpts(el, "[data-sym]", (b) => (S.symptom = b.dataset.sym), "symptom"),
    ...Object.fromEntries(qNames.map((n) => [n, (el) => wireOpts(el, "[data-ans]", (b) => (S.ans[b.dataset.ans] = b.dataset.val), n)])),
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
      // 처방이 나오면 스크롤 없이 바로: 가운데 '쾅' → 도장 자리로
      render._timer = setTimeout(() => stamp.isConnected && slamStamp(stamp, paper), 1000);
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


  // ── 오늘 날씨 (청주 기준, open-meteo) → 탐험 지도에 반영 ──
  const WX_NAME = { clear: "맑음", cloud: "구름 많음", fog: "안개", rain: "비", snow: "눈", storm: "뇌우" };
  const WX_ICON = { clear: "☀️", cloud: "⛅", fog: "🌫️", rain: "🌧️", snow: "❄️", storm: "⛈️" };
  const codeToWx = (c) => c <= 1 ? "clear" : c <= 3 ? "cloud" : c <= 48 ? "fog" : (c >= 71 && c <= 77) || c === 85 || c === 86 ? "snow" : c >= 95 ? "storm" : "rain";
  const WX = { ready: null, data: null };
  WX.ready = (async () => {
    const force = new URLSearchParams(location.search).get("weather");
    if (force && WX_NAME[force]) return (WX.data = { type: force, temp: 12, day: true, forced: true });
    try { const c = JSON.parse(sessionStorage.getItem("cbwx") || "null"); if (c && Date.now() - c.t < 30 * 60e3) return (WX.data = c.d); } catch (e) {}
    try {
      const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=36.64&longitude=127.49&current=temperature_2m,weather_code,is_day&timezone=Asia%2FSeoul");
      const j = await r.json(); const cur = j.current;
      WX.data = { type: codeToWx(cur.weather_code), temp: Math.round(cur.temperature_2m), day: !!cur.is_day };
      try { sessionStorage.setItem("cbwx", JSON.stringify({ t: Date.now(), d: WX.data })); } catch (e) {}
    } catch (e) { const h = new Date().getHours(); WX.data = { type: "clear", temp: null, day: h >= 6 && h < 19 }; }
    return WX.data;
  })();
  // 날씨: 비·눈은 내리고, 맑으면 해, 흐리면 구름이 흘러가요 (화면 전체, 터치 방해 없음)
  function addWeather(shot) {
    if (!shot) return;
    WX.ready.then((w) => {
      const scr = shot.closest(".screen"); if (!scr || !scr.isConnected) return;
      const t = w.type === "storm" ? "rain" : w.type === "fog" ? "cloud" : w.type;
      const layer = document.createElement("div"); layer.className = `wx wx-${t}`;
      if (t === "clear" && w.day) layer.innerHTML = '<div class="wx-sun"><i></i></div>';
      if (t === "cloud") layer.innerHTML = [[90, 150, .9, 0], [230, 120, .8, -14], [330, 170, .8, -7], [430, 110, .7, -20]].map(([y, w2, sc, dl]) => `<div class="wx-cl" style="top:${y}px;--s:${sc};animation-delay:${dl}s"><div class="cloud" style="position:relative;left:0;top:0;width:${w2}px;height:${w2 * 0.42}px"></div></div>`).join("");
      if (t === "rain" || t === "snow") layer.innerHTML = `<canvas width="393" height="${APPH}"></canvas>`;
      if (layer.innerHTML) scr.appendChild(layer);
      if (t === "rain" || t === "snow") particles(layer.firstChild, t, t === "rain" ? 90 : 60);
    });
  }
  const wxTip = (w) => ({ clear: "맑은 날! 평지 산책하기 딱 좋아요", cloud: "구름이 많아요 · 걷기엔 선선해요", fog: "안개가 꼈어요 · 천천히 둘러봐요", rain: "비가 와요 · 우산 챙기고 실내 코스도 좋아요", snow: "눈이 와요 · 미끄럼 주의!", storm: "천둥번개가 쳐요 · 오늘은 실내 코스 추천" })[w.type];
  function particles(cv, type, n) {
    const ctx = cv.getContext("2d"), W = 393, H = cv.height;
    const P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0, r: 0, s: Math.random() }));
    P.forEach((p) => { p.v = type === "snow" ? 0.4 + p.s * 0.9 : type === "clear" ? 0 : 7 + p.s * 6; p.r = type === "snow" ? 1.5 + p.s * 2.6 : 1; });
    let t = 0;
    (function loop() {
      if (!cv.isConnected) return;
      t++; ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        if (type === "snow") { p.y += p.v; p.x += Math.sin((t + p.s * 300) / 40) * 0.5; ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.strokeStyle = "rgba(120,160,210,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.stroke(); }
        else if (type === "clear") { const a = 0.3 + 0.7 * Math.abs(Math.sin((t / 60) + p.s * 6)); if (p.y < H * 0.55) { ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y * 0.55, 0.8 + p.s * 1.4, 0, 7); ctx.fill(); } }
        else { p.y += p.v; p.x -= p.v * 0.18; ctx.strokeStyle = "rgba(60,125,205,.5)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 2.2, p.y - 12); ctx.stroke(); }
        if (p.y > H + 12) { p.y = -12; p.x = Math.random() * (W + 60); }
      }
      requestAnimationFrame(loop);
    })();
  }

  // ── 처방 도장: 화면 가운데 '쾅' → 원래 도장 자리로 이동 ──
  function slamStamp(stamp, paper) {
    const big = stamp.cloneNode(true);
    big.removeAttribute("id"); big.className = "stamp stamp-fly";
    app.appendChild(big);
    const appBox = app.getBoundingClientRect(), k = appBox.width / 393;
    const t = stamp.getBoundingClientRect();
    const tx = (t.left - appBox.left) / k + t.width / k / 2, ty = (t.top - appBox.top) / k + t.height / k / 2;
    const cx = 393 / 2, cy = 852 / 2 - 40;
    big.style.left = cx - 52 + "px"; big.style.top = cy - 52 + "px";
    const flash = document.createElement("div"); flash.className = "stamp-flash"; app.appendChild(flash);
    big.animate([
      { transform: "rotate(-12deg) scale(3.2)", opacity: 0 },
      { transform: "rotate(-12deg) scale(1.75)", opacity: 1, offset: 0.1 },
      { transform: "rotate(-12deg) scale(1.95)", opacity: 1, offset: 0.16 },
      { transform: "rotate(-12deg) scale(1.9)", opacity: 1, offset: 0.55 },
      { transform: `translate(${tx - cx}px, ${ty - cy}px) rotate(-12deg) scale(1)`, opacity: 1 },
    ], { duration: 1400, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).onfinish = () => {
      stamp.classList.add("placed"); big.remove(); flash.remove();
      paper.classList.add("shake"); navigator.vibrate?.(30);
    };
    setTimeout(() => { flash.classList.add("on"); navigator.vibrate?.(50); }, 130);
  }

  // ── 안개가 서서히 걷히는 연출 ──
  function fogReveal(el, cx = 194, cy = 380) {
    const f = document.createElement("div"); f.className = "fog";
    const puffs = [[-40, 80], [120, 40], [260, 90], [-60, 260], [90, 230], [250, 250], [-30, 440], [140, 420], [280, 460], [20, 620], [200, 600], [60, 330], [190, 330]];
    f.innerHTML = '<div class="haze"></div>' + puffs.map(([x, y], i) => `<img src="assets/map/fog.png" alt="" style="left:${x}px;top:${y}px;--d:${i * 70}ms">`).join("") +
      '<div class="fog-msg">☁ 안개가 걷히는 중…</div>';
    el.appendChild(f);
    f.querySelectorAll("img").forEach((im) => {
      const x = parseFloat(im.style.left) + 90, y = parseFloat(im.style.top) + 80;
      const dx = (x - cx) * 1.6, dy = (y - cy) * 1.3;
      im.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(1.5)`, opacity: 0 }],
        { duration: 2600, delay: 350 + parseInt(im.style.getPropertyValue("--d")), easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    });
    f.querySelector(".haze").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 2400, delay: 500, easing: "ease-out", fill: "forwards" });
    f.querySelector(".fog-msg").animate([{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 2600, fill: "forwards" });
    setTimeout(() => f.remove(), 3600);
  }
  // 청주 지도에 들어갈 때도 안개 연출
  // 탐험 탭 처음 들어갈 때: 화면 전체 안개가 걷히고 충북 전체 지도
  for (const n of ["explore", "exploreCourse"]) {
    const orig = after[n];
    after[n] = (el) => { orig(el); if (!S.seen?.explore) { (S.seen ||= {}).explore = true; el.classList.add("fogging"); fogReveal(el.querySelector(".shot"), 196, 430); setTimeout(() => el.classList.remove("fogging"), 2700); } };
  }
  const _cj = after.cheongju;
  after.cheongju = (el) => { _cj(el); if (!S.seen?.cheongju) { (S.seen ||= {}).cheongju = true; fogReveal(el.querySelector(".shot"), 150, 420); } };

  // ── 충북 지도에서 지역 누르면 확대 후 이동 ──
  FN.zoomCheongju = () => zoomTo(70, 425, "cheongju");
  FN.zoomGoesan = () => zoomTo(150, 376, "goesan");
  function zoomTo(x, y, target) {
    const img = app.querySelector(".shot img");
    if (!img) return go(target);
    img.style.transformOrigin = `${x / 393 * 100}% ${(y - CUT) / 814 * 100}%`;
    img.animate([{ transform: "scale(1)" }, { transform: "scale(2.6)", filter: "blur(1px)" }], { duration: 650, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" })
      .onfinish = () => go(target);
  }

  // ── 괴산 지역 지도 (청주와 같은 방식으로 클릭) ──
  const GS = [
    { name: "고산정 소나무숲 산책로", short: "고산정", lm: 1, px: 58.2, py: 420.2, ly: 458.7, pin: [113, 389] , dist: "120m · 도보 2분" },
    { name: "문광저수지", short: "문광저수지", lm: 2, px: 171.6, py: 406.3, ly: 444.7, pin: [226, 375], dist: "350m · 도보 5분" },
    { name: "성불산 산림휴양단지", short: "성불산 휴양단지", lm: 3, px: 83.7, py: 313.7, ly: 351.9, pin: [138, 283], dist: "1.2km · 차 4분" },
    { name: "자연드림", short: "자연드림", lm: 4, px: 217.9, py: 297.5, ly: 334.8, pin: [272, 267], dist: "2.4km · 차 7분" },
  ];
  S.gs = { cur: 0, done: [] };
  const navBar = (on) => `<nav class="nav map-nav">${nav.map(([n, p]) => `<button class="${n === on ? "on" : ""}" data-tab="${n}"><svg viewBox="0 0 24 24">${p}</svg>${n}</button>`).join("")}</nav>`;
  screens.goesan = () => {
    const g = S.gs, cur = GS[g.cur], isDone = g.done.includes(g.cur), all = g.done.length === GS.length;
    return `
    <section class="screen shot-screen"><div class="shot" style="width:393px;height:${APPH}px"><div class="gmap" style="height:${(APPH * 388 / 393 + 38).toFixed(0)}px;transform:scale(${(393 / 388).toFixed(4)}) translateY(-38px)">
      <img class="gbg" src="screens/goesan-map.jpg" alt="" draggable="false">
      ${GS.map((p, i) => `
        <button class="gplace ${i === g.cur ? "cur" : ""}" data-p="${i}" style="left:${p.px}px;top:${p.py - 30}px">
          <img class="gbase" src="assets/map/base.png" alt=""><img class="glm" src="assets/map/lm-${p.lm}.png" alt="">
        </button>
        <span class="glabel ${i === g.cur ? "cur" : ""}" style="left:${p.px + 45.5}px;top:${p.ly}px">${p.short}</span>
        ${g.done.includes(i) ? `<img class="gpin" src="assets/map/pin.png" alt="도장 완료" style="left:${p.pin[0]}px;top:${p.pin[1]}px">` : ""}`).join("")}
      <span class="glabel treasure" style="left:282px;top:146px">${all ? "보물 열림!" : "마지막 보물"}</span>
      <img class="gmole" src="assets/map/mole-slot.png" alt="" style="left:${GS[g.cur].px + 62}px;top:${GS[g.cur].py - 22}px">
      <div class="ghead"><button class="gback" data-act="gback">‹</button><span class="gcrumb">충청북도 <b>›</b> <strong>괴산</strong></span></div>
      <div class="gchip"><i></i><span>이번 코스<b>${g.done.length} / ${GS.length}곳</b></span></div>
      <button class="gbook" data-act="gbook"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M6 3h11a2 2 0 012 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" fill="#0081ee"/></svg>${g.done.length ? `<em>${g.done.length}</em>` : ""}</button>
      <div class="gctrl"><button>⌖</button><button>＋</button><button>－</button></div>
      <div class="gcard">
        <div class="gcard-top"><span class="gtag">${isDone ? "도장 완료" : g.done.length ? "다음 장소" : "현재 장소"}</span><span class="grate">★ 4.8</span></div>
        <h3>${cur.name}</h3>
        <p>🚶 → ${cur.dist}</p>
        <div class="gbtns"><button class="cta gstamp" data-act="gstamp" ${isDone ? "disabled" : ""}>${isDone ? "도장 완료" : "🖃 스탬프 찍기"}</button><button class="gsave" data-act="gsave">🔖</button></div>
      </div>
      ${navBar("탐험")}
    </div></div></section>`;
  };
  after.goesan = (el) => {
    el.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => { S.gs.cur = +b.dataset.p; rerender(el); }));
    el.querySelector('[data-act="gback"]').onclick = () => tabGo("탐험");
    el.querySelector('[data-act="gbook"]').onclick = () => go("stampbook");
    el.querySelector('[data-act="gsave"]').onclick = () => toast("저장했어요");
    el.querySelector('[data-act="gstamp"]').onclick = () => { if (!S.gs.done.includes(S.gs.cur)) S.gs.done.push(S.gs.cur); go("gstampDone"); };
    el.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => tabGo(b.dataset.tab)));
    if (!S.seen?.goesan) { (S.seen ||= {}).goesan = true; fogReveal(el.querySelector(".shot"), 150, 400); }
  };
  screens.gstampDone = () => {
    const g = S.gs, i = g.done[g.done.length - 1], p = GS[i];
    const next = GS.findIndex((_, j) => !g.done.includes(j));
    return `
    <section class="screen gsd">
      <div class="title-row"><button class="back-btn" data-act="back" aria-label="뒤로">${I.back}</button><h1 style="text-align:center;margin-right:52px">스탬프</h1></div>
      <div class="gsd-stamp"><img src="assets/map/stamp-goesan-${p.lm}.png" alt="${p.name} 우표"><span class="zzan">짠!</span></div>
      ${mole("gsd-mole")}
      <h2 class="gsd-title">스탬프<b>완료!</b></h2>
      <div class="gsd-name"><b>${p.name}</b><span>☁ 안개가 걷혔어요</span></div>
      <div class="gsd-course"><div><b>이번 코스</b><b class="blue">${g.done.length} / ${GS.length}곳</b></div>
        <ol>${GS.map((q, j) => `<li class="${g.done.includes(j) ? (j === i ? "now" : "ok") : ""}"><i>${g.done.includes(j) ? "✓" : "?"}</i><span>${g.done.includes(j) ? q.short.split(" ")[0] : "???"}</span></li>`).join("")}</ol>
      </div>
      <div class="spacer"></div>
      <div class="gsd-next">${next >= 0 ? `<b>다음은 ${GS[next].short}!</b><span>가서 또 도장 찍자</span>` : `<b>괴산 코스 완주! 보물이 열렸어요</b><span>스탬프북에서 확인해 보세요</span>`}</div>
      <div class="bottom-row"><button class="cta ghost" data-act="close" style="flex:.6">닫기</button><button class="cta" data-act="nextp">${next >= 0 ? "다음 장소 보기" : "스탬프북 보기"}</button></div>
    </section>`;
  };
  after.gstampDone = (el) => {
    const g = S.gs, next = GS.findIndex((_, j) => !g.done.includes(j));
    el.querySelector(".gsd-stamp img").animate([{ transform: "rotate(-4deg) scale(2.2)", opacity: 0 }, { transform: "rotate(-4deg) scale(.94)", opacity: 1, offset: .6 }, { transform: "rotate(-4deg) scale(1)" }], { duration: 650, easing: "cubic-bezier(.2,1.4,.4,1)" });
    navigator.vibrate?.(40);
    const backToMap = () => { stack.pop(); render("goesan", true); toast(`${GS[g.done[g.done.length - 1]].short} 스탬프 완료!`); };
    el.querySelector('[data-act="close"]').onclick = backToMap;
    el.querySelector('[data-act="nextp"]').onclick = () => { if (next >= 0) { g.cur = next; backToMap(); } else go("stampbook"); };
  };

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
    setBackdrop(n); fitScreen(n); refit(n);
  }

  for (const [n, place] of [["explore", "충북"], ["exploreCourse", "충북"], ["cheongju", "청주"], ["cheongjuDone", "청주"], ["cheongjuSheet", "청주"], ["goesan", "괴산"]]) {
    const orig = after[n];
    after[n] = (el) => { orig(el); addWeather(el.querySelector(".shot"), place); };
  }

  scaleApp();
  // '나만 보기' 같은 토글 스위치
  app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tgl]"); if (!t) return;
    const on = !(S.toggles ||= {})[t.dataset.tgl]; S.toggles[t.dataset.tgl] = on; t.classList.toggle("on", on);
    toast(on ? "나만 보기 켜짐 · 내 기록은 나만 볼 수 있어요" : "나만 보기 꺼짐");
  });
  window.__go = (n) => { stack.length = 0; S.done = true; go(n); };
  window.__cur = () => stack.map((s) => s.name).join(">");
  go("onboarding");
})();
