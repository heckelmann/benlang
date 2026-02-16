package web

import "embed"

//go:embed all:index.html all:hilfe.html all:login.html all:css all:js all:assets all:hilfe
var Content embed.FS
