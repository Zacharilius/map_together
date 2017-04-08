# MapTogether
A Diago site that allows users to chat and create maps in real time.

# Environment Setup
Install

* Postgres 9.6
* Docker for Mac
* Python 3.6

Add PATH to postgresql
`$ export PATH=/usr/local/Cellar/postgresql/9.6.1bin/:$PATH`

## Python Environment
```
$ virtualenv -p python3 venv
$ . venv/bin/activate
$ pip install -r requirements.txt
```

## Postgres Setup

### Create docker Postres database container
```
$ docker run -p 5432:5432 --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres:9.6
```

#### Restart

```
$ docker start my-postgres
```

## Redis Setup
```
$ docker run -p 6379:6379 --name my-redis redis:3.2
```

#### Restart

```
$ docker start my-redis
```

## Django Setup

### Create a settings_local.py inside map_together that include:

```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'mysecretpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

SECRET_KEY = "dJG\x0c{\\XFk~%^H@$%<Rnn\n*J']+iT*3$z%ky0`OL\\"  # Or some random sequence fo 40 characters

DEBUG = True

```

```
python3 manage.py migrate
python3 manage.py createsuperuser
```


# Deploying

## Fist time
```
$ brew install heroku
# Wait for it to install

$ heroku
# Enter heroku login info

```

## Run locally
```
heroku local worker
heroku local web
```

## Deploy First Time on New Computer
```
heroku login
heroku list  # list projects
heroku git:remote -a *app-name*  # Adds remote to git push origin
git push heroku master

```

## Deploy
```
heroku login
git push heroku master
```

## Bash on Heroku
```
heroku list  # list projects
heroku run --app *app-name* bash
```




