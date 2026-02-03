package lexer

import (
	"unicode"
)

// Lexer tokenizes BenLang source code
type Lexer struct {
	input        []rune
	position     int  // current position in input (points to current char)
	readPosition int  // current reading position in input (after current char)
	ch           rune // current char under examination
	line         int  // current line number
	column       int  // current column number
}

// New creates a new Lexer for the given input
func New(input string) *Lexer {
	l := &Lexer{
		input:  []rune(input),
		line:   1,
		column: 0,
	}
	l.readChar()
	return l
}

// readChar reads the next character and advances position
func (l *Lexer) readChar() {
	if l.readPosition >= len(l.input) {
		l.ch = 0 // EOF
	} else {
		l.ch = l.input[l.readPosition]
	}
	l.position = l.readPosition
	l.readPosition++

	if l.ch == '\n' {
		l.line++
		l.column = 0
	} else {
		l.column++
	}
}

// peekChar returns the next character without advancing position
func (l *Lexer) peekChar() rune {
	if l.readPosition >= len(l.input) {
		return 0
	}
	return l.input[l.readPosition]
}

// NextToken returns the next token from the input
func (l *Lexer) NextToken() Token {
	var tok Token

	l.skipWhitespace()

	tok.Line = l.line
	tok.Column = l.column

	switch l.ch {
	case '=':
		if l.peekChar() == '=' {
			l.readChar()
			tok = Token{Type: TOKEN_EQ, Literal: "==", Line: l.line, Column: l.column - 1}
		} else {
			tok = l.newToken(TOKEN_ASSIGN, l.ch)
		}
	case '+':
		tok = l.newToken(TOKEN_PLUS, l.ch)
	case '-':
		tok = l.newToken(TOKEN_MINUS, l.ch)
	case '*':
		tok = l.newToken(TOKEN_ASTERISK, l.ch)
	case '/':
		if l.peekChar() == '/' {
			// Skip comment
			for l.ch != '\n' && l.ch != 0 {
				l.readChar()
			}
			// Return next token after comment
			return l.NextToken()
		}
		tok = l.newToken(TOKEN_SLASH, l.ch)
	case '%':
		tok = l.newToken(TOKEN_MODULO, l.ch)
	case '<':
		if l.peekChar() == '=' {
			l.readChar()
			tok = Token{Type: TOKEN_LTE, Literal: "<=", Line: l.line, Column: l.column - 1}
		} else {
			tok = l.newToken(TOKEN_LT, l.ch)
		}
	case '>':
		if l.peekChar() == '=' {
			l.readChar()
			tok = Token{Type: TOKEN_GTE, Literal: ">=", Line: l.line, Column: l.column - 1}
		} else {
			tok = l.newToken(TOKEN_GT, l.ch)
		}
	case '!':
		if l.peekChar() == '=' {
			l.readChar()
			tok = Token{Type: TOKEN_NOT_EQ, Literal: "!=", Line: l.line, Column: l.column - 1}
		} else {
			tok = l.newToken(TOKEN_ILLEGAL, l.ch)
		}
	case ',':
		tok = l.newToken(TOKEN_COMMA, l.ch)
	case '.':
		tok = l.newToken(TOKEN_DOT, l.ch)
	case ':':
		tok = l.newToken(TOKEN_COLON, l.ch)
	case ';':
		tok = l.newToken(TOKEN_SEMICOLON, l.ch)
	case '(':
		tok = l.newToken(TOKEN_LPAREN, l.ch)
	case ')':
		tok = l.newToken(TOKEN_RPAREN, l.ch)
	case '{':
		tok = l.newToken(TOKEN_LBRACE, l.ch)
	case '}':
		tok = l.newToken(TOKEN_RBRACE, l.ch)
	case '[':
		tok = l.newToken(TOKEN_LBRACKET, l.ch)
	case ']':
		tok = l.newToken(TOKEN_RBRACKET, l.ch)
	case '"':
		tok.Type = TOKEN_STRING
		tok.Literal = l.readString()
		tok.Line = l.line
		return tok
	case 0:
		tok.Literal = ""
		tok.Type = TOKEN_EOF
	default:
		if isLetter(l.ch) {
			tok.Literal = l.readIdentifier()
			tok.Type = LookupIdent(tok.Literal)
			tok.Line = l.line
			return tok
		} else if isDigit(l.ch) {
			tok.Literal = l.readNumber()
			tok.Type = TOKEN_NUMBER
			tok.Line = l.line
			return tok
		} else {
			tok = l.newToken(TOKEN_ILLEGAL, l.ch)
		}
	}

	l.readChar()
	return tok
}

// newToken creates a new token with the given type and character
func (l *Lexer) newToken(tokenType TokenType, ch rune) Token {
	return Token{Type: tokenType, Literal: string(ch), Line: l.line, Column: l.column}
}

// skipWhitespace skips whitespace characters
func (l *Lexer) skipWhitespace() {
	for l.ch == ' ' || l.ch == '\t' || l.ch == '\n' || l.ch == '\r' {
		l.readChar()
	}
}

// skipComment skips single-line comments starting with //
func (l *Lexer) skipComment() {
	if l.ch == '/' && l.peekChar() == '/' {
		// Skip until end of line
		for l.ch != '\n' && l.ch != 0 {
			l.readChar()
		}
	}
}

// readIdentifier reads an identifier (including underscores and umlauts)
func (l *Lexer) readIdentifier() string {
	start := l.position
	for isLetter(l.ch) || isDigit(l.ch) || l.ch == '_' {
		l.readChar()
	}
	return string(l.input[start:l.position])
}

// readNumber reads a number (integer or float)
func (l *Lexer) readNumber() string {
	start := l.position
	for isDigit(l.ch) {
		l.readChar()
	}
	// Check for decimal point
	if l.ch == '.' && isDigit(l.peekChar()) {
		l.readChar() // consume '.'
		for isDigit(l.ch) {
			l.readChar()
		}
	}
	return string(l.input[start:l.position])
}

// readString reads a string literal
func (l *Lexer) readString() string {
	l.readChar() // skip opening quote
	start := l.position
	for l.ch != '"' && l.ch != 0 {
		if l.ch == '\\' && l.peekChar() == '"' {
			l.readChar() // skip backslash
		}
		l.readChar()
	}
	str := string(l.input[start:l.position])
	l.readChar() // skip closing quote
	return str
}

// isLetter returns true if the rune is a letter (including German umlauts)
func isLetter(ch rune) bool {
	return unicode.IsLetter(ch) || ch == '_'
}

// isDigit returns true if the rune is a digit
func isDigit(ch rune) bool {
	return ch >= '0' && ch <= '9'
}

// Tokenize returns all tokens from the input
func (l *Lexer) Tokenize() []Token {
	var tokens []Token
	for {
		tok := l.NextToken()
		tokens = append(tokens, tok)
		if tok.Type == TOKEN_EOF {
			break
		}
	}
	return tokens
}
