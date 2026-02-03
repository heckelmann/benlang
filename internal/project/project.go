package project

import (
	"os"
	"path/filepath"
	"strings"
)

// Project represents a BenLang project
type Project struct {
	Path string
	Name string
}

// FileInfo represents information about a project file
type FileInfo struct {
	Name    string `json:"name"`
	IsDir   bool   `json:"isDir"`
	Size    int64  `json:"size"`
	Content string `json:"inhalt,omitempty"`
}

// New creates a new Project instance
func New(path string) (*Project, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, err
	}

	// Create directory if it doesn't exist
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		if err := os.MkdirAll(absPath, 0755); err != nil {
			return nil, err
		}
	}

	name := filepath.Base(absPath)

	return &Project{
		Path: absPath,
		Name: name,
	}, nil
}

// ListFiles returns all files in the project
func (p *Project) ListFiles() ([]FileInfo, error) {
	var files []FileInfo

	err := filepath.Walk(p.Path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip hidden files and directories
		if strings.HasPrefix(info.Name(), ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		// Only include relevant files
		ext := strings.ToLower(filepath.Ext(info.Name()))
		if info.IsDir() || ext == ".ben" || ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".wav" || ext == ".mp3" {
			relPath, _ := filepath.Rel(p.Path, path)
			if relPath == "." {
				return nil
			}

			files = append(files, FileInfo{
				Name:  relPath,
				IsDir: info.IsDir(),
				Size:  info.Size(),
			})
		}

		return nil
	})

	return files, err
}

// ReadFile reads a file from the project
func (p *Project) ReadFile(name string) (string, error) {
	path := filepath.Join(p.Path, name)

	// Security check: ensure the path is within the project
	if !strings.HasPrefix(path, p.Path) {
		return "", os.ErrPermission
	}

	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

// WriteFile writes a file to the project
func (p *Project) WriteFile(name, content string) error {
	path := filepath.Join(p.Path, name)

	// Security check: ensure the path is within the project
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}
	if !strings.HasPrefix(absPath, p.Path) {
		return os.ErrPermission
	}

	// Create directory if needed
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(path, []byte(content), 0644)
}

// SaveImage saves an uploaded image to the project
func (p *Project) SaveImage(name string, data []byte) error {
	// Ensure images directory exists
	imagesDir := filepath.Join(p.Path, "bilder")
	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		return err
	}

	path := filepath.Join(imagesDir, name)
	return os.WriteFile(path, data, 0644)
}

// CreateDefaultProject creates a default project structure
func (p *Project) CreateDefaultProject() error {
	// Create directories
	dirs := []string{"bilder", "toene"}
	for _, dir := range dirs {
		if err := os.MkdirAll(filepath.Join(p.Path, dir), 0755); err != nil {
			return err
		}
	}

	// Create default main file
	defaultCode := `// Willkommen bei BenLang!
// Drücke "Starten" um dein Spiel zu spielen

SPIEL "Mein erstes Spiel"

VAR punkte = 0
VAR x = 400
VAR y = 300

WENN_START {
    ZEIGE_TEXT("Benutze die Pfeiltasten!", 280, 280)
}

WENN_IMMER {
    // Hintergrund löschen und neu zeichnen
    ZEICHNE_RECHTECK(0, 0, 800, 600, "#1a1a2e")
    
    // Spieler zeichnen
    ZEICHNE_KREIS(x, y, 25, "#4ecca3")
    
    // Bewegung
    WENN TASTE_GEDRUECKT("links") {
        x = x - 5
    }
    WENN TASTE_GEDRUECKT("rechts") {
        x = x + 5
    }
    WENN TASTE_GEDRUECKT("hoch") {
        y = y - 5
    }
    WENN TASTE_GEDRUECKT("runter") {
        y = y + 5
    }
    
    // Punkte anzeigen
    ZEICHNE_RECHTECK(10, 10, 120, 35, "#16213e")
    ZEIGE_TEXT("Punkte: " + punkte, 20, 35, "#ffffff")
}

WENN_TASTE("leertaste") {
    punkte = punkte + 1
}
`

	return p.WriteFile("hauptspiel.ben", defaultCode)
}

// Exists checks if a file exists in the project
func (p *Project) Exists(name string) bool {
	path := filepath.Join(p.Path, name)
	_, err := os.Stat(path)
	return err == nil
}
