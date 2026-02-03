package parser

import "benlang/internal/lexer"

// Node is the base interface for all AST nodes
type Node interface {
	TokenLiteral() string
}

// Statement represents a statement node
type Statement interface {
	Node
	statementNode()
}

// Expression represents an expression node
type Expression interface {
	Node
	expressionNode()
}

// Program is the root node of every AST
type Program struct {
	Statements []Statement
}

func (p *Program) TokenLiteral() string {
	if len(p.Statements) > 0 {
		return p.Statements[0].TokenLiteral()
	}
	return ""
}

// Identifier represents a variable or function name
type Identifier struct {
	Token lexer.Token
	Value string
}

func (i *Identifier) expressionNode()      {}
func (i *Identifier) TokenLiteral() string { return i.Token.Literal }

// NumberLiteral represents a numeric value
type NumberLiteral struct {
	Token lexer.Token
	Value float64
}

func (nl *NumberLiteral) expressionNode()      {}
func (nl *NumberLiteral) TokenLiteral() string { return nl.Token.Literal }

// StringLiteral represents a string value
type StringLiteral struct {
	Token lexer.Token
	Value string
}

func (sl *StringLiteral) expressionNode()      {}
func (sl *StringLiteral) TokenLiteral() string { return sl.Token.Literal }

// BooleanLiteral represents wahr/falsch
type BooleanLiteral struct {
	Token lexer.Token
	Value bool
}

func (bl *BooleanLiteral) expressionNode()      {}
func (bl *BooleanLiteral) TokenLiteral() string { return bl.Token.Literal }

// ArrayLiteral represents an array [1, 2, 3]
type ArrayLiteral struct {
	Token    lexer.Token // the '[' token
	Elements []Expression
}

func (al *ArrayLiteral) expressionNode()      {}
func (al *ArrayLiteral) TokenLiteral() string { return al.Token.Literal }

// IndexExpression represents array[index]
type IndexExpression struct {
	Token lexer.Token // the '[' token
	Left  Expression
	Index Expression
}

func (ie *IndexExpression) expressionNode()      {}
func (ie *IndexExpression) TokenLiteral() string { return ie.Token.Literal }

// PrefixExpression represents -x or NICHT x
type PrefixExpression struct {
	Token    lexer.Token
	Operator string
	Right    Expression
}

func (pe *PrefixExpression) expressionNode()      {}
func (pe *PrefixExpression) TokenLiteral() string { return pe.Token.Literal }

// InfixExpression represents x + y, x UND y, etc.
type InfixExpression struct {
	Token    lexer.Token
	Left     Expression
	Operator string
	Right    Expression
}

func (ie *InfixExpression) expressionNode()      {}
func (ie *InfixExpression) TokenLiteral() string { return ie.Token.Literal }

// CallExpression represents function calls: meineFunktion(arg1, arg2)
type CallExpression struct {
	Token     lexer.Token // the '(' token
	Function  Expression  // Identifier or MemberExpression
	Arguments []Expression
}

func (ce *CallExpression) expressionNode()      {}
func (ce *CallExpression) TokenLiteral() string { return ce.Token.Literal }

// MemberExpression represents object.property or object.method()
type MemberExpression struct {
	Token    lexer.Token // the '.' token
	Object   Expression
	Property *Identifier
}

func (me *MemberExpression) expressionNode()      {}
func (me *MemberExpression) TokenLiteral() string { return me.Token.Literal }

// AssignmentExpression represents x = 5 or objekt.eigenschaft = wert
type AssignmentExpression struct {
	Token lexer.Token
	Left  Expression // Identifier or MemberExpression
	Value Expression
}

func (ae *AssignmentExpression) expressionNode()      {}
func (ae *AssignmentExpression) TokenLiteral() string { return ae.Token.Literal }

// VariableDeclaration represents VAR x = 5
type VariableDeclaration struct {
	Token lexer.Token // VAR or VARIABLE token
	Name  *Identifier
	Value Expression
}

func (vd *VariableDeclaration) statementNode()       {}
func (vd *VariableDeclaration) TokenLiteral() string { return vd.Token.Literal }

// FigurDeclaration represents FIGUR name = LADE_BILD("pfad")
type FigurDeclaration struct {
	Token lexer.Token
	Name  *Identifier
	Value Expression
}

func (fd *FigurDeclaration) statementNode()       {}
func (fd *FigurDeclaration) TokenLiteral() string { return fd.Token.Literal }

// FunctionDeclaration represents FUNKTION name(params) { body }
type FunctionDeclaration struct {
	Token      lexer.Token
	Name       *Identifier
	Parameters []*Identifier
	Body       *BlockStatement
}

func (fd *FunctionDeclaration) statementNode()       {}
func (fd *FunctionDeclaration) TokenLiteral() string { return fd.Token.Literal }

// ReturnStatement represents ZURUECK expression
type ReturnStatement struct {
	Token       lexer.Token
	ReturnValue Expression
}

func (rs *ReturnStatement) statementNode()       {}
func (rs *ReturnStatement) TokenLiteral() string { return rs.Token.Literal }

// ExpressionStatement wraps an expression as a statement
type ExpressionStatement struct {
	Token      lexer.Token
	Expression Expression
}

func (es *ExpressionStatement) statementNode()       {}
func (es *ExpressionStatement) TokenLiteral() string { return es.Token.Literal }

// BlockStatement represents { statements }
type BlockStatement struct {
	Token      lexer.Token // the '{' token
	Statements []Statement
}

func (bs *BlockStatement) statementNode()       {}
func (bs *BlockStatement) TokenLiteral() string { return bs.Token.Literal }

// IfStatement represents WENN condition { } SONST { }
type IfStatement struct {
	Token       lexer.Token
	Condition   Expression
	Consequence *BlockStatement
	Alternative *BlockStatement // can be nil or contain another IfStatement for SONST WENN
}

func (is *IfStatement) statementNode()       {}
func (is *IfStatement) TokenLiteral() string { return is.Token.Literal }

// WhileStatement represents SOLANGE condition { }
type WhileStatement struct {
	Token     lexer.Token
	Condition Expression
	Body      *BlockStatement
}

func (ws *WhileStatement) statementNode()       {}
func (ws *WhileStatement) TokenLiteral() string { return ws.Token.Literal }

// ForStatement represents FUER x VON start BIS end { }
type ForStatement struct {
	Token    lexer.Token
	Variable *Identifier
	Start    Expression
	End      Expression
	Body     *BlockStatement
}

func (fs *ForStatement) statementNode()       {}
func (fs *ForStatement) TokenLiteral() string { return fs.Token.Literal }

// RepeatStatement represents WIEDERHOLE n { }
type RepeatStatement struct {
	Token lexer.Token
	Count Expression
	Body  *BlockStatement
}

func (rs *RepeatStatement) statementNode()       {}
func (rs *RepeatStatement) TokenLiteral() string { return rs.Token.Literal }

// GameDeclaration represents SPIEL "Name"
type GameDeclaration struct {
	Token lexer.Token
	Name  string
}

func (gd *GameDeclaration) statementNode()       {}
func (gd *GameDeclaration) TokenLiteral() string { return gd.Token.Literal }

// EventHandler represents WENN_START, WENN_IMMER, WENN_TASTE, WENN_KOLLISION
type EventHandler struct {
	Token      lexer.Token
	EventType  string       // "start", "immer", "taste", "kollision"
	Parameters []Expression // for WENN_TASTE(taste) or WENN_KOLLISION(a, b)
	Body       *BlockStatement
}

func (eh *EventHandler) statementNode()       {}
func (eh *EventHandler) TokenLiteral() string { return eh.Token.Literal }
