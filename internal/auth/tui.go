package auth

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

func HandleUserManagement() {
	creds, err := LoadCredentials()
	if err != nil {
		fmt.Printf("Fehler beim Laden der Zugangsdaten: %v\n", err)
		return
	}

	reader := bufio.NewReader(os.Stdin)

	fmt.Println("👤 BenLang Benutzerverwaltung")
	fmt.Println("---------------------------")

	for {
		fmt.Println("\nWas möchtest du tun?")
		fmt.Println("1) Benutzer auflisten")
		fmt.Println("2) Neuen Benutzer anlegen")
		fmt.Println("3) Passwort ändern")
		fmt.Println("4) Benutzer löschen")
		fmt.Println("q) Beenden")
		fmt.Print("\nAuswahl: ")

		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		switch input {
		case "1":
			listUsers(creds)
		case "2":
			addUser(creds, reader)
		case "3":
			updatePassword(creds, reader)
		case "4":
			deleteUser(creds, reader)
		case "q", "quit", "exit":
			return
		default:
			fmt.Println("❌ Ungültige Auswahl")
		}
	}
}

func listUsers(c *Credentials) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if len(c.Users) == 0 {
		fmt.Println("Keine Benutzer gefunden.")
		return
	}

	fmt.Println("\nRegistrierte Benutzer:")
	var names []string
	for name := range c.Users {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		fmt.Printf("- %s\n", name)
	}
}

func addUser(c *Credentials, r *bufio.Reader) {
	fmt.Print("Benutzername: ")
	username, _ := r.ReadString('\n')
	username = strings.TrimSpace(username)

	if username == "" {
		fmt.Println("❌ Name darf nicht leer sein")
		return
	}

	fmt.Print("Passwort: ")
	password, _ := r.ReadString('\n')
	password = strings.TrimSpace(password)

	if err := c.AddUser(username, password); err != nil {
		fmt.Printf("❌ Fehler: %v\n", err)
		return
	}

	if err := c.Save(); err != nil {
		fmt.Printf("❌ Fehler beim Speichern: %v\n", err)
		return
	}

	fmt.Printf("✅ Benutzer '%s' wurde angelegt.\n", username)
}

func updatePassword(c *Credentials, r *bufio.Reader) {
	fmt.Print("Benutzername: ")
	username, _ := r.ReadString('\n')
	username = strings.TrimSpace(username)

	fmt.Print("Neues Passwort: ")
	password, _ := r.ReadString('\n')
	password = strings.TrimSpace(password)

	if err := c.UpdateUser(username, password); err != nil {
		fmt.Printf("❌ Fehler: %v\n", err)
		return
	}

	if err := c.Save(); err != nil {
		fmt.Printf("❌ Fehler beim Speichern: %v\n", err)
		return
	}

	fmt.Printf("✅ Passwort für '%s' wurde aktualisiert.\n", username)
}

func deleteUser(c *Credentials, r *bufio.Reader) {
	fmt.Print("Welchen Benutzer möchtest du löschen? ")
	username, _ := r.ReadString('\n')
	username = strings.TrimSpace(username)

	fmt.Printf("Bist du sicher, dass du '%s' löschen willst? (j/n): ", username)
	confirm, _ := r.ReadString('\n')
	confirm = strings.TrimSpace(confirm)

	if confirm != "j" && confirm != "y" {
		fmt.Println("Abgebrochen.")
		return
	}

	if err := c.DeleteUser(username); err != nil {
		fmt.Printf("❌ Fehler: %v\n", err)
		return
	}

	if err := c.Save(); err != nil {
		fmt.Printf("❌ Fehler beim Speichern: %v\n", err)
		return
	}

	fmt.Printf("✅ Benutzer '%s' wurde gelöscht.\n", username)
}
