# Colab Track API Documentation

Copyright (c) 2024 Dhruv Tripathi

## Base URL
```
http://localhost:8080/api
```

## Authentication

All API endpoints (except auth endpoints) require authentication via JWT token.

Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: {
  "name": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "string",
  "password": "string"
}
```

#### Logout
```
POST /api/auth/logout
```

#### Refresh Token
```
POST /api/auth/refresh
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Users

#### Get Current User
```
GET /api/users/me
```

#### Update Profile
```
PUT /api/users/me
Body: {
  "name": "string",
  "avatar": "string"
}
```

### Workspaces

#### Get All Workspaces
```
GET /api/workspaces
```

#### Get Workspace by ID
```
GET /api/workspaces/{id}
```

#### Create Workspace
```
POST /api/workspaces
Body: {
  "name": "string",
  "description": "string"
}
```

### Projects

#### Get All Projects
```
GET /api/workspaces/{workspaceId}/projects
```

#### Create Project
```
POST /api/workspaces/{workspaceId}/projects
Body: {
  "name": "string",
  "description": "string"
}
```

### Tasks

#### Get All Tasks
```
GET /api/projects/{projectId}/tasks
```

#### Create Task
```
POST /api/projects/{projectId}/tasks
Body: {
  "title": "string",
  "description": "string",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "dueDate": "ISO8601"
}
```

#### Update Task Status
```
PATCH /api/projects/{projectId}/tasks/{taskId}/status
Body: {
  "status": "TODO|IN_PROGRESS|REVIEW|DONE"
}
```

### Teams

#### Get All Teams
```
GET /api/workspaces/{workspaceId}/teams
```

#### Create Team
```
POST /api/workspaces/{workspaceId}/teams
Body: {
  "name": "string",
  "description": "string"
}
```

### Notifications

#### Get All Notifications
```
GET /api/notifications
```

#### Mark as Read
```
PATCH /api/notifications/{id}/read
```

## WebSocket

Connect to: `ws://localhost:8080/ws`

### Events

- `task.created` - New task created
- `task.updated` - Task updated
- `task.deleted` - Task deleted
- `comment.created` - New comment added
- `notification.new` - New notification


