#!/usr/bin/python3

from supabase import Client
from datetime import datetime
from src.models.models import CommunicationDirection

class Ticket:
    def __init__(self, supabase: Client, token: str):
        self.supabase = supabase
        self.token = token

    @property
    def name(self):
        today = datetime.now()
        date = today.strftime("%y%m%d")

        ticket_info = self.supabase.table('System_Settings')\
        .select('current_count, ticket_prefix')\
        .eq('name', 'GLOBAL').execute()
        ticket_info = ticket_info.data[-1] or {}
        count = str(ticket_info.get('current_count')).zfill(5)
        self.supabase.table("System_Settings")\
        .update({"current_count": ticket_info.get('current_count', 0) + 1})\
        .eq("name", 'GLOBAL').execute()
        return f"{ticket_info.get('ticket_prefix','').upper()}-{date}-{count}"

    def get_by_id(self, id: str) -> dict:
        res = self.supabase.table('Ticket')\
        .select('*, Communication(*), Priority(*)').eq('name', id).execute()
        ticket = res.data[-1]
        if ticket.get('priority'):
            sla_res = self.supabase.table('SLA')\
            .select('*')\
            .eq('priority_name', ticket['priority'])\
            .execute()
            if sla_res.data:
                ticket['SLA'] = sla_res.data[0]
        return ticket

    def _parse_interval(self, interval_str: str):
        from datetime import timedelta
        if not interval_str:
            return timedelta(0)
        try:
            if ':' in interval_str:
                parts = list(map(int, interval_str.split(':')))
                if len(parts) == 3:
                    return timedelta(hours=parts[0], minutes=parts[1], seconds=parts[2])
            val = int(interval_str.split()[0])
            if 'day' in interval_str:
                return timedelta(days=val)
            if 'hour' in interval_str:
                return timedelta(hours=val)
            if 'minute' in interval_str:
                return timedelta(minutes=val)
        except Exception:
            pass
        return timedelta(0)

    def get_all(self) -> list[dict]:
        from datetime import datetime
        res = self.supabase.table('Ticket')\
        .select('*, Priority(*)').execute()
        tickets = res.data

        sla_res = self.supabase.table('SLA').select('*').execute()
        sla_map = {sla['priority_name']: sla for sla in sla_res.data}
        for ticket in tickets:
            if ticket.get('priority'):
                sla = sla_map.get(ticket['priority'])
                ticket['SLA'] = sla
                if not ticket.get('response_by') and sla and sla.get('first_response_time'):
                    try:
                        creation = datetime.fromisoformat(ticket['creation'].replace('Z', '+00:00'))
                        delta = self._parse_interval(sla['first_response_time'])
                        ticket['response_by'] = (creation + delta).isoformat()
                    except Exception as e:
                        print(f"Error calculating response_by: {e}")
        return tickets

    def create_from_dict(self, obj: dict) -> dict:
        obj['name'] = self.name
        self.supabase.auth.get_user()
        user = self.supabase.auth.get_user(self.token)
        obj['owner'] = user.user.email
        res = self.supabase.table('Ticket')\
        .insert(obj).execute()
        res = res.data[0]
        comm = {
            'ticket': res['name'],
            'body': res['description'],
            'raised_by': res['raised_by'],
            'channel': res['channel'],
            'direction': CommunicationDirection.INBOUND,
            'attachments': obj.get('attachments')
        }
        comm = self.supabase.table('Communication')\
        .insert(comm).execute()
        res['Communication'] = comm.data[-1]
        return res

    def update(self, id: str, obj: dict) -> dict:
        self.supabase.table('Ticket')\
        .update(obj).eq('name', id).execute()

    def add_reply(self, id: str, obj: dict) -> dict:
        obj['ticket'] = id

        user = self.supabase.auth.get_user(self.token)
        obj['sender'] = user.user.id
        obj['direction'] = CommunicationDirection.OUTBOUND
        res = self.supabase.table('Communication')\
        .insert(obj).execute()
        return res.data[-1] if res.data else {}

    def get_channels(self) -> list[dict]:
        res = self.supabase.table('Channel').select('*').eq('is_active', True).execute()
        return res.data
