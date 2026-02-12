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

console.log = function(...args) {
  originalLog.apply(console, args);
  logToConsole(args.join(' '), 'log');
};

console.error = function(...args) {
  originalError.apply(console, args);
  logToConsole(args.join(' '), 'error');
};

console.warn = function(...args) {
  originalWarn.apply(console, args);
  logToConsole(args.join(' '), 'warning');
};

// File management
async function loadFiles() {
  try {
    const response = await fetch('/api/dateien');
    const data = await response.json();
    
    if (data.projekt && projectName) {
      projectName.textContent = data.projekt;
    }
    
    fileModels = {};
    if (data.dateien && Array.isArray(data.dateien)) {
      data.dateien.forEach(f => {
        fileModels[f.name] = f.inhalt || '';
      });
    }
    
    renderFileList();
    
    const benFile = Object.keys(fileModels).find(f => f.endsWith('.ben'));
    if (benFile) {
      currentFile = benFile;
      const content = fileModels[benFile] || getDefaultCode();
      setEditorContent(content);
    } else {
      currentFile = 'hauptspiel.ben';
      fileModels[currentFile] = getDefaultCode();
      renderFileList();
      setEditorContent(getDefaultCode());
    }
    
    hasUnsavedChanges = false;
    updateFileTab();
    return true;
  } catch (err) {
    console.error('Fehler beim Laden der Dateien:', err);
    currentFile = 'hauptspiel.ben';
    fileModels[currentFile] = getDefaultCode();
    renderFileList();
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
      return;
    }
    
    logToConsole('Spiel wird gestartet...', 'success');
    
    if (typeof _benlang !== 'undefined') {
      _benlang.zuruecksetzen();
      _benlang.init('gameCanvas');
      
      eval(result.js);
      _benlang.starten();
      
      if (_benlang.spielName && gameTitle) {
        gameTitle.textContent = _benlang.spielName;
      }
    } else {
      logToConsole('Fehler: Game Engine nicht geladen', 'error');
    }
    
  } catch (err) {
    logToConsole('Laufzeitfehler: ' + err.message, 'error');
    console.error(err);
  } finally {
    isCompiling = false;
  }
}

function stopGame() {
  if (typeof _benlang !== 'undefined') {
    _benlang.stoppen();
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
    
    // Update hex color decorations
    if (typeof createHexColorDecorations === 'function') {
      createHexColorDecorations(monacoEditor);
    }
    
    hasUnsavedChanges = true;
    updateFileTab();
  });

  // Handle keyboard shortcuts
  monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    saveCurrentFile();
  });

  // Create hex color decorations after editor is ready
  setTimeout(() => {
    if (typeof createHexColorDecorations === 'function') {
      createHexColorDecorations(monacoEditor);
    }
  }, 100);

  // Color picker on click
  monacoEditor.onMouseDown((e) => {
    if (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
      const position = e.target.position;
      if (position) {
        const lineNumber = position.lineNumber;
        const column = position.column;
        const lineContent = monacoEditor.getModel().getLineContent(lineNumber);
        const colorMatch = lineContent.match(new RegExp('"(#[0-9A-Fa-f]{3,8})"'));
        if (colorMatch) {
          const colorIndex = lineContent.indexOf(colorMatch[0]);
          if (column > colorIndex && column <= colorIndex + colorMatch[0].length) {
            showColorPicker(colorMatch[1], colorIndex, lineNumber);
          }
        }
      }
    }
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
    const startOffset = model.getOffsetAt({ lineNumber: colorPickerState.lineNumber, column: fullLine.indexOf(colorMatch[0]) + 1 });
    const endOffset = startOffset + colorMatch[1].length;
    
    model.pushEditOperations(
      [{ range: new monaco.Range(colorPickerState.lineNumber, startOffset, colorPickerState.lineNumber, endOffset), text: newColor }],
      []
    );
  }
  
  colorPickerState.color = newColor;
  document.getElementById('colorPickerHex').textContent = newColor;

  // Update hex color decorations
  if (typeof createHexColorDecorations === 'function') {
    createHexColorDecorations(monacoEditor);
  }
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

// Export for use in other scripts
window.getEditorContent = getEditorContent;
window.setEditorContent = setEditorContent;
window.saveCurrentFile = saveCurrentFile;
window.compileAndRun = compileAndRun;
