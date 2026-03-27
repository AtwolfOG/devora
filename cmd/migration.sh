if [ "$1" == "up" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" up
elif [ "$1" == "down" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" down
elif [ "$1" == "up-to" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" up-to $2
elif [ "$1" == "down-to" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" down-to $2
elif [ "$1" == "reset" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" reset
elif [ "$1" == "redo" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" down
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" up-by-one
elif [ "$1" == "status" ]; then
    goose -dir ./backend/database/schema postgres "postgres://postgres:postgres@localhost:5432/devora?sslmode=disable" status
else
    echo "Usage: $0 {up|down|up-to|down-to|reset|redo|status}"
fi