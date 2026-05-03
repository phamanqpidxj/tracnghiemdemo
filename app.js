/* Linux MCQ practice — vanilla JS, no build step. */

const state = {
  questions: [],
  view: "home",
  practice: null,
  exam: null,
};

const VIEWS = ["home", "practice", "exam", "bank"];

document.addEventListener("DOMContentLoaded", () => {
  bindNav();
  bindHomeActions();
  bindPracticeForm();
  bindExamForm();
  bindBankControls();
  loadQuestions();
});

function bindNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
}

function switchView(view) {
  if (!VIEWS.includes(view)) return;
  state.view = view;
  for (const v of VIEWS) {
    document.getElementById(`view-${v}`).classList.toggle("active", v === view);
  }
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if (view === "bank") renderBank();
}

function bindHomeActions() {
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.dataset.action;
      if (a === "start-practice") switchView("practice");
      else if (a === "start-exam") switchView("exam");
      else if (a === "show-bank") switchView("bank");
    });
  });
}

async function loadQuestions() {
  try {
    const res = await fetch("questions.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.questions = await res.json();
    document.getElementById("total-count").textContent =
      String(state.questions.length);
    renderBank();
  } catch (err) {
    console.error(err);
    document.querySelector("#view-home .hero p").textContent =
      "Không thể tải dữ liệu câu hỏi (questions.json). Hãy mở qua một HTTP server.";
  }
}

/* ------------ helpers ------------ */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(section, count) {
  let pool = state.questions.slice();
  if (section === "1") pool = pool.filter((q) => q.section === 1);
  else if (section === "2") pool = pool.filter((q) => q.section === 2);
  pool = shuffle(pool);
  if (count !== "all") {
    const n = Math.min(parseInt(count, 10), pool.length);
    pool = pool.slice(0, n);
  }
  return pool;
}

function buildQuestionInstance(q, shuffleOptions) {
  const letters = ["A", "B", "C", "D"];
  const present = letters.filter((l) => q.options[l] != null);
  const order = shuffleOptions ? shuffle(present) : present;
  return {
    id: q.id,
    section: q.section,
    text: q.text,
    order, // letters in display order
    options: q.options,
    answer: q.answer, // original letter
  };
}

function letterAt(inst, idx) {
  return inst.order[idx];
}

/* ------------ practice mode ------------ */

function bindPracticeForm() {
  const form = document.getElementById("practice-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const sec = data.get("section");
    const count = data.get("count");
    const shuffleOpts = !!data.get("shuffle-options");
    const questions = pickQuestions(sec, count).map((q) =>
      buildQuestionInstance(q, shuffleOpts),
    );
    if (!questions.length) return;
    state.practice = {
      questions,
      idx: 0,
      answers: new Array(questions.length).fill(null),
      revealed: new Array(questions.length).fill(false),
    };
    document.querySelector("#view-practice .setup").classList.add("hidden");
    document.getElementById("practice-runner").classList.remove("hidden");
    renderPractice();
  });
}

function renderPractice() {
  const runner = document.getElementById("practice-runner");
  const s = state.practice;
  if (!s) return;
  const q = s.questions[s.idx];
  const correctCount = s.revealed.reduce(
    (n, r, i) => n + (r && s.answers[i] === q.answer ? 0 : 0),
    0,
  );
  // count correct/wrong in revealed answers
  let correct = 0;
  let wrong = 0;
  for (let i = 0; i < s.questions.length; i++) {
    if (s.revealed[i]) {
      if (s.answers[i] === s.questions[i].answer) correct++;
      else if (s.answers[i] != null) wrong++;
    }
  }

  const revealed = s.revealed[s.idx];
  const userPick = s.answers[s.idx];

  runner.innerHTML = `
    <div class="q-header">
      <div class="q-progress">Câu <strong>${s.idx + 1}</strong> / ${s.questions.length} •
        <span class="value-correct">${correct} đúng</span> •
        <span class="value-wrong">${wrong} sai</span>
      </div>
      <div class="q-progress">Phần ${q.section}</div>
    </div>
    <p class="q-text"><span class="badge">Câu ${q.id}</span>${escapeHTML(q.text)}</p>
    <div class="options">
      ${q.order
        .map((letter, i) => {
          const optText = q.options[letter];
          let cls = "option";
          if (revealed) {
            if (letter === q.answer) cls += " correct";
            if (userPick === letter && letter !== q.answer) cls += " wrong";
          } else if (userPick === letter) {
            cls += " selected";
          }
          return `
          <label class="${cls}" data-letter="${letter}">
            <input type="radio" name="opt" value="${letter}" ${userPick === letter ? "checked" : ""} ${revealed ? "disabled" : ""} hidden />
            <span class="letter">${displayLetter(i)}</span>
            <span class="text">${escapeHTML(optText)}</span>
          </label>`;
        })
        .join("")}
    </div>
    ${
      revealed
        ? `<div class="feedback ${userPick === q.answer ? "correct" : "wrong"}">
            ${userPick === q.answer ? "✓ Chính xác." : `✗ Chưa đúng. Đáp án đúng là <strong>${displayLetter(q.order.indexOf(q.answer))}. ${escapeHTML(q.options[q.answer])}</strong>.`}
          </div>`
        : ""
    }
    <div class="q-footer">
      <div class="left">
        <button class="ghost" data-act="prev" ${s.idx === 0 ? "disabled" : ""}>← Câu trước</button>
        <button class="ghost" data-act="next" ${s.idx === s.questions.length - 1 ? "disabled" : ""}>Câu sau →</button>
      </div>
      <div class="right">
        ${
          revealed
            ? `<button class="primary" data-act="${s.idx === s.questions.length - 1 ? "finish" : "next-auto"}">${s.idx === s.questions.length - 1 ? "Xem tổng kết" : "Câu kế tiếp →"}</button>`
            : `<button class="primary" data-act="check" ${userPick == null ? "disabled" : ""}>Kiểm tra đáp án</button>`
        }
        <button class="ghost" data-act="quit">Thoát</button>
      </div>
    </div>
  `;

  runner.querySelectorAll(".option").forEach((el) => {
    el.addEventListener("click", () => {
      if (s.revealed[s.idx]) return;
      s.answers[s.idx] = el.dataset.letter;
      renderPractice();
    });
  });
  runner.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", () => practiceAct(b.dataset.act));
  });
}

function practiceAct(act) {
  const s = state.practice;
  if (!s) return;
  if (act === "prev" && s.idx > 0) {
    s.idx--;
  } else if ((act === "next" || act === "next-auto") && s.idx < s.questions.length - 1) {
    s.idx++;
  } else if (act === "check") {
    if (s.answers[s.idx] != null) s.revealed[s.idx] = true;
  } else if (act === "finish") {
    practiceFinish();
    return;
  } else if (act === "quit") {
    if (!confirm("Thoát chế độ luyện tập? Tiến độ hiện tại sẽ mất.")) return;
    state.practice = null;
    document.querySelector("#view-practice .setup").classList.remove("hidden");
    document.getElementById("practice-runner").classList.add("hidden");
    return;
  }
  renderPractice();
}

function practiceFinish() {
  const s = state.practice;
  let correct = 0;
  for (let i = 0; i < s.questions.length; i++) {
    if (s.answers[i] === s.questions[i].answer) correct++;
  }
  const total = s.questions.length;
  const wrong = total - correct;
  const percent = total ? Math.round((correct * 100) / total) : 0;
  const runner = document.getElementById("practice-runner");
  runner.innerHTML = renderResultHTML({
    title: "Kết thúc luyện tập",
    correct,
    wrong,
    total,
    percent,
    answers: s.answers,
    questions: s.questions,
    onAgain: "practice-again",
    onClose: "practice-close",
  });
  runner.querySelector("[data-act='practice-again']").addEventListener("click", () => {
    document.querySelector("#view-practice .setup").classList.remove("hidden");
    runner.classList.add("hidden");
    state.practice = null;
  });
  runner.querySelector("[data-act='practice-close']").addEventListener("click", () => {
    document.querySelector("#view-practice .setup").classList.remove("hidden");
    runner.classList.add("hidden");
    state.practice = null;
    switchView("home");
  });
}

/* ------------ exam mode ------------ */

function bindExamForm() {
  const form = document.getElementById("exam-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const sec = data.get("section");
    const count = data.get("count");
    const duration = parseInt(data.get("duration"), 10);
    const shuffleOpts = !!data.get("shuffle-options");
    const questions = pickQuestions(sec, count).map((q) =>
      buildQuestionInstance(q, shuffleOpts),
    );
    if (!questions.length) return;
    state.exam = {
      questions,
      idx: 0,
      answers: new Array(questions.length).fill(null),
      duration,
      remaining: duration > 0 ? duration * 60 : 0,
      timerId: null,
      submitted: false,
    };
    document.querySelector("#view-exam .setup").classList.add("hidden");
    document.getElementById("exam-runner").classList.remove("hidden");
    renderExam();
    if (duration > 0) startExamTimer();
  });
}

function startExamTimer() {
  const s = state.exam;
  if (s.timerId) clearInterval(s.timerId);
  s.timerId = setInterval(() => {
    s.remaining--;
    updateExamTimer();
    if (s.remaining <= 0) {
      clearInterval(s.timerId);
      s.timerId = null;
      submitExam(true);
    }
  }, 1000);
}

function updateExamTimer() {
  const el = document.querySelector("#exam-runner .timer");
  if (!el) return;
  const s = state.exam;
  if (!s) return;
  const m = Math.floor(s.remaining / 60);
  const sec = s.remaining % 60;
  el.textContent = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  el.classList.toggle("danger", s.remaining < 60);
}

function renderExam() {
  const s = state.exam;
  if (!s) return;
  const q = s.questions[s.idx];
  const userPick = s.answers[s.idx];
  const answered = s.answers.filter((a) => a != null).length;
  const runner = document.getElementById("exam-runner");

  runner.innerHTML = `
    <div class="q-header">
      <div class="q-progress">Câu <strong>${s.idx + 1}</strong> / ${s.questions.length}
        • Đã trả lời: <strong>${answered}</strong></div>
      ${s.duration > 0 ? `<div class="timer">${formatTimer(s.remaining)}</div>` : ""}
    </div>
    <p class="q-text"><span class="badge">Câu ${q.id}</span>${escapeHTML(q.text)}</p>
    <div class="options">
      ${q.order
        .map((letter, i) => {
          const optText = q.options[letter];
          const cls = "option" + (userPick === letter ? " selected" : "");
          return `
          <label class="${cls}" data-letter="${letter}">
            <input type="radio" name="opt" value="${letter}" ${userPick === letter ? "checked" : ""} hidden />
            <span class="letter">${displayLetter(i)}</span>
            <span class="text">${escapeHTML(optText)}</span>
          </label>`;
        })
        .join("")}
    </div>
    <div class="q-footer">
      <div class="left">
        <button class="ghost" data-act="prev" ${s.idx === 0 ? "disabled" : ""}>← Câu trước</button>
        <button class="ghost" data-act="next" ${s.idx === s.questions.length - 1 ? "disabled" : ""}>Câu sau →</button>
      </div>
      <div class="right">
        <button class="primary" data-act="submit">Nộp bài</button>
        <button class="ghost" data-act="quit">Thoát</button>
      </div>
    </div>
  `;

  runner.querySelectorAll(".option").forEach((el) => {
    el.addEventListener("click", () => {
      s.answers[s.idx] = el.dataset.letter;
      renderExam();
    });
  });
  runner.querySelectorAll("button[data-act]").forEach((b) => {
    b.addEventListener("click", () => examAct(b.dataset.act));
  });
}

function examAct(act) {
  const s = state.exam;
  if (!s) return;
  if (act === "prev" && s.idx > 0) s.idx--;
  else if (act === "next" && s.idx < s.questions.length - 1) s.idx++;
  else if (act === "submit") {
    const remaining = s.answers.filter((a) => a == null).length;
    if (remaining > 0) {
      if (!confirm(`Bạn còn ${remaining} câu chưa trả lời. Nộp bài luôn?`))
        return;
    }
    submitExam(false);
    return;
  } else if (act === "quit") {
    if (!confirm("Thoát phòng thi? Toàn bộ tiến độ hiện tại sẽ mất.")) return;
    if (s.timerId) clearInterval(s.timerId);
    state.exam = null;
    document.querySelector("#view-exam .setup").classList.remove("hidden");
    document.getElementById("exam-runner").classList.add("hidden");
    return;
  }
  renderExam();
}

function submitExam(autoSubmit) {
  const s = state.exam;
  if (!s || s.submitted) return;
  s.submitted = true;
  if (s.timerId) {
    clearInterval(s.timerId);
    s.timerId = null;
  }
  let correct = 0;
  for (let i = 0; i < s.questions.length; i++) {
    if (s.answers[i] === s.questions[i].answer) correct++;
  }
  const total = s.questions.length;
  const wrong = total - correct;
  const percent = total ? Math.round((correct * 100) / total) : 0;
  const runner = document.getElementById("exam-runner");
  runner.innerHTML =
    (autoSubmit
      ? `<div class="feedback wrong">⏰ Hết giờ — bài thi đã được nộp tự động.</div>`
      : "") +
    renderResultHTML({
      title: "Kết quả bài thi",
      correct,
      wrong,
      total,
      percent,
      answers: s.answers,
      questions: s.questions,
      onAgain: "exam-again",
      onClose: "exam-close",
    });
  runner.querySelector("[data-act='exam-again']").addEventListener("click", () => {
    document.querySelector("#view-exam .setup").classList.remove("hidden");
    runner.classList.add("hidden");
    state.exam = null;
  });
  runner.querySelector("[data-act='exam-close']").addEventListener("click", () => {
    document.querySelector("#view-exam .setup").classList.remove("hidden");
    runner.classList.add("hidden");
    state.exam = null;
    switchView("home");
  });
}

function renderResultHTML(opts) {
  const { title, correct, wrong, total, percent, answers, questions, onAgain, onClose } = opts;
  const reviewItems = questions
    .map((q, i) => {
      const userLetter = answers[i];
      const userIsCorrect = userLetter === q.answer;
      const cls = userIsCorrect ? "correct" : "wrong";
      const optsHtml = q.order
        .map((l, j) => {
          let lc = "opt";
          if (l === q.answer && userLetter === l) lc += " both";
          else if (l === q.answer) lc += " correct";
          else if (userLetter === l) lc += " your";
          return `<div class="${lc}">${displayLetter(j)}. ${escapeHTML(q.options[l])}${
            l === q.answer ? " ✓" : ""
          }${userLetter === l && l !== q.answer ? " ✗" : ""}</div>`;
        })
        .join("");
      const userText =
        userLetter == null
          ? `<span class="opt your">(Bạn chưa trả lời)</span>`
          : userIsCorrect
            ? ""
            : `<div class="opt your">Bạn chọn: ${displayLetter(q.order.indexOf(userLetter))}</div>`;
      return `
        <li class="review-item ${cls}">
          <div class="q"><span class="badge">Câu ${q.id} • Phần ${q.section}</span> ${escapeHTML(q.text)}</div>
          ${optsHtml}
          ${userText}
        </li>`;
    })
    .join("");

  return `
    <h2 style="margin:0 0 12px">${title}</h2>
    <div class="summary-bar">
      <div class="stat score"><div class="label">Điểm</div><div class="value">${percent}%</div></div>
      <div class="stat success"><div class="label">Đúng</div><div class="value">${correct}/${total}</div></div>
      <div class="stat danger"><div class="label">Sai/Bỏ trống</div><div class="value">${wrong}/${total}</div></div>
    </div>
    <div class="q-footer">
      <div class="left">
        <button class="primary" data-act="${onAgain}">Làm lại</button>
        <button class="ghost" data-act="${onClose}">Về trang chủ</button>
      </div>
    </div>
    <h3 style="margin-top:18px">Xem lại từng câu</h3>
    <ul class="review">${reviewItems}</ul>
  `;
}

/* ------------ bank view ------------ */

function bindBankControls() {
  document.getElementById("bank-search").addEventListener("input", renderBank);
  document.getElementById("bank-filter").addEventListener("change", renderBank);
  document.getElementById("bank-show-answers").addEventListener("change", renderBank);
}

function renderBank() {
  const list = document.getElementById("bank-list");
  if (!list) return;
  const q = (document.getElementById("bank-search").value || "").trim().toLowerCase();
  const filter = document.getElementById("bank-filter").value;
  const showAns = document.getElementById("bank-show-answers").checked;

  const filtered = state.questions.filter((it) => {
    if (filter === "1" && it.section !== 1) return false;
    if (filter === "2" && it.section !== 2) return false;
    if (!q) return true;
    const hay = (it.text + " " + Object.values(it.options).join(" ")).toLowerCase();
    return hay.includes(q);
  });

  list.innerHTML = filtered
    .map(
      (it) => `
      <li class="bank-item">
        <div class="meta">Phần ${it.section} • Câu ${it.id}</div>
        <div class="question">${escapeHTML(it.text)}</div>
        <ul>
          ${["A", "B", "C", "D"]
            .filter((l) => it.options[l] != null)
            .map(
              (l) =>
                `<li class="${showAns && l === it.answer ? "correct" : ""}">${l}. ${escapeHTML(it.options[l])}${showAns && l === it.answer ? "  ✓" : ""}</li>`,
            )
            .join("")}
        </ul>
      </li>`,
    )
    .join("");
  if (filtered.length === 0) {
    list.innerHTML = `<li class="bank-item">Không có câu hỏi phù hợp.</li>`;
  }
}

/* ------------ utils ------------ */

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function displayLetter(idx) {
  return String.fromCharCode(65 + idx);
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
