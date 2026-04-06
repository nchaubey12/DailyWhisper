import { protectPage } from './auth.js';
import { initUI, showToast } from './ui.js';

protectPage();
initUI();

let pages = [];
let currentPageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    pages = JSON.parse(localStorage.getItem('learningPages') || '[]');
    if (pages.length === 0) {
        createNewPage();
    }
    renderPageList();
    loadCurrentPage();
    initEventListeners();
});

function createNewPage() {
    const newPage = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }),
        content: '',
        checked: false,
        feedback: null
    };
    pages.push(newPage);
    currentPageIndex = pages.length - 1;
    savePages();
}

function savePages() {
    localStorage.setItem('learningPages', JSON.stringify(pages));
}

function renderPageList() {
    const container = document.getElementById('pageList');
    if (!container) return;

    if (pages.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">No pages yet</p>';
        return;
    }

    container.innerHTML = pages.map((page, index) => {
        const isActive  = index === currentPageIndex;
        const isChecked = page.checked;

        // Determine card colours based on state — fully inline, no class dependency
        const cardBg     = isChecked ? '#2e7d32' : isActive ? '#8b4513' : '#f5e6d3';
        const cardBorder = isChecked ? '#2e7d32' : isActive ? '#8b4513' : '#d4b896';
        const textColor  = (isActive || isChecked) ? '#ffffff' : '#2c1810';

        return `
        <div
            data-index="${index}"
            style="
                background: ${cardBg};
                border: 2px solid ${cardBorder};
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                display: flex;
                flex-direction: column;
                min-height: 90px;
                box-sizing: border-box;
            "
        >
            <!-- Top bar with delete button -->
            <div style="
                display: flex;
                justify-content: flex-end;
                padding: 6px 6px 0 6px;
            ">
                <button
                    data-delete-index="${index}"
                    title="Delete page"
                    style="
                        width: 22px;
                        height: 22px;
                        min-width: 22px;
                        border-radius: 50%;
                        background: #e53935;
                        border: 2px solid #fff;
                        color: #fff;
                        font-size: 11px;
                        font-weight: 700;
                        line-height: 1;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                        flex-shrink: 0;
                        z-index: 5;
                    "
                >✕</button>
            </div>

            <!-- Card content -->
            <div style="
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4px 10px 12px;
                text-align: center;
                color: ${textColor};
            ">
                <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">${page.date}</div>
                <div style="font-size: 0.75rem; opacity: 0.85;">${isChecked ? '✓ Checked' : 'Draft'}</div>
            </div>
        </div>`;
    }).join('');

    // Card click — switch page (ignore delete button clicks)
    container.querySelectorAll('[data-index]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('[data-delete-index]')) return;
            currentPageIndex = parseInt(card.dataset.index);
            loadCurrentPage();
            renderPageList();
        });
    });

    // Delete button click
    container.querySelectorAll('[data-delete-index]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.deleteIndex);
            pages.splice(idx, 1);
            if (currentPageIndex >= pages.length) {
                currentPageIndex = Math.max(0, pages.length - 1);
            }
            if (pages.length === 0) createNewPage();
            savePages();
            renderPageList();
            loadCurrentPage();
            showToast('Page deleted', 'success');
        });
    });
}

function loadCurrentPage() {
    const page = pages[currentPageIndex];
    if (!page) return;

    document.getElementById('pageDate').textContent = page.date;
    document.getElementById('diaryContent').value = page.content;
    document.getElementById('currentPageNum').textContent = currentPageIndex + 1;

    const textarea = document.getElementById('diaryContent');
    const checkBtn = document.getElementById('checkBtn');

    if (page.checked) {
        textarea.disabled = true;
        checkBtn.disabled = true;
        checkBtn.textContent = '✓ Already Checked (Read Only)';
        displayFeedback(page.feedback);
    } else {
        textarea.disabled = false;
        checkBtn.disabled = false;
        checkBtn.textContent = '✓ Check My Writing';
        clearFeedback();
    }

    document.getElementById('prevPageBtn').disabled = currentPageIndex === 0;
    document.getElementById('nextPageBtn').disabled = currentPageIndex === pages.length - 1;
}

function initEventListeners() {
    document.getElementById('diaryContent').addEventListener('input', (e) => {
        if (!pages[currentPageIndex].checked) {
            pages[currentPageIndex].content = e.target.value;
            savePages();
        }
    });

    document.getElementById('checkBtn').addEventListener('click', async () => {
        const content = document.getElementById('diaryContent').value.trim();
        if (!content) { showToast('Please write something first!', 'error'); return; }
        if (pages[currentPageIndex].checked) { showToast('Already checked!', 'error'); return; }
        await analyzeWriting(content);
    });

    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPageIndex > 0) { currentPageIndex--; loadCurrentPage(); renderPageList(); }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        if (currentPageIndex < pages.length - 1) { currentPageIndex++; loadCurrentPage(); renderPageList(); }
    });

    document.getElementById('newPageBtn').addEventListener('click', () => {
        createNewPage(); renderPageList(); loadCurrentPage();
        showToast('New page created!', 'success');
    });
}

async function analyzeWriting(content) {
    const loadingDiv = document.getElementById('analysisLoading');
    const feedbackContainer = document.getElementById('feedbackContainer');
    loadingDiv.style.display = 'block';
    feedbackContainer.style.display = 'none';

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `You are a helpful English teacher. Analyze the following text for grammar, spelling, and writing quality.\n\nPlease provide:\n1. A list of specific errors with corrections\n2. Grammar tips\n3. Overall writing assessment\n\nFormat your response as JSON with this structure:\n{\n  "errors": [\n    {"text": "incorrect word/phrase", "correction": "correct version", "type": "spelling/grammar/punctuation", "explanation": "why it's wrong"}\n  ],\n  "tips": ["tip 1", "tip 2"],\n  "assessment": "overall feedback"\n}\n\nText to analyze:\n${content}`
                }]
            })
        });

        const data = await response.json();
        const analysisText = data.content[0].text;
        let feedback;
        try {
            const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || analysisText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
            feedback = JSON.parse(jsonStr);
        } catch (e) {
            feedback = { errors: [], tips: ["Review your text carefully"], assessment: analysisText };
        }

        displayFeedback(feedback);
        pages[currentPageIndex].checked = true;
        pages[currentPageIndex].feedback = feedback;
        savePages();

        document.getElementById('diaryContent').disabled = true;
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('checkBtn').textContent = '✓ Already Checked (Read Only)';
        renderPageList();
        showToast('Analysis complete! This page is now read-only.', 'success');

    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Failed to analyze writing. Please try again.', 'error');
    } finally {
        loadingDiv.style.display = 'none';
        feedbackContainer.style.display = 'block';
    }
}

function displayFeedback(feedback) {
    if (!feedback) { clearFeedback(); return; }
    const container = document.getElementById('feedbackContainer');
    let html = '<div class="feedback-section">';

    if (feedback.errors && feedback.errors.length > 0) {
        html += '<h4 style="color:#d32f2f;margin-bottom:0.75rem;">❌ Errors Found:</h4>';
        feedback.errors.forEach(error => {
            html += `<div class="feedback-item">
                <div style="display:flex;gap:0.5rem;margin-bottom:0.25rem;"><strong style="color:#d32f2f;">Incorrect:</strong><span style="text-decoration:line-through;">${escapeHtml(error.text)}</span></div>
                <div style="display:flex;gap:0.5rem;margin-bottom:0.25rem;"><strong style="color:#2e7d32;">Correct:</strong><span>${escapeHtml(error.correction)}</span></div>
                <div style="font-size:0.875rem;color:#666;margin-top:0.25rem;"><em>${escapeHtml(error.explanation)}</em></div>
            </div>`;
        });
    } else {
        html += '<div style="color:#2e7d32;padding:1rem;text-align:center;font-weight:600;">✓ No errors found! Great job!</div>';
    }

    if (feedback.tips && feedback.tips.length > 0) {
        html += '<h4 style="color:#1976d2;margin:1rem 0 0.75rem 0;">💡 Writing Tips:</h4>';
        feedback.tips.forEach(tip => {
            html += `<div class="feedback-item suggestion"><div style="color:#1976d2;">• ${escapeHtml(tip)}</div></div>`;
        });
    }

    if (feedback.assessment) {
        html += '<h4 style="color:#f57c00;margin:1rem 0 0.75rem 0;">📝 Overall Assessment:</h4>';
        html += `<div class="feedback-item grammar"><div style="color:#555;">${escapeHtml(feedback.assessment)}</div></div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

function clearFeedback() {
    document.getElementById('feedbackContainer').innerHTML =
        '<p style="color:#666;text-align:center;padding:2rem;">Write something and click "Check" to get AI-powered grammar and writing feedback!</p>';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}