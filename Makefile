.PHONY: help install dev build start lint test test-watch test-coverage test-e2e test-e2e-ui clean clean-all

# Default target
help:
	@echo "Available targets:"
	@echo "  install        - Install dependencies"
	@echo "  dev            - Start development server"
	@echo "  build          - Production build"
	@echo "  start          - Start production server"
	@echo "  lint           - Run ESLint"
	@echo "  test           - Run unit tests"
	@echo "  test-watch     - Run unit tests in watch mode"
	@echo "  test-coverage  - Run unit tests with coverage"
	@echo "  test-e2e       - Run Playwright E2E tests"
	@echo "  test-e2e-ui    - Run Playwright E2E tests with UI"
	@echo "  test-all       - Run all tests (unit + e2e)"
	@echo "  clean          - Remove build artifacts"
	@echo "  clean-all      - Remove build artifacts and node_modules"

# Dependencies
install:
	npm install

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# Linting
lint:
	npm run lint

# Testing
test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

test-e2e:
	npm run test:e2e

test-e2e-ui:
	npm run test:e2e:ui

test-all: test test-e2e

# Cleanup
clean:
	rm -rf .next
	rm -rf playwright-report
	rm -rf test-results

clean-all: clean
	rm -rf node_modules
