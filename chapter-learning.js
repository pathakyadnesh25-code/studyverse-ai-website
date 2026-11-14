
/* =========================================================
   STUDYVERSE AI — CHAPTER LEARNING SYSTEM
   Version 3.0

   FEATURES
   1. Supabase chapter resources
   2. Video lessons
   3. Study notes with local read tracking
   4. Formula revision with local tracking
   5. PYQ options can be changed before submission
   6. Check Answer button
   7. Instant correct / incorrect feedback
   8. Correct answer and explanation display
   9. Local progress without requiring login
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    // -----------------------------------------------------
    // 1. SUPABASE CONFIGURATION
    // -----------------------------------------------------

    const SUPABASE_URL =
        "https://mtxkvupfczhglaqghcbc.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_wMXP6W777wKfoVG_e6iNvg_k8Az7Qc6";

    let db = window.studyverseSupabase || null;

    if (!db && window.supabase) {
        db = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        window.studyverseSupabase = db;
    }

    const messageBox = document.getElementById("page-message");

    function showMessage(message, type = "") {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = "page-message";

        if (type) messageBox.classList.add(type);
    }

    if (!db) {
        showMessage(
            "Supabase could not load. Check your internet connection and refresh.",
            "error"
        );
        return;
    }

    // -----------------------------------------------------
    // 2. CHAPTER ID
    // -----------------------------------------------------

    const params = new URLSearchParams(window.location.search);
    const chapterId = params.get("chapter_id");

    if (!chapterId) {
        showMessage(
            "No chapter selected. Return to the dashboard and open a chapter.",
            "error"
        );

        const title = document.getElementById("chapter-title");
        if (title) title.textContent = "No chapter selected";

        return;
    }

    // -----------------------------------------------------
    // 3. PAGE ELEMENTS
    // -----------------------------------------------------

    const elements = {
        title: document.getElementById("chapter-title"),
        description: document.getElementById("chapter-description"),
        exam: document.getElementById("chapter-exam"),
        subject: document.getElementById("chapter-subject"),
        number: document.getElementById("chapter-number"),

        breadcrumbExam: document.getElementById("breadcrumb-exam"),
        breadcrumbSubject: document.getElementById("breadcrumb-subject"),

        lessons: document.getElementById("lesson-list"),
        notes: document.getElementById("notes-list"),
        formulas: document.getElementById("formula-list"),
        pyqs: document.getElementById("pyq-list"),

        lessonCount: document.getElementById("lesson-count"),
        notesCount: document.getElementById("notes-count"),
        formulaCount: document.getElementById("formula-count"),
        pyqCount: document.getElementById("pyq-count"),

        progressValue: document.getElementById("progress-value"),
        progressFill: document.getElementById("progress-fill")
    };

    // -----------------------------------------------------
    // 4. SAFE DOM HELPERS
    // -----------------------------------------------------

    function makeElement(tag, className = "", text = null) {
        const element = document.createElement(tag);

        if (className) element.className = className;

        if (text !== null && text !== undefined) {
            element.textContent = String(text);
        }

        return element;
    }

    function setCount(element, count, label) {
        if (!element) return;

        element.textContent =
            count + " " + label + (count === 1 ? "" : "s");
    }

    function showEmpty(container, heading, description) {
        if (!container) return;

        container.replaceChildren();

        const card = makeElement("div", "empty-card");

        card.append(
            makeElement("strong", "", heading),
            makeElement("p", "", description)
        );

        container.appendChild(card);
    }

    function safeHttpUrl(value) {
        if (!value) return null;

        try {
            const url = new URL(value);

            return url.protocol === "https:" ||
                url.protocol === "http:"
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function addTextContent(container, content) {
        if (!container || !content) return;

        const paragraph = makeElement("p");
        paragraph.textContent = content;
        container.appendChild(paragraph);
    }

    function showToast(message) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = makeElement("div", "sv-learning-toast");
            toast.id = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.clearTimeout(showToast.timer);

        showToast.timer = window.setTimeout(function () {
            toast.classList.remove("show");
        }, 2800);
    }

    // -----------------------------------------------------
    // 5. LOCAL STORAGE HELPERS
    // -----------------------------------------------------

    const storagePrefix = "studyverse_" + chapterId + "_";

    function readLocalList(key) {
        try {
            const value = JSON.parse(
                localStorage.getItem(storagePrefix + key) || "[]"
            );

            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function writeLocalList(key, values) {
        try {
            localStorage.setItem(
                storagePrefix + key,
                JSON.stringify(values)
            );
        } catch (error) {
            console.warn("Local progress could not be saved:", error);
        }
    }

    function addLocalRecord(key, id) {
        const values = readLocalList(key);

        if (!values.includes(String(id))) {
            values.push(String(id));
            writeLocalList(key, values);
        }
    }

    function hasLocalRecord(key, id) {
        return readLocalList(key).includes(String(id));
    }

    // Progress is stored in this browser for now.
    // No login or email verification is required.

    // -----------------------------------------------------
    // 6. TAB NAVIGATION
    // -----------------------------------------------------

    const tabButtons = document.querySelectorAll("[data-tab]");
    const tabSections = document.querySelectorAll("[data-section]");

    tabButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const selectedTab = button.dataset.tab;

            tabButtons.forEach(function (item) {
                item.classList.toggle("active", item === button);
            });

            tabSections.forEach(function (section) {
                section.classList.toggle(
                    "active",
                    section.dataset.section === selectedTab
                );
            });
        });
    });

    // -----------------------------------------------------
    // 7. LESSON PROGRESS
    // -----------------------------------------------------

    const progressStorageKey =
        storagePrefix + "completed_lessons";

    function getCompletedLessons() {
        return readLocalList("completed_lessons");
    }

    function saveCompletedLessons(completed) {
        writeLocalList("completed_lessons", completed);
    }

    let totalLessons = 0;

    function updateProgress() {
        const completed = getCompletedLessons();

        const percent = totalLessons > 0
            ? Math.min(
                100,
                Math.round((completed.length / totalLessons) * 100)
            )
            : 0;

        if (elements.progressValue) {
            elements.progressValue.textContent = percent + "%";
        }

        if (elements.progressFill) {
            elements.progressFill.style.width = percent + "%";
        }
    }

    // -----------------------------------------------------
    // 8. VIDEO PLAYER
    // -----------------------------------------------------

    function getYouTubeEmbedUrl(rawUrl) {
        try {
            const url = new URL(rawUrl);
            let videoId = "";

            if (
                url.hostname === "youtu.be" ||
                url.hostname.endsWith(".youtu.be")
            ) {
                videoId =
                    url.pathname.split("/").filter(Boolean)[0] || "";
            } else if (
                url.hostname === "youtube.com" ||
                url.hostname.endsWith(".youtube.com")
            ) {
                videoId =
                    url.searchParams.get("v") ||
                    url.pathname.split("/").filter(Boolean).pop() ||
                    "";
            }

            if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                return null;
            }

            return (
                "https://www.youtube-nocookie.com/embed/" +
                encodeURIComponent(videoId)
            );
        } catch {
            return null;
        }
    }

    function addVideo(container, rawUrl, title) {
        const videoUrl = safeHttpUrl(rawUrl);
        if (!videoUrl) return;

        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) {
            const video = makeElement(
                "video",
                "resource-video-player"
            );

            video.controls = true;
            video.preload = "metadata";
            video.playsInline = true;
            video.src = videoUrl;

            container.appendChild(video);
            return;
        }

        const embedUrl = getYouTubeEmbedUrl(videoUrl);

        if (embedUrl) {
            const frame = makeElement("iframe", "resource-video");

            frame.src = embedUrl;
            frame.title = title || "STUDYVERSE AI lesson video";
            frame.loading = "lazy";
            frame.allow =
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            frame.referrerPolicy =
                "strict-origin-when-cross-origin";
            frame.allowFullscreen = true;

            container.appendChild(frame);
            return;
        }

        const link = makeElement(
            "a",
            "resource-link",
            "Watch Lesson ↗"
        );

        link.href = videoUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        container.appendChild(link);
    }

    // -----------------------------------------------------
    // 9. LOAD CHAPTER INFORMATION
    // -----------------------------------------------------

    async function loadChapter() {
        const { data: chapter, error } = await db
            .from("chapters")
            .select(
                "id, subject_id, chapter_name, chapter_number, description"
            )
            .eq("id", chapterId)
            .eq("is_published", true)
            .maybeSingle();

        if (error) throw error;

        if (!chapter) {
            throw new Error(
                "Chapter not found or it is not published."
            );
        }

        const { data: subject, error: subjectError } = await db
            .from("subjects")
            .select("name, exam_id")
            .eq("id", chapter.subject_id)
            .maybeSingle();

        if (subjectError) throw subjectError;

        let examName = "Examination";
        const subjectName = subject ? subject.name : "Subject";

        if (subject && subject.exam_id) {
            const { data: exam, error: examError } = await db
                .from("exams")
                .select("name")
                .eq("id", subject.exam_id)
                .maybeSingle();

            if (examError) throw examError;

            if (exam) examName = exam.name;
        }

        if (elements.title) {
            elements.title.textContent = chapter.chapter_name;
        }

        if (elements.description) {
            elements.description.textContent =
                chapter.description ||
                "Explore the lessons and learning resources for this chapter.";
        }

        if (elements.exam) elements.exam.textContent = examName;
        if (elements.subject) elements.subject.textContent = subjectName;

        if (elements.number) {
            elements.number.textContent =
                "Chapter " + chapter.chapter_number;
        }

        if (elements.breadcrumbExam) {
            elements.breadcrumbExam.textContent = examName;
        }

        if (elements.breadcrumbSubject) {
            elements.breadcrumbSubject.textContent = subjectName;
        }

        document.title =
            chapter.chapter_name + " | STUDYVERSE AI";

        document.body.dataset.chapterId = chapter.id;

        return chapter;
    }

    // -----------------------------------------------------
    // 10. LOAD VIDEO LESSONS
    // -----------------------------------------------------

    async function loadLessons() {
        const { data, error } = await db
            .from("chapter_learning_lessons")
            .select(
                "id, lesson_number, title, description, content_markdown, video_url, video_language, duration_minutes"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("lesson_number", { ascending: true });

        if (error) throw error;

        const lessons = data || [];
        totalLessons = lessons.length;

        setCount(elements.lessonCount, lessons.length, "lesson");

        if (!lessons.length) {
            showEmpty(
                elements.lessons,
                "No lessons published yet",
                "Video lessons will appear here when learning content is added."
            );

            updateProgress();
            return;
        }

        elements.lessons.replaceChildren();

        const completed = getCompletedLessons();

        lessons.forEach(function (lesson) {
            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    "LESSON " + lesson.lesson_number
                )
            );

            card.appendChild(makeElement("h3", "", lesson.title));

            addTextContent(card, lesson.description);

            if (lesson.duration_minutes) {
                addTextContent(
                    card,
                    "Duration: " + lesson.duration_minutes + " minutes"
                );
            }

            if (lesson.video_language) {
                addTextContent(
                    card,
                    "Video narration: " +
                    String(lesson.video_language).toUpperCase()
                );
            }

            if (lesson.content_markdown) {
                const content = makeElement(
                    "div",
                    "lesson-content"
                );

                content.textContent = lesson.content_markdown;
                card.appendChild(content);
            }

            if (lesson.video_url) {
                addVideo(card, lesson.video_url, lesson.title);
            }

            const label = makeElement(
                "label",
                "completion-label"
            );

            const checkbox = makeElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = completed.includes(lesson.id);
            checkbox.dataset.lessonId = lesson.id;

            const labelText = makeElement(
                "span",
                "",
                "Mark this lesson as completed"
            );

            label.append(checkbox, labelText);
            card.appendChild(label);

            elements.lessons.appendChild(card);
        });

        updateProgress();
    }

    // -----------------------------------------------------
    // 11. LOAD STUDY NOTES
    // -----------------------------------------------------

    async function loadNotes() {
        const { data, error } = await db
            .from("chapter_learning_notes")
            .select("id, title, content_markdown, pdf_url")
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const notes = data || [];
        setCount(elements.notesCount, notes.length, "note");

        if (!notes.length) {
            showEmpty(
                elements.notes,
                "No notes published yet",
                "Chapter notes and downloadable PDFs will appear here."
            );
            return;
        }

        elements.notes.replaceChildren();

        notes.forEach(function (note) {
            const card = makeElement("article", "resource-card");

            card.appendChild(
                makeElement("span", "resource-label", "STUDY NOTES")
            );

            card.appendChild(makeElement("h3", "", note.title));
            addTextContent(card, note.content_markdown);

            const readButton = makeElement(
                "button",
                "resource-action note-read-button",
                hasLocalRecord("read_notes", note.id)
                    ? "✓ Notes marked as read"
                    : "Mark notes as read"
            );

            readButton.type = "button";

            if (hasLocalRecord("read_notes", note.id)) {
                readButton.classList.add("is-completed");
            }

            readButton.addEventListener("click", function () {
                addLocalRecord("read_notes", note.id);

                readButton.textContent = "✓ Notes marked as read";
                readButton.classList.add("is-completed");

                showToast("Notes marked as read on this device.");
            });

            card.appendChild(readButton);

            const pdfUrl = safeHttpUrl(note.pdf_url);

            if (pdfUrl) {
                const link = makeElement(
                    "a",
                    "resource-link",
                    "Open / Download PDF ↗"
                );

                link.href = pdfUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                card.appendChild(link);
            }

            elements.notes.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 12. LOAD FORMULAS
    // -----------------------------------------------------

    async function loadFormulas() {
        const { data, error } = await db
            .from("formulas")
            .select(
                "id, chapter_id, title, formula_text, explanation, is_published, created_at"
            )
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("title", { ascending: true });

        if (error) throw error;

        const formulas = data || [];

        setCount(
            elements.formulaCount,
            formulas.length,
            "formula"
        );

        if (!elements.formulas) return;

        if (!formulas.length) {
            showEmpty(
                elements.formulas,
                "No formulas published yet",
                "No published formulas were found for this chapter."
            );
            return;
        }

        elements.formulas.replaceChildren();

        formulas.forEach(function (formula, index) {
            const card = makeElement(
                "article",
                "resource-card formula-card"
            );

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    "FORMULA " + (index + 1)
                )
            );

            card.appendChild(
                makeElement(
                    "h3",
                    "",
                    formula.title || "Important Formula"
                )
            );

            const formulaBox = makeElement(
                "div",
                "formula-display"
            );

            const formulaCode = makeElement(
                "code",
                "formula-text",
                formula.formula_text || "Formula not available"
            );

            formulaBox.appendChild(formulaCode);
            card.appendChild(formulaBox);

            if (formula.explanation) {
                card.appendChild(
                    makeElement(
                        "p",
                        "formula-explanation",
                        formula.explanation
                    )
                );
            }

            const actions = makeElement(
                "div",
                "formula-actions"
            );

            const copyButton = makeElement(
                "button",
                "resource-action",
                "Copy Formula"
            );

            copyButton.type = "button";

            copyButton.addEventListener("click", async function () {
                const copyText =
                    (formula.title || "") +
                    "\n" +
                    (formula.formula_text || "") +
                    "\n" +
                    (formula.explanation || "");

                try {
                    await navigator.clipboard.writeText(copyText);

                    copyButton.textContent = "✓ Copied";
                    showToast("Formula copied successfully!");

                    window.setTimeout(function () {
                        copyButton.textContent = "Copy Formula";
                    }, 2000);
                } catch (error) {
                    console.error("Copy failed:", error);
                    showToast(
                        "Unable to copy. Please select the formula manually."
                    );
                }
            });

            const reviseButton = makeElement(
                "button",
                "resource-action formula-revise-button",
                hasLocalRecord("revised_formulas", formula.id)
                    ? "✓ Marked as revised"
                    : "Mark as revised"
            );

            reviseButton.type = "button";

            if (hasLocalRecord("revised_formulas", formula.id)) {
                reviseButton.classList.add("is-completed");
            }

            reviseButton.addEventListener("click", function () {
                addLocalRecord("revised_formulas", formula.id);

                reviseButton.textContent = "✓ Marked as revised";
                reviseButton.classList.add("is-completed");

                showToast("Formula revision saved on this device.");
            });

            actions.append(copyButton, reviseButton);
            card.appendChild(actions);

            elements.formulas.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 13. PYQ ANSWER FEEDBACK
    // -----------------------------------------------------

    async function loadPyqs() {
        const { data, error } = await db
            .from("chapter_learning_pyqs")
            .select(`
                id,
                question_number,
                question_text,
                option_a,
                option_b,
                option_c,
                option_d,
                correct_option,
                explanation,
                exam_year,
                difficulty,
                topic,
                question_type
            `)
            .eq("chapter_id", chapterId)
            .eq("is_published", true)
            .order("question_number", { ascending: true });

        if (error) throw error;

        const questions = data || [];

        setCount(elements.pyqCount, questions.length, "question");

        if (!questions.length) {
            showEmpty(
                elements.pyqs,
                "No questions published yet",
                "Practice questions will appear here when they are added."
            );
            return;
        }

        elements.pyqs.replaceChildren();

        questions.forEach(function (question, index) {
            const card = makeElement(
                "article",
                "resource-card pyq-card"
            );

            card.dataset.questionId = question.id;

            const questionLabel =
                question.question_number
                    ? "QUESTION " + question.question_number
                    : "QUESTION " + (index + 1);

            card.appendChild(
                makeElement(
                    "span",
                    "resource-label",
                    questionLabel
                )
            );

            card.appendChild(
                makeElement("h3", "", question.question_text)
            );

            if (question.topic) {
                addTextContent(card, "Topic: " + question.topic);
            }

            if (question.exam_year) {
                addTextContent(
                    card,
                    "Exam year: " + question.exam_year
                );
            }

            if (question.difficulty) {
                addTextContent(
                    card,
                    "Difficulty: " + question.difficulty
                );
            }

            const options = [
                ["A", question.option_a],
                ["B", question.option_b],
                ["C", question.option_c],
                ["D", question.option_d]
            ].filter(function (option) {
                return option[1] !== null &&
                    option[1] !== undefined &&
                    String(option[1]).trim() !== "";
            });

            const validAnswer = ["A", "B", "C", "D"].includes(
                String(question.correct_option || "").toUpperCase()
            );

            const optionGroup = makeElement(
                "div",
                "pyq-options"
            );

            let selectedOption = null;
            let submitted = false;

            const optionButtons = [];

            options.forEach(function (option) {
                const optionButton = makeElement(
                    "button",
                    "pyq-option",
                    option[0] + ". " + option[1]
                );

                optionButton.type = "button";
                optionButton.dataset.option = option[0];
                optionButton.setAttribute(
                    "aria-pressed",
                    "false"
                );

                optionButton.addEventListener("click", function () {
                    if (submitted) return;

                    selectedOption = option[0];

                    optionButtons.forEach(function (button) {
                        const isSelected =
                            button.dataset.option === selectedOption;

                        button.classList.toggle("selected", isSelected);
                        button.setAttribute(
                            "aria-pressed",
                            String(isSelected)
                        );
                    });

                    checkButton.disabled = false;

                    feedback.className = "pyq-feedback";
                    feedback.textContent = "";

                    showToast("Option " + selectedOption + " selected.");
                });

                optionButtons.push(optionButton);
                optionGroup.appendChild(optionButton);
            });

            card.appendChild(optionGroup);

            // Check Answer button
            const checkButton = makeElement(
                "button",
                "resource-action pyq-check-button",
                "Check Answer"
            );

            checkButton.type = "button";
            checkButton.disabled = true;

            // Feedback area
            const feedback = makeElement(
                "div",
                "pyq-feedback"
            );

            feedback.setAttribute("aria-live", "polite");

            checkButton.addEventListener("click", function () {
                if (!selectedOption || submitted) return;

                if (!validAnswer) {
                    feedback.className =
                        "pyq-feedback incorrect";

                    feedback.textContent =
                        "The correct answer is not available for this question yet. Please contact the content administrator.";

                    return;
                }

                submitted = true;

                const correctAnswer =
                    String(question.correct_option).toUpperCase();

                const isCorrect =
                    selectedOption === correctAnswer;

                optionButtons.forEach(function (button) {
                    const optionLetter = button.dataset.option;

                    button.disabled = true;

                    if (optionLetter === correctAnswer) {
                        button.classList.add("correct");
                    } else if (
                        optionLetter === selectedOption &&
                        !isCorrect
                    ) {
                        button.classList.add("incorrect");
                    }
                });

                if (isCorrect) {
                    feedback.className =
                        "pyq-feedback correct";

                    feedback.appendChild(
                        makeElement(
                            "strong",
                            "",
                            "✓ Correct Answer!"
                        )
                    );
                } else {
                    feedback.className =
                        "pyq-feedback incorrect";

                    feedback.appendChild(
                        makeElement(
                            "strong",
                            "",
                            "✗ Incorrect Answer"
                        )
                    );

                    feedback.appendChild(
                        makeElement(
                            "p",
                            "",
                            "Correct option: " + correctAnswer
                        )
                    );
                }

                if (question.explanation) {
                    feedback.appendChild(
                        makeElement(
                            "p",
                            "pyq-explanation",
                            "Explanation: " + question.explanation
                        )
                    );
                } else {
                    feedback.appendChild(
                        makeElement(
                            "p",
                            "pyq-explanation",
                            "Explanation has not been added yet."
                        )
                    );
                }

                checkButton.textContent = "Answer Checked";
                checkButton.disabled = true;

                addLocalRecord(
                    "attempted_questions",
                    question.id
                );

                const attemptRecords = readLocalList(
                    "question_results"
                );

                attemptRecords.push({
                    question_id: question.id,
                    selected_option: selectedOption,
                    correct_option: correctAnswer,
                    is_correct: isCorrect,
                    attempted_at: new Date().toISOString()
                });

                writeLocalList(
                    "question_results",
                    attemptRecords
                );

                showToast(
                    isCorrect
                        ? "Correct! Well done."
                        : "Answer checked. Review the explanation."
                );
            });

            card.appendChild(checkButton);
            card.appendChild(feedback);

            elements.pyqs.appendChild(card);
        });
    }

    // -----------------------------------------------------
    // 14. LESSON COMPLETION EVENT
    // -----------------------------------------------------

    if (elements.lessons) {
        elements.lessons.addEventListener(
            "change",
            function (event) {
                const checkbox = event.target.closest(
                    'input[type="checkbox"][data-lesson-id]'
                );

                if (!checkbox) return;

                const lessonId = checkbox.dataset.lessonId;
                let completed = getCompletedLessons();

                if (checkbox.checked) {
                    if (!completed.includes(lessonId)) {
                        completed.push(lessonId);
                    }
                } else {
                    completed = completed.filter(function (id) {
                        return id !== lessonId;
                    });
                }

                saveCompletedLessons(completed);
                updateProgress();

                showToast(
                    checkbox.checked
                        ? "Lesson completion saved on this device."
                        : "Lesson completion removed."
                );
            }
        );
    }

    // -----------------------------------------------------
    // 15. LOAD ALL CHAPTER RESOURCES
    // -----------------------------------------------------

    try {
        showMessage("Loading chapter information...");

        await loadChapter();

        showMessage("Loading your learning resources...");

        const sections = [
            {
                name: "lessons",
                loader: loadLessons,
                target: elements.lessons
            },
            {
                name: "notes",
                loader: loadNotes,
                target: elements.notes
            },
            {
                name: "formulas",
                loader: loadFormulas,
                target: elements.formulas
            },
            {
                name: "PYQs",
                loader: loadPyqs,
                target: elements.pyqs
            }
        ];

        const results = await Promise.allSettled(
            sections.map(function (section) {
                return section.loader();
            })
        );

        const failedSections = [];

        results.forEach(function (result, index) {
            if (result.status === "rejected") {
                const section = sections[index];

                failedSections.push(section.name);

                console.error(
                    "STUDYVERSE AI: Could not load " +
                    section.name,
                    result.reason
                );

                showEmpty(
                    section.target,
                    "Unable to load this section",
                    "Check the Supabase table, column names and permissions."
                );
            }
        });

        if (failedSections.length) {
            showMessage(
                "Chapter opened, but these resources could not load: " +
                failedSections.join(", ") +
                ". Check the browser console.",
                "error"
            );
        } else {
            showMessage(
                "Chapter loaded successfully. Happy learning!",
                "success"
            );
        }

        updateProgress();

        console.log(
            "STUDYVERSE AI: Chapter Learning Version 3.0 initialized.",
            {
                chapterId: chapterId,
                failedSections: failedSections,
                pyqAnswerChecking: true,
                localProgress: true
            }
        );

    } catch (error) {
        console.error(
            "STUDYVERSE AI: Chapter loading failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load this chapter. Check Supabase configuration.",
            "error"
        );
    }
});
