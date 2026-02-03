package main

import (
	"benlang/internal/project"
	"benlang/internal/server"
	"benlang/web"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

const version = "1.0.0"

func main() {
	// Command line flags
	port := flag.Int("port", 3000, "Port für den Server")
	showVersion := flag.Bool("version", false, "Version anzeigen")
	help := flag.Bool("help", false, "Hilfe anzeigen")
	noBrowser := flag.Bool("no-browser", false, "Browser nicht automatisch öffnen")

	flag.Usage = func() {
		fmt.Println("BenLang - Eine Programmiersprache für Kinder")
		fmt.Println()
		fmt.Println("Verwendung:")
		fmt.Println("  benlang [optionen] <projektordner>")
		fmt.Println("  benlang neu <projektordner>       Neues Projekt erstellen")
		fmt.Println()
		fmt.Println("Optionen:")
		flag.PrintDefaults()
		fmt.Println()
		fmt.Println("Beispiele:")
		fmt.Println("  benlang /pfad/zu/meinspiel")
		fmt.Println("  benlang --port 8080 ./meinspiel")
		fmt.Println("  benlang neu ./neues-spiel")
	}

	flag.Parse()

	if *showVersion {
		fmt.Printf("BenLang Version %s\n", version)
		return
	}

	if *help {
		flag.Usage()
		return
	}

	args := flag.Args()

	// Handle 'neu' command
	if len(args) >= 2 && args[0] == "neu" {
		createNewProject(args[1])
		return
	}

	// Require a project path
	if len(args) < 1 {
		fmt.Println("🎮 BenLang - Programmieren für Kinder")
		fmt.Println()
		fmt.Println("Verwendung: benlang <projektordner>")
		fmt.Println()
		fmt.Println("Beispiele:")
		fmt.Println("  benlang ./meinspiel")
		fmt.Println("  benlang neu ./neues-spiel")
		fmt.Println()
		fmt.Println("Für mehr Hilfe: benlang --help")
		os.Exit(1)
	}

	projectPath := args[0]

	// Create or open project
	proj, err := project.New(projectPath)
	if err != nil {
		fmt.Printf("Fehler: Konnte Projekt nicht öffnen: %v\n", err)
		os.Exit(1)
	}

	// Check if project has any .ben files, if not create default
	files, _ := proj.ListFiles()
	hasBenFile := false
	for _, f := range files {
		if len(f.Name) > 4 && f.Name[len(f.Name)-4:] == ".ben" {
			hasBenFile = true
			break
		}
	}

	if !hasBenFile {
		fmt.Println("📁 Erstelle Standardprojekt...")
		if err := proj.CreateDefaultProject(); err != nil {
			fmt.Printf("Warnung: Konnte Standardprojekt nicht erstellen: %v\n", err)
		}
	}

	// Set embedded web content for server
	server.WebContent = web.Content

	// Open browser
	if !*noBrowser {
		url := fmt.Sprintf("http://localhost:%d", *port)
		go openBrowser(url)
	}

	// Start server
	srv := server.New(proj, *port)
	if err := srv.Start(); err != nil {
		fmt.Printf("Fehler: Server konnte nicht gestartet werden: %v\n", err)
		os.Exit(1)
	}
}

func createNewProject(path string) {
	proj, err := project.New(path)
	if err != nil {
		fmt.Printf("Fehler: Konnte Projekt nicht erstellen: %v\n", err)
		os.Exit(1)
	}

	if err := proj.CreateDefaultProject(); err != nil {
		fmt.Printf("Fehler: Konnte Standarddateien nicht erstellen: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Neues Projekt erstellt: %s\n", proj.Path)
	fmt.Printf("\nStarte mit: benlang %s\n", path)
}

func openBrowser(url string) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}

	cmd.Start()
}
