interface Room {
    id: string
    role: string
    company: string
    description: string
    start_time: string
    status: string
    owner_id: string
    participant_id: string | null
    created_at: string
    updated_at: string
    feedback: {
        Valid: boolean
        String: string
    } 
    passed: {
        Valid: boolean
        Bool: boolean
    }
    started_at: {
        Valid: boolean
        Time: string
    }
    ended_at: {
        Valid: boolean
        Time: string
    }   
}   

interface User {
	id: string
	email: string
	name: string
	created_at: string
	updated_at: string
	profile_picture_url: string
	verified: boolean
}
type Question = {
	id: number 
	room_id: string 
	done: boolean 
	passed:{
        Bool: boolean
        Valid: boolean
    }
	created_at: string 
	updated_at: string 
	title: string 
	description: string 
	is_code: boolean 
}

type Answer = {
	questionID: number 
	roomID:     string 
	answer:     string 
	createdAt:  string 
	updatedAt:  string
}

type CodeSnippet = {
	name:       string    
	questionID: number     
	roomID:     string 
	code:       string   
	language:   string  
	createdAt:  string 
	updatedAt:  string
}

export type { Room, User, Question, Answer, CodeSnippet }