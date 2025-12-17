import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { APIResponse, PaginatedResponse, Ticket, Customer, Team, Communication, ChannelConfig } from './types'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

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

    async replyToTicket(name: string, data: { body: string; attachments?: Record<string, string>; channel?: string }): Promise<Communication> {
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
        const response = await this.client.get('/api/customers', { params })
        return response.data
    }

    async getCustomer(name: string): Promise<APIResponse<Customer>> {
        const response = await this.client.get(`/api/customers/${name}`)
        return response.data
    }

    async getTeams(): Promise<APIResponse<Team[]>> {
        const response = await this.client.get('/api/teams')
        return response.data
    }
}

export const api = new APIClient()
export default api
