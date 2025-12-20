#!/usr/bin/python3

import os
from datetime import datetime, timedelta
from supabase import create_client, Client
from src.middleware.auth import auth

config = {
    "name": "Get Dashboard Stats",
    "type": "api",
    "method": "GET",
    "description": "Get dashboard statistics for helpdesk analytics",
    "path": "/management/stats",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase_url = os.environ.get('SUPABASE_URL')
    service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not service_role_key or not supabase_url:
        ctx.logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
        return {
            "status": 500,
            "body": {"error": "An error occurred! It's on us!"}
        }

    supabase: Client = create_client(supabase_url, service_role_key)

    try:
        query_params = req.get('queryParams', {})
        period = query_params.get('period', 'all')
        custom_start = query_params.get('start_date')
        custom_end = query_params.get('end_date')

        now = datetime.now()
        start_date = None
        end_date = None

        if custom_start and custom_end:
            try:
                start_date = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
                end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            except Exception:
                pass
        elif period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == '7d':
            start_date = now - timedelta(days=7)
        elif period == '30d':
            start_date = now - timedelta(days=30)
        elif period == '3m':
            start_date = now - timedelta(days=90)
        elif period == '6m':
            start_date = now - timedelta(days=180)
        elif period == '1y':
            start_date = now - timedelta(days=365)

        query = supabase.table('Ticket').select('*')
        if start_date:
            start_date_str = start_date.isoformat()
            query = query.gte('creation', start_date_str)
        if end_date:
            end_date_str = end_date.isoformat()
            query = query.lte('creation', end_date_str)

        tickets_res = query.execute()
        tickets = tickets_res.data or []

        users_res = supabase.auth.admin.list_users()
        users_data = users_res.users if hasattr(users_res, 'users') else users_res
        user_map = {str(u.id): u.email for u in users_data}

        profiles_res = supabase.table('Profile').select('id, full_name, email').execute()
        profile_map = {p['id']: p for p in profiles_res.data}

        status_counts = {
            'open': 0,
            'replied': 0,
            'on hold': 0,
            'resolved': 0,
            'closed': 0
        }
        for t in tickets:
            status = (t.get('status') or '').lower()
            if status in status_counts:
                status_counts[status] += 1

        bot_resolved = sum(1 for t in tickets if t.get('resolved_by_bot'))

        agent_stats = {}
        for t in tickets:
            resolved_by = t.get('resolved_by')
            if resolved_by and t.get('status') in ['Resolved', 'Closed']:
                agent_id = str(resolved_by)
                if agent_id not in agent_stats:
                    email = user_map.get(agent_id, 'Unknown')
                    name = email
                    if agent_id in profile_map:
                        profile = profile_map[agent_id]
                        name = profile.get('full_name') or profile.get('email') or email

                    agent_stats[agent_id] = {
                        'agent_id': agent_id,
                        'email': email,
                        'name': name,
                        'resolved_count': 0,
                        'closed_count': 0
                    }
                if t.get('status') == 'Resolved':
                    agent_stats[agent_id]['resolved_count'] += 1
                elif t.get('status') == 'Closed':
                    agent_stats[agent_id]['closed_count'] += 1

        response_times = []
        for t in tickets:
            if t.get('first_response_time'):
                frt = t.get('first_response_time')
                if isinstance(frt, str):
                    hours = _parse_interval_to_hours(frt)
                    if hours is not None:
                        response_times.append(hours)

        avg_first_response_hours = round(sum(response_times) / len(response_times), 2) if response_times else None

        resolution_times = []
        for t in tickets:
            if t.get('resolution_date') and t.get('creation'):
                try:
                    created = datetime.fromisoformat(t['creation'].replace('Z', '+00:00'))
                    resolved = datetime.fromisoformat(t['resolution_date'].replace('Z', '+00:00'))
                    delta_hours = (resolved - created).total_seconds() / 3600
                    resolution_times.append(delta_hours)
                except Exception:
                    pass

        avg_resolution_hours = round(sum(resolution_times) / len(resolution_times), 2) if resolution_times else None

        sla_breached = sum(1 for t in tickets if t.get('agreement_status') == 'Failed')
        sla_compliance = 100.0
        if tickets:
            sla_compliance = round(((len(tickets) - sla_breached) / len(tickets)) * 100, 1)

        hold_times = []
        for t in tickets:
            if t.get('total_hold_time'):
                hours = _parse_interval_to_hours(t.get('total_hold_time'))
                if hours is not None:
                    hold_times.append(hours)

        avg_hold_time_hours = round(sum(hold_times) / len(hold_times), 2) if hold_times else None

        stats = {
            'total_tickets': len(tickets),
            'status_counts': status_counts,
            'bot_resolved': bot_resolved,
            'agent_performance': list(agent_stats.values()),
            'avg_first_response_hours': avg_first_response_hours,
            'avg_resolution_hours': avg_resolution_hours,
            'sla_compliance': sla_compliance,
            'avg_hold_time_hours': avg_hold_time_hours
        }

        return {"status": 200, "body": stats}

    except Exception as e:
        ctx.logger.error(f"Failed to get stats: {str(e)}")
        return {"status": 500, "body": {"error": str(e)}}


def _parse_interval_to_hours(interval_str: str) -> float | None:
    try:
        hours = 0.0
        if 'day' in interval_str:
            parts = interval_str.split()
            days = int(parts[0])
            hours += days * 24
            if len(parts) > 2:
                time_part = parts[2]
            else:
                return hours
        else:
            time_part = interval_str

        if ':' in time_part:
            time_parts = time_part.split(':')
            hours += int(time_parts[0])
            hours += int(time_parts[1]) / 60
            if len(time_parts) > 2:
                hours += float(time_parts[2]) / 3600
        return hours
    except Exception:
        return None
