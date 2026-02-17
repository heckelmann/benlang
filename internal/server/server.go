package server

import (
	"benlang/internal/auth"
	"benlang/internal/lexer"
	"benlang/internal/parser"
	"benlang/internal/project"
	"benlang/internal/transpiler"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// WebContent will be set from main package with embedded files
var WebContent fs.FS

// Server represents the BenLang HTTP server
type Server struct {
	project     *project.Project
	port        int
	WorkDir     string
	AuthEnabled bool
	auth        *auth.Credentials
	mu          sync.RWMutex
}

// New creates a new Server
func New(proj *project.Project, port int) *Server {
	creds, _ := auth.LoadCredentials()
	return &Server{
		project: proj,
		port:    port,
		auth:    creds,
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
	mux.HandleFunc("/api/login", s.handleLogin)
	mux.HandleFunc("/api/logout", s.handleLogout)

	// Projektverwaltung API
	mux.HandleFunc("/api/projekte/liste", s.handleProjekteListe)
	mux.HandleFunc("/api/projekte/neu", s.handleProjekteNeu)
	mux.HandleFunc("/api/projekte/oeffnen", s.handleProjekteOeffnen)
	mux.HandleFunc("/api/system/info", s.handleSystemInfo)

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
	if s.project != nil {
		fmt.Printf("📁 Projekt: %s\n", s.project.Path)
	} else {
		fmt.Printf("📁 Kein Projekt geladen (Arbeitsverzeichnis: %s)\n", s.WorkDir)
	}
	if s.AuthEnabled {
		fmt.Println("🔒 Authentifizierung ist AKTIVIERT")
	}
	fmt.Println("Drücke Strg+C zum Beenden")

	handler := s.wrapAuth(mux)
	return http.ListenAndServe(addr, handler)
}

func (s *Server) wrapAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.AuthEnabled {
			next.ServeHTTP(w, r)
			return
		}

		// Allow access to login page and login API
		if r.URL.Path == "/login.html" || r.URL.Path == "/api/login" {
			next.ServeHTTP(w, r)
			return
		}

		// Check session cookie
		cookie, err := r.Cookie("session")
		if err != nil {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, "/login.html", http.StatusSeeOther)
			}
			return
		}

		_, authenticated := s.auth.GetUsernameFromSession(cookie.Value)
		if !authenticated {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
			} else {
				http.Redirect(w, r, "/login.html", http.StatusSeeOther)
			}
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !s.auth.Verify(req.Username, req.Password) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := s.auth.CreateSession(req.Username)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true if using HTTPS
		SameSite: http.SameSiteStrictMode,
	})

	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err == nil {
		s.auth.DeleteSession(cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	http.Redirect(w, r, "/login.html", http.StatusSeeOther)
}

func (s *Server) handleDateien(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.project == nil {
		response := map[string]interface{}{
			"projekt": nil,
			"dateien": []interface{}{},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	files, err := s.project.ListFiles()
	projectName := s.project.Name

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
		"projekt": projectName,
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

		s.mu.RLock()
		defer s.mu.RUnlock()

		if s.project == nil {
			http.Error(w, "Kein Projekt geladen", http.StatusNotFound)
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

		s.mu.Lock()
		err := s.project.WriteFile(req.Name, req.Inhalt)
		s.mu.Unlock()

		if err != nil {
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

	s.mu.Lock()
	defer s.mu.Unlock()

	if s.project == nil {
		http.Error(w, "Kein Projekt geladen", http.StatusForbidden)
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
	err = s.project.SaveImage(header.Filename, content)

	if err != nil {
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

	s.mu.RLock()
	content, err := s.project.ReadFile(cleanPath)
	if err != nil {
		// Try in bilder/ directory
		content, err = s.project.ReadFile(filepath.Join("bilder", cleanPath))
	}
	s.mu.RUnlock()

	if err != nil {
		http.NotFound(w, r)
		return
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

// handleProjekteListe returns a list of directories in WorkDir
func (s *Server) handleProjekteListe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	entries, err := os.ReadDir(s.WorkDir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var projekte []string
	for _, entry := range entries {
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			projekte = append(projekte, entry.Name())
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projekte)
}

// handleProjekteNeu creates a new project
func (s *Server) handleProjekteNeu(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Security: check name
	if req.Name == "" || strings.Contains(req.Name, "..") || strings.Contains(req.Name, "/") || strings.Contains(req.Name, "\\") {
		http.Error(w, "Ungültiger Projektname", http.StatusBadRequest)
		return
	}

	projectPath := filepath.Join(s.WorkDir, req.Name)

	s.mu.Lock()
	defer s.mu.Unlock()

	proj, err := project.New(projectPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := proj.CreateDefaultProject(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.project = proj

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"erfolg": true, "projekt": s.project.Name})
}

// handleProjekteOeffnen switches to an existing project
func (s *Server) handleProjekteOeffnen(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Security: check name
	if req.Name == "" || strings.Contains(req.Name, "..") || strings.Contains(req.Name, "/") || strings.Contains(req.Name, "\\") {
		http.Error(w, "Ungültiger Projektname", http.StatusBadRequest)
		return
	}

	projectPath := filepath.Join(s.WorkDir, req.Name)

	s.mu.Lock()
	defer s.mu.Unlock()

	proj, err := project.New(projectPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.project = proj

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"erfolg": true, "projekt": s.project.Name})
}

// handleSystemInfo returns information about the server
func (s *Server) handleSystemInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	var projectName interface{} = nil
	if s.project != nil {
		projectName = s.project.Name
	}
	s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"projekt": projectName,
		"workdir": s.WorkDir,
	})
}
