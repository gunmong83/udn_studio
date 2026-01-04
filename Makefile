build-web:
	docker build -t gunmong/udn_home -f ./docker/Dockerfile .

push-web:
	docker push gunmong/udn_home

run-web:
	docker run -it --rm -p 80:8080 --name stdudioudn-home gunmong/udn_home