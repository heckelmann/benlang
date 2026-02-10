package transpiler

import (
	"benlang/internal/lexer"
	"benlang/internal/parser"
	"strings"
	"testing"
)

func TestTranspileLoeschen(t *testing.T) {
	input := `
FIGUR f = LADE_BILD("test.png")
LOESCHEN(f)
f.LOESCHEN()
`
	l := lexer.New(input)
	p := parser.New(l)
	program := p.ParseProgram()

	tr := New()
	output := tr.Transpile(program)

	if !strings.Contains(output, "_benlang.loescheFigur(f)") {
		t.Errorf("Expected output to contain _benlang.loescheFigur(f), but got:\n%s", output)
	}

	if !strings.Contains(output, "f.LOESCHEN()") {
		t.Errorf("Expected output to contain f.LOESCHEN(), but got:\n%s", output)
	}
}
