// ==========================================================================
// Жас ерекшелік психологиясы — Негізгі клиенттік логика
// ==========================================================================

import bookContent from './data/book_content.json';
import tocData from './data/toc.json';
import questionsData from './data/questions.json';

// Күйді басқару (State)
const state = {
  currentRoute: 'cover',
  theme: localStorage.getItem('ebook_theme') || 'paper',
  fontSize: localStorage.getItem('ebook_fontsize') || 'md',
  sidebarOpen: window.innerWidth > 860,
  quizState: {
    started: false,
    studentName: localStorage.getItem('quiz_student_name') || '',
    questions: [],
    currentIndex: 0,
    answers: {},
    finished: false,
    startTime: null,
    endTime: null
  }
};

// DOM элементтері
const elements = {
  readingProgress: document.getElementById('readingProgress'),
  readingContainer: document.getElementById('readingContainer'),
  sidebar: document.getElementById('sidebar'),
  tocNav: document.getElementById('tocNav'),
  sidebarFilterInput: document.getElementById('sidebarFilterInput'),
  toggleSidebarBtn: document.getElementById('toggleSidebarBtn'),
  brandHomeBtn: document.getElementById('brandHomeBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  fontDecBtn: document.getElementById('fontDecBtn'),
  fontIncBtn: document.getElementById('fontIncBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  openSearchBtn: document.getElementById('openSearchBtn'),
  searchModal: document.getElementById('searchModal'),
  closeSearchModalBtn: document.getElementById('closeSearchModalBtn'),
  globalSearchInput: document.getElementById('globalSearchInput'),
  searchResults: document.getElementById('searchResults'),
  navTabs: document.querySelectorAll('.nav-tab-btn')
};

// --------------------------------------------------------------------------
// Тақырып және қаріпті баптау
// --------------------------------------------------------------------------
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ebook_theme', theme);
  const icons = { paper: '☀️', sepia: '📜', dark: '🌙' };
  if (elements.themeIcon) elements.themeIcon.textContent = icons[theme] || '☀️';
}

function cycleTheme() {
  const themes = ['paper', 'sepia', 'dark'];
  const next = themes[(themes.indexOf(state.theme) + 1) % themes.length];
  applyTheme(next);
}

function applyFontSize(size) {
  state.fontSize = size;
  document.documentElement.setAttribute('data-size', size);
  localStorage.setItem('ebook_fontsize', size);
}

function changeFontSize(delta) {
  const sizes = ['sm', 'md', 'lg', 'xl'];
  let idx = sizes.indexOf(state.fontSize) + delta;
  if (idx >= 0 && idx < sizes.length) {
    applyFontSize(sizes[idx]);
  }
}

// --------------------------------------------------------------------------
// Сайдбар және Мазмұны (TOC)
// --------------------------------------------------------------------------
function renderTOC(filter = '') {
  elements.tocNav.innerHTML = '';
  const search = filter.toLowerCase().trim();

  const groups = [
    { key: 'intro', title: 'Кіріспе' },
    { key: 'lecture', title: 'Дәрістер кешені' },
    { key: 'practice', title: 'Практикалық сабақтар' },
    { key: 'selfwork', title: 'Өздік жұмыстар (СӨЖ)' }
  ];

  groups.forEach(grp => {
    const items = tocData.filter(item => {
      const matchCat = item.category === grp.key;
      const matchQuery = !search || item.title.toLowerCase().includes(search) || item.shortTitle.toLowerCase().includes(search);
      return matchCat && matchQuery;
    });

    if (items.length === 0) return;

    const grpEl = document.createElement('div');
    grpEl.className = 'toc-group';
    grpEl.innerHTML = `<div class="toc-group-title">${grp.title}</div>`;

    items.forEach(item => {
      const link = document.createElement('a');
      link.className = `toc-item-link ${state.currentRoute === item.id ? 'active' : ''}`;
      link.href = `#${item.id}`;
      link.innerHTML = `
        <span class="toc-item-badge">${item.shortTitle}</span>
        <span>${item.title.replace(item.shortTitle, '').replace(/^[.:\s-]+/, '').trim() || item.title}</span>
      `;
      grpEl.appendChild(link);
    });

    elements.tocNav.appendChild(grpEl);
  });

  // Бақылау тесті пункті
  const quizLink = document.createElement('a');
  quizLink.className = `toc-item-link ${state.currentRoute === 'quiz' ? 'active' : ''}`;
  quizLink.href = '#quiz';
  quizLink.style.marginTop = '0.5rem';
  quizLink.innerHTML = `
    <span class="toc-item-badge">🎯</span>
    <strong>Бақылау тесті (Интерактивті)</strong>
  `;
  elements.tocNav.appendChild(quizLink);
}

// --------------------------------------------------------------------------
// Басты бетті бейнелеу (Cover Hero)
// --------------------------------------------------------------------------
function renderCoverPage() {
  elements.readingContainer.innerHTML = `
    <div class="cover-hero">
      <span class="cover-badge">Электрондық оқу құралы</span>
      <h1 class="cover-title">Жас ерекшелік психологиясы</h1>
      <p class="cover-subtitle">
        Адамның туылғаннан өмірінің соңына дейінгі психикалық даму заңдылықтарын, 
        жас кезеңдері мен дағдарыстарын, танымдық процестердің қалыптасуын зерттейтін кешенді оқулық.
      </p>

      <div class="cover-actions">
        <a href="#intro" class="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Кіріспеден бастау
        </a>
        <a href="#lecture-1" class="btn-secondary">
          Дәрістерге өту
        </a>
        <a href="#quiz" class="btn-secondary">
          🎯 Тестілеу
        </a>
      </div>

      <div class="cover-meta">
        <div>📚 <strong>14</strong> Дәріс</div>
        <div>✍️ <strong>15</strong> Практикалық сабақ</div>
        <div>📝 <strong>10</strong> Өздік жұмыс тапсырмасы</div>
        <div>🎯 <strong>15</strong> Бақылау сұрағы</div>
      </div>
    </div>

    <!-- Тез бағдарлау карточкалары -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem;">
      <a href="#lecture-1" class="nav-card" style="max-width: 100%;">
        <span class="nav-card-label">1-бөлім</span>
        <span class="nav-card-title">Жасерекшелік психологиясы ғылым ретінде</span>
      </a>
      <a href="#lecture-4" class="nav-card" style="max-width: 100%;">
        <span class="nav-card-label">2-бөлім</span>
        <span class="nav-card-title">Нәрестелік және сәбилік шақ психологиясы</span>
      </a>
      <a href="#lecture-9" class="nav-card" style="max-width: 100%;">
        <span class="nav-card-label">3-бөлім</span>
        <span class="nav-card-title">Жеткіншектік және жасөспірімдік кезең</span>
      </a>
      <a href="#lecture-12" class="nav-card" style="max-width: 100%;">
        <span class="nav-card-label">4-бөлім</span>
        <span class="nav-card-title">Ересектік кезең және геронтопсихология</span>
      </a>
    </div>
  `;
}

// --------------------------------------------------------------------------
// Мәтінді оқу парағы (Article Reader)
// --------------------------------------------------------------------------
function renderArticlePage(sectionId) {
  const section = bookContent.find(s => s.id === sectionId);
  if (!section) {
    elements.readingContainer.innerHTML = `<div class="cover-hero"><h2>Бөлім табылмады</h2><a href="#cover" class="btn-primary">Басты бетке оралу</a></div>`;
    return;
  }

  // Алдыңғы және келесі бөлімдерді анықтау
  const currentIndex = tocData.findIndex(item => item.id === sectionId);
  const prevSection = currentIndex > 0 ? tocData[currentIndex - 1] : null;
  const nextSection = currentIndex < tocData.length - 1 ? tocData[currentIndex + 1] : null;

  elements.readingContainer.innerHTML = `
    <article class="article-container">
      <header class="article-header">
        <span class="article-category-badge">${section.categoryName}</span>
        <h1 class="article-title">${section.title}</h1>
        <div class="article-meta" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; gap: 1rem;">
            <span>📖 ${section.shortTitle}</span>
            <span>⏱ Оқу уақыты: ~${Math.max(2, Math.round(section.content.length / 800))} мин</span>
          </div>
          ${section.original ? `
            <a href="${section.original}" download class="control-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 0.8rem; padding: 0.3rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm);" title="Түпнұсқа MHT файлын жүктеу">
              📥 Түпнұсқа MHT жүктеу
            </a>
          ` : ''}
        </div>
      </header>

      <div class="article-body">
        ${section.content}
      </div>

      <nav class="chapter-navigation" aria-label="Бөлімдер бойынша шарлау">
        ${prevSection ? `
          <a href="#${prevSection.id}" class="nav-card">
            <span class="nav-card-label">← Алдыңғы бөлім</span>
            <span class="nav-card-title">${prevSection.shortTitle}: ${prevSection.title}</span>
          </a>
        ` : '<div></div>'}

        ${nextSection ? `
          <a href="#${nextSection.id}" class="nav-card" style="text-align: right; align-items: flex-end;">
            <span class="nav-card-label">Келесі бөлім →</span>
            <span class="nav-card-title">${nextSection.shortTitle}: ${nextSection.title}</span>
          </a>
        ` : `
          <a href="#quiz" class="nav-card" style="text-align: right; align-items: flex-end;">
            <span class="nav-card-label">Қорытынды →</span>
            <span class="nav-card-title">🎯 Бақылау тестіне өту</span>
          </a>
        `}
      </nav>
    </article>
  `;

  // Парақтың басына жылжу
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// Бақылау тесті (Interactive Quiz Engine)
// --------------------------------------------------------------------------
function renderQuizPage() {
  const qs = state.quizState;

  // 1. Тест басталмаған: тіркелу және бастау экраны
  if (!qs.started) {
    elements.readingContainer.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-header">
          <div class="quiz-title-wrap">
            <h2>Бақылау тесті</h2>
            <p>Жас ерекшелік психологиясы пәні бойынша білімді тексеру</p>
          </div>
          <span class="cover-badge">10 сұрақ</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px; margin: 1rem 0;">
          <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">
            Студенттің / Тыңдаушының Аты-жөні:
          </label>
          <input type="text" id="quizStudentNameInput" value="${qs.studentName}" 
            placeholder="Мысалы: Ахметов Нұрлан"
            style="padding: 0.75rem 1rem; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); font-size: 1rem; background: var(--bg-surface); color: var(--text-main);" />

          <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
            <button id="startStandardQuizBtn" class="btn-primary" style="flex: 1;">
              Стандартты тест (10 кездейсоқ сұрақ)
            </button>
            <button id="startFullQuizBtn" class="btn-secondary" style="flex: 1;">
              Толық тест (Барлық 15 сұрақ)
            </button>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 1rem; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
          <strong>Тест ережесі:</strong><br />
          • Әрбір сұрақта 4 немесе 5 жауап нұсқасы беріледі, тек біреуі ғана дұрыс.<br />
          • Жауап нұсқалары әр тапсырған сайын кездейсоқ араластырылады.<br />
          • Тест соңында нәтижеңіз, қателер талдауы және ресми хаттама басып шығаруға дайын болады.
        </div>
      </div>
    `;

    document.getElementById('startStandardQuizBtn').addEventListener('click', () => startQuiz(10));
    document.getElementById('startFullQuizBtn').addEventListener('click', () => startQuiz(15));
    return;
  }

  // 2. Тест аяқталды: нәтижелер экраны
  if (qs.finished) {
    let correctCount = 0;
    qs.questions.forEach((q, i) => {
      const userAnsIndex = qs.answers[i];
      if (userAnsIndex !== undefined && q.options[userAnsIndex]?.correct) {
        correctCount++;
      }
    });

    const totalCount = qs.questions.length;
    const scorePercent = Math.round((correctCount / totalCount) * 100);
    let gradeText = 'Қанағаттанарлықсыз';
    let gradeColor = 'var(--danger)';

    if (scorePercent >= 90) {
      gradeText = 'Өте жақсы (5)';
      gradeColor = 'var(--success)';
    } else if (scorePercent >= 75) {
      gradeText = 'Жақсы (4)';
      gradeColor = 'var(--success)';
    } else if (scorePercent >= 50) {
      gradeText = 'Қанағаттанарлық (3)';
      gradeColor = 'var(--warning)';
    }

    elements.readingContainer.innerHTML = `
      <div class="quiz-container">
        <div class="results-card">
          <div class="results-score-circle" style="border-color: ${gradeColor}; color: ${gradeColor};">
            <span class="results-score-value">${correctCount}/${totalCount}</span>
            <span class="results-score-label">${scorePercent}%</span>
          </div>

          <h2 style="font-size: 1.6rem; color: var(--text-main);">Тестілеу аяқталды!</h2>
          <p style="font-size: 1.1rem; font-weight: 600; color: ${gradeColor};">Баға: ${gradeText}</p>

          <table class="results-table">
            <tbody>
              <tr><td><strong>Тыңдаушы:</strong></td><td>${qs.studentName || 'Аноним'}</td></tr>
              <tr><td><strong>Сұрақ саны:</strong></td><td>${totalCount}</td></tr>
              <tr><td><strong>Дұрыс жауап:</strong></td><td style="color: var(--success); font-weight: 700;">${correctCount}</td></tr>
              <tr><td><strong>Дұрыс емес жауап:</strong></td><td style="color: var(--danger); font-weight: 700;">${totalCount - correctCount}</td></tr>
              <tr><td><strong>Уақыты:</strong></td><td>${new Date().toLocaleString('kk-KZ')}</td></tr>
            </tbody>
          </table>

          <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
            <button id="restartQuizBtn" class="btn-primary">Тестті қайта тапсыру</button>
            <button id="printQuizProtocolBtn" class="btn-secondary">🖨 Хаттаманы басып шығару</button>
          </div>
        </div>

        <!-- Қателер мен жауаптардың толық талдауы -->
        <div style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 1rem;">
          <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">Сұрақтар бойынша талдау:</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${qs.questions.map((q, idx) => {
              const userAns = qs.answers[idx];
              const isCorrect = userAns !== undefined && q.options[userAns]?.correct;
              const correctOpt = q.options.find(o => o.correct);

              return `
                <div style="padding: 1rem; border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}; background: ${isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)'};">
                  <div style="font-weight: 600; margin-bottom: 0.5rem;">${idx + 1}. ${q.text}</div>
                  <div style="font-size: 0.9rem;">
                    Сіздің жауабыңыз: <strong>${userAns !== undefined ? q.options[userAns]?.text : 'Жауап берілмеді'}</strong> ${isCorrect ? '✓' : '✗'}
                  </div>
                  ${!isCorrect ? `<div style="font-size: 0.9rem; color: var(--success); margin-top: 0.25rem;">Дұрыс жауап: <strong>${correctOpt?.text}</strong></div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('restartQuizBtn').addEventListener('click', () => {
      state.quizState.started = false;
      state.quizState.finished = false;
      renderQuizPage();
    });

    document.getElementById('printQuizProtocolBtn').addEventListener('click', () => {
      window.print();
    });
    return;
  }

  // 3. Тест барысы: сұрақ карточкасы
  const q = qs.questions[qs.currentIndex];
  const userSelected = qs.answers[qs.currentIndex];

  elements.readingContainer.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-header">
        <div class="quiz-title-wrap">
          <h2>Сұрақ ${qs.currentIndex + 1} / ${qs.questions.length}</h2>
          <p>${qs.studentName ? `Студент: ${qs.studentName}` : 'Бақылау тесті'}</p>
        </div>
      </div>

      <!-- Навигация нүктелері -->
      <div class="question-progress">
        ${qs.questions.map((_, i) => `
          <button class="progress-dot ${i === qs.currentIndex ? 'active' : ''} ${qs.answers[i] !== undefined ? 'answered' : ''}" data-idx="${i}">
            ${i + 1}
          </button>
        `).join('')}
      </div>

      <!-- Сұрақ мәтіні -->
      <div class="question-card">
        <div class="question-text">${q.text}</div>

        <div class="options-list">
          ${q.options.map((opt, optIdx) => `
            <div class="option-card ${userSelected === optIdx ? 'selected' : ''}" data-opt-idx="${optIdx}">
              <div class="option-radio"></div>
              <span>${opt.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="quiz-footer">
        <button id="quizPrevBtn" class="control-btn" ${qs.currentIndex === 0 ? 'disabled style="opacity: 0.4;"' : ''}>
          ← Алдыңғы
        </button>

        ${qs.currentIndex === qs.questions.length - 1 ? `
          <button id="finishQuizBtn" class="btn-primary">
            Тестті аяқтау ✓
          </button>
        ` : `
          <button id="quizNextBtn" class="btn-primary">
            Келесі сұрақ →
          </button>
        `}
      </div>
    </div>
  `;

  // Оқиғаларды тіркеу
  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      const optIdx = parseInt(card.dataset.optIdx, 10);
      qs.answers[qs.currentIndex] = optIdx;
      renderQuizPage();
    });
  });

  document.querySelectorAll('.progress-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      qs.currentIndex = parseInt(dot.dataset.idx, 10);
      renderQuizPage();
    });
  });

  const prevBtn = document.getElementById('quizPrevBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (qs.currentIndex > 0) {
        qs.currentIndex--;
        renderQuizPage();
      }
    });
  }

  const nextBtn = document.getElementById('quizNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (qs.currentIndex < qs.questions.length - 1) {
        qs.currentIndex++;
        renderQuizPage();
      }
    });
  }

  const finishBtn = document.getElementById('finishQuizBtn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      qs.finished = true;
      qs.endTime = Date.now();
      renderQuizPage();
    });
  }
}

function startQuiz(count = 10) {
  const nameInput = document.getElementById('quizStudentNameInput');
  const name = nameInput ? nameInput.value.trim() : '';
  state.quizState.studentName = name;
  localStorage.setItem('quiz_student_name', name);

  // Сұрақтарды клондеу және араластыру
  let pool = JSON.parse(JSON.stringify(questionsData));
  pool.sort(() => Math.random() - 0.5);
  const selected = pool.slice(0, count);

  // Әр сұрақтың нұсқаларын араластыру
  selected.forEach(q => {
    q.options.sort(() => Math.random() - 0.5);
  });

  state.quizState.questions = selected;
  state.quizState.currentIndex = 0;
  state.quizState.answers = {};
  state.quizState.started = true;
  state.quizState.finished = false;
  state.quizState.startTime = Date.now();

  renderQuizPage();
}

// --------------------------------------------------------------------------
// Түпнұсқа файлдар парағы (40 MHT және Paradox DB)
// --------------------------------------------------------------------------
function renderOriginalsPage() {
  elements.readingContainer.innerHTML = `
    <div class="author-card" style="padding: 2.5rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div>
          <span class="cover-badge">Түпнұсқа деректер</span>
          <h1 style="font-family: var(--font-body); font-size: 1.85rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;">
            Түпнұсқа MHT файлдары және Delphi/Paradox дерекқоры
          </h1>
        </div>
        <a href="#cover" class="btn-secondary" style="font-size: 0.85rem;">Басты бетке</a>
      </div>

      <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
        Мұнда бағдарламаның барлық 40 түпнұсқа веб-архивтері (MHT форматында) және Delphi бақылау тестінің Paradox 7 (t.DB) дерекқор файлдары сақталған. Кез келген файлды жүктеп алуға немесе пайдалануға болады.
      </p>

      <div style="margin-bottom: 2rem;">
        <h3 style="font-size: 1.15rem; color: var(--text-main); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          💾 Delphi Paradox 7 Тест дерекқоры
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem;">
          <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-app); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600;">t.DB (Тест сұрақтары)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">226 КБ • Paradox 7 KZLocale</div>
            </div>
            <a href="./originals/test/t.DB" download class="btn-primary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">Жүктеу</a>
          </div>
          <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-app); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600;">t.MB (Мемо блогы)</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">8 КБ • Paradox Memo</div>
            </div>
            <a href="./originals/test/t.MB" download class="btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">Жүктеу</a>
          </div>
          <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-app); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600;">sd_06.11.2022.rts</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">572 Б • Delphi нәтижелері</div>
            </div>
            <a href="./originals/test/sd_06.11.2022.rts" download class="btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">Жүктеу</a>
          </div>
        </div>
      </div>

      <div>
        <h3 style="font-size: 1.15rem; color: var(--text-main); margin-bottom: 0.75rem;">
          📄 Барлық 40 бөлімнің түпнұсқа MHT файлдары
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.6rem;">
          ${bookContent.map(sec => `
            <div style="padding: 0.6rem 0.8rem; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface);">
              <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem;">
                <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">${sec.categoryName}</span><br/>
                <span style="font-size: 0.85rem; font-weight: 500;">${sec.shortTitle}</span>
              </div>
              <a href="${sec.original}" download class="control-btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; text-decoration: none;" title="Жүктеу">
                ⬇️ MHT
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// Роутер (Hash-based Routing)
// --------------------------------------------------------------------------
function navigate(route) {
  state.currentRoute = route || 'cover';

  // Бас навигация тақтасындағы белсенді түймені жаңарту
  elements.navTabs.forEach(btn => {
    const r = btn.dataset.route;
    let isActive = false;
    if (r === 'cover' && state.currentRoute === 'cover') isActive = true;
    else if (r === 'intro' && state.currentRoute === 'intro') isActive = true;
    else if (r === 'lecture-1' && state.currentRoute.startsWith('lecture-')) isActive = true;
    else if (r === 'practice-1' && state.currentRoute.startsWith('practice-')) isActive = true;
    else if (r === 'selfwork-1' && state.currentRoute.startsWith('selfwork-')) isActive = true;
    else if (r === 'quiz' && state.currentRoute === 'quiz') isActive = true;
    else if (r === 'originals' && state.currentRoute === 'originals') isActive = true;

    btn.classList.toggle('active', isActive);
  });

  // Мазмұнды белсенді элемент бойынша жаңарту
  renderTOC(elements.sidebarFilterInput ? elements.sidebarFilterInput.value : '');

  // Экранды сызу
  if (state.currentRoute === 'cover') {
    renderCoverPage();
  } else if (state.currentRoute === 'quiz') {
    renderQuizPage();
  } else if (state.currentRoute === 'originals') {
    renderOriginalsPage();
  } else {
    renderArticlePage(state.currentRoute);
  }

  // Мобильді құрылғыда сайдбарды жабу
  if (window.innerWidth <= 860) {
    elements.sidebar.classList.add('collapsed');
  }
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '').trim();
  navigate(hash || 'cover');
}

// --------------------------------------------------------------------------
// Іздеу жүйесі (Search Modal)
// --------------------------------------------------------------------------
function performSearch(query) {
  const q = query.toLowerCase().trim();
  if (q.length < 2) {
    elements.searchResults.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">Іздеу үшін кемінде 2 әріп енгізіңіз</p>`;
    return;
  }

  const results = [];
  bookContent.forEach(sec => {
    // Тақырып бойынша
    if (sec.title.toLowerCase().includes(q)) {
      results.push({
        id: sec.id,
        title: sec.title,
        category: sec.categoryName,
        matchType: 'title',
        snippet: sec.title
      });
      return;
    }
    // Мазмұн мәтіні бойынша
    const plainText = sec.content.replace(/<[^>]+>/g, ' ');
    const idx = plainText.toLowerCase().indexOf(q);
    if (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(plainText.length, idx + 100);
      const snip = plainText.substring(start, end).replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
      results.push({
        id: sec.id,
        title: sec.title,
        category: sec.categoryName,
        matchType: 'content',
        snippet: `...${snip}...`
      });
    }
  });

  if (results.length === 0) {
    elements.searchResults.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">«${query}» бойынша ештеңе табылмады</p>`;
    return;
  }

  elements.searchResults.innerHTML = `
    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Табылды: ${results.length} нәтиже</div>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      ${results.map(r => `
        <a href="#${r.id}" class="search-result-item" style="padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 0.25rem; transition: background 0.15s ease;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">${r.category}</div>
          <div style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${r.title}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">${r.snippet}</div>
        </a>
      `).join('')}
    </div>
  `;

  // Нәтижені басқанда модальді жабу
  elements.searchResults.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      elements.searchModal.classList.remove('open');
    });
  });
}

// --------------------------------------------------------------------------
// Оқу прогресі индикаторы (Scroll listener)
// --------------------------------------------------------------------------
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const b = document.body;
  const st = 'scrollTop';
  const sh = 'scrollHeight';
  const percent = ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100;
  if (elements.readingProgress) {
    elements.readingProgress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
});

// --------------------------------------------------------------------------
// Бастапқы іске қосу (Init)
// --------------------------------------------------------------------------
function init() {
  applyTheme(state.theme);
  applyFontSize(state.fontSize);

  // Сайдбар түймесі
  elements.toggleSidebarBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('collapsed');
  });

  // Бренд басқанда басты бетке
  elements.brandHomeBtn.addEventListener('click', () => {
    window.location.hash = '#cover';
  });

  // Бас навигация тақтасының батырмалары
  elements.navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#${btn.dataset.route}`;
    });
  });

  // Тақырыпты ауыстыру
  elements.themeToggleBtn.addEventListener('click', cycleTheme);

  // Қаріп өлшемі
  elements.fontDecBtn.addEventListener('click', () => changeFontSize(-1));
  elements.fontIncBtn.addEventListener('click', () => changeFontSize(1));

  // Толық экран
  elements.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Сайдбарды сүзу
  elements.sidebarFilterInput.addEventListener('input', e => {
    renderTOC(e.target.value);
  });

  // Іздеу модалі
  elements.openSearchBtn.addEventListener('click', () => {
    elements.searchModal.classList.add('open');
    elements.globalSearchInput.focus();
  });

  elements.closeSearchModalBtn.addEventListener('click', () => {
    elements.searchModal.classList.remove('open');
  });

  elements.searchModal.addEventListener('click', e => {
    if (e.target === elements.searchModal) {
      elements.searchModal.classList.remove('open');
    }
  });

  elements.globalSearchInput.addEventListener('input', e => {
    performSearch(e.target.value);
  });

  // Ыстық пернелер: Ctrl+K немесе Escape
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      elements.searchModal.classList.add('open');
      elements.globalSearchInput.focus();
    }
    if (e.key === 'Escape' && elements.searchModal.classList.contains('open')) {
      elements.searchModal.classList.remove('open');
    }
  });

  // Хэш өзгерісін бақылау
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

// Іске қосу
init();
