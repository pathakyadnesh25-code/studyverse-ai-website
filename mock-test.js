(() => {
  "use strict";

  const client = window.studyverseSupabase;
  const TEST_ID = new URLSearchParams(location.search).get("test_id");
  const STORAGE_KEY = "studyverse_mock_attempt_" + (TEST_ID || "missing");
  const $ = id => document.getElementById(id);

  const ui = {
    loading: $("loadingScreen"), login: $("loginScreen"), error: $("errorScreen"),
    errorMessage: $("errorMessage"), exam: $("examScreen"), result: $("resultScreen"),
    title: $("testTitle"), subtitle: $("testSubtitle"), timer: $("timer"),
    timerStatus: $("timerStatus"), progressText: $("progressText"),
    progressPercent: $("progressPercent"), progressBar: $("progressBar"),
    questionNumber: $("questionNumber"), questionType: $("questionType"),
    questionMarks: $("questionMarks"), questionText: $("questionText"),
    options: $("optionsContainer"), palette: $("questionPalette"),
    answered: $("answeredCount"), unanswered: $("unansweredCount"),
    marked: $("markedCount"), saveStatus: $("saveStatus"), toast: $("toast"),
    confirm: $("submitConfirm"), submitSummary: $("submitSummary")
  };

  const state = {
    attemptId: null, startedAt: null, duration: 45, title: "Mock Test",
    questions: [], answers: {}, marked: [], current: 0,
    saveChain: Promise.resolve(), submitted: false,
    timerHandle: null, toastHandle: null
  };

  function showOnly(section) {
    [ui.loading, ui.login, ui.error, ui.exam, ui.result].forEach(el => {
      if (el) el.hidden = el !== section;
    });
  }

  function showError(message) {
    ui.errorMessage.textContent = message || "An unexpected error occurred.";
    showOnly(ui.error);
  }

  function notify(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("show");
    clearTimeout(state.toastHandle);
    state.toastHandle = setTimeout(() => ui.toast.classList.remove("show"), 2800);
  }

  function unwrap(value) {
    let v = value;
    for (let i = 0; i < 3; i++) {
      if (Array.isArray(v) && v.length === 1) v = v[0];
      else if (v && typeof v === "object" && v.data &&
        !v.questions && !v.attempt_id) v = v.data;
      else break;
    }
    return v;
  }

  function parseOptions(value) {
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch (_) { return {}; }
    }
    if (Array.isArray(value)) {
      const result = {};
      value.forEach((item, index) => {
        if (item && typeof item === "object") {
          const key = item.key || item.label || String.fromCharCode(65 + index);
          result[key] = item.text || item.value || item.option || "";
        } else {
          result[String.fromCharCode(65 + index)] = String(item);
        }
      });
      return result;
    }
    return value && typeof value === "object" ? value : {};
  }

  function normalizeQuestion(q, index) {
    return {
      id: q.id || q.question_id,
      text: q.question_text || q.text || q.question || "",
      type: q.question_type || "MCQ",
      options: parseOptions(q.options),
      marks: Number(q.marks ?? 4),
      negative: Number(q.negative_marks ?? 1),
      order: Number(q.question_order ?? index + 1)
    };
  }

  function readSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || !saved.attemptId || !Array.isArray(saved.questions)) return false;

      state.attemptId = saved.attemptId;
      state.startedAt = saved.startedAt;
      state.duration = Number(saved.duration) || 45;
      state.title = saved.title || state.title;
      state.questions = saved.questions;
      state.answers = saved.answers || {};
      state.marked = saved.marked || [];
      state.current = Math.min(Number(saved.current) || 0, state.questions.length - 1);

      return state.questions.length > 0;
    } catch (_) {
      return false;
    }
  }

  function persistLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      attemptId: state.attemptId,
      startedAt: state.startedAt,
      duration: state.duration,
      title: state.title,
      questions: state.questions,
      answers: state.answers,
      marked: state.marked,
      current: state.current
    }));
  }

  async function startAttempt() {
    const { data, error } = await client.rpc("start_mock_test", {
      p_mock_test_id: TEST_ID
    });

    if (error) throw error;

    const result = unwrap(data) || {};
    const questions = result.questions || result.test_questions || result.items;
    const attemptId = result.attempt_id || result.attemptId ||
      result.attempt?.id || result.id;

    if (!attemptId || !Array.isArray(questions) || !questions.length) {
      throw new Error("The start_mock_test function did not return an attempt ID and questions. Check its SQL response.");
    }

    state.attemptId = attemptId;
    state.startedAt = result.started_at || result.startedAt || new Date().toISOString();
    state.duration = Number(result.duration_minutes || result.duration || 45);
    state.title = result.title || result.test?.title || "NEET UG Mock Test";
    state.questions = questions.map(normalizeQuestion).filter(q => q.id && q.text);

    if (!state.questions.length) {
      throw new Error("The returned questions are missing their IDs or question text.");
    }

    persistLocal();
  }

  function answerPayload() {
    return state.questions.map(q => ({
      question_id: q.id,
      selected_answer: state.answers[q.id] || null
    }));
  }

  function saveProgress() {
    if (!state.attemptId || state.submitted) return Promise.resolve();

    const payload = answerPayload();

    state.saveChain = state.saveChain.then(async () => {
      ui.saveStatus.textContent = "Saving answers...";

      const { error } = await client.rpc("save_mock_test_progress", {
        p_attempt_id: state.attemptId,
        p_answers: payload
      });

      if (error) throw error;
      ui.saveStatus.textContent = "All answers saved";
    }).catch(error => {
      console.error("Mock test autosave error:", error);
      ui.saveStatus.textContent = "Save issue — retry on next change";
    });

    return state.saveChain;
  }

  function updateStats() {
    const total = state.questions.length;
    const answered = Object.keys(state.answers).filter(id => state.answers[id]).length;
    const marked = state.marked.length;
    const unanswered = total - answered;
    const percent = total ? Math.round(answered / total * 100) : 0;

    ui.answered.textContent = answered;
    ui.unanswered.textContent = unanswered;
    ui.marked.textContent = marked;
    ui.progressText.textContent = answered + " of " + total + " answered";
    ui.progressPercent.textContent = percent + "%";
    ui.progressBar.style.width = percent + "%";
  }

  function renderPalette() {
    ui.palette.replaceChildren();

    state.questions.forEach((q, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-number";
      button.textContent = index + 1;

      if (state.answers[q.id]) button.classList.add("answered");
      if (state.marked.includes(q.id)) button.classList.add("review");
      if (index === state.current) button.classList.add("current");

      button.addEventListener("click", () => {
        state.current = index;
        persistLocal();
        renderQuestion();
      });

      ui.palette.appendChild(button);
    });

    updateStats();
  }

  function renderQuestion() {
    const q = state.questions[state.current];
    if (!q) return;

    ui.questionNumber.textContent =
      "Question " + (state.current + 1) + " of " + state.questions.length;
    ui.questionType.textContent = String(q.type).toUpperCase();
    ui.questionMarks.textContent = "+" + q.marks + " / −" + q.negative;
    ui.questionText.textContent = q.text;
    ui.options.replaceChildren();

    Object.entries(q.options).forEach(([key, value]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";

      if (state.answers[q.id] === key) button.classList.add("selected");

      const letter = document.createElement("span");
      letter.className = "option-key";
      letter.textContent = key;

      const text = document.createElement("span");
      text.textContent = String(value);

      button.append(letter, text);

      button.addEventListener("click", () => {
        state.answers[q.id] = key;
        persistLocal();
        renderQuestion();
        saveProgress();
      });

      ui.options.appendChild(button);
    });

    $("previousButton").disabled = state.current === 0;
    $("previousButton").style.opacity = state.current === 0 ? ".45" : "1";

    $("saveNextButton").textContent =
      state.current === state.questions.length - 1
        ? "Save answer"
        : "Save & Next →";

    $("reviewButton").classList.toggle("active", state.marked.includes(q.id));
    $("reviewButton").textContent = state.marked.includes(q.id)
      ? "★ Marked for review"
      : "☆ Mark for review";

    renderPalette();
  }

  function remainingSeconds() {
    const start = new Date(state.startedAt).getTime();
    const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
    return Math.max(0, state.duration * 60 - elapsed);
  }

  function updateTimer() {
    const seconds = remainingSeconds();
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    ui.timer.textContent =
      String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");

    if (seconds <= 300) ui.timer.parentElement.classList.add("warning");

    if (seconds <= 0) {
      clearInterval(state.timerHandle);
      ui.timerStatus.textContent = "Time is over — submitting";
      submitExam(true);
    }
  }

  function showResult(result) {
    state.submitted = true;
    clearInterval(state.timerHandle);
    localStorage.removeItem(STORAGE_KEY);

    showOnly(ui.result);

    const r = unwrap(result) || {};

    $("resultScore").textContent = Number(r.score ?? r.marks_obtained ?? 0);
    $("resultMaximum").textContent = Number(r.total_marks ?? r.maximum_marks ?? 180);
    $("resultCorrect").textContent = Number(r.correct_count ?? r.correct ?? 0);
    $("resultIncorrect").textContent = Number(r.incorrect_count ?? r.incorrect ?? 0);
    $("resultUnanswered").textContent = Number(r.unanswered_count ?? r.unanswered ?? 0);

    $("resultMessage").textContent =
      "Your answers have been evaluated securely. Your result is recorded.";
  }

  async function submitExam(auto = false) {
    if (state.submitted) return;

    if (!auto) {
      const answered = Object.values(state.answers).filter(Boolean).length;

      ui.submitSummary.textContent =
        answered + " answered, " +
        (state.questions.length - answered) +
        " unanswered. Submit your test now?";

      ui.confirm.hidden = false;
      return;
    }

    state.submitted = true;
    clearInterval(state.timerHandle);
    ui.saveStatus.textContent = "Submitting examination...";

    try {
      await state.saveChain;

      const { data, error } = await client.rpc("submit_mock_test", {
        p_attempt_id: state.attemptId,
        p_answers: answerPayload()
      });

      if (error) throw error;
      showResult(data);

    } catch (error) {
      state.submitted = false;
      console.error("Mock test submission error:", error);
      notify(error.message || "Submission failed. Please retry.");
      ui.timerStatus.textContent = "Submission failed — please retry";
    }
  }

  async function initialize() {
    if (!TEST_ID) {
      return showError("Test ID is missing. Return to Mock Tests and select a test again.");
    }

    if (!client) {
      return showError("Supabase client is not initialized. Check supabase.js.");
    }

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;

      if (!data.session) return showOnly(ui.login);

      if (!readSaved()) await startAttempt();

      ui.title.textContent = state.title;
      ui.subtitle.textContent =
        state.questions.length + " questions • " +
        state.duration + " minutes • Single-correct MCQ";

      showOnly(ui.exam);
      renderQuestion();
      updateTimer();

      state.timerHandle = setInterval(updateTimer, 1000);
      saveProgress();

    } catch (error) {
      console.error("Mock test initialization error:", error);
      showError(error.message || "Unable to start this test. Check your login and database functions.");
    }
  }

  $("previousButton").addEventListener("click", () => {
    if (state.current > 0) {
      state.current--;
      persistLocal();
      renderQuestion();
    }
  });

  $("saveNextButton").addEventListener("click", () => {
    saveProgress();

    if (state.current < state.questions.length - 1) {
      state.current++;
      persistLocal();
      renderQuestion();
    } else {
      notify("Last question reached. Review your answers or submit the test.");
    }
  });

  $("clearButton").addEventListener("click", () => {
    const q = state.questions[state.current];

    if (q) {
      delete state.answers[q.id];
      persistLocal();
      renderQuestion();
      saveProgress();
    }
  });

  $("reviewButton").addEventListener("click", () => {
    const q = state.questions[state.current];
    if (!q) return;

    state.marked = state.marked.includes(q.id)
      ? state.marked.filter(id => id !== q.id)
      : [...state.marked, q.id];

    persistLocal();
    renderQuestion();
  });

  $("submitButton").addEventListener("click", () => submitExam(false));

  $("cancelSubmit").addEventListener("click", () => {
    ui.confirm.hidden = true;
  });

  $("confirmSubmit").addEventListener("click", async () => {
    ui.confirm.hidden = true;
    await submitExam(true);
  });

  document.addEventListener("DOMContentLoaded", initialize);
})();
