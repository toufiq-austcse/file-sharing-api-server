# File Sharing API Server

A Node.js-based REST API server for file sharing with support for local storage and Google Cloud Storage. Features automatic cleanup of inactive files, rate limiting, and secure file access with public/private key pairs.


## Prerequisites

- Node.js (>= 20.0.0)
- npm or pnpm
- (Optional) Google Cloud Platform account with Storage bucket

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/toufiq-austcse/file-sharing-server.git
cd file-sharing-server
```

### 2. Install Dependencies

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

### 3. Configure Environment Variables
```bash
cp .env.sample .env 
```
### 4. Start the Server

```bash
npm run start
```
### 5. Run Tests (Optional)

```bash
npm run test
```

## Using Docker Compose
```bash
docker compose up -d --build
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### 1. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "message": "Up and running"
}
```

---

### 2. Upload File

Upload a file and receive public/private keys for access.

**Endpoint:** `POST /files`

**Request:**
```bash
curl -X POST http://localhost:3000/files \
  -F "file=@/path/to/your/file.pdf"
```

**Response (200 OK):**
```json
{
  "publicKey": "abc123def456",
  "privateKey": "xyz789uvw012"
}
```

**Error Responses:**

- **400 Bad Request** - No file provided
```json
{
  "error": "file is required"
}
```

- **429 Too Many Requests** - Daily upload limit exceeded
```json
{
  "error": "Daily traffic limit exceeded"
}
```

**Notes:**
- The `publicKey` is used for downloading the file
- The `privateKey` is required for deleting the file
- Store both keys securely as they cannot be retrieved later

---

### 3. Download File

Download a file using its public key.

**Endpoint:** `GET /files/:publicKey`

**Request:**
```bash
curl --request GET \
  --url http://localhost:3000/files/08b6bc871346430f3793a71b2e75f019
```

**Response:**
- Returns the file with appropriate headers:
  - `Content-Type`: File's MIME type
  - `Content-Disposition`: `attachment; filename="original-filename.ext"`

**Error Responses:**


- **404 Not Found** - File doesn't exist
```json
{
  "error": "file not found"
}
```

- **429 Too Many Requests** - Daily download limit exceeded
```json
{
  "error": "Daily traffic limit exceeded"
}
```

---

### 4. Delete File

Delete a file using its private key.

**Endpoint:** `DELETE /files/:privateKey`

**Request:**
```bash
curl -X DELETE http://localhost:3000/files/xyz789uvw012
```

**Response (200 OK):**
```json
{
  "message": "File deleted successfully"
}
```

**Error Responses:**


- **404 Not Found** - File not found or invalid private key
```json
{
  "error": "File not found or invalid privateKey"
}
```

---

## Configuration

### Environment Variables

All configuration is done through environment variables. Copy `.env.sample` to `.env` and configure as needed.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port number | `3000` | No |
| `PROVIDER` | Storage provider (`local` or `google`) | `local` | No |
| `ROOT_FOLDER` | Local storage directory path | `./uploads` | Only for local provider |
| `CONFIG` | Path to GCP configuration JSON file | - | Only for google provider |
| `DAILY_UPLOAD_LIMIT_BYTES` | Daily upload limit per IP (in bytes) | `2081228` (~2 MB) | No |
| `DAILY_DOWNLOAD_LIMIT_BYTES` | Daily download limit per IP (in bytes) | `2081052` (~2 MB) | No |
| `FILE_CLEANUP_INACTIVITY_MINUTES` | Minutes before inactive files are deleted | `2` | No |
| `FILE_CLEANUP_CRON` | Cron schedule for cleanup job | `* * * * *` (every minute) | No |

### Storage Provider Configuration

#### Local Storage Provider

When using `PROVIDER=local`:

```env
PROVIDER=local
ROOT_FOLDER=./uploads
```

Files are stored in the specified local directory. Make sure the application has write permissions.

#### Google Cloud Storage Provider

When using `PROVIDER=google`:

```env
PROVIDER=google
CONFIG=/path/to/gcp-config.json
```

Edit the `gcp-config.json` file with the following structure:

```json
{
  "bucket_name": "your-bucket-name", // Replace with your GCS bucket name
  "gcp_key_file_path": "/path/to/service-account-key.json" // Path to your GCP service account JSON key file
}
```

