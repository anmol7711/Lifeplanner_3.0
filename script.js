/* ================================================================
   SCRIPT.JS — Student Life Dashboard
   ----------------------------------------------------------------
   HOW THIS FILE IS ORGANIZED:
    A. Utility helpers (localStorage, dates)
    B. Navigation (sidebar switching)
    C. Dark mode
    D. Task Manager
    E. Homework Tracker
    F. Pomodoro Timer
    G. Daily Planner
    H. Smart Assistant
    I. Dashboard overview
    J. App startup (runs everything when the page loads)
================================================================ */

/* ================================================================
   A. UTILITY HELPERS
   Small functions used throughout the rest of the code.
================================================================ */

/**
 * saveData(key, data)
 * Saves any JavaScript value to localStorage.
 * localStorage only stores strings, so we convert to JSON first.
 */
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * loadData(key, fallback)
 * Loads a value from localStorage.
 * If nothing is stored yet, returns the fallback value.
 */
function loadData(key, fallback) {
  const stored = localStorage.getItem(key);
  // If stored is null (not found), return the fallback
  return stored ? JSON.parse(stored) : fallback;
}

/**
 * todayString()
 * Returns today's date as "YYYY-MM-DD" (matches <input type="date"> format).
 */
function todayString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * formatTime(h, m)
 * Converts 24-hour numbers to a readable time string like "3:45 PM".
 */
function formatTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * generateId()
 * Creates a unique ID for each task / homework item.
 * Uses the current timestamp so it's always different.
 */
function generateId() {
  return Date.now().toString();
}

/* ================================================================
   B. NAVIGATION — Switching between sections
================================================================ */

// All nav buttons in the sidebar
const navButtons = document.querySelectorAll('.nav-btn');
// All section elements in the main content
const sections   = document.querySelectorAll('.section');

/**
 * showSection(sectionId)
 * Hides all sections then shows only the one matching sectionId.
 * Also updates which nav button looks "active".
 */
function showSection(sectionId) {
  // Hide every section
  sections.forEach(s => s.classList.remove('active'));
  // Remove "active" from every nav button
  navButtons.forEach(b => b.classList.remove('active'));

  // Show only the target section
  const target = document.getElementById(sectionId);
  if (target) target.classList.add('active');

  // Highlight the matching nav button
  navButtons.forEach(b => {
    if (b.dataset.section === sectionId) b.classList.add('active');
  });

  // Close sidebar on mobile after navigating
  document.getElementById('sidebar').classList.remove('open');

  // Refresh dashboard stats whenever we navigate there
  if (sectionId === 'dashboard') updateDashboard();
}

// Add click listener to each nav button
navButtons.forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});

// Hamburger toggle for mobile
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ================================================================
   C. DARK MODE
================================================================ */

/** Applies or removes dark mode based on a boolean. */
function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.getElementById('themeIcon').textContent  = isDark ? '☀️' : '🌙';
  document.getElementById('themeLabel').textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// When the toggle button is clicked, flip the theme
document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark-mode');
  applyTheme(isDark);
  saveData('darkMode', isDark);   // remember preference
});

/* ================================================================
   D. TASK MANAGER
================================================================ */

// We store tasks as an array of objects:
// { id, text, category, completed }
let tasks = loadData('tasks', []);

// Which category filter is active ("All" by default)
let currentFilter = 'All';

/**
 * addTask()
 * Reads the input field, creates a new task object, saves it, and re-renders.
 */
function addTask() {
  const input    = document.getElementById('taskInput');
  const category = document.getElementById('taskCategory').value;
  const text     = input.value.trim();

  // Don't add empty tasks
  if (!text) {
    input.focus();
    return;
  }

  // Build a new task object
  const task = {
    id:        generateId(),
    text:      text,
    category:  category,
    completed: false
  };

  tasks.push(task);
  saveData('tasks', tasks);
  renderTasks();
  updateDashboard();

  // Clear the input so user can type the next task
  input.value = '';
  input.focus();
}

/**
 * toggleTask(id)
 * Marks a task complete or incomplete when its checkbox is clicked.
 */
function toggleTask(id) {
  tasks = tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveData('tasks', tasks);
  renderTasks();
  updateDashboard();
}

/**
 * deleteTask(id)
 * Removes a task from the array.
 */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveData('tasks', tasks);
  renderTasks();
  updateDashboard();
}

/**
 * filterTasks(category, btn)
 * Updates which category is shown and highlights the right filter button.
 */
function filterTasks(category, btn) {
  currentFilter = category;
  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

/**
 * renderTasks()
 * Clears the task list and redraws every task that matches the current filter.
 */
function renderTasks() {
  const list = document.getElementById('taskList');

  // Filter tasks by the currently selected category
  const filtered = currentFilter === 'All'
    ? tasks
    : tasks.filter(t => t.category === currentFilter);

  // If nothing to show, display a friendly message
  if (filtered.length === 0) {
    list.innerHTML = '<li class="empty-msg">No tasks here. Add one above! ✨</li>';
    return;
  }

  // Build HTML for each task
  list.innerHTML = filtered.map(task => `
    <li class="task-item ${task.completed ? 'completed' : ''}" id="task-${task.id}">
      <input
        type="checkbox"
        ${task.completed ? 'checked' : ''}
        onchange="toggleTask('${task.id}')"
        aria-label="Mark ${escapeHtml(task.text)} as complete"
      />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <span class="task-badge badge-${task.category}">${task.category}</span>
      <button class="btn-icon" onclick="deleteTask('${task.id}')" aria-label="Delete task" title="Delete">🗑️</button>
    </li>
  `).join('');
}

/**
 * escapeHtml(str)
 * Prevents XSS by converting special characters to HTML entities.
 * Always do this when inserting user text into HTML.
 */
function escapeHtml(str) {
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return str.replace(/[&<>"']/g, m => map[m]);
}

// Allow pressing Enter in the task input to add a task
document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

/* ================================================================
   E. HOMEWORK TRACKER
================================================================ */

// Homework items: { id, subject, desc, due }
let homeworks = loadData('homeworks', []);

/**
 * addHomework()
 * Reads all three homework fields and adds a new assignment.
 */
function addHomework() {
  const subject = document.getElementById('hwSubject').value.trim();
  const desc    = document.getElementById('hwDesc').value.trim();
  const due     = document.getElementById('hwDue').value;

  if (!subject || !desc || !due) {
    alert('Please fill in subject, description, and due date.');
    return;
  }

  const hw = { id: generateId(), subject, desc, due };
  homeworks.push(hw);
  saveData('homeworks', homeworks);
  renderHomework();
  updateDashboard();

  // Clear the fields
  document.getElementById('hwSubject').value = '';
  document.getElementById('hwDesc').value    = '';
  document.getElementById('hwDue').value     = '';
}

/**
 * deleteHomework(id)
 * Removes an assignment by its id.
 */
function deleteHomework(id) {
  homeworks = homeworks.filter(h => h.id !== id);
  saveData('homeworks', homeworks);
  renderHomework();
  updateDashboard();
}

/**
 * renderHomework()
 * Redraws the homework list, marking overdue items in red.
 */
function renderHomework() {
  const list  = document.getElementById('hwList');
  const today = todayString();

  if (homeworks.length === 0) {
    list.innerHTML = '<li class="empty-msg">No assignments yet. Enjoy the free time! 🎉</li>';
    return;
  }

  // Sort by due date (earliest first)
  const sorted = [...homeworks].sort((a, b) => a.due.localeCompare(b.due));

  list.innerHTML = sorted.map(hw => {
    const isOverdue = hw.due < today;  // compare date strings (YYYY-MM-DD sorts correctly)
    const dueLabel  = isOverdue ? `⚠️ Overdue — was due ${hw.due}` : `📅 Due: ${hw.due}`;

    return `
      <li class="hw-item ${isOverdue ? 'overdue' : ''}">
        <div class="hw-info">
          <div class="hw-subject">${escapeHtml(hw.subject)}</div>
          <div class="hw-desc">${escapeHtml(hw.desc)}</div>
          <div class="hw-due">${dueLabel}</div>
        </div>
        <button class="btn-icon" onclick="deleteHomework('${hw.id}')" title="Delete">🗑️</button>
      </li>
    `;
  }).join('');
}

/* ================================================================
   F. POMODORO TIMER
================================================================ */

// Timer state variables
let timerMode      = 'focus';    // 'focus' or 'break'
let timerDuration  = 25 * 60;   // total seconds (25 min by default)
let timerRemaining = timerDuration;
let timerInterval  = null;       // holds the setInterval reference
let timerRunning   = false;
let sessionCount   = loadData('pomodoroSessions', 0);

// Circumference of the SVG ring (2 * π * r = 2 * 3.14159 * 90 ≈ 565)
const RING_CIRCUMFERENCE = 565;

/** setMode(mode) — Switches between focus and break mode. */
function setMode(mode) {
  timerMode = mode;
  clearInterval(timerInterval);
  timerRunning = false;

  // Set duration based on mode
  timerDuration  = mode === 'focus' ? 25 * 60 : 5 * 60;
  timerRemaining = timerDuration;

  // Update button styles
  document.getElementById('modeFocus').classList.toggle('active', mode === 'focus');
  document.getElementById('modeBreak').classList.toggle('active', mode === 'break');

  updateTimerDisplay();
}

/** startTimer() — Begins the countdown. */
function startTimer() {
  if (timerRunning) return;   // don't start twice
  timerRunning = true;

  timerInterval = setInterval(() => {
    timerRemaining--;

    if (timerRemaining <= 0) {
      // Timer finished!
      clearInterval(timerInterval);
      timerRunning = false;
      timerRemaining = 0;
      updateTimerDisplay();

      // Play a beep sound (built-in Web Audio API — no file needed)
      playBeep();

      if (timerMode === 'focus') {
        sessionCount++;
        saveData('pomodoroSessions', sessionCount);
        document.getElementById('sessionCount').textContent = sessionCount;
        alert('🎉 Focus session complete! Take a break.');
        setMode('break');
      } else {
        alert('☕ Break over! Ready to focus again?');
        setMode('focus');
      }
      return;
    }

    updateTimerDisplay();
  }, 1000);   // fires every 1000 milliseconds = 1 second
}

/** pauseTimer() — Pauses the countdown without resetting. */
function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

/** resetTimer() — Resets to the beginning of the current mode. */
function resetTimer() {
  clearInterval(timerInterval);
  timerRunning   = false;
  timerRemaining = timerDuration;
  updateTimerDisplay();
}

/**
 * updateTimerDisplay()
 * Converts remaining seconds to MM:SS and updates the screen.
 * Also updates the SVG ring progress.
 */
function updateTimerDisplay() {
  const mins = Math.floor(timerRemaining / 60);
  const secs = timerRemaining % 60;
  document.getElementById('timerDisplay').textContent =
    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Update ring: offset goes from 0 (full) to CIRCUMFERENCE (empty)
  const progress = timerRemaining / timerDuration;
  const offset   = RING_CIRCUMFERENCE * (1 - progress);
  document.getElementById('timerRing').style.strokeDashoffset = offset;

  document.getElementById('sessionCount').textContent = sessionCount;
}

/**
 * playBeep()
 * Creates a short beep using the Web Audio API.
 * No audio files needed — works in all modern browsers.
 */
function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type      = 'sine';
    osc.frequency.value = 880;     // A5 note
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Audio not available in this browser — silently skip
  }
}

/* ================================================================
   G. DAILY PLANNER
================================================================ */

// Planner slots: { id, time (24hr string "HH:MM"), activity }
let plannerSlots = loadData('plannerSlots', []);

/**
 * addSlot()
 * Adds a new time slot to the day planner.
 */
function addSlot() {
  const timeInput     = document.getElementById('slotTime');
  const activityInput = document.getElementById('slotActivity');
  const time          = timeInput.value;
  const activity      = activityInput.value.trim();

  if (!time || !activity) {
    alert('Please enter both a time and an activity.');
    return;
  }

  plannerSlots.push({ id: generateId(), time, activity });
  saveData('plannerSlots', plannerSlots);
  renderPlanner();

  timeInput.value     = '';
  activityInput.value = '';
}

/**
 * deleteSlot(id)
 * Removes a time slot.
 */
function deleteSlot(id) {
  plannerSlots = plannerSlots.filter(s => s.id !== id);
  saveData('plannerSlots', plannerSlots);
  renderPlanner();
}

/**
 * renderPlanner()
 * Redraws the planner list, sorted chronologically.
 */
function renderPlanner() {
  const list = document.getElementById('plannerList');

  if (plannerSlots.length === 0) {
    list.innerHTML = '<li class="empty-msg">No slots yet. Plan your day! 📆</li>';
    return;
  }

  // Sort by time string (HH:MM sorts correctly as a string)
  const sorted = [...plannerSlots].sort((a, b) => a.time.localeCompare(b.time));

  list.innerHTML = sorted.map(slot => {
    // Convert "14:30" → "2:30 PM"
    const [h, m]    = slot.time.split(':').map(Number);
    const timeLabel = formatTime(h, m);

    return `
      <li class="planner-item">
        <span class="planner-time">${timeLabel}</span>
        <span class="planner-activity">${escapeHtml(slot.activity)}</span>
        <button class="btn-icon" onclick="deleteSlot('${slot.id}')" title="Delete">🗑️</button>
      </li>
    `;
  }).join('');
}

/* ================================================================
   H. SMART ASSISTANT (rule-based chatbot)
   No AI API — responses are determined by simple keyword matching.
================================================================ */

/**
 * sendChat()
 * Reads the chat input, shows the user's message, then generates a bot reply.
 */
function sendChat() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;

  addChatBubble(text, 'user');   // show user message
  input.value = '';

  // Small delay so user sees the message before the bot replies
  setTimeout(() => {
    const reply = generateReply(text);
    addChatBubble(reply, 'bot');
  }, 300);
}

/**
 * sendSuggestion(text)
 * Called when a quick-prompt button is clicked — acts like the user typed it.
 */
function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

/**
 * addChatBubble(text, sender)
 * Creates a new chat bubble and scrolls the chat to the bottom.
 * sender is either 'user' or 'bot'.
 */
function addChatBubble(text, sender) {
  const messages = document.getElementById('chatMessages');
  const bubble   = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = text;   // we generate bot text ourselves, user text is escaped below
  if (sender === 'user') bubble.textContent = text;   // safe — no HTML injection
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;   // auto-scroll to bottom
}

/**
 * generateReply(input)
 * Matches the user's message against keywords and returns an appropriate response.
 * This is a simple rule-based system — no AI involved.
 */
function generateReply(input) {
  const msg   = input.toLowerCase();
  const today = todayString();

  /* --- "what should I do" / suggestions --- */
  if (msg.includes('what should') || msg.includes('suggest') || msg.includes('help me') || msg.includes('what to do')) {
    const urgent = tasks.filter(t => !t.completed && t.category === 'Urgent');
    const pending = tasks.filter(t => !t.completed);
    if (urgent.length > 0) {
      return `🔥 You have <b>${urgent.length} urgent task${urgent.length > 1 ? 's' : ''}</b> waiting:<br>` +
             urgent.slice(0, 3).map(t => `• ${escapeHtml(t.text)}`).join('<br>');
    }
    if (pending.length > 0) {
      return `📋 You have <b>${pending.length} pending task${pending.length > 1 ? 's' : ''}</b>. Here are the first few:<br>` +
             pending.slice(0, 3).map(t => `• ${escapeHtml(t.text)}`).join('<br>');
    }
    return '🎉 You\'re all caught up on tasks! Maybe review your homework or plan tomorrow.';
  }

  /* --- homework check --- */
  if (msg.includes('homework') || msg.includes('assignment') || msg.includes('due')) {
    const upcoming = homeworks.filter(h => h.due >= today);
    const overdue  = homeworks.filter(h => h.due < today);
    if (homeworks.length === 0) return '😊 No assignments logged. Either you\'re free or forgot to add them!';
    let reply = '';
    if (overdue.length > 0)  reply += `⚠️ <b>${overdue.length} overdue</b> assignment${overdue.length > 1 ? 's' : ''}!<br>`;
    if (upcoming.length > 0) reply += `📚 <b>${upcoming.length} upcoming</b> assignment${upcoming.length > 1 ? 's' : ''}.<br>`;
    reply += upcoming.slice(0, 3).map(h => `• ${escapeHtml(h.subject)}: ${escapeHtml(h.desc)} (${h.due})`).join('<br>');
    return reply || 'All assignments checked!';
  }

  /* --- start studying / timer --- */
  if (msg.includes('study') || msg.includes('focus') || msg.includes('timer') || msg.includes('pomodoro')) {
    return '⏱️ Great idea! Head to the <b>Pomodoro Timer</b> tab. Start a 25-minute focus session — your brain will thank you. Remember: one task at a time!';
  }

  /* --- progress check --- */
  if (msg.includes('progress') || msg.includes('how am i') || msg.includes('doing')) {
    const total     = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent   = total > 0 ? Math.round((completed / total) * 100) : 0;
    return `📊 You've completed <b>${completed} of ${total} tasks</b> (${percent}%).<br>` +
           (percent >= 80 ? '🌟 Amazing work!' : percent >= 50 ? '💪 Keep pushing!' : '🚀 You can do it!');
  }

  /* --- motivational / encouragement --- */
  if (msg.includes('motivat') || msg.includes('inspire') || msg.includes('tired') || msg.includes('stressed')) {
    const quotes = [
      '"The secret of getting ahead is getting started." — Mark Twain',
      '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
      '"You don\'t have to be great to start, but you have to start to be great."',
      '"Study hard, for the well is deep, and our brains are shallow."',
      '"Push yourself because no one else is going to do it for you." 💪'
    ];
    return '✨ ' + quotes[Math.floor(Math.random() * quotes.length)];
  }

  /* --- time / planner --- */
  if (msg.includes('schedule') || msg.includes('plan') || msg.includes('today')) {
    if (plannerSlots.length === 0) return '📅 Your daily planner is empty. Head to the <b>Daily Planner</b> tab to add some slots!';
    const sorted = [...plannerSlots].sort((a, b) => a.time.localeCompare(b.time));
    return '📅 Your schedule today:<br>' +
      sorted.slice(0, 5).map(s => {
        const [h, m] = s.time.split(':').map(Number);
        return `• ${formatTime(h, m)} — ${escapeHtml(s.activity)}`;
      }).join('<br>');
  }

  /* --- greetings --- */
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return '👋 Hey there! I\'m your study assistant. Ask me about your tasks, homework, or studying tips!';
  }

  /* --- thanks --- */
  if (msg.includes('thanks') || msg.includes('thank you') || msg.includes('ty')) {
    return '😊 Happy to help! Keep up the great work!';
  }

  /* --- break / relax --- */
  if (msg.includes('break') || msg.includes('relax') || msg.includes('rest')) {
    return '☕ You\'ve earned it! Take a 5-minute break — stretch, breathe, grab water. Then come back strong! Use the Pomodoro timer to track your break.';
  }

  /* --- default fallback --- */
  return `🤔 I'm not sure about that. Try asking:<br>
    • "What should I do?"<br>
    • "Do I have homework?"<br>
    • "Start studying"<br>
    • "How am I doing?"`;
}

/* ================================================================
   I. DASHBOARD OVERVIEW
   Calculates stats and updates all the numbers/progress bar.
================================================================ */

/**
 * updateDashboard()
 * Recalculates all dashboard stats and refreshes the UI.
 * Called whenever tasks or homework change, and when navigating to dashboard.
 */
function updateDashboard() {
  const today    = todayString();
  const total    = tasks.length;
  const done     = tasks.filter(t => t.completed).length;
  const percent  = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue  = homeworks.filter(h => h.due < today).length;
  const hwDue    = homeworks.filter(h => h.due >= today).length;

  // Update stat card numbers
  document.getElementById('statTaskCount').textContent    = total;
  document.getElementById('statHWCount').textContent      = hwDue;
  document.getElementById('statPercent').textContent      = percent + '%';
  document.getElementById('statOverdueCount').textContent = overdue;

  // Update progress bar width and label
  document.getElementById('progressBar').style.width = percent + '%';
  document.getElementById('progressLabel').textContent =
    `${done} of ${total} task${total !== 1 ? 's' : ''} completed`;

  // Update urgent tasks snapshot
  const urgentList = document.getElementById('urgentSnapshot');
  const urgent     = tasks.filter(t => !t.completed && t.category === 'Urgent');

  if (urgent.length === 0) {
    urgentList.innerHTML = '<li class="empty-msg">No urgent tasks — enjoy the calm! 😊</li>';
  } else {
    urgentList.innerHTML = urgent.slice(0, 5).map(t => `
      <li class="task-snippet">
        <span class="task-badge badge-Urgent">Urgent</span>
        <span>${escapeHtml(t.text)}</span>
      </li>
    `).join('');
  }
}

/* ================================================================
   J. APP STARTUP
   Everything in this function runs once when the page first loads.
================================================================ */

function init() {
  /* --- Time-based greeting --- */
  const hour = new Date().getHours();
  let greeting = 'morning';
  if (hour >= 12 && hour < 17) greeting = 'afternoon';
  else if (hour >= 17)          greeting = 'evening';
  document.getElementById('timeGreeting').textContent = greeting;

  /* --- Motivational message of the day --- */
  const motivations = [
    '🌟 Today is a new chance to be productive!',
    '💡 One task at a time — you\'ve got this.',
    '🚀 Small progress is still progress. Keep going!',
    '📖 Every expert was once a beginner.',
    '🎯 Focus on what matters most today.',
    '🌱 Your future self will thank you for studying today.',
    '⚡ Consistency beats intensity. Show up every day.',
    '🏆 The best time to start was yesterday. The next best time is now.',
    '🌈 Believe in yourself — you are capable of amazing things.',
    '🔑 Hard work + dedication = your success story.',
  ];
  // Pick a message based on the day of year so it changes daily
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  document.getElementById('motivationalMsg').textContent =
    motivations[dayOfYear % motivations.length];

  /* --- Load saved dark mode preference --- */
  const savedDark = loadData('darkMode', false);
  applyTheme(savedDark);

  /* --- Render all saved data --- */
  renderTasks();
  renderHomework();
  renderPlanner();
  updateDashboard();
  updateTimerDisplay();

  /* --- Show session count --- */
  document.getElementById('sessionCount').textContent = sessionCount;

  /* --- Welcome chat message --- */
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '';  // clear any leftover HTML
  addChatBubble(
    '👋 Hi! I\'m your study assistant.<br>Ask me about your tasks, homework, studying tips, or anything else. Try the quick buttons below!',
    'bot'
  );
}

// Run init() as soon as the page is ready
document.addEventListener('DOMContentLoaded', init);
