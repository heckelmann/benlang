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

	if !strings.Contains(output, "f.loeschen()") {
		t.Errorf("Expected output to contain f.loeschen(), but got:\n%s", output)
	}
}

func TestTranspileFigureMethods(t *testing.T) {
	input := `
FIGUR f = LADE_BILD("test.png")
GEHE_ZU(f, 100, 200)
DREHE(f, 45)
SKALIERE(f, 2)
f.GEHE_ZU(10, 20)
f.DREHE(10)
f.SKALIERE(0.5)
`
	l := lexer.New(input)
	p := parser.New(l)
	program := p.ParseProgram()

	tr := New()
	output := tr.Transpile(program)

	cases := []string{
		"_benlang.geheZu(f, 100, 200)",
		"_benlang.drehe(f, 45)",
		"_benlang.skaliere(f, 2)",
		"f.gehe_zu(10, 20)",
		"f.drehe(10)",
		"f.skaliere(0.5)",
	}

	for _, c := range cases {
		if !strings.Contains(output, c) {
			t.Errorf("Expected output to contain %s, but got:\n%s", c, output)
		}
	}
}
