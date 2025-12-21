# Helpdesk

**The omnichannel AI-driven helpdesk system that empowers your team to deliver exceptional customer experiences. Faster responses, happier customers.**

A unified system built with the [Motia](https://motia.dev) framework. This project automates the entire lifecycle of a support ticket from email ingestion to AI-powered orchestration and real-time agent updates.

## 🏛 Architecture

The project follows a modular, event-driven architecture. You can find the visual overview in the root directory:
- [architecture.svg](./architecture.svg)

## 🚀 How I used Motia

This project leverages Motia to eliminate backend fragmentation by unifying APIs, background jobs, and AI workflows into a single system of **Steps**.

### 1. Handling Background Jobs (Cron)
I used Motia's `cron` steps to handle periodic maintenance and high-frequency polling:
- **Email Polling**: [pull_emails_step.py](./src/email/step/pull_emails_step.py) runs every 5 seconds to ingest support emails.
- **Daily Resets**: [reset_ticket_current_count_step.py](./src/ticket/step/reset_ticket_current_count_step.py) resets daily ticket counters every midnight.

### 2. Handling Events
The core logic is decoupled using Motia's event system:
- **Email Processing**: When an email is received, it emits an `email.received` event, which is handled by [email_to_ticket_step.py](./src/ticket/step/email_to_ticket_step.py) to create or update tickets.
- **Workflow Triggers**: Events like `ticket.created` or `ticket.replied` automatically kick off the AI orchestration flows.

### 3. Streaming
Real-time updates are pushed to the frontend using Motia's built-in streaming:
- **Live Ticket Feed**: Real-time ticket updates are streamed via the `tickets` stream.
- **AI Workflow Progress**: Things like AI is analyzing ticket, retrieving knowledge base, etc, check [ticket_orchestrator_step.py](./src/ai/step/ticket_orchestrator_step.py).
- **Frontend Integration**: I used the `@motiadev/stream-client-react` library in the frontend to subscribe to these streams with minimal boilerplate, ensuring the UI stays in sync with background AI processes.

### 4. Workflows for AI Orchestrator
Check [ticket_orchestrator_step.py](./src/ai/step/ticket_orchestrator_step.py):
- **Intelligent Routing**: Subscribes to new tickets and uses Gemini AI to classify, prioritize, and assign them to the correct team.
- **Auto-Resolution**: Analyzes conversation history and knowledge base articles to suggest resolutions or ask clarifying questions autonomously.

## 🛠 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.10+
- Redis (for Motia state management, queue, background job, etc,  or just use Motia's embedded redis)
- Supabase account (for database and auth)

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/maxwelldorliea/Helpdesk
    cd Helpdesk
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file in the root directory. This file is **shared** by both the Motia backend and the React frontend. Fill in the following values (see `env.example` for a template):

    | Variable | Description |
    | :--- | :--- |
    | `SUPABASE_URL` | Supabase project URL (Backend). |
    | `SUPABASE_KEY` | Supabase anon/public key (Backend). |
    | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Backend). |
    | `GEMINI_API_KEY` | API key for Google Gemini (AI Orchestrator). |
    | `EMAIL_USER` | The email address for the support inbox. |
    | `EMAIL_AUTH_CREDENTIAL` | Password or App Password for the support email. |
    | `IMAP_SERVER` | IMAP server address (e.g., `imap.gmail.com`). |
    | `SMTP_SERVER` | SMTP server address (e.g., `smtp.gmail.com`). |
    | `VITE_API_BASE_URL` | Backend API URL (`http://localhost:3000`). |

### 2. Frontend Setup
The frontend is a React + TypeScript application located in the `frontend/` directory.

1.  **Navigate to frontend**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start development server**:
    ```bash
    npm run dev
    ```
    The **Frontend** will be available at `http://localhost:5173`

## 🛠 Development Commands

### 1. Backend & Motia
From the root directory:
```bash
# Start Motia runtime and Workbench

npm run dev

```
The **Workbench** will be available at `http://localhost:3000`, where you can monitor all events, streams, and AI execution logs in real-time.

---

### 🟢 In Progress
- Integration for channels like WhatsApp, Slack, and Telegram
- Security Audit

Built with ❤️ using [Motia](https://motia.dev)