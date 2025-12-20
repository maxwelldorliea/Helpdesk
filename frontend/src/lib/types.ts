export type TicketStatus = 'Open' | 'Replied' | 'On Hold' | 'Resolved' | 'Closed'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Channel = 'Email' | 'WhatsApp'
export type AgreementStatus = 'First Response Due' | 'Resolution Due' | 'Failed' | 'Fulfilled' | 'Paused' | 'On Track' | 'Passed'
export type CommunicationDirection = 'Inbound' | 'Outbound' | 'System' | 'Escalation'

export interface ChannelConfig {
    name: string
    description: string | null
    icon_slug: string | null
    is_active: boolean
}

export interface Ticket {
    name: string
    owner: string
    subject: string
    description: string
    raised_by: string
    status: TicketStatus
    priority: string | null
    customer: string | null
    team: string | null
    agent: string | null
    channel: string
    external_thread_id: string | null

    creation: string
    modified: string
    resolution_date: string | null
    response_by: string | null
    resolution_by: string | null
    first_responded_on: string | null
    total_hold_time: string | null

    resolved_by_bot: boolean
    resolved_by: string | null
    bot_first_responded_on: string | null

    sla: string | null
    agreement_status: AgreementStatus | null
    escalation_count: number

    customerName?: string
    customerEmail?: string
    customerPhone?: string
    assigneeName?: string
    teamName?: string
    Communication?: Communication[]
    SLA?: SLA | null
    Priority?: PriorityLevel | null
}

export interface Customer {
    name: string
    full_name: string | null
    email: string | null
    phone: string | null
    organization: string | null
    creation: string
    modified: string
}

export interface Team {
    name: string
    description: string | null
    escalation_team: string | null
    last_agent: string | null
    creation: string
    modified: string
}

export interface SLA {
    name: string
    priority: string
    description: string | null
    first_response_time: string | null
    resolution_time: string | null
    applies_to_contract_group: string | null
    creation: string
    modified: string
}

export interface PriorityLevel {
    name: string
    description: string | null
    color_code: string | null
    sort_order: number | null
    creation: string
    modified: string
}

export interface Communication {
    id: number
    ticket: string
    body: string
    direction: CommunicationDirection
    channel: string | null
    attachments: Record<string, any> | null
    sender: string | null
    raised_by: string
    name: string
    event_type: string | null
    creation: string
    modified: string
}

export interface KnowledgeBaseArticle {
    id: number
    title: string
    content: string
    category: string | null
    is_public: boolean
    author: string | null
    creation: string
    modified: string
}

export interface SystemSettings {
    name: string
    ticket_prefix: string
    current_count: number
    customer_prefix: string
    current_customer_count: number
    admin_team: string | null
    last_reset_date: string
}

export interface AgentMembership {
    id: number
    user: string
    team: string
    creation: string
    modified: string
    userInfo?: {
        id: string
        email: string
        full_name?: string
    }
}

export interface CustomerHandle {
    id: number
    customer: string
    channel: string
    handle: string
    creation: string
    modified: string
}

export interface User {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    role?: 'System Manager' | 'Agent' | 'Customer'
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
}

export interface APIResponse<T> {
    data: T
    message?: string
    success: boolean
}
