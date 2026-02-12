/**
 * BenLang IDE Editor
 * Einfacher Editor mit Syntax Highlighting
 */

// App state
let editor = null;
let currentFile = 'hauptspiel.ben';
let files = {};
let hasUnsavedChanges = false;
let colorPickerState = null; // Tracks active color picker

// DOM Elements
let editorContainer, editorTextarea, consoleOutput, fileList, projectName, gameTitle;

// BenLang Keywords for highlighting
const keywords = [
  'WENN', 'SONST', 'SOLANGE', 'FUER', 'FÜR', 'VON', 'BIS', 'WIEDERHOLE',
  'FUNKTION', 'ZURUECK', 'ZURÜCK', 'VAR', 'VARIABLE', 'FIGUR',
  'WAHR', 'FALSCH', 'UND', 'ODER', 'NICHT',
  'SPIEL', 'WENN_START', 'WENN_IMMER', 'WENN_TASTE', 'WENN_KOLLISION'
];

const builtinFunctions = [
  'LADE_BILD', 'BILD_WECHSELN', 'SPIELE_TON', 'ZEIGE_TEXT', 'ZEICHNE_RECHTECK', 'ZEICHNE_KREIS',
  'ZEICHNE_LINIE', 'TASTE_GEDRUECKT', 'TASTE_GEDRÜCKT', 'MAUS_X', 'MAUS_Y',
  'MAUS_GEDRUECKT', 'MAUS_GEDRÜCKT', 'ZUFALL', 'RUNDEN', 'ABSOLUT',
  'WURZEL', 'SINUS', 'KOSINUS', 'SCHREIBE', 'FRAGE', 'WARTE',
  'LOESCHEN', 'LADE_LEVEL', 'GEHE_ZU', 'DREHE', 'SKALIERE'
];

const builtinFunctionSignatures = {
  'LADE_BILD': { params: '(pfad)', desc: 'Lädt ein Bild und gibt eine Figur zurück' },
  'BILD_WECHSELN': { params: '(figur, bild)', desc: 'Wechselt das Bild einer Figur' },
  'SPIELE_TON': { params: '(pfad)', desc: 'Spielt eine Sound-Datei ab' },
  'ZEIGE_TEXT': { params: '(text, x, y, farbe, groesse)', desc: 'Zeigt Text an' },
  'ZEICHNE_RECHTECK': { params: '(x, y, breite, hoehe, farbe)', desc: 'Zeichnet ein Rechteck' },
  'ZEICHNE_KREIS': { params: '(x, y, radius, farbe)', desc: 'Zeichnet einen Kreis' },
  'ZEICHNE_LINIE': { params: '(x1, y1, x2, y2, farbe)', desc: 'Zeichnet eine Linie' },
  'TASTE_GEDRUECKT': { params: '(taste)', desc: 'Gibt WAHR zurück wenn Taste gedrückt ist' },
  'MAUS_X': { params: '()', desc: 'X-Position der Maus' },
  'MAUS_Y': { params: '()', desc: 'Y-Position der Maus' },
  'MAUS_GEDRUECKT': { params: '()', desc: 'Gibt WAHR zurück wenn Maustaste gedrückt' },
  'ZUFALL': { params: '(min, max)', desc: 'Zufällige Ganzzahl zwischen min und max' },
  'RUNDEN': { params: '(zahl)', desc: 'Rundet zur nächsten Ganzzahl' },
  'ABSOLUT': { params: '(zahl)', desc: 'Gibt den positiven Wert zurück' },
  'WURZEL': { params: '(zahl)', desc: 'Quadratwurzel der Zahl' },
  'SINUS': { params: '(zahl)', desc: 'Sinus der Zahl (in Grad)' },
  'KOSINUS': { params: '(zahl)', desc: 'Kosinus der Zahl (in Grad)' },
  'SCHREIBE': { params: '(text)', desc: 'Schreibt Text in die Konsole' },
  'FRAGE': { params: '(frage)', desc: 'Zeigt eine Eingabeaufforderung' },
  'WARTE': { params: '(millisekunden)', desc: 'Wartet die angegebene Zeit' },
  'LOESCHEN': { params: '(figur)', desc: 'Entfernt eine Figur aus dem Spiel' },
  'LADE_LEVEL': { params: '(nummer)', desc: 'Lädt ein Level' },
  'GEHE_ZU': { params: '(figur, x, y)', desc: 'Bewegt eine Figur zu einer Position' },
  'DREHE': { params: '(figur, winkel)', desc: 'Dreht eine Figur' },
  'SKALIERE': { params: '(figur, faktor)', desc: 'Skaliert eine Figur' }
};

const figurProperties = ['.x', '.y', '.breite', '.hoehe', '.sichtbar', '.drehung', '.geschwindigkeit'];

// Symbol table for user-defined variables and figurs
let symbolTable = {
  variables: [],
  figurs: [],
  functions: [],
  loopVariables: [],
  currentFunction: null,
  currentLoop: null,
  braceDepth: 0
};

// Autocomplete state
let autocompletePopup = null;
let autocompleteItems = [];
let selectedIndex = -1;
let autocompleteTrigger = null;

// Parse code to extract user-defined symbols
function parseCodeForSymbols(code) {
  const lines = code.split('\n');
  const symbols = {
    variables: [],
    figurs: [],
    functions: [],
    loopVariables: [],
    currentFunction: null,
    currentLoop: null,
    braceDepth: 0
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const beforeBrace = symbols.braceDepth;

    symbols.braceDepth += (line.match(/\{/g) || []).length;
    symbols.braceDepth -= (line.match(/\}/g) || []).length;

    const isGlobal = symbols.braceDepth === 0;
    const wasInFunction = beforeBrace > 0 && symbols.currentFunction;
    const isInFunction = symbols.braceDepth > 0 && symbols.currentFunction;

    if (trimmed.startsWith('FUNKTION ')) {
      const match = trimmed.match(/FUNKTION\s+(\w+)\s*\(([^)]*)\)/);
      if (match) {
        const params = match[2].split(',').map(p => p.trim()).filter(p => p);
        symbols.currentFunction = {
          name: match[1],
          params,
          line: lineIndex
        };
        symbols.functions.push(symbols.currentFunction);
      }
    }

    if (trimmed.startsWith('FUER ') || trimmed.startsWith('FÜR ')) {
      const match = trimmed.match(/F(?:ÜR|UER)\s+(\w+)\s+VON/);
      if (match) {
        symbols.currentLoop = { var: match[1], line: lineIndex };
        symbols.loopVariables.push({ name: match[1], line: lineIndex });
      }
    }

    if (trimmed === '}' && symbols.currentFunction && symbols.braceDepth === 0) {
      symbols.currentFunction = null;
    }
    if (trimmed === '}' && symbols.currentLoop && symbols.braceDepth === 0) {
      symbols.currentLoop = null;
    }

    if (symbols.braceDepth <= 1) {
      const varMatch = line.match(/(?:VAR|VARIABLE)\s+(\w+)\s*=/);
      if (varMatch) {
        symbols.variables.push({ name: varMatch[1], line: lineIndex });
      }

      const figurMatch = line.match(/FIGUR\s+(\w+)\s*=/);
      if (figurMatch) {
        symbols.figurs.push({ name: figurMatch[1], line: lineIndex });
      }
    }

    if (isInFunction && !wasInFunction) {
      const params = symbols.currentFunction?.params || [];
      params.forEach(param => {
        if (!symbols.variables.find(v => v.name === param)) {
          symbols.variables.push({ name: param, line: symbols.currentFunction.line, isParam: true });
        }
      });
    }
  });

  return symbols;
}

// Get autocomplete trigger info
function getAutocompleteTrigger(code, cursorPos) {
  const beforeCursor = code.substring(0, cursorPos);
  const afterCursor = code.substring(cursorPos);

  const dotMatch = beforeCursor.match(/(\w*)\.(\w*)$/);
  if (dotMatch && dotMatch[2] !== undefined) {
    const baseIdentifier = dotMatch[1];
    const partialProp = dotMatch[2];
    return { type: 'property', baseIdentifier, partialProp };
  }

  const functionCallMatch = beforeCursor.match(/(\w+)\($/);
  if (functionCallMatch) {
    const funcName = functionCallMatch[1];
    if (builtinFunctionSignatures[funcName]) {
      return { type: 'functionCall', functionName: funcName };
    }
  }

  const wordMatch = beforeCursor.match(/(\w{1,})$/);
  if (wordMatch) {
    return { type: 'word', partialWord: wordMatch[1] };
  }

  if (/[^a-zA-ZäöüÄÖÜß0-9_]$/.test(beforeCursor) && !afterCursor.startsWith('.')) {
    return { type: 'trigger' };
  }

  return null;
}

// Filter completions based on trigger
function getCompletions(trigger, symbols, partialWord) {
  const completions = [];
  const lowerPartial = partialWord?.toLowerCase() || '';

  if (trigger.type === 'functionCall') {
    const sig = builtinFunctionSignatures[trigger.functionName];
    if (sig) {
      completions.push({
        type: 'function',
        label: sig.params,
        insertText: sig.params,
        detail: sig.params,
        documentation: sig.desc
      });
    }
    return completions;
  }

  if (trigger.type === 'word' || trigger.type === 'trigger') {
    keywords.forEach(kw => {
      if (kw.toLowerCase().startsWith(lowerPartial)) {
        completions.push({ type: 'keyword', label: kw, icon: 'KW' });
      }
    });

    Object.keys(builtinFunctionSignatures).forEach(fn => {
      if (fn.toLowerCase().startsWith(lowerPartial)) {
        const sig = builtinFunctionSignatures[fn];
        completions.push({
          type: 'function',
          label: fn + sig.params,
          insertText: fn + sig.params,
          detail: sig.params,
          documentation: sig.desc
        });
      }
    });

    symbols.variables.forEach(v => {
      if (v.name.toLowerCase().startsWith(lowerPartial)) {
        completions.push({
          type: 'variable',
          label: v.name,
          icon: v.isParam ? 'PR' : 'VR'
        });
      }
    });

    symbols.figurs.forEach(f => {
      if (f.name.toLowerCase().startsWith(lowerPartial)) {
        completions.push({ type: 'figur', label: f.name, icon: 'FG' });
      }
    });
  }

  if (trigger.type === 'property') {
    const isFigur = symbols.figurs.some(f => f.name === trigger.baseIdentifier);
    if (isFigur) {
      figurProperties.forEach(prop => {
        const propName = prop.substring(1);
        if (propName.toLowerCase().startsWith(trigger.partialProp?.toLowerCase() || '')) {
          completions.push({ type: 'property', label: prop, icon: 'PR' });
        }
      });
    }
  }

  return completions;
}

// Create autocomplete popup
function createAutocompletePopup() {
  if (autocompletePopup) return;

  const popup = document.createElement('div');
  popup.id = 'autocompletePopup';
  popup.className = 'autocomplete-popup';
  popup.innerHTML = `
    <div class="autocomplete-list" id="autocompleteList"></div>
    <div class="autocomplete-footer">
      <span><kbd>↑↓</kbd> Navigate</span>
      <span><kbd>Enter</kbd> Select</span>
      <span><kbd>Esc</kbd> Close</span>
    </div>
  `;
  document.body.appendChild(popup);

  autocompletePopup = popup;

  popup.querySelectorAll('.autocomplete-list').forEach(list => {
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.autocomplete-item');
      if (item) {
        const index = parseInt(item.dataset.index);
        selectAutocompleteItem(index);
      }
    });
  });
}

// Show autocomplete popup
function showAutocompletePopup(completions, x, y) {
  if (!autocompletePopup) {
    createAutocompletePopup();
  }

  const list = autocompletePopup.querySelector('#autocompleteList');
  list.innerHTML = '';

  if (completions.length === 0) {
    list.innerHTML = '<div class="autocomplete-no-match">Keine Vervollständigung</div>';
    autocompletePopup.classList.add('show');
    autocompleteItems = [];
    selectedIndex = -1;
    return;
  }

  autocompleteItems = completions;
  selectedIndex = 0;

  completions.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item' + (index === 0 ? ' selected' : '');
    div.dataset.index = index;

    const iconClass = item.type.toLowerCase();
    let iconText = item.type.charAt(0).toUpperCase();
    if (item.type === 'function') iconText = 'FN';
    if (item.type === 'variable') iconText = item.icon || 'VR';
    if (item.type === 'figur') iconText = 'FG';
    if (item.type === 'property') iconText = 'PR';

    let detailHtml = '';
    if (item.type === 'function' && item.detail) {
      detailHtml = `<div class="detail function">${item.detail}</div>`;
    }

    div.innerHTML = `
      <span class="icon ${iconClass}">${iconText}</span>
      <div class="content">
        <div class="label">${escapeHtml(item.label)}</div>
        ${detailHtml}
      </div>
    `;
    list.appendChild(div);
  });

  const maxX = window.innerWidth - 250;
  const maxY = window.innerHeight - 100;

  autocompletePopup.style.left = Math.min(x, maxX) + 'px';
  autocompletePopup.style.top = Math.min(y, maxY) + 'px';
  autocompletePopup.classList.add('show');
}

// Hide autocomplete popup
function hideAutocompletePopup() {
  if (autocompletePopup) {
    autocompletePopup.classList.remove('show');
    autocompleteItems = [];
    selectedIndex = -1;
    autocompleteTrigger = null;
  }
}

// Update selected item in popup
function updateAutocompleteSelection() {
  const list = autocompletePopup?.querySelector('#autocompleteList');
  if (!list || selectedIndex < 0 || selectedIndex >= autocompleteItems.length) return;

  list.querySelectorAll('.autocomplete-item').forEach((item, index) => {
    item.classList.toggle('selected', index === selectedIndex);
  });

  const selectedItem = list.children[selectedIndex];
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: 'nearest' });
  }
}

// Select autocomplete item
function selectAutocompleteItem(index) {
  if (index < 0 || index >= autocompleteItems.length) return;

  const item = autocompleteItems[index];
  if (!item || !editorTextarea) return;

  const insertText = item.insertText || item.label;

  const start = editorTextarea.selectionStart;
  const end = editorTextarea.selectionEnd;

  let insertStart = start;
  let insertEnd = end;

  if (autocompleteTrigger?.type === 'property') {
    const beforeCursor = editorTextarea.value.substring(0, start);
    const dotIndex = beforeCursor.lastIndexOf('.');
    if (dotIndex >= 0) {
      insertStart = dotIndex;
    }
  } else if (autocompleteTrigger?.type === 'functionCall') {
    const beforeCursor = editorTextarea.value.substring(0, start);
    const funcMatch = beforeCursor.match(/(\w+)\($/);
    if (funcMatch) {
      insertStart = start - funcMatch[1].length - 1;
    }
  } else if (autocompleteTrigger?.type === 'word') {
    const beforeCursor = editorTextarea.value.substring(0, start);
    const wordMatch = beforeCursor.match(/(\w+)$/);
    if (wordMatch) {
      const existingWord = wordMatch[1];
      insertStart = start - existingWord.length;
      if (item.type === 'function') {
        const fnName = item.label.split('(')[0];
        if (existingWord.toLowerCase() === fnName.toLowerCase()) {
          insertText = item.label.substring(fnName.length);
        }
      }
    }
  }

  const newValue = editorTextarea.value.substring(0, insertStart) + insertText + editorTextarea.value.substring(insertEnd);
  editorTextarea.value = newValue;

  const newCursorPos = insertStart + insertText.length;
  editorTextarea.selectionStart = editorTextarea.selectionEnd = newCursorPos;

  hideAutocompletePopup();

  if (editor && typeof editor.refresh === 'function') {
    editor.refresh();
  }

  editorTextarea.focus();
}

// Navigate autocomplete
function navigateAutocomplete(direction) {
  if (autocompleteItems.length === 0) return;

  selectedIndex = (selectedIndex + direction + autocompleteItems.length) % autocompleteItems.length;
  updateAutocompleteSelection();
}

// Get cursor pixel position for popup
function getCursorPixelPosition() {
  if (!editorTextarea) return { x: 0, y: 0 };

  const cursorPos = editorTextarea.selectionStart;
  const textBeforeCursor = editorTextarea.value.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const lineIndex = lines.length - 1;
  const charIndex = lines[lineIndex].length;

  const lineHeight = 22;
  const charWidth = 9;

  const lineNumbersWidth = 50;
  const paddingLeft = 10;

  const editorRect = editorTextarea.getBoundingClientRect();
  const scrollLeft = editorTextarea.scrollLeft;
  const scrollTop = editorTextarea.scrollTop;

  return {
    x: lineNumbersWidth + paddingLeft + (charIndex * charWidth) - scrollLeft,
    y: editorRect.top - scrollTop + (lineIndex * lineHeight) + lineHeight + 35
  };
}

// Handle autocomplete input
function handleAutocompleteInput(e) {
  if (!editorTextarea) return;

  const code = editorTextarea.value;
  const cursorPos = editorTextarea.selectionStart;

  const trigger = getAutocompleteTrigger(code, cursorPos);

  if (!trigger || (trigger.type === 'word' && trigger.partialWord.length < 2) || trigger.type === 'trigger') {
    hideAutocompletePopup();
    return;
  }

  symbolTable = parseCodeForSymbols(code);

  let partialWord = '';
  if (trigger.type === 'word') {
    partialWord = trigger.partialWord;
  } else if (trigger.type === 'property') {
    partialWord = trigger.partialProp || '';
  }

  const completions = getCompletions(trigger, symbolTable, partialWord);

  if (completions.length > 0) {
    autocompleteTrigger = trigger;
    const pos = getCursorPixelPosition();
    showAutocompletePopup(completions, pos.x, pos.y);
  } else {
    hideAutocompletePopup();
  }
}

// Handle keyboard for autocomplete
function handleAutocompleteKeydown(e) {
  if (!autocompletePopup?.classList.contains('show')) {
    if (e.key === 'Escape') {
      hideColorPicker();
    }
    return;
  }

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      navigateAutocomplete(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      navigateAutocomplete(1);
      break;
    case 'Enter':
    case 'Tab':
      e.preventDefault();
      if (selectedIndex >= 0) {
        selectAutocompleteItem(selectedIndex);
      }
      break;
    case 'Escape':
      hideAutocompletePopup();
      break;
    default:
      break;
  }
}

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

// Syntax highlighting - tokenize first, then build HTML
function highlightCode(code) {
  const lines = code.split('\n');
  const highlightedLines = lines.map(line => highlightLine(line));
  return highlightedLines.join('\n');
}

function highlightLine(line) {
  // Check for comment first
  const commentIndex = line.indexOf('//');
  if (commentIndex !== -1) {
    const beforeComment = line.substring(0, commentIndex);
    const comment = line.substring(commentIndex);
    return highlightSegment(beforeComment) + '<span class="comment">' + escapeHtml(comment) + '</span>';
  }
  return highlightSegment(line);
}

function highlightSegment(text) {
  if (!text) return '';
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    // Skip whitespace
    if (/\s/.test(text[i])) {
      result += text[i];
      i++;
      continue;
    }
    
    // String - check for hex color codes inside
    if (text[i] === '"') {
      let str = '"';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < text.length) {
          str += text[i] + text[i + 1];
          i += 2;
        } else {
          str += text[i];
          i++;
        }
      }
      if (i < text.length) {
        str += '"';
        i++;
      }
      
      // Check if the string content is a hex color code
      const colorMatch = str.match(/^"(#[0-9A-Fa-f]{3,8})"$/);
      if (colorMatch) {
        const hexColor = colorMatch[1];
        // Calculate contrasting text color
        const textColor = getContrastColor(hexColor);
        result += '<span class="string color-code" data-color="' + hexColor + '" style="background-color: ' + hexColor + '; color: ' + textColor + '; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.3);">' + escapeHtml(str) + '</span>';
      } else {
        result += '<span class="string">' + escapeHtml(str) + '</span>';
      }
      continue;
    }
    
    // Number
    if (/\d/.test(text[i])) {
      let num = '';
      while (i < text.length && /[\d.]/.test(text[i])) {
        num += text[i];
        i++;
      }
      result += '<span class="number">' + escapeHtml(num) + '</span>';
      continue;
    }
    
    // Identifier or keyword
    if (/[a-zA-ZäöüÄÖÜß_]/.test(text[i])) {
      let ident = '';
      while (i < text.length && /[a-zA-ZäöüÄÖÜß0-9_]/.test(text[i])) {
        ident += text[i];
        i++;
      }
       const lower = ident.toLowerCase();
      const lowerUmlauts = lower.replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a').replace(/ß/g, 'ss');
      const builtinFnKeys = Object.keys(builtinFunctionSignatures).map(f => f.toLowerCase());
      if (keywords.map(k => k.toLowerCase()).includes(lower)) {
        result += '<span class="keyword">' + escapeHtml(ident) + '</span>';
      } else if (builtinFunctions.map(f => f.toLowerCase()).includes(lower) || builtinFnKeys.includes(lower)) {
        result += '<span class="function">' + escapeHtml(ident) + '</span>';
      } else {
        result += escapeHtml(ident);
      }
      continue;
    }
    
    // Operators and other characters
    result += escapeHtml(text[i]);
    i++;
  }
  
  return result;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Calculate contrasting text color (black or white) for a hex background
function getContrastColor(hexColor) {
  // Remove # if present
  let hex = hexColor.replace('#', '');
  
  // Expand short hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Color Picker Functions
function createColorPicker() {
  // Create color picker popup if it doesn't exist
  if (document.getElementById('colorPickerPopup')) return;
  
  const popup = document.createElement('div');
  popup.id = 'colorPickerPopup';
  popup.innerHTML = `
    <div class="color-picker-header">
      <span>Farbe wählen</span>
      <button class="color-picker-close">&times;</button>
    </div>
    <div class="color-picker-body">
      <input type="color" id="colorPickerInput" value="#6bb88a">
      <div class="color-picker-preview">
        <span class="color-picker-hex">#00ff9d</span>
      </div>
      <div class="color-picker-presets">
        <div class="color-preset" data-color="#00d4ff" style="background:#00d4ff"></div>
        <div class="color-preset" data-color="#00ff9d" style="background:#00ff9d"></div>
        <div class="color-preset" data-color="#ffcc00" style="background:#ffcc00"></div>
        <div class="color-preset" data-color="#ff79c6" style="background:#ff79c6"></div>
        <div class="color-preset" data-color="#bd93f9" style="background:#bd93f9"></div>
        <div class="color-preset" data-color="#ffffff" style="background:#ffffff"></div>
        <div class="color-preset" data-color="#0d1117" style="background:#0d1117"></div>
        <div class="color-preset" data-color="#ff6b6b" style="background:#ff6b6b"></div>
        <div class="color-preset" data-color="#8be9fd" style="background:#8be9fd"></div>
        <div class="color-preset" data-color="#50fa7b" style="background:#50fa7b"></div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  // Event listeners
  const colorInput = document.getElementById('colorPickerInput');
  const hexDisplay = popup.querySelector('.color-picker-hex');
  const closeBtn = popup.querySelector('.color-picker-close');
  
  colorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    hexDisplay.textContent = color;
    applyColorChange(color);
  });
  
  closeBtn.addEventListener('click', hideColorPicker);
  
  // Preset colors
  popup.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = preset.dataset.color;
      colorInput.value = color;
      hexDisplay.textContent = color;
      applyColorChange(color);
    });
  });
  
  // Prevent clicks inside popup from closing it
  popup.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

function showColorPickerAtPosition(x, y, colorInfo) {
  const popup = document.getElementById('colorPickerPopup');
  if (!popup) return;
  
  const color = colorInfo.color;
  
  // Position popup near the click, but keep it on screen
  let left = x + 10;
  let top = y + 10;
  
  // Adjust if too close to right edge
  if (left + 250 > window.innerWidth) {
    left = window.innerWidth - 260;
  }
  
  // Adjust if too close to bottom
  if (top + 300 > window.innerHeight) {
    top = y - 310;
  }
  
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  
  // Set current color
  const colorInput = document.getElementById('colorPickerInput');
  const hexDisplay = popup.querySelector('.color-picker-hex');
  
  // Expand short hex if needed
  const expandedColor = color.length === 4 ? expandHex(color) : color;
  colorInput.value = expandedColor;
  hexDisplay.textContent = color;
  
  // Store state for replacement
  colorPickerState = {
    startIndex: colorInfo.startIndex,
    endIndex: colorInfo.endIndex,
    originalColor: color
  };
  
  popup.classList.add('show');
}

function showColorPicker(element, startIndex, endIndex) {
  // Legacy function - redirect to new one
  const rect = element.getBoundingClientRect();
  showColorPickerAtPosition(rect.left, rect.bottom, {
    color: element.dataset.color,
    startIndex: startIndex,
    endIndex: endIndex
  });
}

function hideColorPicker() {
  const popup = document.getElementById('colorPickerPopup');
  if (popup) {
    popup.classList.remove('show');
  }
  colorPickerState = null;
}

function expandHex(hex) {
  // Convert #RGB to #RRGGBB
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function applyColorChange(newColor) {
  if (!colorPickerState || !editorTextarea) return;
  
  const text = editorTextarea.value;
  const { startIndex, endIndex } = colorPickerState;
  
  // Find the color in the text (it's inside quotes like "#ffffff")
  const before = text.substring(0, startIndex);
  const after = text.substring(endIndex);
  
  // Replace the color
  const newText = before + '"' + newColor + '"' + after;
  editorTextarea.value = newText;
  
  // Update state for next change
  colorPickerState.startIndex = startIndex;
  colorPickerState.endIndex = startIndex + newColor.length + 2; // +2 for quotes
  colorPickerState.originalColor = newColor;
  
  // Trigger update
  editorTextarea.dispatchEvent(new Event('input'));
}

function findColorAtPosition(text, position) {
  // Find hex color code at cursor position
  // Match patterns like "#fff", "#ffffff", "#ffffffff"
  const regex = /"(#[0-9A-Fa-f]{3,8})"/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    
    if (position >= start && position <= end) {
      return {
        color: match[1],
        startIndex: start,
        endIndex: end,
        fullMatch: match[0]
      };
    }
  }
  
  return null;
}

// Create editor
function createEditor(container, initialContent) {
  container.innerHTML = `
    <div class="code-editor">
      <div class="line-numbers" id="lineNumbers"></div>
      <div class="editor-wrapper">
        <pre class="syntax-highlight" id="syntaxHighlight"></pre>
        <textarea id="codeTextarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
      </div>
    </div>
  `;
  
  editorTextarea = document.getElementById('codeTextarea');
  const syntaxHighlight = document.getElementById('syntaxHighlight');
  const lineNumbers = document.getElementById('lineNumbers');
  
  function updateEditor() {
    const code = editorTextarea.value;
    syntaxHighlight.innerHTML = highlightCode(code) + '\n';
    
    // Update line numbers
    const lines = code.split('\n').length;
    let lineHtml = '';
    for (let i = 1; i <= lines; i++) {
      lineHtml += i + '\n';
    }
    lineNumbers.textContent = lineHtml;
    
    hasUnsavedChanges = true;
    updateFileTab();
  }
  
  function syncScroll() {
    syntaxHighlight.scrollTop = editorTextarea.scrollTop;
    syntaxHighlight.scrollLeft = editorTextarea.scrollLeft;
    lineNumbers.scrollTop = editorTextarea.scrollTop;
  }
  
  editorTextarea.addEventListener('input', () => {
    updateEditor();
    handleAutocompleteInput();
  });
  editorTextarea.addEventListener('keydown', (e) => {
    handleAutocompleteKeydown(e);
    if (!autocompletePopup?.classList.contains('show')) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editorTextarea.selectionStart;
        const end = editorTextarea.selectionEnd;
        editorTextarea.value = editorTextarea.value.substring(0, start) + '    ' + editorTextarea.value.substring(end);
        editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 4;
        updateEditor();
      }
    }
  });
  editorTextarea.addEventListener('scroll', syncScroll);
  
  // Color picker on click
  editorTextarea.addEventListener('click', (e) => {
    const cursorPos = editorTextarea.selectionStart;
    const text = editorTextarea.value;
    const colorInfo = findColorAtPosition(text, cursorPos);
    
    if (colorInfo) {
      e.stopPropagation();
      // Show color picker near the click position
      showColorPickerAtPosition(e.clientX, e.clientY, colorInfo);
    } else {
      // Clicked somewhere else, hide picker
      hideColorPicker();
    }
  });
  

  
  // Set initial content
  editorTextarea.value = initialContent || getDefaultCode();
  updateEditor();
  
  return {
    getValue: () => editorTextarea.value,
    setValue: (content) => {
      editorTextarea.value = content;
      updateEditor();
    },
    refresh: () => updateEditor(),
    getTextarea: () => editorTextarea
  };
}

// Console logging
function logToConsole(message, type = 'log') {
  if (!consoleOutput) return;
  const div = document.createElement('div');
  div.className = type;
  div.textContent = message;
  consoleOutput.appendChild(div);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
  if (consoleOutput) {
    consoleOutput.innerHTML = '';
  }
}

// Override console for game
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
    
    files = {};
    if (data.dateien && Array.isArray(data.dateien)) {
      data.dateien.forEach(f => {
        files[f.name] = f.inhalt || '';
      });
    }
    
    renderFileList();
    
    // Load first .ben file
    const benFile = Object.keys(files).find(f => f.endsWith('.ben'));
    if (benFile) {
      currentFile = benFile;
      const content = files[benFile] || getDefaultCode();
      
      if (editor) {
        editor.setValue(content);
      } else {
        editor = createEditor(editorContainer, content);
      }
      hasUnsavedChanges = false;
    }
    
    return true;
  } catch (err) {
    console.error('Fehler beim Laden der Dateien:', err);
    files['hauptspiel.ben'] = getDefaultCode();
    currentFile = 'hauptspiel.ben';
    renderFileList();
    
    if (!editor) {
      editor = createEditor(editorContainer, getDefaultCode());
    }
    
    return false;
  }
}

function renderFileList() {
  if (!fileList) return;
  
  fileList.innerHTML = '';
  
  Object.keys(files).filter(f => f.endsWith('.ben')).forEach(filename => {
    const tab = document.createElement('div');
    tab.className = 'file-tab' + (filename === currentFile ? ' active' : '');
    tab.innerHTML = `<span class="name">${filename}</span>`;
    tab.addEventListener('click', () => openFile(filename));
    fileList.appendChild(tab);
  });
}

function openFile(filename) {
  if (!editor) return;
  
  // Save current file first
  if (currentFile) {
    files[currentFile] = editor.getValue();
  }
  
  currentFile = filename;
  const content = files[filename] || '';
  editor.setValue(content);
  
  hasUnsavedChanges = false;
  renderFileList();
}

async function saveCurrentFile() {
  if (!currentFile || !editor) return;
  
  const content = editor.getValue();
  files[currentFile] = content;
  
  try {
    await fetch('/api/datei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentFile,
        inhalt: content
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

// Compile and run
let isCompiling = false;
async function compileAndRun() {
  // Prevent multiple simultaneous runs
  if (isCompiling) {
    return;
  }
  isCompiling = true;
  
  try {
    clearConsole();
    logToConsole('Kompiliere...', 'log');
  
    // Save current content
    if (editor && currentFile) {
      files[currentFile] = editor.getValue();
    }
    
    // Compile all .ben files
    // Order: hauptspiel.ben first, then alphabetically
    let allCode = '';
    const benFiles = Object.keys(files).filter(f => f.endsWith('.ben'));
    benFiles.sort((a, b) => {
      if (a === 'hauptspiel.ben') return -1;
      if (b === 'hauptspiel.ben') return 1;
      return a.localeCompare(b);
    });
    benFiles.forEach(filename => {
      allCode += files[filename] + '\n';
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
  files[filename] = '// ' + filename + '\n';
  
  try {
    await fetch('/api/datei', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: filename,
        inhalt: files[filename]
      })
    });
  } catch (err) {
    console.warn('Konnte Datei nicht auf Server speichern');
  }
  
  renderFileList();
  openFile(filename);
}

// Image upload
function uploadImage() {
  const input = document.getElementById('imageInput');
  const modal = document.getElementById('uploadModal');
  
  if (modal) modal.classList.add('show');
  
  if (input) {
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('bild', file);
      
      try {
        await fetch('/api/bilder', {
          method: 'POST',
          body: formData
        });
        
        logToConsole('Bild hochgeladen: ' + file.name, 'success');
        if (modal) modal.classList.remove('show');
      } catch (err) {
        logToConsole('Fehler beim Hochladen: ' + err.message, 'error');
      }
      
      input.value = '';
    };
  }
}

// Resizer
function initResizer() {
  const resizer = document.getElementById('resizer');
  const editorPanel = document.querySelector('.panel-editor');
  const previewPanel = document.querySelector('.panel-preview');
  
  if (!resizer || !editorPanel || !previewPanel) return;
  
  let isResizing = false;
  
  resizer.addEventListener('mousedown', () => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    
    const containerWidth = editorPanel.parentElement.offsetWidth;
    const newEditorWidth = (e.clientX / containerWidth) * 100;
    
    if (newEditorWidth > 20 && newEditorWidth < 80) {
      editorPanel.style.flex = `0 0 ${newEditorWidth}%`;
      previewPanel.style.flex = `0 0 ${100 - newEditorWidth - 1}%`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
  });
}

// Modal handlers
function initModals() {
  const btnHelp = document.getElementById('btnHelp');
  const closeHelp = document.getElementById('closeHelp');
  const helpModal = document.getElementById('helpModal');
  const btnUploadImage = document.getElementById('btnUploadImage');
  const closeUpload = document.getElementById('closeUpload');
  const uploadModal = document.getElementById('uploadModal');
  
  if (btnHelp && helpModal) {
    btnHelp.addEventListener('click', () => helpModal.classList.add('show'));
  }
  
  if (closeHelp && helpModal) {
    closeHelp.addEventListener('click', () => helpModal.classList.remove('show'));
  }
  
  if (btnUploadImage) {
    btnUploadImage.addEventListener('click', uploadImage);
  }
  
  if (closeUpload && uploadModal) {
    closeUpload.addEventListener('click', () => uploadModal.classList.remove('show'));
  }
  
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });
}

// Initialize
async function init() {
  editorContainer = document.getElementById('editorContainer');
  consoleOutput = document.getElementById('consoleOutput');
  fileList = document.getElementById('fileList');
  projectName = document.getElementById('projectName');
  gameTitle = document.getElementById('gameTitle');
  
  initResizer();
  initModals();
  createColorPicker();
  createAutocompletePopup();
  
  await loadFiles();
  
  // Button handlers
  const btnRun = document.getElementById('btnRun');
  const btnStop = document.getElementById('btnStop');
  const btnSave = document.getElementById('btnSave');
  const btnNewFile = document.getElementById('btnNewFile');
  
  if (btnRun) {
    // Remove any existing listeners first
    const newBtnRun = btnRun.cloneNode(true);
    btnRun.parentNode.replaceChild(newBtnRun, btnRun);
    newBtnRun.addEventListener('click', () => {
      // Ignore if game is already running (prevents Enter key triggering button)
      if (window._benlang && window._benlang.running) {
        return;
      }
      compileAndRun();
    });
  }
  if (btnStop) btnStop.addEventListener('click', stopGame);
  if (btnSave) btnSave.addEventListener('click', saveCurrentFile);
  if (btnNewFile) btnNewFile.addEventListener('click', createNewFile);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts while BenLang input is active or game is running
    if (window._benlang && (window._benlang.eingabeAktiv || window._benlang.running)) {
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        compileAndRun();
      }
    }
    // Escape closes color picker
    if (e.key === 'Escape') {
      hideColorPicker();
    }
  });
  
   // Close color picker and autocomplete when clicking outside
   document.addEventListener('click', (e) => {
     const popup = document.getElementById('colorPickerPopup');
     const textarea = document.getElementById('codeTextarea');
     if (popup && popup.classList.contains('show')) {
       if (!popup.contains(e.target) && e.target !== textarea) {
         hideColorPicker();
       }
     }
     if (autocompletePopup && autocompletePopup.classList.contains('show')) {
       if (!autocompletePopup.contains(e.target) && e.target !== textarea) {
         hideAutocompletePopup();
       }
     }
   });
  
  logToConsole('BenLang IDE bereit!', 'success');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
