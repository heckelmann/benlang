package main

import (
	"benlang/internal/auth"
	"benlang/internal/project"
	"benlang/internal/server"
	"benlang/web"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const version = "1.0.0"

func main() {
	// Command line flags
	port := flag.Int("port", 3000, "Port für den Server")
	showVersion := flag.Bool("version", false, "Version anzeigen")
	help := flag.Bool("help", false, "Hilfe anzeigen")
	noBrowser := flag.Bool("no-browser", false, "Browser nicht automatisch öffnen")
	workDirFlag := flag.String("workdir", "", "Basis-Verzeichnis für Projekte")
	enableAuth := flag.Bool("enable-auth", false, "Einfache Authentifizierung (Basic Auth) aktivieren")
	manageUsers := flag.Bool("manage-users", false, "Benutzer für die Web-IDE verwalten")

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
		fmt.Println("  benlang --workdir ./meine-spiele projekt1")
		fmt.Println("  benlang --enable-auth ./meinspiel")
		fmt.Println("  benlang --manage-users")
		fmt.Println("  benlang neu ./neues-spiel")
	}

	flag.Parse()

	if *manageUsers {
		auth.HandleUserManagement()
		return
	}

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

	var projectPath string
	if len(args) > 0 {
		projectPath = args[0]
	}

	// Determine workDir
	var workDir string
	if *workDirFlag != "" {
		absWorkDir, err := filepath.Abs(*workDirFlag)
		if err != nil {
			fmt.Printf("Fehler: Ungültiges Arbeitsverzeichnis: %v\n", err)
			os.Exit(1)
		}
		workDir = absWorkDir
	}

	// If projectPath is relative and workDir is set, make it relative to workDir
	if projectPath != "" && workDir != "" && !filepath.IsAbs(projectPath) {
		projectPath = filepath.Join(workDir, projectPath)
	} else if projectPath == "" && workDir == "" {
		// Only default to current dir if workDir is NOT set
		projectPath = "."
	}

	// Determine project to open
	var proj *project.Project
	if projectPath != "" {
		p, err := project.New(projectPath)
		if err != nil {
			fmt.Printf("Fehler: Konnte Projekt nicht öffnen: %v\n", err)
			os.Exit(1)
		}
		proj = p

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
	} else if workDir == "" {
		// No project path and no workDir -> default to current directory
		p, err := project.New(".")
		if err != nil {
			fmt.Printf("Fehler: Konnte Verzeichnis nicht öffnen: %v\n", err)
			os.Exit(1)
		}
		proj = p
	}

	// If workDir was not set via flag, use the parent of the project path or current dir
	if workDir == "" {
		if proj != nil {
			workDir = filepath.Dir(proj.Path)
		} else {
			abs, _ := filepath.Abs(".")
			workDir = abs
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
	srv.WorkDir = workDir
	srv.AuthEnabled = *enableAuth
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
