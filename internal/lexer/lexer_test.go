package lexer

import "testing"

func TestNextToken(t *testing.T) {
	input := `VAR punkte = 0
FIGUR spieler = LADE_BILD("held.png")

WENN_START {
    spieler.x = 100
}

WENN punkte > 10 {
    ZEIGE_TEXT("Gewonnen!")
}

FUNKTION addiere(a, b) {
    ZURUECK a + b
}
`

	tests := []struct {
		expectedType    TokenType
		expectedLiteral string
	}{
		{TOKEN_VAR, "VAR"},
		{TOKEN_IDENT, "punkte"},
		{TOKEN_ASSIGN, "="},
		{TOKEN_NUMBER, "0"},
		{TOKEN_FIGUR, "FIGUR"},
		{TOKEN_IDENT, "spieler"},
		{TOKEN_ASSIGN, "="},
		{TOKEN_IDENT, "LADE_BILD"},
		{TOKEN_LPAREN, "("},
		{TOKEN_STRING, "held.png"},
		{TOKEN_RPAREN, ")"},
		{TOKEN_WENN_START, "WENN_START"},
		{TOKEN_LBRACE, "{"},
		{TOKEN_IDENT, "spieler"},
		{TOKEN_DOT, "."},
		{TOKEN_IDENT, "x"},
		{TOKEN_ASSIGN, "="},
		{TOKEN_NUMBER, "100"},
		{TOKEN_RBRACE, "}"},
		{TOKEN_WENN, "WENN"},
		{TOKEN_IDENT, "punkte"},
		{TOKEN_GT, ">"},
		{TOKEN_NUMBER, "10"},
		{TOKEN_LBRACE, "{"},
		{TOKEN_IDENT, "ZEIGE_TEXT"},
		{TOKEN_LPAREN, "("},
		{TOKEN_STRING, "Gewonnen!"},
		{TOKEN_RPAREN, ")"},
		{TOKEN_RBRACE, "}"},
		{TOKEN_FUNKTION, "FUNKTION"},
		{TOKEN_IDENT, "addiere"},
		{TOKEN_LPAREN, "("},
		{TOKEN_IDENT, "a"},
		{TOKEN_COMMA, ","},
		{TOKEN_IDENT, "b"},
		{TOKEN_RPAREN, ")"},
		{TOKEN_LBRACE, "{"},
		{TOKEN_ZURUECK, "ZURUECK"},
		{TOKEN_IDENT, "a"},
		{TOKEN_PLUS, "+"},
		{TOKEN_IDENT, "b"},
		{TOKEN_RBRACE, "}"},
		{TOKEN_EOF, ""},
	}

	l := New(input)

	for i, tt := range tests {
		tok := l.NextToken()

		if tok.Type != tt.expectedType {
			t.Fatalf("tests[%d] - tokentype wrong. expected=%q, got=%q (literal=%q)",
				i, tt.expectedType, tok.Type, tok.Literal)
		}

		if tok.Literal != tt.expectedLiteral {
			t.Fatalf("tests[%d] - literal wrong. expected=%q, got=%q",
				i, tt.expectedLiteral, tok.Literal)
		}
	}
}

func TestGermanKeywords(t *testing.T) {
	tests := []struct {
		input    string
		expected TokenType
	}{
		{"wenn", TOKEN_WENN},
		{"WENN", TOKEN_WENN},
		{"Wenn", TOKEN_WENN},
		{"sonst", TOKEN_SONST},
		{"solange", TOKEN_SOLANGE},
		{"für", TOKEN_FUER},
		{"fuer", TOKEN_FUER},
		{"von", TOKEN_VON},
		{"bis", TOKEN_BIS},
		{"funktion", TOKEN_FUNKTION},
		{"zurück", TOKEN_ZURUECK},
		{"zurueck", TOKEN_ZURUECK},
		{"var", TOKEN_VAR},
		{"variable", TOKEN_VARIABLE},
		{"wahr", TOKEN_WAHR},
		{"falsch", TOKEN_FALSCH},
		{"und", TOKEN_UND},
		{"oder", TOKEN_ODER},
		{"nicht", TOKEN_NICHT},
		{"spiel", TOKEN_SPIEL},
		{"figur", TOKEN_FIGUR},
		{"wenn_start", TOKEN_WENN_START},
		{"wenn_immer", TOKEN_WENN_IMMER},
		{"wenn_taste", TOKEN_WENN_TASTE},
		{"wenn_kollision", TOKEN_WENN_KOLLISION},
	}

	for _, tt := range tests {
		l := New(tt.input)
		tok := l.NextToken()

		if tok.Type != tt.expected {
			t.Errorf("keyword %q - expected=%q, got=%q",
				tt.input, tt.expected, tok.Type)
		}
	}
}

func TestOperators(t *testing.T) {
	input := `+ - * / % < > <= >= == != =`

	tests := []struct {
		expectedType    TokenType
		expectedLiteral string
	}{
		{TOKEN_PLUS, "+"},
		{TOKEN_MINUS, "-"},
		{TOKEN_ASTERISK, "*"},
		{TOKEN_SLASH, "/"},
		{TOKEN_MODULO, "%"},
		{TOKEN_LT, "<"},
		{TOKEN_GT, ">"},
		{TOKEN_LTE, "<="},
		{TOKEN_GTE, ">="},
		{TOKEN_EQ, "=="},
		{TOKEN_NOT_EQ, "!="},
		{TOKEN_ASSIGN, "="},
		{TOKEN_EOF, ""},
	}

	l := New(input)

	for i, tt := range tests {
		tok := l.NextToken()

		if tok.Type != tt.expectedType {
			t.Fatalf("tests[%d] - tokentype wrong. expected=%q, got=%q",
				i, tt.expectedType, tok.Type)
		}

		if tok.Literal != tt.expectedLiteral {
			t.Fatalf("tests[%d] - literal wrong. expected=%q, got=%q",
				i, tt.expectedLiteral, tok.Literal)
		}
	}
}

func TestComments(t *testing.T) {
	input := `VAR x = 5 // Dies ist ein Kommentar
VAR y = 10`

	l := New(input)

	tests := []struct {
		expectedType TokenType
	}{
		{TOKEN_VAR},
		{TOKEN_IDENT},
		{TOKEN_ASSIGN},
		{TOKEN_NUMBER},
		{TOKEN_VAR},
		{TOKEN_IDENT},
		{TOKEN_ASSIGN},
		{TOKEN_NUMBER},
		{TOKEN_EOF},
	}

	for i, tt := range tests {
		tok := l.NextToken()

		if tok.Type != tt.expectedType {
			t.Fatalf("tests[%d] - tokentype wrong. expected=%q, got=%q",
				i, tt.expectedType, tok.Type)
		}
	}
}
