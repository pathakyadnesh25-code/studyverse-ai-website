
/* ============================================================
   STUDYVERSE AI — FUNCTIONAL LEARNING PLATFORM
   Version 5.0
   Correct Supabase Relationships
   Exams → Subjects → Chapters → Chapter Learning
============================================================ */

"use strict";

/* ------------------------------------------------------------
   1. SUPABASE CONFIGURATION
------------------------------------------------------------ */

const SUPABASE_URL =
    "https://mtxkvupfczhglaqghcbc.supabase.co";

/*
 IMPORTANT:
 Replace the value below with the REAL existing Supabase
 publishable/anon key from your project.

 Supabase Dashboard → Project Settings → API Keys.

 Never use the service_role / secret key in browser code.
*/

const SUPABASE_ANON_KEY =
    "PASTE_YOUR_EXISTING_SUPABASE_PUBLIC_KEY_HERE";

const CHAPTER_PAGE = "chapter-learning.html";

let db = null;
let exams = [];
let selectedExam = null;
let selectedSubject = null;
let chapters = [];
let chapterSearch = "";

/* ------------------------------------------------------------
   2. START APPLICATION
------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("year")?.replaceChildren(
        document.createTextNode(String(new Date().getFullYear()))
    );

    initializeSupabase();
    initializeNavigation();
    initializeScrollProgress();
    initializeReveal();
    initializeModal();
    initializeTimeline();
    initializeChapterSearch();

    await loadExams();
});

/* ------------------------------------------------------------
   3. SUPABASE INITIALIZATION
------------------------------------------------------------ */

function initializeSupabase() {
    const message = document.getElementById("sv-dashboard-message");

    try {
        if (!window.supabase) {
            throw new Error("Supabase JavaScript library is missing.");
        }

        if (
            !SUPABASE_ANON_KEY ||
            SUPABASE_ANON_KEY === "PASTE_YOUR_EXISTING_SUPABASE_PUBLIC_KEY_HERE"
        ) {
            throw new Error(
                "Your existing Supabase public key has not been added."
            );
        }

        db = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("STUDYVERSE AI: Supabase initialized.");

    } catch (error) {
        console.error("Supabase initialization:", error);
        setMessage(error.message, "error");
    }
}

/* ------------------------------------------------------------
   4. NAVIGATION
------------------------------------------------------------ */

function initializeNavigation() {
    const toggle = document.getElementById("menuToggle");
    const navigation = document.getElementById("navLinks");

    toggle?.addEventListener("click", () => {
        navigation?.classList.toggle("open");
        toggle.classList.toggle("active");
    });

    navigation?.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navigation.classList.remove("open");
            toggle?.classList.remove("active");
        });
    });
}

/* ------------------------------------------------------------
   5. SCROLL PROGRESS
------------------------------------------------------------ */

function initializeScrollProgress() {
    const bar = document.getElementById("pageProgress");
    const navbar = document.getElementById("navbar");

    window.addEventListener("scroll", () => {
        const maximum =
            document.documentElement.scrollHeight - window.innerHeight;

        const percentage = maximum > 0
            ? (window.scrollY / maximum) * 100
            : 0;

        if (bar) bar.style.width = percentage + "%";

        navbar?.classList.toggle("scrolled", window.scrollY > 30);
    }, { passive: true });
}

/* ------------------------------------------------------------
   6. REVEAL ANIMATIONS
------------------------------------------------------------ */

function initializeReveal() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => element.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, current) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                current.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => observer.observe(element));
}

/* ------------------------------------------------------------
   7. LOAD EXAMINATIONS
------------------------------------------------------------ */

async function loadExams() {
    const container = document.getElementById("sv-exam-cards");

    if (!container) return;

    if (!db) {
        showError(
            container,
            "Supabase is not configured. Add your existing public API key."
        );
        return;
    }

    showLoading(container, "Loading examinations...");

    try {
        const { data, error } = await db
            .from("exams")
            .select("id,name,slug,description,is_published")
            .eq("is_published", true)
            .order("name");

        if (error) throw error;

        if (!data?.length) {
            showEmpty(container, "No published examinations are available.");
            return;
        }

        exams = data;

        renderExams(exams);

        setMessage(
            `${exams.length} examinations loaded successfully.`,
            "success"
        );

        console.log("Examinations:", exams);

    } catch (error) {
        console.error("Exam query failed:", error);
        showError(container, error.message);
        setMessage("Unable to load examinations.", "error");
    }
}

/* ------------------------------------------------------------
   8. DISPLAY EXAMINATIONS
------------------------------------------------------------ */

function renderExams(items) {
    const container = document.getElementById("sv-exam-cards");
    container.replaceChildren();

    const symbols = {
        "jee-main": "J",
        "jee-advanced": "A",
        "neet-ug": "N"
    };

    items.forEach((exam, index) => {
        const card = document.createElement("article");

        card.className = "exam-card reveal visible";
        card.style.animationDelay = `${index * 100}ms`;
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const icon = createElement(
            "div",
            "exam-icon",
            symbols[exam.slug] || "✦"
        );

        const title = createElement("h3", "", exam.name);
        const description = createElement(
            "p",
            "",
            exam.description || "Explore your examination syllabus."
        );

        const action = createElement(
            "div",
            "card-action",
            "Explore subjects →"
        );

        card.append(icon, title, description, action);

        const select = () => selectExam(exam);

        card.addEventListener("click", select);
        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select();
            }
        });

        container.appendChild(card);
    });
}

/* ------------------------------------------------------------
   9. SELECT EXAMINATION
------------------------------------------------------------ */

async function selectExam(exam) {
    selectedExam = exam;
    selectedSubject = null;
    chapters = [];

    const subjectArea = document.getElementById("sv-subject-area");
    const chapterArea = document.getElementById("sv-chapter-area");

    subjectArea?.classList.remove("hidden");
    chapterArea?.classList.add("hidden");

    const title = document.getElementById("sv-selected-exam");
    if (title) title.textContent = exam.name;

    const container = document.getElementById("sv-subject-cards");

    showLoading(container, `Loading ${exam.name} subjects...`);

    subjectArea?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    await loadSubjects(exam);
}

/* ------------------------------------------------------------
   10. LOAD SUBJECTS — CORRECT RELATIONSHIP
------------------------------------------------------------ */

async function loadSubjects(exam) {
    const container = document.getElementById("sv-subject-cards");

    try {
        /*
          Correct database relationship:

          exams.id = subjects.exam_id

          We filter subjects directly using the selected exam UUID.
          No exam_subjects table or exam_slug column is assumed.
        */

        const { data, error } = await db
            .from("subjects")
            .select("id,exam_id,name,slug,is_published")
            .eq("exam_id", exam.id)
            .eq("is_published", true)
            .order("name");

        if (error) throw error;

        if (!data?.length) {
            showEmpty(
                container,
                `No published subjects found for ${exam.name}.`
            );
            return;
        }

        renderSubjects(data);

        setMessage(
            `${data.length} subjects loaded for ${exam.name}.`,
            "success"
        );

        console.log("Subjects:", data);

    } catch (error) {
        console.error("Subject query failed:", error);
        showError(container, error.message);
    }
}

/* ------------------------------------------------------------
   11. DISPLAY SUBJECTS
------------------------------------------------------------ */

function renderSubjects(subjects) {
    const container = document.getElementById("sv-subject-cards");
    container.replaceChildren();

    const symbols = {
        physics: "Φ",
        chemistry: "⚗",
        mathematics: "∫",
        biology: "♧"
    };

    subjects.forEach((subject, index) => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = "subject-card reveal visible";
        card.style.animationDelay = `${index * 80}ms`;

        const name = subject.name;

        card.append(
            createElement(
                "div",
                "subject-symbol",
                symbols[String(name).toLowerCase()] || "✦"
            ),
            createElement("h4", "", name),
            createElement("p", "", "Explore chapters →")
        );

        card.addEventListener("click", () => selectSubject(subject));

        container.appendChild(card);
    });
}

/* ------------------------------------------------------------
   12. SELECT SUBJECT
------------------------------------------------------------ */

async function selectSubject(subject) {
    selectedSubject = subject;
    chapters = [];

    const area = document.getElementById("sv-chapter-area");
    const label = document.getElementById("sv-selected-subject");
    const container = document.getElementById("sv-chapter-cards");

    area?.classList.remove("hidden");

    if (label) label.textContent = subject.name;

    showLoading(container, `Loading ${subject.name} chapters...`);

    area?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    await loadChapters(subject);
}

/* ------------------------------------------------------------
   13. LOAD CHAPTERS — CORRECT RELATIONSHIP
------------------------------------------------------------ */

async function loadChapters(subject) {
    const container = document.getElementById("sv-chapter-cards");

    try {
        /*
          Correct database relationship:

          subjects.id = chapters.subject_id

          Only published chapters are displayed.
        */

        const { data, error } = await db
            .from("chapters")
            .select(
                "id,subject_id,chapter_name,chapter_number,description,is_published"
            )
            .eq("subject_id", subject.id)
            .eq("is_published", true)
            .order("chapter_number", { ascending: true });

        if (error) throw error;

        if (!data?.length) {
            showEmpty(
                container,
                `No published chapters found in ${subject.name}.`
            );
            return;
        }

        chapters = data;
        renderChapters(chapters);

        setMessage(
            `${data.length} chapters loaded successfully.`,
            "success"
        );

        console.log("Published chapters:", chapters);

    } catch (error) {
        console.error("Chapter query failed:", error);

        showError(
            container,
            "Chapter loading failed: " + error.message
        );
    }
}

/* ------------------------------------------------------------
   14. DISPLAY CHAPTERS
------------------------------------------------------------ */

function renderChapters(items) {
    const container = document.getElementById("sv-chapter-cards");
    container.replaceChildren();

    items.forEach((chapter, index) => {
        const card = document.createElement("article");

        card.className = "chapter-card reveal visible";
        card.style.animationDelay = `${index * 60}ms`;

        card.append(
            createElement(
                "div",
                "chapter-index",
                String(chapter.chapter_number ?? index + 1).padStart(2, "0")
            ),
            createElement("h4", "", chapter.chapter_name),
            createElement(
                "p",
                "",
                chapter.description || "Explore the complete chapter."
            ),
            createElement(
                "span",
                "chapter-action",
                "Start learning →"
            )
        );

        card.addEventListener("click", () => openChapter(chapter));

        container.appendChild(card);
    });
}

/* ------------------------------------------------------------
   15. CHAPTER SEARCH
------------------------------------------------------------ */

function initializeChapterSearch() {
    const input = document.getElementById("sv-chapter-search");

    input?.addEventListener("input", event => {
        chapterSearch = event.target.value.toLowerCase().trim();

        if (!chapters.length) return;

        const filtered = chapters.filter(chapter =>
            chapter.chapter_name.toLowerCase().includes(chapterSearch)
        );

        if (!filtered.length) {
            showEmpty(
                document.getElementById("sv-chapter-cards"),
                "No chapters match your search."
            );
            return;
        }

        renderChapters(filtered);
    });
}

/* ------------------------------------------------------------
   16. OPEN CHAPTER LEARNING PAGE
------------------------------------------------------------ */

function openChapter(chapter) {
    if (!chapter?.id) {
        setMessage("This chapter does not have a valid ID.", "error");
        return;
    }

    const params = new URLSearchParams({
        chapter_id: chapter.id,
        exam_id: selectedExam.id,
        subject_id: selectedSubject.id
    });

    window.location.href = `${CHAPTER_PAGE}?${params.toString()}`;
}

/* ------------------------------------------------------------
   17. LEARNING JOURNEY TIMELINE
------------------------------------------------------------ */

function initializeTimeline() {
    document.querySelectorAll("[data-journey-step]").forEach(step => {
        step.addEventListener("click", () => {
            const destination = step.dataset.destination;

            if (destination) {
                document.getElementById(destination)?.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });
}

/* ------------------------------------------------------------
   18. LOGIN MODAL
   Existing login UI only; real authentication is a separate
   integration and must not be simulated as successful.
------------------------------------------------------------ */

function initializeModal() {
    const modal = document.getElementById("loginModal");
    const close = document.getElementById("modalClose");

    document.querySelectorAll("[data-open-login]").forEach(button => {
        button.addEventListener("click", () => {
            modal?.classList.add("active");
            document.body.classList.add("modal-open");
        });
    });

    function closeModal() {
        modal?.classList.remove("active");
        document.body.classList.remove("modal-open");
    }

    close?.addEventListener("click", closeModal);

    modal?.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeModal();
    });

    document.getElementById("loginForm")?.addEventListener("submit", event => {
        event.preventDefault();
        showToast("Real student authentication is being integrated next.");
    });
}

/* ------------------------------------------------------------
   19. UI HELPERS
------------------------------------------------------------ */

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    element.textContent = String(text ?? "");

    return element;
}

function showLoading(container, message) {
    if (!container) return;

    container.replaceChildren();

    const box = createElement("div", "loading-card", "");
    const loader = createElement("div", "loader", "");
    const text = createElement("p", "", message);

    box.append(loader, text);
    container.appendChild(box);
}

function showEmpty(container, message) {
    if (!container) return;

    container.replaceChildren(
        createElement("div", "empty-state", message)
    );
}

function showError(container, message) {
    if (!container) return;

    const box = createElement("div", "empty-state", "");
    const title = createElement("strong", "", "Something needs attention");
    const detail = createElement("p", "", message);

    detail.style.marginTop = "10px";
    detail.style.overflowWrap = "anywhere";

    box.append(title, detail);
    container.replaceChildren(box);
}

function setMessage(message, type = "info") {
    const element = document.getElementById("sv-dashboard-message");

    if (!element) return;

    element.textContent = message;
    element.dataset.status = type;
}

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);

    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* ------------------------------------------------------------
   END — STUDYVERSE AI VERSION 5.0
------------------------------------------------------------ */
