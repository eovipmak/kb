.PHONY: all up down restart logs deps

# Variables
API_DIR = api
CLIENT_DIR = client
MEILI_BIN = ./meilisearch
MEILI_DATA = ./data.ms
PIDS_FILE = .pids

# Service configurations
MEILI_PORT = 7700
API_PORT = 3000
CLIENT_PORT = 5173

# Environment variables
MEILI_ENV = MEILI_MASTER_KEY=masterKey
API_ENV = DATABASE_URL=file:./prisma/dev.db JWT_SECRET=supersecret MEILI_HOST=http://127.0.0.1:$(MEILI_PORT) MEILI_MASTER_KEY=masterKey PORT=$(API_PORT)
CLIENT_ENV = VITE_API_BASE_URL=http://localhost:$(API_PORT)/api

deps:
	@echo "Checking dependencies..."
	@if [ ! -d "$(API_DIR)/node_modules" ]; then \
		echo "Installing API dependencies..."; \
		cd $(API_DIR) && npm install && npx prisma generate; \
	fi
	@if [ ! -d "$(CLIENT_DIR)/node_modules" ]; then \
		echo "Installing Client dependencies..."; \
		cd $(CLIENT_DIR) && npm install; \
	fi

up: deps
	@echo "Starting services..."
	@: > $(PIDS_FILE)
	
	@echo "Starting Meilisearch..."
	@$(MEILI_ENV) $(MEILI_BIN) --db-path $(MEILI_DATA) --http-addr 127.0.0.1:$(MEILI_PORT) > meili.log 2>&1 & echo $$! >> $(PIDS_FILE)
	
	@echo "Starting API..."
	@cd $(API_DIR) && $(API_ENV) npm run dev > ../api.log 2>&1 & echo $$! >> ../$(PIDS_FILE)
	
	@echo "Starting Client..."
	@cd $(CLIENT_DIR) && $(CLIENT_ENV) npm run dev > ../client.log 2>&1 & echo $$! >> ../$(PIDS_FILE)
	
	@echo "All services started! Logs availabe in meili.log, api.log, client.log"

down:
	@if [ -f $(PIDS_FILE) ]; then \
		echo "Stopping services..."; \
		while read pid; do \
			if kill -0 $$pid 2>/dev/null; then \
				kill $$pid; \
				echo "Killed PID $$pid"; \
			fi; \
		done < $(PIDS_FILE); \
		rm $(PIDS_FILE); \
		echo "Services stopped."; \
	else \
		echo "No PID file found. Checking ports..."; \
	fi
	@# Failsafe cleanup by cleaning children processes if any
	@pkill -P `cat $(PIDS_FILE) 2>/dev/null` 2>/dev/null || true

restart: down up

logs:
	tail -f meili.log api.log client.log
