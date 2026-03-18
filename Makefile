.PHONY: lint build test

lint:
	cd ../.. && npm run lint -- --filter=organograma

build:
	cd ../.. && npm run build

test:
	cd ../.. && npm test -- --filter=organograma
