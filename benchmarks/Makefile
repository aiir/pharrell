
all: endpoints

endpoints:
	@./run 1 ../dist/benchmarks/$@
	@./run 5 ../dist/benchmarks/$@
	@./run 10 ../dist/benchmarks/$@
	@./run 15 ../dist/benchmarks/$@
	@./run 20 ../dist/benchmarks/$@
	@./run 30 ../dist/benchmarks/$@
	@./run 50 ../dist/benchmarks/$@
	@./run 100 ../dist/benchmarks/$@
	@echo

.PHONY: all endpoints
