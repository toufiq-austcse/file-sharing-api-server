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
