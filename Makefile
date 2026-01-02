build-web:
	docker build -t udn_home -f ./docker/Dockerfile .

run-web:
	docker run -it --rm -p 80:8080 --name stdudioudn-home udn_home 