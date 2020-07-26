FROM alpine:latest

# File Author / Maintainer
MAINTAINER "shazi7804" <shazi7804@gmail.com>

# Install dependencies
RUN apk update && apk add curl python py-pip jq vim

# Install bottle if running the python file directly
RUN pip install flask

ADD app.py /srv

CMD [ "sh", "-c", "python /srv/app.py" ]

EXPOSE 80

