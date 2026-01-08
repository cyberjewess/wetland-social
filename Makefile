.PHONY: dev build prod stop logs test clean help

dev:
	docker-compose up

build:
	docker-compose build

prod:
	docker-compose -f docker-compose.prod.yml up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f

test:
	docker-compose run --rm wetland-social npm test

clean:
	docker-compose down -v
	rm -rf node_modules .next

help:
	@echo "Available commands:"
	@echo "  make dev    - Start development environment"
	@echo "  make build  - Build Docker images"
	@echo "  make prod   - Start production environment"
	@echo "  make stop   - Stop all containers"
	@echo "  make logs   - View container logs"
	@echo "  make test   - Run unit tests"
	@echo "  make clean  - Remove containers and volumes"
