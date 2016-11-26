# MapTogether
A Diago site that allows users to chat and create maps in real time.

# Environment Setup
Install 

* Postgres 9.6
* Docker for Mac
* Python 3.5

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
$ docker run -p 5432:5432 --name my-postgres -e POSTGRES_PASSWORD=*mysecretpassword* -d postgres:9.6
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

```
python3 manage.py migrate
python3 manage.py createsuperuser
```
