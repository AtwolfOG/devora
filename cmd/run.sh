BACKEND_FOLDER=backend
FRONTEND_FOLDER=frontend

cd "$BACKEND_FOLDER" || { echo "Backend folder not found"; exit 1; }
go run . 2>&1 | while IFS= read -r line; do
    echo "$line"
    # if [[ "$line" == *"Server started on port 8080"* ]]; then
    #     cd "$FRONTEND_FOLDER" || { echo "Frontend folder not found"; exit 1; }
    #     npm run dev
    # fi
done