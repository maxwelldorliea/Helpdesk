import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { APIResponse, PaginatedResponse, Ticket, Customer, Team, Communication, ChannelConfig, KnowledgeBaseArticle, PriorityLevel, SystemSettings, AgentMembership, CustomerHandle, SLA, User } from './types'
import { supabase } from './supabase'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class APIClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        })

        this.client.interceptors.request.use(
            async (config) => {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.access_token) {
                    config.headers.Authorization = `Bearer ${session.access_token}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    window.location.href = '/login'
                }
                return Promise.reject(error)
            }
        )
    }

    async getTickets(params?: {
        status?: string
        priority?: string
        search?: string
    }): Promise<Ticket[]> {
        const response = await this.client.get('/tickets', { params })
        return response.data
    }

    async getTicket(name: string): Promise<Ticket> {
        const response = await this.client.get(`/tickets/${name}`)
        return response.data
    }

    async createTicket(data: Partial<Ticket>): Promise<Ticket> {
        const response = await this.client.post('/tickets', data)
        return response.data
    }

    async updateTicket(name: string, data: Partial<Ticket>): Promise<Ticket> {
        const response = await this.client.put(`/tickets/${name}`, data)
        return response.data
    }

    async replyToTicket(name: string, data: { body: string; attachments?: Record<string, string>; channel?: string; raised_by?: string }): Promise<Communication> {
        const response = await this.client.post(`/tickets/${name}/reply`, data)
        return response.data
    }

    async deleteTicket(name: string): Promise<void> {
        await this.client.delete(`/tickets/${name}`)
    }

    async getChannels(): Promise<ChannelConfig[]> {
        const response = await this.client.get('/channels')
        return response.data
    }

    async getCustomers(params?: {
        page?: number
        pageSize?: number
        search?: string
    }): Promise<PaginatedResponse<Customer>> {
        const response = await this.client.get('/management/customers', { params })
        return response.data
    }

    async getCustomer(name: string): Promise<APIResponse<Customer>> {
        const response = await this.client.get(`/api/customers/${name}`)
        return response.data
    }

    async createCustomer(data: Partial<Customer>): Promise<Customer> {
        const response = await this.client.post('/management/customers', data)
        return response.data
    }

    async updateCustomer(name: string, data: Partial<Customer>): Promise<Customer> {
        const response = await this.client.put(`/management/customers/${name}`, data)
        return response.data
    }

    async deleteCustomer(name: string): Promise<void> {
        await this.client.delete(`/management/customers/${name}`)
    }

    async getSettings(): Promise<SystemSettings> {
        const response = await this.client.get('/management/settings')
        return response.data
    }

    async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
        const response = await this.client.put('/management/settings', data)
        return response.data
    }

    async getTeamMembers(teamName: string): Promise<AgentMembership[]> {
        const response = await this.client.get(`/management/teams/${teamName}/members`)
        return response.data
    }

    async addTeamMember(teamName: string, user: string): Promise<AgentMembership> {
        const response = await this.client.post(`/management/teams/${teamName}/members`, { user })
        return response.data
    }

    async removeTeamMember(teamName: string, user: string): Promise<void> {
        await this.client.delete(`/management/teams/${teamName}/members/${user}`)
    }

    async getAgents(): Promise<{ user: string, name: string }[]> {
        const response = await this.client.get('/management/agents')
        return response.data
    }

    async getCustomerHandles(customerName: string): Promise<CustomerHandle[]> {
        const response = await this.client.get(`/management/customers/${customerName}/handles`)
        return response.data
    }

    async addCustomerHandle(customerName: string, data: { channel: string, handle: string }): Promise<CustomerHandle> {
        const response = await this.client.post(`/management/customers/${customerName}/handles`, data)
        return response.data
    }

    async removeCustomerHandle(customerName: string, handleId: number): Promise<void> {
        await this.client.delete(`/management/customers/${customerName}/handles/${handleId}`)
    }

    async getSLAs(): Promise<SLA[]> {
        const res = await this.client.get<SLA[]>('/management/slas')
        return res.data
    }

    async createSLA(data: Partial<SLA>): Promise<SLA> {
        const res = await this.client.post<SLA>('/management/slas', data)
        return res.data
    }

    async updateSLA(name: string, data: Partial<SLA>): Promise<SLA> {
        const res = await this.client.put<SLA>(`/management/slas/${name}`, data)
        return res.data
    }

    async deleteSLA(name: string): Promise<void> {
        await this.client.delete(`/management/slas/${name}`)
    }

    async getUsers(): Promise<User[]> {
        const res = await this.client.get<User[]>('/management/users')
        return res.data
    }

    async inviteUser(email: string): Promise<{ message: string; user: User }> {
        const res = await this.client.post<{ message: string; user: User }>('/management/users/invite', { email })
        return res.data
    }

    async getTeams(): Promise<Team[]> {
        const response = await this.client.get('/management/teams')
        return response.data
    }

    async createTeam(data: Partial<Team>): Promise<Team> {
        const response = await this.client.post('/management/teams', data)
        return response.data
    }

    async updateTeam(name: string, data: Partial<Team>): Promise<Team> {
        const response = await this.client.put(`/management/teams/${name}`, data)
        return response.data
    }

    async deleteTeam(name: string): Promise<void> {
        await this.client.delete(`/management/teams/${name}`)
    }

    async getArticles(): Promise<KnowledgeBaseArticle[]> {
        const response = await this.client.get('/management/kb')
        return response.data
    }

    async createArticle(data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle> {
        const response = await this.client.post('/management/kb', data)
        return response.data
    }

    async updateArticle(id: number, data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle> {
        const response = await this.client.put(`/management/kb/${id}`, data)
        return response.data
    }

    async deleteArticle(id: number): Promise<void> {
        await this.client.delete(`/management/kb/${id}`)
    }

    async getPriorities(): Promise<PriorityLevel[]> {
        const response = await this.client.get('/management/priorities')
        return response.data
    }

    async createPriority(data: Partial<PriorityLevel>): Promise<PriorityLevel> {
        const response = await this.client.post('/management/priorities', data)
        return response.data
    }

    async updatePriority(name: string, data: Partial<PriorityLevel>): Promise<PriorityLevel> {
        const response = await this.client.put(`/management/priorities/${name}`, data)
        return response.data
    }

    async deletePriority(name: string): Promise<void> {
        await this.client.delete(`/management/priorities/${name}`)
    }

    async getStats(period?: string, startDate?: string, endDate?: string): Promise<any> {
        const params: Record<string, string> = {}
        if (period) params.period = period
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate

        const response = await this.client.get('/management/stats', {
            params: Object.keys(params).length > 0 ? params : undefined
        })
        return response.data
    }

    async getProfile(): Promise<any> {
        const response = await this.client.get('/profile')
        return response.data
    }

    async updateProfile(data: { full_name?: string; bio?: string; avatar_url?: string }): Promise<any> {
        const response = await this.client.put('/profile', data)
        return response.data
    }
}

export const api = new APIClient()
export default api
