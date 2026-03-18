if [ "$1" == "up" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" up
elif [ "$1" == "down" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" down
fi