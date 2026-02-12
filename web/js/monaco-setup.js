/**
 * Monaco Editor Setup for BenLang
 * Language configuration, syntax highlighting, autocomplete, and more
 */

let monacoLoaded = false;
let monacoReadyCallbacks = [];

// BenLang Keywords
const keywords = [
  'WENN', 'SONST', 'SOLANGE', 'FUER', 'FUER', 'VON', 'BIS', 'WIEDERHOLE',
  'FUNKTION', 'ZURUECK', 'ZURUECK', 'VAR', 'VARIABLE', 'FIGUR',
  'WAHR', 'FALSCH', 'UND', 'ODER', 'NICHT',
  'SPIEL', 'WENN_START', 'WENN_IMMER', 'WENN_TASTE', 'WENN_KOLLISION'
];

const builtinFunctions = [
  'LADE_BILD', 'BILD_WECHSELN', 'SPIELE_TON', 'ZEIGE_TEXT', 'ZEICHNE_RECHTECK', 'ZEICHNE_KREIS',
  'ZEICHNE_LINIE', 'TASTE_GEDRUECKT', 'TASTE_GEDRUECKT', 'MAUS_X', 'MAUS_Y',
  'MAUS_GEDRUECKT', 'MAUS_GEDRUECKT', 'ZUFALL', 'RUNDEN', 'ABSOLUT',
  'WURZEL', 'SINUS', 'KOSINUS', 'SCHREIBE', 'FRAGE', 'WARTE',
  'LOESCHEN', 'LADE_LEVEL', 'GEHE_ZU', 'DREHE', 'SKALIERE'
];

const builtinFunctionSignatures = {
  'LADE_BILD': { params: '(pfad)', desc: 'Laedt ein Bild und gibt eine Figur zurueck' },
  'BILD_WECHSELN': { params: '(figur, bild)', desc: 'Wechselt das Bild einer Figur' },
  'SPIELE_TON': { params: '(pfad)', desc: 'Spielt eine Sound-Datei ab' },
  'ZEIGE_TEXT': { params: '(text, x, y, farbe, groesse)', desc: 'Zeigt Text an' },
  'ZEICHNE_RECHTECK': { params: '(x, y, breite, hoehe, farbe)', desc: 'Zeichnet ein Rechteck' },
  'ZEICHNE_KREIS': { params: '(x, y, radius, farbe)', desc: 'Zeichnet einen Kreis' },
  'ZEICHNE_LINIE': { params: '(x1, y1, x2, y2, farbe)', desc: 'Zeichnet eine Linie' },
  'TASTE_GEDRUECKT': { params: '(taste)', desc: 'Gibt WAHR zurueck wenn Taste gedrueckt ist' },
  'MAUS_X': { params: '()', desc: 'X-Position der Maus' },
  'MAUS_Y': { params: '()', desc: 'Y-Position der Maus' },
  'MAUS_GEDRUECKT': { params: '()', desc: 'Gibt WAHR zurueck wenn Maustaste gedrueckt' },
  'ZUFALL': { params: '(min, max)', desc: 'Zufaellige Ganzzahl zwischen min und max' },
  'RUNDEN': { params: '(zahl)', desc: 'Rundet zur naechsten Ganzzahl' },
  'ABSOLUT': { params: '(zahl)', desc: 'Gibt den positiven Wert zurueck' },
  'WURZEL': { params: '(zahl)', desc: 'Quadratwurzel der Zahl' },
  'SINUS': { params: '(zahl)', desc: 'Sinus der Zahl (in Grad)' },
  'KOSINUS': { params: '(zahl)', desc: 'Kosinus der Zahl (in Grad)' },
  'SCHREIBE': { params: '(text)', desc: 'Schreibt Text in die Konsole' },
  'FRAGE': { params: '(frage)', desc: 'Zeigt eine Eingabeaufforderung' },
  'WARTE': { params: '(millisekunden)', desc: 'Wartet die angegebene Zeit' },
  'LOESCHEN': { params: '(figur)', desc: 'Entfernt eine Figur aus dem Spiel' },
  'LADE_LEVEL': { params: '(nummer)', desc: 'Laedt ein Level' },
  'GEHE_ZU': { params: '(figur, x, y)', desc: 'Bewegt eine Figur zu einer Position' },
  'DREHE': { params: '(figur, winkel)', desc: 'Dreht eine Figur' },
  'SKALIERE': { params: '(figur, faktor)', desc: 'Skaliert eine Figur' }
};

const figurProperties = ['.x', '.y', '.breite', '.hoehe', '.sichtbar', '.drehung', '.geschwindigkeit'];

// Symbol table for user-defined symbols
let symbolTable = {
  variables: [],
  figurs: [],
  functions: [],
  loopVariables: []
};

function parseCodeForSymbols(code) {
  const symbols = {
    variables: [],
    figurs: [],
    functions: [],
    loopVariables: [],
    braceDepth: 0,
    currentFunction: null
  };

  const lines = code.split('\n');
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const beforeBrace = symbols.braceDepth;

    symbols.braceDepth += (line.match(/\{/g) || []).length;
    symbols.braceDepth -= (line.match(/\}/g) || []).length;

    const isGlobal = symbols.braceDepth === 0;

    if (trimmed.startsWith('FUNKTION ')) {
      const match = trimmed.match(/FUNKTION\s+(\w+)\s*\(([^)]*)\)/);
      if (match) {
        const params = match[2].split(',').map(p => p.trim()).filter(p => p);
        symbols.currentFunction = { name: match[1], params, line: lineIndex };
        symbols.functions.push(symbols.currentFunction);
      }
    }

    if (trimmed.startsWith('FUER ') || trimmed.startsWith('FUER ')) {
      const match = trimmed.match(/FUER\s+(\w+)\s+VON/);
      if (match) {
        symbols.loopVariables.push({ name: match[1], line: lineIndex });
      }
    }

    if (trimmed === '}' && symbols.currentFunction && symbols.braceDepth === 0) {
      symbols.currentFunction = null;
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

    if (symbols.currentFunction && symbols.braceDepth > 0 && beforeBrace === 0) {
      symbols.currentFunction.params.forEach(param => {
        if (!symbols.variables.find(v => v.name === param)) {
          symbols.variables.push({ name: param, line: lineIndex, isParam: true });
        }
      });
    }
  });

  return symbols;
}

function updateSymbolTable(code) {
  symbolTable = parseCodeForSymbols(code);
}

function initMonaco() {
  if (typeof monaco === 'undefined') {
    console.error('Monaco not loaded');
    return;
  }

  monaco.editor.defineTheme('benlang-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
      { token: 'function', foreground: '00d4ff' },
      { token: 'string', foreground: '50fa7b' },
      { token: 'string.hexcolor', foreground: 'ffffff', background: '3a3a4a' },
      { token: 'number', foreground: 'ffcc00' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'variable', foreground: 'bd93f9' },
      { token: 'property', foreground: '8be9fd' }
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e0e6ed',
      'editor.lineHighlightBackground': '#1a2130',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#00d4ff',
      'editorLineNumber.foreground': '#6b7a8a',
      'editorLineNumber.activeForeground': '#e0e6ed',
      'editor.inactiveSelectionBackground': '#1a2130'
    }
  });

  monaco.languages.register({ id: 'benlang' });

  monaco.languages.setMonarchTokensProvider('benlang', {
    defaultToken: '',
    tokenPostfix: '.benlang',
    keywords: keywords,
    builtins: builtinFunctions,
    operators: [
      '=', '==', '!=', '<', '<=', '>', '>=',
      '+', '-', '*', '/', '%',
      '.', '(', ')', '{', '}', '[', ']', ',', ':'
    ],
    symbols: /[=><!+\-*/%.,(){}[\]]+/,
    tokenizer: {
      root: [
        [/[{}]/, 'delimiter.bracket'],
        [/[()]/, 'delimiter.parenthesis'],
        [/\/\/.*/, 'comment'],
        [/"(#[0-9A-Fa-f]{3,8})"/, { token: 'string.hexcolor' }],
        [/"[^"]*"/, 'string'],
        [/\d+/, 'number'],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, {
          cases: {
            '@keywords': 'keyword',
            '@builtins': 'function',
            '@default': 'identifier'
          }
        }]
      ]
    }
  });

  monaco.languages.registerCompletionItemProvider('benlang', {
    provideCompletionItems: function(model, position) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const wordMatch = textUntilPosition.match(/(\w*)$/);
      const partialWord = wordMatch ? wordMatch[1] : '';

      const dotMatch = textUntilPosition.match(/(\w*)\.(\w*)$/);
      let suggestions = [];

      if (dotMatch) {
        const baseIdentifier = dotMatch[1];
        const partialProp = dotMatch[2] || '';

        if (symbolTable.figurs.some(f => f.name === baseIdentifier)) {
          figurProperties.forEach(prop => {
            const propName = prop.substring(1);
            if (propName.toLowerCase().startsWith(partialProp.toLowerCase())) {
              suggestions.push({
                label: prop,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: prop,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.None
              });
            }
          });
        }
      } else if (partialWord.length >= 1) {
        keywords.forEach(kw => {
          if (kw.toLowerCase().startsWith(partialWord.toLowerCase())) {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw + ' ',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.None
            });
          }
        });

        Object.keys(builtinFunctionSignatures).forEach(fn => {
          if (fn.toLowerCase().startsWith(partialWord.toLowerCase())) {
            const sig = builtinFunctionSignatures[fn];
            suggestions.push({
              label: fn + sig.params,
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: sig.desc,
              detail: sig.params,
              insertText: fn + sig.params,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.None
            });
          }
        });

        symbolTable.variables.forEach(v => {
          if (v.name.toLowerCase().startsWith(partialWord.toLowerCase())) {
            suggestions.push({
              label: v.name,
              kind: v.isParam ? monaco.languages.CompletionItemKind.Parameter : monaco.languages.CompletionItemKind.Variable,
              insertText: v.name
            });
          }
        });

        symbolTable.figurs.forEach(f => {
          if (f.name.toLowerCase().startsWith(partialWord.toLowerCase())) {
            suggestions.push({
              label: f.name,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: f.name
            });
          }
        });
      }

      return { suggestions: suggestions };
    },
    triggerCharacters: ['.', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '_']
  });

  monaco.languages.registerHoverProvider('benlang', {
    provideHover: function(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const fn = builtinFunctionSignatures[word.word.toUpperCase()];
      if (fn) {
        return {
          contents: [
            { value: `**${word.word.toUpperCase()}**` },
            { value: fn.params },
            { value: fn.desc }
          ]
        };
      }

      return null;
    }
  });

  monaco.languages.registerSignatureHelpProvider('benlang', {
    provideSignatureHelp: function(model, position) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const match = textUntilPosition.match(/(\w+)\([^)]*$/);
      if (match) {
        const fnName = match[1].toUpperCase();
        const fn = builtinFunctionSignatures[fnName];
        if (fn) {
          const paramNames = fn.params.slice(1, -1).split(',').map(p => p.trim());
          return {
            activeSignature: 0,
            activeParameter: paramNames.length - 1,
            signatures: [{
              label: fnName + fn.params,
              documentation: fn.desc,
              parameters: paramNames.map((p, i) => ({
                label: p,
                documentation: `Parameter ${i + 1}`
              }))
            }]
          };
        }
      }
      return null;
    },
    signatureHelpTriggerCharacters: ['(']
  });

  monacoLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    .hex-color-bg {
      background-color: rgba(80, 80, 80, 0.3);
      padding: 0 2px;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);

  monacoReadyCallbacks.forEach(cb => cb());
}

function onMonacoReady(callback) {
  if (monacoLoaded) {
    callback();
  } else {
    monacoReadyCallbacks.push(callback);
  }
}

function createHexColorDecorations(editor) {
  if (!editor || typeof monaco === 'undefined') return;

  const model = editor.getModel();
  if (!model) return;

  const code = model.getValue();
  const decorations = [];

  const hexRegex = /"#([0-9A-Fa-f]{3,8})"/g;
  let match;
  while ((match = hexRegex.exec(code)) !== null) {
    const fullMatch = match[0];
    const hexColor = match[1];
    const startIndex = match.index;

    const startPos = model.getPositionAt(startIndex);
    const endPos = model.getPositionAt(startIndex + fullMatch.length);

    let textColor;
    if (hexColor.length <= 4) {
      const r = parseInt(hexColor[0] + hexColor[0], 16);
      const g = parseInt(hexColor[1] + hexColor[1], 16);
      const b = parseInt(hexColor[2] + hexColor[2], 16);
      textColor = `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = parseInt(hexColor.slice(0, 2), 16);
      const g = parseInt(hexColor.slice(2, 4), 16);
      const b = parseInt(hexColor.slice(4, 6), 16);
      textColor = `rgb(${r}, ${g}, ${b})`;
    }

    const hexColorClass = `hex-color-${hexColor.replace(/[^a-fA-F0-9]/g, '_')}`;
    const styleId = `style-hex-${hexColor.replace(/[^a-fA-F0-9]/g, '_')}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `.${hexColorClass} { color: ${textColor} !important; font-weight: bold; }`;
      document.head.appendChild(style);
    }

    decorations.push({
      range: new monaco.Range(startPos.lineNumber, startPos.column + 1, endPos.lineNumber, endPos.column),
      options: {
        inlineClassName: hexColorClass,
        hoverMessage: { value: `Color: #${hexColor}` }
      }
    });
  }

  editor.deltaDecorations([], decorations);
}

function loadMonaco() {
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
  require(['vs/editor/editor.main'], function() {
    initMonaco();
  });
}

if (typeof window !== 'undefined') {
  window.loadMonaco = loadMonaco;
  window.onMonacoReady = onMonacoReady;
  window.updateSymbolTable = updateSymbolTable;
  window.builtinFunctionSignatures = builtinFunctionSignatures;
  window.symbolTable = symbolTable;
  window.figurProperties = figurProperties;
  window.createHexColorDecorations = createHexColorDecorations;
}
