# Postgres Setup

# Create docker database
$ docker run -p 5432:5432 --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres:9.5

# Restart database
$ docker start postgres-db
