/**
 * BenLang IDE Editor
 * Monaco Editor integration
 */

// App state
let monacoEditor = null;
let currentFile = 'hauptspiel.ben';
let fileModels = {};  // Monaco models for each file
let hasUnsavedChanges = false;

// DOM Elements
let editorContainer, consoleOutput, fileList, projectName, gameTitle;

// Default BenLang code
function getDefaultCode() {
  return `// Willkommen bei BenLang!
// Drücke "Starten" um dein Spiel zu spielen

SPIEL "Mein erstes Spiel"

VAR punkte = 0

WENN_START {
  ZEIGE_TEXT("Drücke die Pfeiltasten!", 250, 300)
}

WENN_IMMER {
  // Hier passiert etwas jeden Frame
  ZEICHNE_RECHTECK(10, 10, 100, 30, "#6bb88a")
  ZEIGE_TEXT("Punkte: " + punkte, 20, 30)
}

WENN_TASTE("leertaste") {
  punkte = punkte + 1
}
`;
}

// Console logging
function logToConsole(message, type = 'log') {
  if (!consoleOutput) return;
  const div = document.createElement('div');
  div.className = type;
  div.textContent = message;
  consoleOutput.appendChild(div);
  consoleOutput.scrollTop = consoleOutput.scrollTop;
}

function clearConsole() {
  if (consoleOutput) {
    consoleOutput.innerHTML = '';
  }
}

// Override console for game output
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function (...args) {
  originalLog.apply(console, args);
  logToConsole(args.join(' '), 'log');
};

console.error = function (...args) {
  originalError.apply(console, args);
  logToConsole(args.join(' '), 'error');
};

console.warn = function (...args) {
  originalWarn.apply(console, args);
  logToConsole(args.join(' '), 'warning');
};

// File management
async function loadFiles() {
  try {
    const response = await fetch('/api/dateien');
    const data = await response.json();

    if (data.projekt) {
      if (projectName) projectName.textContent = data.projekt;
    } else {
      if (projectName) projectName.textContent = 'Kein Projekt geladen';
      // Automatically show project modal if no project is loaded
      document.getElementById('projectModal')?.classList.add('show');
      loadProjectList();
    }

    fileModels = {};
    if (data.dateien && Array.isArray(data.dateien)) {
      data.dateien.forEach(f => {
        fileModels[f.name] = f.inhalt || '';
      });
    }

    // Sort files: hauptspiel.ben first
    const files = Object.keys(fileModels).filter(f => f.endsWith('.ben')).sort((a, b) => {
      if (a === 'hauptspiel.ben') return -1;
      if (b === 'hauptspiel.ben') return 1;
      return a.localeCompare(b);
    });

    if (files.length > 0) {
      currentFile = files[0];
      const content = fileModels[currentFile] || getDefaultCode();
      setEditorContent(content);
    } else {
      currentFile = 'hauptspiel.ben';
      if (data.projekt) {
        // Only set default code if we actually have a project
        fileModels[currentFile] = getDefaultCode();
        setEditorContent(getDefaultCode());
      } else {
        // Clear editor if no project
        setEditorContent('// Bitte wähle ein Projekt aus oder erstelle ein neues.');
      }
    }

    renderFileList();

    hasUnsavedChanges = false;
    updateFileTab();
    return true;
  } catch (err) {
    console.error('Fehler beim Laden der Dateien:', err);
    currentFile = 'hauptspiel.ben';
    setEditorContent(getDefaultCode());
    return false;
  }
}

function renderFileList() {
  if (!fileList) return;

  fileList.innerHTML = '';

  Object.keys(fileModels).filter(f => f.endsWith('.ben')).forEach(filename => {
    const tab = document.createElement('div');
    tab.className = 'file-tab' + (filename === currentFile ? ' active' : '');
    tab.innerHTML = `<span class="name">${filename}</span>`;
    tab.addEventListener('click', () => openFile(filename));
    fileList.appendChild(tab);
  });
}

function openFile(filename) {
  if (!monacoEditor || !fileModels[filename]) return;

  // Save current file
  if (currentFile) {
    fileModels[currentFile] = monacoEditor.getValue();
  }

  currentFile = filename;
  setEditorContent(fileModels[filename] || '');

  hasUnsavedChanges = false;
  renderFileList();
}

async function saveCurrentFile() {
  if (!currentFile || !monacoEditor) return;

  fileModels[currentFile] = monacoEditor.getValue();

  try {
    await fetch('/api/datei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentFile,
        inhalt: fileModels[currentFile]
      })
    });

    hasUnsavedChanges = false;
    updateFileTab();
    logToConsole('Datei gespeichert: ' + currentFile, 'success');
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
  }
}

function updateFileTab() {
  if (!fileList) return;

  const tabs = fileList.querySelectorAll('.file-tab');
  tabs.forEach(tab => {
    const nameSpan = tab.querySelector('.name');
    if (nameSpan) {
      const baseName = nameSpan.textContent.replace('*', '');
      if (baseName === currentFile) {
        nameSpan.textContent = currentFile + (hasUnsavedChanges ? '*' : '');
      }
    }
  });
}

// Editor content management
function setEditorContent(content) {
  if (!monacoEditor) return;

  monacoEditor.setValue(content);
  hasUnsavedChanges = false;
  updateFileTab();
}

function getEditorContent() {
  return monacoEditor ? monacoEditor.getValue() : '';
}

// Compile and run
let isCompiling = false;
async function compileAndRun() {
  if (isCompiling) return;
  isCompiling = true;

  try {
    clearConsole();
    logToConsole('Kompiliere...', 'log');

    // Save current content
    if (monacoEditor && currentFile) {
      fileModels[currentFile] = monacoEditor.getValue();
    }

    // Collect all code
    let allCode = '';
    const benFiles = Object.keys(fileModels).filter(f => f.endsWith('.ben'));
    benFiles.sort((a, b) => {
      if (a === 'hauptspiel.ben') return -1;
      if (b === 'hauptspiel.ben') return 1;
      return a.localeCompare(b);
    });
    benFiles.forEach(filename => {
      allCode += fileModels[filename] + '\n';
    });

    const response = await fetch('/api/kompilieren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: allCode })
    });

    const result = await response.json();

    if (result.fehler && result.fehler.length > 0) {
      result.fehler.forEach(err => {
        logToConsole(err, 'error');
      });
      // Ensure editor is NOT locked if compilation fails
      if (monacoEditor) monacoEditor.updateOptions({ readOnly: false });
      return;
    }

    logToConsole('Spiel wird gestartet...', 'success');

    if (typeof _benlang !== 'undefined') {
      // Lock editor during game
      if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: true });
      }

      _benlang.zuruecksetzen();
      _benlang.init('gameCanvas');

      try {
        eval(result.js);
        _benlang.starten();

        if (_benlang.spielName && gameTitle) {
          gameTitle.textContent = _benlang.spielName;
        }
      } catch (evalErr) {
        logToConsole('Laufzeitfehler beim Spielstart: ' + evalErr.message, 'error');
        // Unlock on start failure
        if (monacoEditor) monacoEditor.updateOptions({ readOnly: false });
      }
    } else {
      logToConsole('Fehler: Game Engine nicht geladen', 'error');
      if (monacoEditor) monacoEditor.updateOptions({ readOnly: false });
    }

  } catch (err) {
    logToConsole('Kompilierungsfehler: ' + err.message, 'error');
    console.error(err);
    if (monacoEditor) monacoEditor.updateOptions({ readOnly: false });
  } finally {
    isCompiling = false;
  }
}

function stopGame() {
  if (typeof _benlang !== 'undefined') {
    _benlang.stoppen();
  }

  // Unlock editor
  if (monacoEditor) {
    monacoEditor.updateOptions({ readOnly: false });
    monacoEditor.focus();
  }

  logToConsole('Spiel gestoppt', 'log');
}

// New file
async function createNewFile() {
  const name = prompt('Dateiname (ohne .ben):');
  if (!name) return;

  const filename = name.endsWith('.ben') ? name : name + '.ben';
  fileModels[filename] = '// ' + filename + '\n';

  try {
    await fetch('/api/datei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: filename,
        inhalt: fileModels[filename]
      })
    });
  } catch (err) {
    console.warn('Konnte Datei nicht auf Server speichern');
  }

  renderFileList();
  openFile(filename);
}

// Upload image
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('bild', file);

  try {
    const response = await fetch('/api/bild', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (data.pfad) {
      logToConsole('Bild hochgeladen: ' + data.pfad, 'success');
      return data.pfad;
    }
  } catch (err) {
    console.error('Fehler beim Hochladen:', err);
  }
  return null;
}

// Initialize Monaco Editor
function createEditor(container, initialContent) {
  // Wait for Monaco to be ready
  if (typeof monaco === 'undefined') {
    // Monaco not loaded yet, wait
    setTimeout(() => createEditor(container, initialContent), 100);
    return;
  }

  monacoEditor = monaco.editor.create(container, {
    value: initialContent || getDefaultCode(),
    language: 'benlang',
    theme: 'benlang-dark',
    fontSize: 15,
    fontFamily: 'Fira Code, Consolas, monospace',
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    folding: true,
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on'
  });

  // Update symbol table and unsaved changes on content change
  monacoEditor.onDidChangeModelContent(() => {
    const content = monacoEditor.getValue();

    // Update symbol table for autocomplete
    if (typeof updateSymbolTable === 'function') {
      updateSymbolTable(content);
    }

    hasUnsavedChanges = true;
    updateFileTab();
  });

  // Handle keyboard shortcuts
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveCurrentFile();
  });


  return {
    getValue: () => monacoEditor.getValue(),
    setValue: (content) => monacoEditor.setValue(content),
    focus: () => monacoEditor.focus(),
    getModel: () => monacoEditor.getModel()
  };
}

// Color picker state
let colorPickerState = null;

function showColorPicker(color, startIndex, lineNumber) {
  colorPickerState = { color, startIndex, lineNumber };
  const modal = document.getElementById('colorPickerModal');
  const input = document.getElementById('colorPickerInput');
  const hexDisplay = document.getElementById('colorPickerHex');

  input.value = expandHex(color);
  hexDisplay.textContent = color;
  modal.classList.add('show');
}

function hideColorPicker() {
  const modal = document.getElementById('colorPickerModal');
  modal.classList.remove('show');
  colorPickerState = null;
}

function expandHex(hex) {
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function applyColorChange(newColor) {
  if (!colorPickerState || !monacoEditor) return;

  const model = monacoEditor.getModel();
  const fullLine = model.getLineContent(colorPickerState.lineNumber);
  const colorMatch = fullLine.match(/"(#[0-9A-Fa-f]{3,8})"/);

  if (colorMatch) {
    const startColumn = colorPickerState.startIndex + 2; // +1 for 1-based column, +1 for reaching the '#' inside quotes
    const endColumn = startColumn + colorMatch[1].length;

    model.pushEditOperations(
      [],
      [{ range: new monaco.Range(colorPickerState.lineNumber, startColumn, colorPickerState.lineNumber, endColumn), text: newColor }],
      () => null
    );
  }

  colorPickerState.color = newColor;
  document.getElementById('colorPickerHex').textContent = newColor;

}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  editorContainer = document.getElementById('editorContainer');
  consoleOutput = document.getElementById('consoleOutput');
  fileList = document.getElementById('fileList');
  projectName = document.getElementById('projectName');
  gameTitle = document.getElementById('gameTitle');

  // Wait for Monaco to be ready, then create editor
  function waitForMonaco() {
    if (typeof monaco !== 'undefined') {
      window.onMonacoReady(() => {
        createEditor(document.getElementById('monaco-editor'), getDefaultCode());
        loadFiles();
      });
    } else if (typeof window.loadMonaco === 'function') {
      window.loadMonaco();
      setTimeout(waitForMonaco, 100);
    } else {
      setTimeout(waitForMonaco, 100);
    }
  }

  waitForMonaco();

  // Button event listeners
  document.getElementById('btnRun')?.addEventListener('click', compileAndRun);
  document.getElementById('btnStop')?.addEventListener('click', stopGame);
  document.getElementById('btnSave')?.addEventListener('click', saveCurrentFile);
  document.getElementById('btnHelp')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.add('show');
  });
  document.getElementById('closeHelp')?.addEventListener('click', () => {
    document.getElementById('helpModal')?.classList.remove('show');
  });
  document.getElementById('btnNewFile')?.addEventListener('click', createNewFile);
  document.getElementById('closeUpload')?.addEventListener('click', () => {
    document.getElementById('uploadModal')?.classList.remove('show');
  });
  document.getElementById('btnUploadImage')?.addEventListener('click', () => {
    document.getElementById('uploadModal')?.classList.add('show');
  });

  // Color picker event listeners
  document.getElementById('closeColorPicker')?.addEventListener('click', () => {
    hideColorPicker();
  });
  document.getElementById('colorPickerInput')?.addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('colorPickerHex').textContent = color;
    applyColorChange(color);
  });
  document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
      const color = e.target.dataset.color;
      if (color) {
        document.getElementById('colorPickerInput').value = expandHex(color);
        document.getElementById('colorPickerHex').textContent = color;
        applyColorChange(color);
      }
    });
  });

  // Close color picker on outside click
  document.getElementById('colorPickerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'colorPickerModal') {
      hideColorPicker();
    }
  });
  document.getElementById('imageInput')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = await uploadImage(file);
      if (path) {
        logToConsole('Verwende: LADE_BILD("' + path + '")', 'log');
        document.getElementById('uploadModal')?.classList.remove('show');
      }
    }
  });

  // Project menu event listeners
  document.getElementById('btnProjectMenu')?.addEventListener('click', () => {
    loadProjectList();
    document.getElementById('projectModal')?.classList.add('show');
  });

  document.getElementById('closeProjectModal')?.addEventListener('click', () => {
    document.getElementById('projectModal')?.classList.remove('show');
  });

  document.getElementById('btnShowNewProject')?.addEventListener('click', () => {
    document.getElementById('projectModal')?.classList.remove('show');
    document.getElementById('newProjectModal')?.classList.add('show');
  });

  document.getElementById('closeNewProjectModal')?.addEventListener('click', () => {
    document.getElementById('newProjectModal')?.classList.remove('show');
  });

  document.getElementById('btnCreateProject')?.addEventListener('click', createProject);

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
  });

  // Handle page unload with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});

// Project management
async function loadProjectList() {
  try {
    const response = await fetch('/api/projekte/liste');
    const projects = await response.json();
    const list = document.getElementById('projectList');
    if (!list) return;

    list.innerHTML = '';
    projects.forEach(p => {
      const item = document.createElement('div');
      item.className = 'project-item';
      item.innerHTML = `
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="name">${p}</div>
      `;
      item.onclick = () => openProject(p);
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Fehler beim Laden der Projektliste:', err);
  }
}

async function openProject(name) {
  try {
    const response = await fetch('/api/projekte/oeffnen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const result = await response.json();
    if (result.erfolg) {
      document.getElementById('projectModal').classList.remove('show');
      await loadFiles();
      logToConsole('Projekt geladen: ' + name, 'success');
    }
  } catch (err) {
    console.error('Fehler beim Öffnen des Projekts:', err);
  }
}

async function createProject() {
  const nameInput = document.getElementById('newProjectName');
  const name = nameInput.value.trim();
  if (!name) return;

  try {
    const response = await fetch('/api/projekte/neu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const result = await response.json();
    if (result.erfolg) {
      document.getElementById('newProjectModal').classList.remove('show');
      nameInput.value = '';
      await loadFiles();
      logToConsole('Neues Projekt erstellt: ' + name, 'success');
    } else {
      alert('Fehler: ' + (result.fehler || 'Unbekannter Fehler'));
    }
  } catch (err) {
    console.error('Fehler beim Erstellen des Projekts:', err);
  }
}

// Export for use in other scripts
window.getEditorContent = getEditorContent;
window.setEditorContent = setEditorContent;
window.saveCurrentFile = saveCurrentFile;
window.compileAndRun = compileAndRun;
window.loadProjectList = loadProjectList;
window.openProject = openProject;
window.createProject = createProject;
