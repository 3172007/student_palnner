/**
 * ==============================================================================
 * Student Study Planner - Main JavaScript Logic (Hardened & Bulletproof)
 * 
 * Features:
 *  - Safe LocalStorage access with In-Memory fallback (prevents SecurityError on file:///)
 *  - Event Delegation for task actions (no inline handler breakage)
 *  - Dynamic DOM query caching inside initApp (no null element errors)
 *  - Overdue date calculations & Live search filtering
 *  - Summary cards & animated progress bar
 *  - Custom delete confirmation modal & Toast system
 * ==============================================================================
 */

// --- Constants & Storage Keys ---
const STORAGE_KEY = 'student_study_planner_tasks';
const THEME_STORAGE_KEY = 'study_planner_theme';

// In-memory fallback if localStorage is blocked by browser security
let inMemoryStorage = {};
const SafeStorage = {
  getItem: (key) => {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : (inMemoryStorage[key] || null);
    } catch (e) {
      console.warn('LocalStorage read blocked; using fallback storage:', e);
      return inMemoryStorage[key] || null;
    }
  },
  setItem: (key, val) => {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, val);
      } else {
        inMemoryStorage[key] = val;
      }
    } catch (e) {
      console.warn('LocalStorage write blocked; using fallback storage:', e);
      inMemoryStorage[key] = val;
    }
  }
};

// Subject Icon Lookup Map
const SUBJECT_ICONS = {
  'Data Structures': '🌲',
  'Java': '☕',
  'Python': '🐍',
  'DBMS': '🗄️',
  'Computer Networks': '🌐',
  'Operating Systems': '💻',
  'Web Development': '⚡',
  'Other': '📖'
};

// Priority Weights for Sorting
const PRIORITY_ORDER = {
  'High': 1,
  'Medium': 2,
  'Low': 3
};

// --- Application State ---
let tasks = [];
let activeStatusFilter = 'all';
let activeSubjectFilter = 'all';
let activeSortOption = 'dueSoon';
let searchQuery = '';
let taskToDeleteId = null;

// Cached DOM Elements Container
let elements = {};

/**
 * Safely caches DOM element references after DOM has loaded.
 */
function cacheDOMElements() {
  elements = {
    currentDateText: document.getElementById('currentDateText'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeLabel: document.getElementById('themeLabel'),

    totalTasksCount: document.getElementById('totalTasksCount'),
    completedTasksCount: document.getElementById('completedTasksCount'),
    pendingTasksCount: document.getElementById('pendingTasksCount'),
    progressPercentCount: document.getElementById('progressPercentCount'),

    progressRatioText: document.getElementById('progressRatioText'),
    progressBadge: document.getElementById('progressBadge'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressBarTrack: document.getElementById('progressBarTrack'),

    addTaskForm: document.getElementById('addTaskForm'),
    taskNameInput: document.getElementById('taskNameInput'),
    subjectSelect: document.getElementById('subjectSelect'),
    prioritySelect: document.getElementById('prioritySelect'),
    dueDateInput: document.getElementById('dueDateInput'),
    taskNameValidation: document.getElementById('taskNameValidation'),

    subjectChipsContainer: document.getElementById('subjectChipsContainer'),

    visibleTasksCount: document.getElementById('visibleTasksCount'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    filterPillAll: document.getElementById('filterPillAll'),
    filterPillPending: document.getElementById('filterPillPending'),
    filterPillCompleted: document.getElementById('filterPillCompleted'),
    filterSubject: document.getElementById('filterSubject'),
    sortBySelect: document.getElementById('sortBySelect'),
    tasksContainer: document.getElementById('tasksContainer'),
    emptyState: document.getElementById('emptyState'),
    emptyStateTitle: document.getElementById('emptyStateTitle'),
    emptyStateDesc: document.getElementById('emptyStateDesc'),

    deleteModalOverlay: document.getElementById('deleteModalOverlay'),
    deleteTaskTargetName: document.getElementById('deleteTaskTargetName'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    toastContainer: document.getElementById('toastContainer')
  };
}

// ==============================================================================
// 1. Initialization
// ==============================================================================

/**
 * Initializes the application.
 */
function initApp() {
  cacheDOMElements();
  displayCurrentDate();
  setupInitialTheme();
  setDefaultDueDate();
  loadTasks();
  setupEventListeners();
  updateUI();
}

/**
 * Formats and displays current date in header.
 */
function displayCurrentDate() {
  if (!elements.currentDateText) return;
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  elements.currentDateText.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Sets default due date input to today's date.
 */
function setDefaultDueDate() {
  if (!elements.dueDateInput) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  elements.dueDateInput.value = `${yyyy}-${mm}-${dd}`;
}

// ==============================================================================
// 2. Storage Operations
// ==============================================================================

/**
 * Loads tasks from storage. Seeds starter tasks on first launch.
 */
function loadTasks() {
  const savedTasks = SafeStorage.getItem(STORAGE_KEY);
  if (savedTasks) {
    try {
      const parsed = JSON.parse(savedTasks);
      tasks = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse tasks from storage:', e);
      tasks = [];
    }
  } else {
    // Seed sample tasks for initial load
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 5);

    const formatDateStr = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    tasks = [
      {
        id: 'task_1',
        name: 'Learn JavaScript DOM & Events',
        subject: 'Web Development',
        priority: 'High',
        dueDate: formatDateStr(today),
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_2',
        name: 'Implement Binary Search Tree Algorithms',
        subject: 'Data Structures',
        priority: 'Medium',
        dueDate: formatDateStr(tomorrow),
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_3',
        name: 'Design ER Diagram for Database Project',
        subject: 'DBMS',
        priority: 'Low',
        dueDate: formatDateStr(nextWeek),
        completed: true,
        createdAt: new Date().toISOString()
      }
    ];
    saveTasks();
  }
}

/**
 * Saves current tasks array into storage.
 */
function saveTasks() {
  SafeStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==============================================================================
// 3. Task Operations (Add, Complete, Delete)
// ==============================================================================

/**
 * Handles adding a study task.
 */
function addTask(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  if (!elements.taskNameInput) return;

  const taskName = elements.taskNameInput.value.trim();
  const subject = elements.subjectSelect ? elements.subjectSelect.value : 'Web Development';
  const priority = elements.prioritySelect ? elements.prioritySelect.value : 'Medium';
  let dueDate = elements.dueDateInput ? elements.dueDateInput.value : '';

  // Validation
  if (!taskName) {
    elements.taskNameInput.classList.add('input-error');
    if (elements.taskNameValidation) {
      elements.taskNameValidation.textContent = '⚠️ Please enter a task name to proceed.';
    }
    elements.taskNameInput.focus();
    return;
  }

  // Clear validation state
  elements.taskNameInput.classList.remove('input-error');
  if (elements.taskNameValidation) {
    elements.taskNameValidation.textContent = '';
  }

  // Fallback to today if no date picked
  if (!dueDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dueDate = `${yyyy}-${mm}-${dd}`;
  }

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: taskName,
    subject: subject,
    priority: priority,
    dueDate: dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();

  // Reset form
  elements.taskNameInput.value = '';
  setDefaultDueDate();
  elements.taskNameInput.focus();

  updateUI();
  showToast(`Added: "${taskName}"`, 'success');
}

/**
 * Toggles completion status of a task.
 */
function completeTask(taskId) {
  const taskIndex = tasks.findIndex(t => String(t.id) === String(taskId));
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveTasks();
    updateUI();

    const isDone = tasks[taskIndex].completed;
    showToast(isDone ? `Completed: "${tasks[taskIndex].name}" 🎉` : `Reopened: "${tasks[taskIndex].name}"`, isDone ? 'success' : 'info');
  }
}

/**
 * Opens delete confirmation modal.
 */
function promptDeleteTask(taskId) {
  const task = tasks.find(t => String(t.id) === String(taskId));
  if (!task || !elements.deleteModalOverlay) return;

  taskToDeleteId = taskId;
  if (elements.deleteTaskTargetName) {
    elements.deleteTaskTargetName.textContent = `"${task.name}"`;
  }
  elements.deleteModalOverlay.classList.add('active');
  elements.deleteModalOverlay.setAttribute('aria-hidden', 'false');
}

/**
 * Helper function matching specification requirement.
 */
function deleteTask(taskId) {
  promptDeleteTask(taskId);
}

/**
 * Closes delete confirmation modal.
 */
function closeDeleteModal() {
  taskToDeleteId = null;
  if (elements.deleteModalOverlay) {
    elements.deleteModalOverlay.classList.remove('active');
    elements.deleteModalOverlay.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Confirms deletion of selected task.
 */
function confirmDeleteTask() {
  if (!taskToDeleteId) return;

  const taskIndex = tasks.findIndex(t => String(t.id) === String(taskToDeleteId));
  if (taskIndex !== -1) {
    const deletedName = tasks[taskIndex].name;
    tasks.splice(taskIndex, 1);
    saveTasks();
    updateUI();
    showToast(`Deleted: "${deletedName}"`, 'danger');
  }

  closeDeleteModal();
}

/**
 * Filter tasks helper function.
 */
function filterTasks() {
  displayTasks();
}

// ==============================================================================
// 4. Rendering & DOM Updates
// ==============================================================================

/**
 * Master UI update function.
 */
function updateUI() {
  updateStatistics();
  updateProgress();
  updateSubjectBreakdown();
  displayTasks();
}

/**
 * Updates 4 dashboard summary cards.
 */
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (elements.totalTasksCount) elements.totalTasksCount.textContent = total;
  if (elements.completedTasksCount) elements.completedTasksCount.textContent = completed;
  if (elements.pendingTasksCount) elements.pendingTasksCount.textContent = pending;
  if (elements.progressPercentCount) elements.progressPercentCount.textContent = `${progressPercent}%`;

  if (elements.filterPillAll) elements.filterPillAll.textContent = total;
  if (elements.filterPillPending) elements.filterPillPending.textContent = pending;
  if (elements.filterPillCompleted) elements.filterPillCompleted.textContent = completed;
}

/**
 * Updates visual progress bar.
 */
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (elements.progressRatioText) {
    elements.progressRatioText.textContent = `${completed} of ${total} tasks completed`;
  }
  if (elements.progressBadge) {
    elements.progressBadge.textContent = `${percent}% Done`;
  }
  if (elements.progressBarFill) {
    elements.progressBarFill.style.width = `${percent}%`;
  }
  if (elements.progressBarTrack) {
    elements.progressBarTrack.setAttribute('aria-valuenow', percent);
  }
}

/**
 * Displays task list according to active filters.
 */
function displayTasks() {
  if (!elements.tasksContainer) return;

  const filteredTasks = getFilteredAndSortedTasks();
  elements.tasksContainer.innerHTML = '';

  if (elements.visibleTasksCount) {
    elements.visibleTasksCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;
  }

  // Handle empty state
  if (filteredTasks.length === 0) {
    if (elements.emptyState) elements.emptyState.style.display = 'flex';
    if (tasks.length === 0) {
      if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = 'No study tasks yet';
      if (elements.emptyStateDesc) elements.emptyStateDesc.textContent = 'Add your first task and start planning your study!';
    } else {
      if (elements.emptyStateTitle) elements.emptyStateTitle.textContent = 'No matching tasks found';
      if (elements.emptyStateDesc) elements.emptyStateDesc.textContent = 'Try adjusting your filters, search term, or subject selection.';
    }
    return;
  }

  if (elements.emptyState) elements.emptyState.style.display = 'none';

  filteredTasks.forEach(task => {
    const card = createTaskCardElement(task);
    elements.tasksContainer.appendChild(card);
  });
}

/**
 * Creates DOM card element for a task with data-id attributes for event delegation.
 */
function createTaskCardElement(task) {
  const card = document.createElement('article');
  card.className = `task-card ${task.completed ? 'is-completed' : ''}`;
  card.id = `card-${task.id}`;
  card.setAttribute('data-task-id', task.id);

  const subjectIcon = SUBJECT_ICONS[task.subject] || '📖';
  const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
  const dueDateInfo = formatDueDateBadge(task.dueDate, task.completed);

  card.innerHTML = `
    <div class="task-card-main">
      <div class="task-checkbox-wrapper">
        <button 
          type="button" 
          class="task-checkbox-btn" 
          data-action="toggle-complete" 
          data-id="${task.id}"
          aria-label="${task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}"
          title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"
        >
          ${task.completed ? '✓' : ''}
        </button>
      </div>

      <div class="task-details">
        <h4 class="task-title">${escapeHTML(task.name)}</h4>
        <div class="task-meta">
          <span class="badge subject-badge">
            <span>${subjectIcon}</span> ${escapeHTML(task.subject)}
          </span>
          <span class="badge priority-badge ${priorityClass}">
            <span>${task.priority === 'High' ? '🔥' : task.priority === 'Medium' ? '⚡' : '🌱'}</span> ${task.priority}
          </span>
          <span class="badge due-badge ${dueDateInfo.className}">
            <span>${dueDateInfo.icon}</span> ${dueDateInfo.text}
          </span>
          ${task.completed ? '<span class="status-indicator-badge">✓ Done</span>' : ''}
        </div>
      </div>
    </div>

    <div class="task-actions">
      <button 
        type="button" 
        class="action-btn action-btn-complete" 
        data-action="toggle-complete" 
        data-id="${task.id}"
        title="${task.completed ? 'Mark as Pending' : 'Mark as Complete'}"
      >
        <span>${task.completed ? '↩' : '✓'}</span>
        <span>${task.completed ? 'Reopen' : 'Complete'}</span>
      </button>
      <button 
        type="button" 
        class="action-btn action-btn-delete" 
        data-action="prompt-delete" 
        data-id="${task.id}"
        title="Delete task"
        aria-label="Delete ${escapeHTML(task.name)}"
      >
        <span>🗑️</span>
        <span>Delete</span>
      </button>
    </div>
  `;

  return card;
}

/**
 * Analyzes due date and formats badge status.
 */
function formatDueDateBadge(dateString, isCompleted) {
  if (!dateString) {
    return { text: 'No Due Date', className: '', icon: '📅' };
  }

  const parts = String(dateString).split('-');
  if (parts.length < 3) {
    return { text: `Due: ${dateString}`, className: '', icon: '📅' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { text: `Due: ${dateString}`, className: '', icon: '📅' };
  }

  const taskDueDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = taskDueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${day} ${monthNames[month - 1] || ''} ${year}`;

  if (!isCompleted && diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: `Overdue: ${formattedDate} (${daysAgo}d ago)`,
      className: 'is-overdue',
      icon: '⚠️'
    };
  }

  if (!isCompleted && diffDays === 0) {
    return {
      text: `Due Today: ${formattedDate}`,
      className: 'is-today',
      icon: '⏰'
    };
  }

  return {
    text: `Due: ${formattedDate}`,
    className: '',
    icon: '📅'
  };
}

/**
 * Updates subject chips in sidebar.
 */
function updateSubjectBreakdown() {
  if (!elements.subjectChipsContainer) return;

  const counts = {};
  tasks.forEach(t => {
    if (!t.completed) {
      counts[t.subject] = (counts[t.subject] || 0) + 1;
    }
  });

  elements.subjectChipsContainer.innerHTML = '';
  const subjects = Object.keys(counts);

  if (subjects.length === 0) {
    elements.subjectChipsContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">No pending subjects</span>';
    return;
  }

  subjects.forEach(subject => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `subject-chip ${activeSubjectFilter === subject ? 'active' : ''}`;
    const icon = SUBJECT_ICONS[subject] || '📖';
    chip.innerHTML = `<span>${icon}</span> ${escapeHTML(subject)} <span class="chip-count">${counts[subject]}</span>`;
    chip.onclick = () => {
      if (activeSubjectFilter === subject) {
        activeSubjectFilter = 'all';
        if (elements.filterSubject) elements.filterSubject.value = 'all';
      } else {
        activeSubjectFilter = subject;
        if (elements.filterSubject) elements.filterSubject.value = subject;
      }
      updateUI();
    };
    elements.subjectChipsContainer.appendChild(chip);
  });
}

// ==============================================================================
// 5. Filtering, Searching & Sorting
// ==============================================================================

function getFilteredAndSortedTasks() {
  let result = tasks.filter(task => {
    if (activeStatusFilter === 'pending' && task.completed) return false;
    if (activeStatusFilter === 'completed' && !task.completed) return false;
    if (activeSubjectFilter !== 'all' && task.subject !== activeSubjectFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = String(task.name || '').toLowerCase().includes(q);
      const matchSubject = String(task.subject || '').toLowerCase().includes(q);
      if (!matchName && !matchSubject) return false;
    }

    return true;
  });

  result.sort((a, b) => {
    if (activeSortOption === 'dueSoon') {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
    }
    if (activeSortOption === 'priority') {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99);
    }
    if (activeSortOption === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return 0;
  });

  return result;
}

// ==============================================================================
// 6. Theme Switching
// ==============================================================================

function setupInitialTheme() {
  const savedTheme = SafeStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') {
    applyTheme('dark');
  } else if (savedTheme === 'light') {
    applyTheme('light');
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    if (elements.themeLabel) elements.themeLabel.textContent = 'Light';
    SafeStorage.setItem(THEME_STORAGE_KEY, 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    if (elements.themeLabel) elements.themeLabel.textContent = 'Dark';
    SafeStorage.setItem(THEME_STORAGE_KEY, 'light');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme');
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

// ==============================================================================
// 7. Toast Notifications & Helpers
// ==============================================================================

function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✨';
  if (type === 'danger') icon = '🗑️';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==============================================================================
// 8. Event Delegation & Listeners Registration
// ==============================================================================

function setupEventListeners() {
  // Form submission
  if (elements.addTaskForm) {
    elements.addTaskForm.addEventListener('submit', addTask);
  }

  // Live input validation clear
  if (elements.taskNameInput) {
    elements.taskNameInput.addEventListener('input', () => {
      if (elements.taskNameInput.value.trim().length > 0) {
        elements.taskNameInput.classList.remove('input-error');
        if (elements.taskNameValidation) elements.taskNameValidation.textContent = '';
      }
    });
  }

  // Event Delegation for Task Container Clicks (Checkmark, Complete, Delete)
  if (elements.tasksContainer) {
    elements.tasksContainer.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const taskId = target.getAttribute('data-id');

      if (action === 'toggle-complete') {
        completeTask(taskId);
      } else if (action === 'prompt-delete') {
        promptDeleteTask(taskId);
      }
    });
  }

  // Status Filter Buttons
  if (elements.filterButtons) {
    elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeStatusFilter = btn.getAttribute('data-status');
        displayTasks();
      });
    });
  }

  // Subject Dropdown
  if (elements.filterSubject) {
    elements.filterSubject.addEventListener('change', (e) => {
      activeSubjectFilter = e.target.value;
      updateUI();
    });
  }

  // Sort Dropdown
  if (elements.sortBySelect) {
    elements.sortBySelect.addEventListener('change', (e) => {
      activeSortOption = e.target.value;
      displayTasks();
    });
  }

  // Search input
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (elements.clearSearchBtn) {
        elements.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      }
      displayTasks();
    });
  }

  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', () => {
      if (elements.searchInput) {
        elements.searchInput.value = '';
        elements.searchInput.focus();
      }
      searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      displayTasks();
    });
  }

  // Theme Toggle Button
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Delete Modal Events
  if (elements.cancelDeleteBtn) {
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  if (elements.confirmDeleteBtn) {
    elements.confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
  }

  if (elements.deleteModalOverlay) {
    elements.deleteModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.deleteModalOverlay) {
        closeDeleteModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.deleteModalOverlay && elements.deleteModalOverlay.classList.contains('active')) {
      closeDeleteModal();
    }
  });
}

// Auto-boot on DOM content loaded or immediate if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Expose functions globally for direct console inspection or inline fallback
window.addTask = addTask;
window.completeTask = completeTask;
window.deleteTask = deleteTask;
window.promptDeleteTask = promptDeleteTask;
window.confirmDeleteTask = confirmDeleteTask;
window.closeDeleteModal = closeDeleteModal;
window.filterTasks = filterTasks;
window.updateStatistics = updateStatistics;
window.updateProgress = updateProgress;
window.displayTasks = displayTasks;
window.toggleTheme = toggleTheme;
