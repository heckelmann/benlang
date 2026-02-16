package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"sync"

	"golang.org/x/crypto/bcrypt"
)

const CredentialsFile = ".bencreds"

type User struct {
	Username string `json:"username"`
	Password string `json:"password"` // Hashed
}

type Credentials struct {
	Users    map[string]User   `json:"users"`
	Sessions map[string]string `json:"-"` // token -> username
	mu       sync.RWMutex
}

func LoadCredentials() (*Credentials, error) {
	creds := &Credentials{
		Users:    make(map[string]User),
		Sessions: make(map[string]string),
	}

	data, err := os.ReadFile(CredentialsFile)
	if err != nil {
		if os.IsNotExist(err) {
			return creds, nil
		}
		return nil, err
	}

	if err := json.Unmarshal(data, &creds.Users); err != nil {
		return nil, err
	}

	return creds, nil
}

func (c *Credentials) Save() error {
	c.mu.RLock()
	defer c.mu.RUnlock()

	data, err := json.MarshalIndent(c.Users, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(CredentialsFile, data, 0600)
}

func (c *Credentials) AddUser(username, password string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.Users[username]; exists {
		return errors.New("Benutzer existiert bereits")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	c.Users[username] = User{
		Username: username,
		Password: string(hashed),
	}

	return nil
}

func (c *Credentials) UpdateUser(username, password string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.Users[username]; !exists {
		return errors.New("Benutzer existiert nicht")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	c.Users[username] = User{
		Username: username,
		Password: string(hashed),
	}

	return nil
}

func (c *Credentials) DeleteUser(username string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if _, exists := c.Users[username]; !exists {
		return errors.New("Benutzer existiert nicht")
	}

	delete(c.Users, username)
	return nil
}

func (c *Credentials) Verify(username, password string) bool {
	c.mu.RLock()
	user, exists := c.Users[username]
	c.mu.RUnlock()

	if !exists {
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	return err == nil
}

func (c *Credentials) CreateSession(username string) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)

	c.mu.Lock()
	c.Sessions[token] = username
	c.mu.Unlock()

	return token, nil
}

func (c *Credentials) GetUsernameFromSession(token string) (string, bool) {
	c.mu.RLock()
	username, exists := c.Sessions[token]
	c.mu.RUnlock()
	return username, exists
}

func (c *Credentials) DeleteSession(token string) {
	c.mu.Lock()
	delete(c.Sessions, token)
	c.mu.Unlock()
}
