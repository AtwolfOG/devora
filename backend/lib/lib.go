package lib

// import (
// 	"errors"
// 	"net/http"

// 	"github.com/google/uuid"
// )

// func GetIdFromReqCtx(r *http.Request) (uuid.UUID, error) {
// 	id, ok := r.Context().Value("user_id").(string)
// 	if !ok{
// 		return uuid.Nil, errors.New("incorrect user_id")
// 	}
// 	userUUID, err := uuid.Parse(id)
// 	if err != nil {
// 		return uuid.Nil, errors.New("incorrect user_id")
// 	}
// 	return userUUID, nil
// }
