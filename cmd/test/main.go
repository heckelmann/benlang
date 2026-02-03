package main

import (
	"benlang/internal/lexer"
	"benlang/internal/parser"
	"benlang/internal/transpiler"
	"fmt"
	"os"
)

func main() {
	code, _ := os.ReadFile(os.Args[1])
	l := lexer.New(string(code))
	p := parser.New(l)
	program := p.ParseProgram()
	t := transpiler.New()
	js := t.Transpile(program)
	fmt.Println(js)
}
