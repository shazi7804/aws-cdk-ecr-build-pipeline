FROM python:3.7-alpine

# File Author / Maintainer
LABEL maintainer="shazi7804 shazi7804@gmail.com"

COPY . /srv
RUN pip install -r /srv/requirements.txt

CMD [ "sh", "-c", "python /srv/app.py" ]

EXPOSE 80

