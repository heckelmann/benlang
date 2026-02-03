package server

import (
	"benlang/internal/lexer"
	"benlang/internal/parser"
	"benlang/internal/project"
	"benlang/internal/transpiler"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path/filepath"
	"strings"
)

// WebContent will be set from main package with embedded files
var WebContent fs.FS

// Server represents the BenLang HTTP server
type Server struct {
	project *project.Project
	port    int
}

// New creates a new Server
func New(proj *project.Project, port int) *Server {
	return &Server{
		project: proj,
		port:    port,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/dateien", s.handleDateien)
	mux.HandleFunc("/api/datei", s.handleDatei)
	mux.HandleFunc("/api/kompilieren", s.handleKompilieren)
	mux.HandleFunc("/api/bilder", s.handleBilder)
	mux.HandleFunc("/api/hilfe", s.handleHilfe)

	// Project files (images, sounds)
	mux.HandleFunc("/projekt/", s.handleProjektDateien)

	// Static files from embedded web content
	webFS := WebContent

	// Use a custom file server that serves index.html for root
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" {
			path = "/index.html"
		}
		path = strings.TrimPrefix(path, "/")

		file, err := webFS.Open(path)
		if err != nil {
			// Try index.html for SPA routing
			file, err = webFS.Open("index.html")
			if err != nil {
				http.NotFound(w, r)
				return
			}
		}
		defer file.Close()

		// Set content type
		contentType := "text/html"
		switch {
		case strings.HasSuffix(path, ".js"):
			contentType = "application/javascript"
		case strings.HasSuffix(path, ".css"):
			contentType = "text/css"
		case strings.HasSuffix(path, ".png"):
			contentType = "image/png"
		case strings.HasSuffix(path, ".jpg"), strings.HasSuffix(path, ".jpeg"):
			contentType = "image/jpeg"
		case strings.HasSuffix(path, ".svg"):
			contentType = "image/svg+xml"
		}
		w.Header().Set("Content-Type", contentType)

		content, _ := io.ReadAll(file)
		w.Write(content)
	})

	addr := fmt.Sprintf(":%d", s.port)
	fmt.Printf("🎮 BenLang Server gestartet auf http://localhost%s\n", addr)
	fmt.Printf("📁 Projekt: %s\n", s.project.Path)
	fmt.Println("Drücke Strg+C zum Beenden")

	return http.ListenAndServe(addr, mux)
}

// handleDateien returns a list of project files
func (s *Server) handleDateien(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	files, err := s.project.ListFiles()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Load content for .ben files
	for i, f := range files {
		if strings.HasSuffix(f.Name, ".ben") {
			content, err := s.project.ReadFile(f.Name)
			if err == nil {
				files[i].Content = content
			}
		}
	}

	response := map[string]interface{}{
		"projekt": s.project.Name,
		"dateien": files,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleDatei handles reading/writing a single file
func (s *Server) handleDatei(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		name := r.URL.Query().Get("pfad")
		if name == "" {
			http.Error(w, "pfad parameter required", http.StatusBadRequest)
			return
		}

		content, err := s.project.ReadFile(name)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"name":   name,
			"inhalt": content,
		})

	case http.MethodPost:
		var req struct {
			Name   string `json:"name"`
			Inhalt string `json:"inhalt"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := s.project.WriteFile(req.Name, req.Inhalt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]bool{"erfolg": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleKompilieren compiles BenLang code to JavaScript
func (s *Server) handleKompilieren(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Code string `json:"code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Lexer
	l := lexer.New(req.Code)

	// Parser
	p := parser.New(l)
	program := p.ParseProgram()

	// Check for parser errors
	if len(p.Errors()) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"fehler": p.Errors(),
			"js":     "",
		})
		return
	}

	// Transpile to JavaScript
	t := transpiler.New()
	js := t.Transpile(program)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"fehler": []string{},
		"js":     js,
	})
}

// handleBilder handles image uploads
func (s *Server) handleBilder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("bild")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file content
	content, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Save to project
	if err := s.project.SaveImage(header.Filename, content); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"erfolg": true,
		"pfad":   "bilder/" + header.Filename,
	})
}

// handleProjektDateien serves project files (images, sounds)
func (s *Server) handleProjektDateien(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/projekt/")

	// Security: prevent path traversal
	cleanPath := filepath.Clean(path)
	if strings.Contains(cleanPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	content, err := s.project.ReadFile(cleanPath)
	if err != nil {
		// Try in bilder/ directory
		content, err = s.project.ReadFile(filepath.Join("bilder", cleanPath))
		if err != nil {
			http.NotFound(w, r)
			return
		}
	}

	// Set content type based on extension
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".png":
		w.Header().Set("Content-Type", "image/png")
	case ".jpg", ".jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case ".gif":
		w.Header().Set("Content-Type", "image/gif")
	case ".wav":
		w.Header().Set("Content-Type", "audio/wav")
	case ".mp3":
		w.Header().Set("Content-Type", "audio/mpeg")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	w.Write([]byte(content))
}

// handleHilfe serves help documentation
func (s *Server) handleHilfe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	seite := r.URL.Query().Get("seite")
	if seite == "" {
		seite = "01-erste-schritte"
	}

	// Security: prevent path traversal
	seite = filepath.Base(seite)
	if strings.Contains(seite, "..") {
		http.Error(w, "Invalid page", http.StatusBadRequest)
		return
	}

	// Read from embedded help files
	filename := "hilfe/" + seite + ".md"
	file, err := WebContent.Open(filename)
	if err != nil {
		http.Error(w, "Page not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Error reading page", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"seite":  seite,
		"inhalt": string(content),
	})
}
