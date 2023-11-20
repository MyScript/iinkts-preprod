include Makefile.inc

purge:
	@git clean -xdf || true

prepare:
	@PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 yarn install

lint:
	@yarn lint

build-lib:
	@yarn build:lib

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

docker-wait-tcp:
	@echo "Build wait tcp"
	@cd docker/wait-tcp/ && docker build --quiet -t $(DOCKER_IMAGE_WAIT_TCP) .

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
docker-examples: build-lib
	@echo "Building examples image!"
	@rm -rf docker/examples/delivery/
	@mkdir -p docker/examples/delivery
	@cp -R dist docker/examples/delivery/
	@cp -R examples docker/examples/delivery/
	@cd docker/examples/ && docker build --quiet -t $(DOCKER_IMAGE_IINK_EXAMPLES) .

_launch_examples: docker-examples
	@echo "Starting examples container!"
	@docker run -d \
		$(NETWORK_PARAM) \
		$(NETWORK_ALIAS_EXAMPLES_PARAM) \
		-e "LISTEN_PORT=$(EXAMPLES_LISTEN_PORT)" \
		-e "API_SCHEME=http" \
		-e "API_HOST=$(NETWORK_ALIAS_IINK_BACKEND):8897" \
		-e "APPLICATION_KEY=$(APPLICATION_KEY)" \
		-e "HMAC_KEY=$(HMAC_KEY)" \
		--name $(DOCKER_INSTANCE_IINK_EXAMPLES) \
		$(DOCKER_IMAGE_IINK_EXAMPLES)

_check_examples:
	@docker run --rm \
		--user=$$(id -u) --userns=host \
		$(NETWORK_PARAM) \
		-e "WAIT_PORT=$(EXAMPLES_LISTEN_PORT)" \
		-e "WAIT_HOST=$(NETWORK_ALIAS_EXAMPLES)" \
		-e "WAIT_SERVICE=Examples" \
		$(DOCKER_IMAGE_WAIT_TCP)
	@echo "Examples started!"

init_examples: _launch_examples _check_examples

#########
# TESTS #
#########
test-unit:
	@echo "Starting test unit"
	@docker run --rm --user=$$(id -u) --userns=host \
		-e "TEST_SUITE_PATH=$(TEST_SUITE_PATH)" \
		-v $(CURRENT_PWD):/test \
		-w "/test/test/unit" \
		$(DOCKER_IMAGE_JEST) \
		yarn test:unit --coverage

prepare-test-integration: _create-network \
	_launch-mongo \
	_launch-googlefonts-volume \
	_launch-iinkresources-volume \
	_launch-iinklicenses-volume \
	_launch-iink-backend \
	init_examples

test-integration:
	@echo "Starting test integration"
	@docker run --rm --ipc=host --user=$$(id -u) --userns=host --init \
		$(NETWORK_PARAM) \
		-e BASE_URL="http://$(NETWORK_ALIAS_EXAMPLES):$(EXAMPLES_LISTEN_PORT)" \
		-e BROWSER="$(BROWSER)" \
		-e DEVICE="$(DEVICE)" \
		-e PROJECT="$(PROJECT)" \
		-v $(CURRENT_PWD):/home/pwuser/tests \
		-w "/home/pwuser/tests" \
		--name "$(DOCKER_PREFIX)-playwright-$(subst $() $(),-,$(shell echo $(PROJECT)-$(BROWSER)-$(DEVICE) | tr A-Z a-z))" \
		$(DOCKER_IMAGE_PLAYWRIGHT) \
		yarn test:integration --runInBand

dev-test-integration:
	@make WITH_NETWORK=false -C ./ prepare-test-integration

local-test-integration:
	@echo "Starting test integration"
	docker run --rm --ipc=host --user=$$(id -u) --userns=host --init \
		--network host \
		-e BASE_URL="http://localhost:80" \
		-e BROWSER="$(BROWSER)" \
		-e DEVICE="$(DEVICE)" \
		-e PROJECT="$(PROJECT)" \
		-v $(CURRENT_PWD):/home/pwuser/tests \
		-w "/home/pwuser/tests" \
		--name "$(DOCKER_PREFIX)-playwright-$(subst $() $(),-,$(shell echo $(PROJECT)-$(BROWSER)-$(DEVICE) | tr A-Z a-z))" \
		$(DOCKER_IMAGE_PLAYWRIGHT) \
		yarn test:integration --runInBand

#########
# MONGO #
#########
_launch-iink-scripts:
	@if [ $$(docker ps -a | grep $(DOCKER_INSTANCE_IINK_SCRIPTS) | wc -l) -eq 0 ]; then \
    make BUILDID=$(BUILDID) -C ./ docker-mongo-scripts && \
		echo "Launch scripts volume" && \
		docker run -d \
			--user=$$(id -u) --userns=host \
			--name $(DOCKER_INSTANCE_IINK_SCRIPTS) \
			$(DOCKER_IMAGE_IINK_SCRIPTS) ;\
	 fi

_start-mongo:
	@echo "Starting mongo container!"
	@docker run -d \
		$(NETWORK_PARAM) \
		$(NETWORK_ALIAS_MONGO_PARAM) \
		--name $(DOCKER_INSTANCE_MONGO) \
		$(DOCKER_IMAGE_MONGO) mongod --replSet "$(DOCKER_MONGO_REPLICATSET)"

_check-mongo:
	@echo "Check mongo container"
	@docker run --rm \
			--user=$$(id -u) --userns=host \
			$(NETWORK_PARAM) \
			-e "WAIT_PORT=27017" \
			-e "WAIT_HOST=$(NETWORK_ALIAS_MONGO)" \
			-e "WAIT_SERVICE=mongoDB" \
			$(DOCKER_IMAGE_WAIT_TCP)

_setting-up-mongo-replica-set:
	@echo "Setting up replica set"
	@docker exec $(DOCKER_INSTANCE_MONGO) mongo --quiet --eval "rs.initiate({_id: '$(DOCKER_MONGO_REPLICATSET)', version: 1, members: [{ _id: 0, host : '$(NETWORK_ALIAS_MONGO):27017' }]});"

_check-mongo-replica-set:
	@echo "Check mongo replica set"
	@docker run --rm \
			--user=$$(id -u) --userns=host \
			$(NETWORK_PARAM) \
			--volumes-from $(DOCKER_INSTANCE_IINK_SCRIPTS) \
			$(DOCKER_IMAGE_MONGO) mongo --quiet $(NETWORK_ALIAS_MONGO):27017 /mongo-scripts/waitForReplica.js

_populate-mongo:
	@echo "Populate mongo"
	@docker run --rm \
			--user=$$(id -u) --userns=host \
			$(NETWORK_PARAM) \
			--volumes-from $(DOCKER_INSTANCE_IINK_SCRIPTS) \
			$(DOCKER_IMAGE_MONGO) mongorestore --quiet --host $(NETWORK_ALIAS_MONGO) /mongo-scripts/mongodump

_launch-mongo: _launch-iink-scripts _start-mongo _check-mongo _setting-up-mongo-replica-set _check-mongo-replica-set _populate-mongo

#########
# FONTS #
#########
_launch-googlefonts-volume:
	@echo "Starting googlefonts volume!"
	@docker run --pull always -d --user=$$(id -u) --userns=host \
		--name $(DOCKER_INSTANCE_IINK_FONTS) \
		$(DOCKER_IMAGE_IINK_FONTS)
	@echo "Googlefonts volume started!"

#############
# RESOURCES #
#############
_launch-iinkresources-volume:
	@echo "Starting iink resources volume!"
	@docker run -d --user=$$(id -u) --userns=host \
		--name $(DOCKER_INSTANCE_IINK_RESOURCES) \
		$(DOCKER_IMAGE_IINK_RESOURCES_MYSCRYPT)
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
		-e "MYSCRIPT_IINK_MONGOURL=mongodb://$(NETWORK_ALIAS_MONGO):27017/webservices" \
		-e "IINK_BACKEND_MAXINACTIVITYDURATION=10000" \
		-e "IINK_BACKEND_MAXINACTIVITYNOSTROKEDURATION=5000" \
		-e "IINK_BACKEND_BATCH_SYNCHRONEMODE=true" \
		-e "IINK_BACKEND_ENGINECACHE_ENABLED=true" \
		-e "IINK_BACKEND_ENGINECACHE_SIZELIMIT=20" \
		-e "IINK_BACKEND_BATCH_MAXTHREADS=10" \
		-e "IINK_BACKEND_BATCH_MAXQUEUESIZE=50" \
		-e "MYSCRIPT_IINK_JVM_PARAMS=-Xmx2G -Djava.net.preferIPv4Stack=true -Djava.awt.headless=true -Dlogging.level.com.myscript.cloud.iink.controller.websocket.IInkSessionUtil=DEBUG" \
		-e "IINK_BACKEND_CONFDIR=/resources/conf/" \
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
		-e "WAIT_PORT=8897" \
		-e "WAIT_SERVICE=IINK-Backend" \
		$(DOCKER_IMAGE_WAIT_TCP)
	@echo "iink Backend started!"

#########
# CLEAN #
#########
kill-docker:
	@docker ps -qa --filter name="$(DOCKER_PREFIX)"|xargs -r docker rm -f
	@docker network rm "$(NETWORK_NAME)"||true;

_postbuild: kill-docker
