/* ============================
   MON CARNET — app.js
   ============================ */

const STORAGE_KEY = 'monCarnet_notes';
const COLOR_COUNT = 5;

// Estado
let notes = loadNotes();
let pendingDeleteId = null;

// DOM
const noteTitle       = document.getElementById('noteTitle');
const noteContent     = document.getElementById('noteContent');
const saveBtnDesktop  = document.getElementById('saveBtnDesktop');
const saveBtnMobile   = document.getElementById('saveBtnMobile');
const charCount       = document.getElementById('charCount');
const notesGrid       = document.getElementById('notesGrid');
const emptyState      = document.getElementById('emptyState');
const toast           = document.getElementById('toast');
const deleteModal     = document.getElementById('deleteModal');
const cancelDelete    = document.getElementById('cancelDelete');
const confirmDelete   = document.getElementById('confirmDelete');

// Init
renderAll();

// ——— Eventos ———

noteContent.addEventListener('input', () => {
  const len = noteContent.value.length;
  charCount.textContent = `${len} / 1000`;
  charCount.style.color = len > 900 ? '#e91e8c' : '';
});

saveBtnDesktop.addEventListener('click', saveNote);
saveBtnMobile.addEventListener('click', saveNote);

noteTitle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') noteContent.focus();
});

noteContent.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote();
});

cancelDelete.addEventListener('click', closeModal);

confirmDelete.addEventListener('click', () => {
  if (pendingDeleteId !== null) {
    deleteNote(pendingDeleteId);
    pendingDeleteId = null;
  }
  closeModal();
});

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && deleteModal.classList.contains('open')) closeModal();
});

// ——— Funciones principales ———

function saveNote() {
  const title   = noteTitle.value.trim();
  const content = noteContent.value.trim();

  if (!content && !title) {
    showToast('✍️ Escribe algo primero, cariño~');
    noteContent.focus();
    return;
  }

  const note = {
    id:      Date.now(),
    title:   title || '',
    content: content || '',
    date:    formatDate(new Date()),
    color:   notes.length % COLOR_COUNT,
  };

  notes.unshift(note);
  saveNotes();
  renderAll();

  noteTitle.value       = '';
  noteContent.value     = '';
  charCount.textContent = '0 / 1000';
  charCount.style.color = '';

  showToast('🌸 ¡Nota guardada con amor!');
  noteTitle.focus();
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderAll();
  showToast('🌺 Nota eliminada');
}

function renderAll() {
  notesGrid.innerHTML = '';

  if (notes.length === 0) {
    emptyState.classList.add('visible');
    return;
  }

  emptyState.classList.remove('visible');

  notes.forEach((note, index) => {
    notesGrid.appendChild(createCard(note, index));
  });
}

function createCard(note, index) {
  const card = document.createElement('article');
  card.className = `note-card color-${note.color}`;
  card.style.animationDelay = `${index * 0.05}s`;
  card.setAttribute('aria-label', `Nota: ${note.title || 'Sin título'}`);

  const hasTitle = note.title.length > 0;

  card.innerHTML = `
    <div class="card-header">
      <h3 class="card-title ${hasTitle ? '' : 'no-title'}">
        ${hasTitle ? escapeHtml(note.title) : 'Sin título'}
      </h3>
      <button class="delete-btn" aria-label="Eliminar nota" data-id="${note.id}" title="Eliminar">✕</button>
    </div>
    <p class="card-content">${escapeHtml(note.content)}</p>
    <span class="card-date">${note.date}</span>
  `;

  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    pendingDeleteId = note.id;
    openModal();
  });

  return card;
}

// ——— Modal ———

function openModal() {
  deleteModal.classList.add('open');
  cancelDelete.focus();
}

function closeModal() {
  deleteModal.classList.remove('open');
  pendingDeleteId = null;
}

// ——— Toast ———

let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ——— LocalStorage (persistencia permanente) ———

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validar estructura de cada nota
    return parsed.filter(n =>
      n &&
      typeof n.id === 'number' &&
      typeof n.content === 'string'
    );
  } catch {
    // Si hay corrupción, intentar recuperar del backup
    try {
      const backup = localStorage.getItem(STORAGE_KEY + '_backup');
      if (!backup) return [];
      const parsed = JSON.parse(backup);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

function saveNotes() {
  try {
    // Guardar backup antes de sobrescribir
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(STORAGE_KEY + '_backup', current);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('⚠️ Almacenamiento lleno. Eliminá alguna nota.');
    } else {
      showToast('⚠️ No se pudo guardar');
    }
  }
}

// ——— Utils ———

function formatDate(date) {
  return date.toLocaleDateString('es-AR', {
    day:    'numeric',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
    .replace(/\n/g, '<br>');
}