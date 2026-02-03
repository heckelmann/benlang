.PHONY: build build-all clean run test dist-package

# Default target
all: build

# Build for current platform
build:
	go build -o benlang ./cmd/benlang

# Build for all platforms
build-all: build-mac build-mac-arm build-windows build-linux

build-mac:
	GOOS=darwin GOARCH=amd64 go build -o dist/benlang-mac-amd64 ./cmd/benlang

build-mac-arm:
	GOOS=darwin GOARCH=arm64 go build -o dist/benlang-mac-arm64 ./cmd/benlang

build-windows:
	GOOS=windows GOARCH=amd64 go build -o dist/benlang-windows-amd64.exe ./cmd/benlang

build-linux:
	GOOS=linux GOARCH=amd64 go build -o dist/benlang-linux-amd64 ./cmd/benlang

# Run the development server
run:
	go run ./cmd/benlang ./beispiele/fang-den-stern

# Run with a specific project
run-projekt:
	go run ./cmd/benlang $(PROJEKT)

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f benlang
	rm -rf dist/

# Create distribution directory
dist:
	mkdir -p dist

# Development: rebuild and run
dev: build run

# Create a new example project
beispiel:
	go run ./cmd/benlang neu ./beispiele/$(NAME)

# Package distribution with examples and documentation
dist-package: build-all
	@echo "Packaging distribution..."
	mkdir -p dist/benlang-distribution
	mkdir -p dist/benlang-distribution/beispiele
	mkdir -p dist/benlang-distribution/hilfe
	# Copy examples
	cp -r beispiele/* dist/benlang-distribution/beispiele/
	# Copy help documentation
	cp -r hilfe/* dist/benlang-distribution/hilfe/
	# Copy README
	cp README.md dist/benlang-distribution/
	# Copy binaries
	cp dist/benlang-mac-amd64 dist/benlang-distribution/
	cp dist/benlang-mac-arm64 dist/benlang-distribution/
	cp dist/benlang-windows-amd64.exe dist/benlang-distribution/
	cp dist/benlang-linux-amd64 dist/benlang-distribution/
	# Create ZIP archive
	cd dist && zip -r benlang-distribution.zip benlang-distribution
	@echo "Distribution package created: dist/benlang-distribution.zip"
