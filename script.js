
/* ==========================================================
   STUDYVERSE AI — MAIN APPLICATION
   Version 4.0
   Supabase + Dynamic Dashboard + UI Animations
========================================================== */

"use strict";

/* ==========================================================
   1. SUPABASE CONFIGURATION
========================================================== */

const SUPABASE_URL = "https://mtxkvupfczhglaqghcbc.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

let supabaseClient = null;
let examData = [];
let subjectData = [];
let selectedExam = null;
let selectedSubject = null;
let toastTimer = null;

const EXAM_DEFAULTS = [
    {
        exam_name: "JEE Main",
        exam_slug: "jee-main",
        description: "Prepare for engineering entrance examinations.",
        symbol: "J"
    },
    {
        exam_name: "JEE Advanced",
        exam_slug: "jee-advanced",
        description: "Challenge yourself with advanced concepts.",
        symbol: "A"
    },
    {
        exam_name: "NEET UG",
        exam_slug: "neet-ug",
        description: "Build your foundation for medical entrance.",
        symbol: "N"
    }
];

/* ==========================================================
   2. INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    initializeSupabase();
    initializeNavigation();
    initializeScrollEffects();
    initializeRevealAnimations();
    initializeModal();
    initializeLoginDemo();

    document.getElementById("year").textContent =
        new Date().getFullYear();

    await loadExaminations();
});

/* ==========================================================
   3. SUPABASE CLIENT
========================================================== */

function initializeSupabase() {
    try {
        if (!window.supabase) {
            throw new Error("Supabase library was not loaded.");
        }

        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("STUDYVERSE AI: Supabase client initialized.");
    } catch (error) {
        console.error("Supabase initialization failed:", error);
        showMessage("Database connection could not be initialized.");
    }
}

/* ==========================================================
   4. NAVIGATION
========================================================== */

function initializeNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("open");
            menuToggle.classList.toggle("active");
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.classList.remove("active");
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const target = document.querySelector(link.getAttribute("href"));

            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
}

/* ==========================================================
   5. SCROLL EFFECTS
========================================================== */

function initializeScrollEffects() {
    const navbar = document.getElementById("navbar");
    const progress = document.getElementById("pageProgress");

    function updateScroll() {
        const scrollTop =
            window.scrollY || document.documentElement.scrollTop;

        const totalHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        if (navbar) {
            navbar.classList.toggle("scrolled", scrollTop > 30);
        }

        if (progress) {
            const percentage =
                totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

            progress.style.width = percentage + "%";
        }
    }

    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    const sections = document.querySelectorAll("main section[id]");
    const links = document.querySelectorAll(".nav-link");

    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(link => {
                        link.classList.toggle(
                            "active",
                            link.getAttribute("href") ===
                                "#" + entry.target.id
                        );
                    });
                }
            });
        }, { rootMargin: "-35% 0px -55% 0px" });

        sections.forEach(section => sectionObserver.observe(section));
    }
}

/* ==========================================================
   6. SCROLL REVEAL ANIMATIONS
========================================================== */

function initializeRevealAnimations() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => element.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px"
    });

    elements.forEach(element => observer.observe(element));
}

/* ==========================================================
   7. LOAD EXAMINATIONS
========================================================== */

async function loadExaminations() {
    const container = document.getElementById("sv-exam-cards");

    if (!container) return;

    container.innerHTML = `
        <div class="loading-card">
            <div class="loader"></div>
            <p>Loading examinations...</p>
        </div>
    `;

    if (!supabaseClient) {
        renderExaminations(EXAM_DEFAULTS, false);
        showMessage("Demo examination cards are displayed. Database unavailable.");
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("exams")
            .select("*");

        if (error) throw error;

        if (!data || data.length === 0) {
            renderExaminations(EXAM_DEFAULTS, false);
            showMessage("No examination records found in the database.");
            return;
        }

        examData = data.map((exam, index) => ({
            ...exam,
            exam_name: getExamName(exam),
            exam_slug: getExamSlug(exam),
            symbol: getExamSymbol(exam, index)
        }));

        renderExaminations(examData, true);

        console.log("Examinations loaded:", examData.length);
        showMessage("Examinations loaded successfully!");

    } catch (error) {
        console.error("Examination loading error:", error);

        renderExaminations(EXAM_DEFAULTS, false);
        showMessage("Database examination loading failed. Showing demo cards.");
    }
}

function getExamName(exam) {
    return exam.exam_name ||
        exam.name ||
        exam.title ||
        "Examination";
}

function getExamSlug(exam) {
    return exam.exam_slug ||
        exam.slug ||
        slugify(getExamName(exam));
}

function getExamSymbol(exam, index) {
    const symbols = ["J", "A", "N"];
    return (getExamName(exam)[0] || symbols[index % 3]).toUpperCase();
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/* ==========================================================
   8. RENDER EXAMINATIONS
========================================================== */

function renderExaminations(exams, fromDatabase) {
    const container = document.getElementById("sv-exam-cards");

    container.innerHTML = "";

    exams.forEach((exam, index) => {
        const name = exam.exam_name || getExamName(exam);
        const slug = exam.exam_slug || getExamSlug(exam);

        const description =
            exam.description ||
            EXAM_DEFAULTS.find(item => item.exam_slug === slug)?.description ||
            "Explore examination-wise learning resources.";

        const card = document.createElement("article");
        card.className = "exam-card reveal visible";
        card.style.animationDelay = `${index * 120}ms`;

        card.innerHTML = `
            <div class="exam-icon">${escapeHTML(
                exam.symbol || getExamSymbol(exam, index)
            )}</div>
            <h3>${escapeHTML(name)}</h3>
            <p>${escapeHTML(description)}</p>
            <div class="card-action">Explore subjects <span>→</span></div>
            <span class="card-arrow">↗</span>
        `;

        card.addEventListener("click", () => {
            selectExamination(exam, fromDatabase);
        });

        container.appendChild(card);
    });
}

/* ==========================================================
   9. SELECT EXAMINATION
========================================================== */

async function selectExamination(exam, fromDatabase = true) {
    selectedExam = exam;

    const subjectArea = document.getElementById("sv-subject-area");
    const chapterArea = document.getElementById("sv-chapter-area");

    subjectArea.classList.remove("hidden");
    chapterArea.classList.add("hidden");

    document.getElementById("sv-selected-exam").textContent =
        exam.exam_name || getExamName(exam);

    document.getElementById("sv-subject-cards").innerHTML = `
        <div class="loading-card">
            <div class="loader"></div>
            <p>Loading subjects...</p>
        </div>
    `;

    subjectArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    if (!fromDatabase) {
        renderSubjectCards(getDemoSubjects(exam));
        return;
    }

    await loadSubjects(exam);
}

/* ==========================================================
   10. LOAD SUBJECTS
========================================================== */

async function loadSubjects(exam) {
    const container = document.getElementById("sv-subject-cards");

    const examName = exam.exam_name || getExamName(exam);
    const examSlug = exam.exam_slug || getExamSlug(exam);

    try {
        // First attempt: existing exam-subject mapping table.
        let result = await supabaseClient
            .from("exam_subjects")
            .select("*")
            .eq("exam_slug", examSlug);

        let records = result.data;

        if (result.error || !records || records.length === 0) {
            // Fallback: subjects table.
            result = await supabaseClient
                .from("subjects")
                .select("*");

            if (result.error) throw result.error;

            records = (result.data || []).filter(subject => {
                const subjectExamSlug =
                    subject.exam_slug ||
                    slugify(subject.exam_name || "");

                const subjectExamName =
                    String(subject.exam_name || "").toLowerCase();

                return subjectExamSlug === examSlug ||
                    subjectExamName === examName.toLowerCase();
            });
        }

        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    No subjects found for ${escapeHTML(examName)}.
                </div>
            `;
            showMessage("No subjects are currently available.");
            return;
        }

        subjectData = records.map((subject, index) => ({
            id: subject.subject_id || subject.id,
            subject_name:
                subject.subject_name ||
                subject.name ||
                "Subject",
            subject_slug:
                subject.subject_slug ||
                subject.slug ||
                slugify(subject.subject_name || subject.name),
            symbol: getSubjectSymbol(
                subject.subject_name || subject.name,
                index
            )
        }));

        renderSubjectCards(subjectData);
        showMessage("Subjects loaded successfully!");

    } catch (error) {
        console.error("Subject loading error:", error);

        container.innerHTML = `
            <div class="empty-state">
                Unable to load subjects. Please check the database connection and table permissions.
            </div>
        `;

        showMessage("Subject loading failed. Check the browser console.");
    }
}

function getDemoSubjects(exam) {
    const name = exam.exam_name || getExamName(exam);
    const isNEET = name.toLowerCase().includes("neet");

    const names = isNEET
        ? ["Physics", "Chemistry", "Biology"]
        : ["Physics", "Chemistry", "Mathematics"];

    return names.map((subject, index) => ({
        id: null,
        subject_name: subject,
        subject_slug: slugify(subject),
        symbol: getSubjectSymbol(subject, index)
    }));
}

function getSubjectSymbol(name, index) {
    const symbols = {
        physics: "Φ",
        chemistry: "⚗",
        mathematics: "∫",
        biology: "♧"
    };

    return symbols[String(name || "").toLowerCase()] ||
        ["✦", "◈", "◎"][index % 3];
}

/* ==========================================================
   11. RENDER SUBJECTS
========================================================== */

function renderSubjectCards(subjects) {
    const container = document.getElementById("sv-subject-cards");

    container.innerHTML = "";

    subjects.forEach((subject, index) => {
        const card = document.createElement("button");

        card.type = "button";
        card.className = "subject-card reveal visible";
        card.style.animationDelay = `${index * 100}ms`;

        card.innerHTML = `
            <div class="subject-symbol">${escapeHTML(subject.symbol)}</div>
            <h4>${escapeHTML(subject.subject_name)}</h4>
            <p>Explore chapters →</p>
        `;

        card.addEventListener("click", () => {
            selectSubject(subject);
        });

        container.appendChild(card);
    });
}

/* ==========================================================
   12. SELECT SUBJECT
========================================================== */

async function selectSubject(subject) {
    selectedSubject = subject;

    const chapterArea = document.getElementById("sv-chapter-area");

    chapterArea.classList.remove("hidden");

    document.getElementById("sv-selected-subject").textContent =
        subject.subject_name;

    document.getElementById("sv-chapter-cards").innerHTML = `
        <div class="loading-card">
            <div class="loader"></div>
            <p>Discovering chapters...</p>
        </div>
    `;

    chapterArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    if (!subject.id) {
        document.getElementById("sv-chapter-cards").innerHTML = `
            <div class="empty-state">
                Demo subjects do not contain database chapters.
                Select an examination loaded from your database.
            </div>
        `;
        return;
    }

    await loadChapters(subject);
}

/* ==========================================================
   13. LOAD PUBLISHED CHAPTERS
========================================================== */

async function loadChapters(subject) {
    const container = document.getElementById("sv-chapter-cards");

    try {
        const { data, error } = await supabaseClient
            .from("chapters")
            .select(`
                id,
                subject_id,
                chapter_name,
                chapter_number,
                description,
                is_published
            `)
            .eq("subject_id", subject.id)
            .eq("is_published", true)
            .order("chapter_number", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    No published chapters are available for
                    ${escapeHTML(subject.subject_name)} yet.
                </div>
            `;
            showMessage("No published chapters found.");
            return;
        }

        renderChapterCards(data);
        showMessage(`${data.length} published chapters loaded successfully!`);

        console.log("Published chapters:", data.length);

    } catch (error) {
        console.error("Chapter loading error:", error);

        container.innerHTML = `
            <div class="empty-state">
                Unable to load chapters. Please check Supabase permissions.
            </div>
        `;

        showMessage("Chapter loading failed.");
    }
}

/* ==========================================================
   14. RENDER CHAPTERS
========================================================== */

function renderChapterCards(chapters) {
    const container = document.getElementById("sv-chapter-cards");

    container.innerHTML = "";

    chapters.forEach((chapter, index) => {
        const card = document.createElement("article");

        card.className = "chapter-card reveal visible";
        card.style.animationDelay = `${index * 90}ms`;

        const number = chapter.chapter_number ?? index + 1;

        card.innerHTML = `
            <div class="chapter-index">${escapeHTML(number)}</div>
            <h4>${escapeHTML(chapter.chapter_name)}</h4>
            <p>${escapeHTML(
                chapter.description || "Explore this chapter and master its concepts."
            )}</p>
            <span class="chapter-action">Start learning →</span>
        `;

        card.addEventListener("click", () => {
            openChapter(chapter);
        });

        container.appendChild(card);
    });
}

/* ==========================================================
   15. OPEN CHAPTER LEARNING PAGE
========================================================== */

function openChapter(chapter) {
    if (!chapter.id) {
        showToast("Chapter ID is unavailable.");
        return;
    }

    window.location.href =
        "./chapter.html?chapter_id=" +
        encodeURIComponent(chapter.id);
}

/* ==========================================================
   16. LOGIN MODAL — DEMO ONLY
========================================================== */

function initializeModal() {
    const modal = document.getElementById("loginModal");
    const close = document.getElementById("modalClose");

    document.querySelectorAll("[data-open-login]").forEach(button => {
        button.addEventListener("click", () => {
            modal.classList.add("active");
            document.body.classList.add("modal-open");
        });
    });

    function closeModal() {
        modal.classList.remove("active");
        document.body.classList.remove("modal-open");
    }

    close.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeModal();
    });
}

function initializeLoginDemo() {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name =
            document.getElementById("studentName").value.trim();

        const email =
            document.getElementById("studentEmail").value.trim();

        if (!name || !email) return;

        // Only the display name is stored.
        // Passwords are never saved.
        localStorage.setItem("sv_demo_name", name);

        document.getElementById("loginModal").classList.remove("active");
        document.body.classList.remove("modal-open");

        showToast(`Welcome to STUDYVERSE AI, ${name}!`);
        form.reset();
    });
}

/* ==========================================================
   17. MESSAGE SYSTEM
========================================================== */

function showMessage(message) {
    const element = document.getElementById("sv-dashboard-message");

    if (element) element.textContent = message;
}

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* ==========================================================
   18. SECURITY — SAFE HTML TEXT
========================================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

/* ==========================================================
   END OF STUDYVERSE AI — VERSION 4.0
========================================================== */
