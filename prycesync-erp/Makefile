.PHONY: up migrate db-smoke snapshot

up:
	docker compose up -d

migrate:
	docker compose exec app npx prisma migrate deploy

db-smoke:
	docker compose exec app sh ./scripts/db-smoke.sh

snapshot:
	docker compose exec app sh ./scripts/db-snapshot.sh