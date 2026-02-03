package lexer

// TokenType represents the type of a token
type TokenType string

const (
	// Special tokens
	TOKEN_ILLEGAL TokenType = "ILLEGAL"
	TOKEN_EOF     TokenType = "EOF"

	// Identifiers and literals
	TOKEN_IDENT  TokenType = "IDENT"  // variable names, function names
	TOKEN_NUMBER TokenType = "NUMBER" // 123, 3.14
	TOKEN_STRING TokenType = "STRING" // "hello"

	// Operators
	TOKEN_PLUS     TokenType = "+"
	TOKEN_MINUS    TokenType = "-"
	TOKEN_ASTERISK TokenType = "*"
	TOKEN_SLASH    TokenType = "/"
	TOKEN_MODULO   TokenType = "%"

	TOKEN_LT     TokenType = "<"
	TOKEN_GT     TokenType = ">"
	TOKEN_LTE    TokenType = "<="
	TOKEN_GTE    TokenType = ">="
	TOKEN_EQ     TokenType = "=="
	TOKEN_NOT_EQ TokenType = "!="

	TOKEN_ASSIGN TokenType = "="

	// Delimiters
	TOKEN_COMMA     TokenType = ","
	TOKEN_DOT       TokenType = "."
	TOKEN_COLON     TokenType = ":"
	TOKEN_SEMICOLON TokenType = ";"
	TOKEN_LPAREN    TokenType = "("
	TOKEN_RPAREN    TokenType = ")"
	TOKEN_LBRACE    TokenType = "{"
	TOKEN_RBRACE    TokenType = "}"
	TOKEN_LBRACKET  TokenType = "["
	TOKEN_RBRACKET  TokenType = "]"

	// German Keywords - Control Flow
	TOKEN_WENN       TokenType = "WENN"       // if
	TOKEN_SONST      TokenType = "SONST"      // else
	TOKEN_SOLANGE    TokenType = "SOLANGE"    // while
	TOKEN_FUER       TokenType = "FUER"       // for
	TOKEN_VON        TokenType = "VON"        // from
	TOKEN_BIS        TokenType = "BIS"        // to
	TOKEN_WIEDERHOLE TokenType = "WIEDERHOLE" // repeat

	// German Keywords - Functions
	TOKEN_FUNKTION TokenType = "FUNKTION" // function
	TOKEN_ZURUECK  TokenType = "ZURUECK"  // return

	// German Keywords - Variables
	TOKEN_VARIABLE TokenType = "VARIABLE" // var declaration
	TOKEN_VAR      TokenType = "VAR"      // var (short form)

	// German Keywords - Boolean
	TOKEN_WAHR   TokenType = "WAHR"   // true
	TOKEN_FALSCH TokenType = "FALSCH" // false

	// German Keywords - Logical Operators
	TOKEN_UND   TokenType = "UND"   // and
	TOKEN_ODER  TokenType = "ODER"  // or
	TOKEN_NICHT TokenType = "NICHT" // not

	// German Keywords - Game specific
	TOKEN_SPIEL          TokenType = "SPIEL"          // game
	TOKEN_FIGUR          TokenType = "FIGUR"          // sprite/figure
	TOKEN_WENN_TASTE     TokenType = "WENN_TASTE"     // on key
	TOKEN_WENN_KOLLISION TokenType = "WENN_KOLLISION" // on collision
	TOKEN_WENN_START     TokenType = "WENN_START"     // on start
	TOKEN_WENN_IMMER     TokenType = "WENN_IMMER"     // on update (every frame)
)

// Token represents a lexical token
type Token struct {
	Type    TokenType
	Literal string
	Line    int
	Column  int
}

// keywords maps German keywords to their token types
var keywords = map[string]TokenType{
	// Control flow
	"wenn":       TOKEN_WENN,
	"sonst":      TOKEN_SONST,
	"solange":    TOKEN_SOLANGE,
	"fuer":       TOKEN_FUER,
	"für":        TOKEN_FUER,
	"von":        TOKEN_VON,
	"bis":        TOKEN_BIS,
	"wiederhole": TOKEN_WIEDERHOLE,

	// Functions
	"funktion": TOKEN_FUNKTION,
	"zurueck":  TOKEN_ZURUECK,
	"zurück":   TOKEN_ZURUECK,

	// Variables
	"variable": TOKEN_VARIABLE,
	"var":      TOKEN_VAR,

	// Boolean
	"wahr":   TOKEN_WAHR,
	"falsch": TOKEN_FALSCH,

	// Logical
	"und":   TOKEN_UND,
	"oder":  TOKEN_ODER,
	"nicht": TOKEN_NICHT,

	// Game specific
	"spiel":          TOKEN_SPIEL,
	"figur":          TOKEN_FIGUR,
	"wenn_taste":     TOKEN_WENN_TASTE,
	"wenn_kollision": TOKEN_WENN_KOLLISION,
	"wenn_start":     TOKEN_WENN_START,
	"wenn_immer":     TOKEN_WENN_IMMER,
}

// LookupIdent checks if an identifier is a keyword
func LookupIdent(ident string) TokenType {
	// Convert to lowercase for case-insensitive matching
	lower := toLower(ident)
	if tok, ok := keywords[lower]; ok {
		return tok
	}
	return TOKEN_IDENT
}

// toLower converts a string to lowercase (handling German umlauts)
func toLower(s string) string {
	result := make([]rune, 0, len(s))
	for _, r := range s {
		switch r {
		case 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
			'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z':
			result = append(result, r+32)
		case 'Ä':
			result = append(result, 'ä')
		case 'Ö':
			result = append(result, 'ö')
		case 'Ü':
			result = append(result, 'ü')
		default:
			result = append(result, r)
		}
	}
	return string(result)
}
