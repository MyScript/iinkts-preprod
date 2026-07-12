include Makefile.inc

purge:
	@git clean -xdf || true

prepare: docker-mongo-scripts docker-wait4x docker-jest
	@PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn install
	yarn install:tldraw && yarn prepare:tldraw

lint:
	@yarn lint

build-lib:
	@yarn build:lib

build-tldraw-examples:
	@yarn copy:to:tldraw
	@cd ./examples/offscreen-interactivity/offscreen_interactivity_tldraw && yarn build

build-docs:
	@yarn build:docs

audit:
	@yarn audit --groups dependencies

#######
# DEV #
#######
dev-lib:
	@make WITH_NETWORK=false -C ./ _launch-mongo \
	_launch-googlefonts-volume \
	_launch-iinkresources-volume \
	_launch-iinklicenses-volume \
	_launch-iink-backend \

#########
# TOOLS #
#########
docker-mongo-scripts:
	@echo "Build mongo scripts"
	@cd docker/mongo-scripts && docker build --quiet -t $(DOCKER_IMAGE_IINK_SCRIPTS) .

docker-wait4x:
	echo "Build wait4x"
	docker build -t $(DOCKER_IMAGE_WAIT4X) ./docker/wait4x

docker-jest:
	@echo "Build jest"
	@cd docker/jest/ && docker build --quiet -t $(DOCKER_IMAGE_JEST) .

###########
# NETWORK #
###########
_create-network:
	@if [ ! "$(NETWORK_NAME)" ]; then \
		echo "Use network host"; \
	else \
		echo "Create network $(NETWORK_NAME)"; \
		docker network create $(NETWORK_NAME); \
	fi;

############
# EXAMPLES #
############
docker-examples:
	@echo "Building examples image!"
	@rm -rf docker/examples/delivery/
	@mkdir -p docker/examples/delivery
	@cp -R dist docker/examples/delivery/
	@cp -R examples docker/examples/delivery/
	@cd docker/examples/ && find . -name 'node_modules' -type d -prune -exec rm -rf '{}' + && docker build --quiet -t $(DOCKER_IMAGE_IINK_EXAMPLES) .

_launch_examples: docker-examples
	@echo "Starting examples container!"
	@docker run -d \
		$(NETWORK_PARAM) \
		$(NETWORK_ALIAS_EXAMPLES_PARAM) \
		-e "LISTEN_PORT=$(EXAMPLES_LISTEN_PORT)" \
		--name $(DOCKER_INSTANCE_IINK_EXAMPLES) \
		$(DOCKER_IMAGE_IINK_EXAMPLES)

_check_examples:
	@docker run --rm --user=$$(id -u) --userns=host $(NETWORK_PARAM) -e "WAIT_PORT=$(EXAMPLES_LISTEN_PORT)" -e "WAIT_HOST=$(NETWORK_ALIAS_EXAMPLES)" -e "WAIT_SERVICE=Examples" $(DOCKER_IMAGE_WAIT4X)
	@echo "Examples started!"

init_examples: _launch_examples _check_examples

dev-init_examples:
	@make WITH_NETWORK=false -C ./ init_examples

#########
# TESTS #
#########
test-unit:
	@echo "Starting test unit"
	@docker run --rm --user=$$(id -u) --userns=host \
		-e "TEST_SUITE_PATH=$(TEST_SUITE_PATH)" \
		-v $(CURRENT_PWD):/iink-ts \
		-w "/iink-ts/test/unit" \
		$(DOCKER_IMAGE_JEST) \
		yarn test:unit --coverage --maxWorkers 2

prepare-test-examples-ci: _create-network \
	_launch-mongo \
	_launch-googlefonts-volume \
	_launch-iinkresources-volume \
	_launch-iinklicenses-volume \
	_launch-iink-backend \
	_check-iink-backend \
	init_examples

test-examples-ci:
	@echo "Starting test examples"
	@docker run --rm --ipc=host --user=$$(id -u) --userns=host --init \
		$(NETWORK_PARAM) \
		-e BASE_URL="$(BASE_URL)" \
		-e PROJECT="$(PROJECT)" \
		-e CI="true" \
    -e SCHEME="http" \
		-e HOST="$(BACKEND_HOST)" \
		-e APPLICATION_KEY="$(APPLICATION_KEY)" \
		-e HMAC_KEY="$(HMAC_KEY)" \
		-v $(CURRENT_PWD):/iink-ts \
		-w "/iink-ts/test/examples" \
		--name "$(DOCKER_INSTANCE_PLAYWRIGHT)" \
		$(DOCKER_IMAGE_PLAYWRIGHT) \
		yarn test:examples

dev-test-examples:
	@make WITH_NETWORK=false -C ./ prepare-test-examples

prepare-test-examples: _create-network init_examples

test-examples:
	@echo "Starting test examples"
	@docker run --rm --ipc=host --user=$$(id -u) --userns=host --init \
		-e "PROJECT=$(PROJECT)" \
		-e "CI=true" \
		-e "BASE_URL=$(BASE_URL)" \
    -e "SCHEME=http" \
		-e "HOST=$(BACKEND_HOST)" \
		-e "APPLICATION_KEY=$(APPLICATION_KEY)" \
		-e "HMAC_KEY=$(HMAC_KEY)" \
		-v $(CURRENT_PWD):/iink-ts \
		-w "/iink-ts/test/examples" \
		--name "$(DOCKER_INSTANCE_PLAYWRIGHT)" \
		$(DOCKER_IMAGE_PLAYWRIGHT) \
		yarn test:examples

dev-test-examples-ci:
	@make WITH_NETWORK=false -C ./ prepare-test-examples-ci test-examples-ci

#########
# MONGO #
#########
_launch-iink-scripts:
	@if [ $$(docker ps -a | grep $(DOCKER_INSTANCE_IINK_SCRIPTS) | wc -l) -eq 0 ]; then \
		echo "Launch scripts volume" && \
		docker run -d --user=$$(id -u) --userns=host --name $(DOCKER_INSTANCE_IINK_SCRIPTS) $(DOCKER_IMAGE_IINK_SCRIPTS) ;\
	 fi

_start-mongo:
	@echo "Starting mongo container!"
	@docker run -d $(NETWORK_PARAM) $(NETWORK_ALIAS_MONGO_PARAM) --name $(DOCKER_INSTANCE_MONGO) $(DOCKER_IMAGE_MONGO) mongod --replSet "$(DOCKER_MONGO_REPLICATSET)"
	@docker run --rm $(NETWORK_PARAM) $(DOCKER_IMAGE_WAIT4X) wait4x tcp $(NETWORK_ALIAS_MONGO):27017 -t 60s
	@echo "mongo container started!"
	@echo "Initiate mongo replicat set"
	@docker exec $(DOCKER_INSTANCE_MONGO) mongosh --quiet --eval "rs.initiate({_id: '$(DOCKER_MONGO_REPLICATSET)', version: 1, members: [{ _id: 0, host : '$(NETWORK_ALIAS_MONGO):27017' }]});"

_populate-mongo:
	@echo "Populate mongo"
	@docker run --rm --user=$$(id -u) --userns=host $(NETWORK_PARAM) --volumes-from $(DOCKER_INSTANCE_IINK_SCRIPTS) $(DOCKER_IMAGE_MONGO) mongorestore --quiet --host $(NETWORK_ALIAS_MONGO) /mongo-scripts/mongodump

_launch-mongo: _launch-iink-scripts _start-mongo _populate-mongo

#########
# FONTS #
#########
_launch-googlefonts-volume:
	@echo "Starting googlefonts volume!"
	@docker run --pull always -d --user=$$(id -u) --userns=host --name $(DOCKER_INSTANCE_IINK_FONTS) $(DOCKER_IMAGE_IINK_FONTS)
	@echo "Googlefonts volume started!"

#############
# RESOURCES #
#############
_launch-iinkresources-volume:
	@echo "Starting iink resources volume!"
	@docker run -d --user=$$(id -u) --userns=host --name $(DOCKER_INSTANCE_IINK_RESOURCES) $(DOCKER_IMAGE_IINK_RESOURCES_MYSCRYPT)
	@echo "IInk resources volume started!"

############
# LICENSES #
############
_launch-iinklicenses-volume:
	@echo "Starting iink licenses volume!"
	@docker run -d --user=$$(id -u) --userns=host \
		--name $(DOCKER_INSTANCE_IINK_LICENSES) \
		$(DOCKER_IMAGE_IINK_LICENSES)
	@echo "IInk Licenses volume started!"

###########
# BACKEND #
###########
_launch-iink-backend:
	@echo "Starting iink backend container!"
	@docker run --pull always -d \
		--user=$$(id -u) --userns=host \
		$(NETWORK_PARAM) \
		$(NETWORK_ALIAS_IINK_BACKEND_PARAM) \
		-e "IINK_BACKEND_MAXINACTIVITYDURATION=10000" \
		-e "IINK_BACKEND_MAXINACTIVITYNOSTROKEDURATION=5000" \
		-e "IINK_BACKEND_BATCH_SYNCHRONEMODE=true" \
		-e "IINK_BACKEND_ENGINECACHE_ENABLED=true" \
		-e "IINK_BACKEND_ENGINECACHE_SIZELIMIT=20" \
		-e "IINK_BACKEND_BATCH_MAXTHREADS=10" \
		-e "IINK_BACKEND_BATCH_MAXQUEUESIZE=50" \
		-e "IINK_BACKEND_CONFDIR=/resources/conf/" \
		-e "MONGOURL=mongodb://$(NETWORK_ALIAS_MONGO):27017/webservices" \
		-e "JVM_PARAMS=-Xmx2G -Djava.net.preferIPv4Stack=true -Djava.awt.headless=true -Dlogging.level.com.myscript.cloud.iink.controller.websocket.IInkSessionUtil=DEBUG" \
		--volumes-from $(DOCKER_INSTANCE_IINK_FONTS) \
		--volumes-from $(DOCKER_INSTANCE_IINK_LICENSES) \
		--volumes-from $(DOCKER_INSTANCE_IINK_RESOURCES) \
		--name $(DOCKER_INSTANCE_IINK_BACKEND) \
		$(DOCKER_IMAGE_IINK_BACKEND)

_check-iink-backend:
	@docker run --rm \
		--user=$$(id -u) --userns=host \
		$(NETWORK_PARAM) \
		-e "WAIT_HOST=$(NETWORK_ALIAS_IINK_BACKEND)" \
		-e "WAIT_PORT=$(BACKEND_LISTEN_PORT)" \
		-e "WAIT_SERVICE=IINK-Backend" \
		$(DOCKER_IMAGE_WAIT4X)
	@echo "iink Backend started!"

#########
# CLEAN #
#########
save-docker-logs:
	@mkdir -p docker-logs
	@for c in $$(docker ps -aq --filter name="$(DOCKER_PREFIX)"); do \
		name=$$(docker inspect --format='{{.Name}}' $$c | sed 's#^/##'); \
		docker logs $$c > "docker-logs/$$name.log" 2>&1 || true; \
	done

kill-docker:
	@docker ps -qa --filter name="$(DOCKER_PREFIX)"|xargs -r docker rm -f
	@docker network rm "$(NETWORK_NAME)"||true;

_postbuild: kill-docker
