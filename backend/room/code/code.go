package code

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"

	"github.com/AtwolfOG/devora/internal/config"
	"github.com/google/uuid"
)

type CompileGoCodeReqquestStruct struct {
	Code []code `json:"code"`
	RoomID string `json:"room_id"`
}
type code struct {
	Name     string `json:"name"`
	Content  string `json:"content"`
	Language string `json:"language"`
}

func CompileGoCodeEndpoint(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	var req CompileGoCodeReqquestStruct
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// check if roomid is valid
	roomUUID, err := uuid.Parse(req.RoomID)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}
	_, err = cfg.DB.GetRoomByID(r.Context(), roomUUID)
	if err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}
	// check if max file compile limit is reached
	if len(req.Code) > 5 {
		http.Error(w, "Too many files", http.StatusBadRequest)
		return
	}
	for _, code := range req.Code {
		if code.Language != "go" {
			http.Error(w, "Invalid language", http.StatusBadRequest)
			return
		}
	}
	wasmBytes, err := compileGoCodeAndCleanup(req.Code, req.RoomID)
	if err != nil {
		http.Error(w, "Failed to compile code", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/wasm")
	w.Write(wasmBytes)

}

func compileGoCodeAndCleanup(code []code, roomID string) ([]byte, error) {
	tempDir := os.TempDir()
	roomPath := tempDir + "/devora/rooms/" + roomID
	err := os.MkdirAll(roomPath, 0777)
	if err != nil {
		return nil, err
	}
	for _, code := range code {
		filepath := roomPath + "/" + code.Name + ".go"
		err := os.WriteFile(filepath, []byte(code.Content), 0777)
		if err != nil {
			return nil, err
		}
	}
	cmd := exec.Command("go", "build", "-o", "main.wasm", ".")
	cmd.Env = append(os.Environ(), "GOOS=js", "GOARCH=wasm")
	cmd.Dir = roomPath
	// output, err := cmd.CombinedOutput()
	err = cmd.Run()
	if err != nil {
		return nil, err
	}
	wasmfilePath := roomPath + "/main.wasm"
	wasmBytes, err := os.ReadFile(wasmfilePath)
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(roomPath)
	return wasmBytes, nil
}