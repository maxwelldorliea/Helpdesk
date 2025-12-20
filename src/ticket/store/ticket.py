#!/usr/bin/python3

import os
from supabase import Client
from datetime import datetime, timedelta, timezone
from src.models.models import CommunicationDirection, AgreementStatus, TicketCreate
from pydantic import ValidationError

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
        ticket_info = ticket_info.data[0]
        count = str(ticket_info.get('current_count', 1)).zfill(5)
        self.supabase.table("System_Settings")\
        .update({"current_count": ticket_info.get('current_count', 0) + 1})\
        .eq("name", 'GLOBAL').execute()
        return f"{ticket_info.get('ticket_prefix','').upper()}-{date}-{count}"

    def _generate_customer_id(self) -> str:
        settings = self.supabase.table('System_Settings').select('current_customer_count, customer_prefix').eq('name', 'GLOBAL').execute()
        settings = settings.data[0]
        prefix = settings.get('customer_prefix', 'CUST')
        count = settings.get('current_customer_count', 1)
        self.supabase.table('System_Settings').update({'current_customer_count': count + 1}).eq('name', 'GLOBAL').execute()
        return f"{prefix}-{str(count).zfill(6)}"

    def create_from_dict(self, obj: dict) -> dict:
        try:
            TicketCreate(**obj)
        except ValidationError as e:
            raise ValueError(f"Invalid ticket data: {e}")

        obj['name'] = self.name
        if self.token:
            try:
                user = self.supabase.auth.get_user(self.token)
                if user and user.user:
                    obj['owner'] = user.user.email
            except Exception:
                pass
        if not obj.get('owner'):
            obj['owner'] = 'system@helpdesk.com'

        if obj.get('team') and not obj.get('agent'):
            agent = self.get_next_agent_for_team(obj['team'])
            if agent:
                obj['agent'] = agent

        if obj.get('raised_by'):
            handle = obj['raised_by']
            channel = obj.get('channel', 'Email')

            handle_res = self.supabase.table('Customer_Handle').select('customer').eq('channel', channel).eq('handle', handle).execute()

            customer_id = None
            if handle_res.data:
                customer_id = handle_res.data[0]['customer']
            else:
                if channel == 'Email':
                    cust_res = self.supabase.table('Customer').select('name').eq('email', handle).execute()
                    if cust_res.data:
                        customer_id = cust_res.data[0]['name']
                elif channel in ['WhatsApp', 'SMS', 'Phone']:
                    cust_res = self.supabase.table('Customer').select('name').eq('phone', handle).execute()
                    if cust_res.data:
                        customer_id = cust_res.data[0]['name']

                if customer_id:
                    self.supabase.table('Customer_Handle').insert({
                        'customer': customer_id,
                        'channel': channel,
                        'handle': handle
                    }).execute()
                else:
                    customer_id = self._generate_customer_id()
                    new_customer = {
                        'name': customer_id,
                        'full_name': handle.split('@')[0] if '@' in handle else handle
                    }
                    if channel == 'Email':
                        new_customer['email'] = handle
                    elif channel in ['WhatsApp', 'SMS', 'Phone']:
                        new_customer['phone'] = handle

                    self.supabase.table('Customer').insert(new_customer).execute()

                    self.supabase.table('Customer_Handle').insert({
                        'customer': customer_id,
                        'channel': channel,
                        'handle': handle
                    }).execute()

            obj['customer'] = customer_id

        if obj.get('priority'):
            sla_res = self.supabase.table('SLA').select('*').eq('priority', obj['priority']).execute()
            if sla_res.data:
                sla = sla_res.data[0]
                creation = datetime.now()

                if sla.get('first_response_time'):
                    delta = self._parse_interval(sla['first_response_time'])
                    obj['response_by'] = (creation + delta).isoformat()
                    obj['agreement_status'] = AgreementStatus.FIRST_RESPONSE_DUE

                if sla.get('resolution_time'):
                    delta = self._parse_interval(sla['resolution_time'])
                    obj['resolution_by'] = (creation + delta).isoformat()
                    if not obj.get('agreement_status'):
                         obj['agreement_status'] = AgreementStatus.RESOLUTION_DUE

        attachments = obj.pop('attachments', None)
        message_id = obj.pop('message_id', None)
        raw_headers = obj.pop('raw_headers', None)

        res = self.supabase.table('Ticket')\
        .insert(obj).execute()

        if not res.data:
            raise Exception("Failed to create ticket: No data returned from Supabase")

        res = res.data[0]
        comm = {
            'ticket': res['name'],
            'body': res['description'],
            'raised_by': res['raised_by'],
            'channel': res['channel'],
            'direction': CommunicationDirection.INBOUND,
            'attachments': attachments,
            'message_id': message_id,
            'raw_headers': raw_headers
        }
        comm = self.supabase.table('Communication')\
        .insert(comm).execute()
        res['Communication'] = comm.data[-1]
        return res

    def update(self, id: str, obj: dict) -> dict:
        current = self.get_by_id(id)
        now = datetime.now()

        if 'team' in obj and obj['team'] and 'agent' not in obj:
            if current.get('team') != obj['team']:
                agent = self.get_next_agent_for_team(obj['team'])
                if agent:
                    obj['agent'] = agent

        if 'status' in obj and obj['status'] in ['Resolved', 'Closed']:
            updates = {}

            if not current.get('resolved_by'):
                if self.token:
                    try:
                        user_res = self.supabase.auth.get_user(self.token)
                        if user_res and user_res.user:
                            updates['resolved_by'] = user_res.user.id
                    except Exception:
                        pass

            if not current.get('resolution_date'):
                updates['resolution_date'] = now.isoformat()

            if current.get('resolution_by'):
                resolution_by = datetime.fromisoformat(current['resolution_by'].replace('Z', '+00:00'))
                if resolution_by.tzinfo and not now.tzinfo:
                    now = now.replace(tzinfo=timezone.utc)

                if now > resolution_by:
                    updates['agreement_status'] = AgreementStatus.FAILED
                elif current.get('agreement_status') != AgreementStatus.FAILED:
                    updates['agreement_status'] = AgreementStatus.FULFILLED

            if updates:
                obj.update(updates)
                self.supabase.table('Ticket').update(updates).eq('name', id).execute()

        if 'priority' in obj and obj['priority'] != current.get('priority'):
            sla_res = self.supabase.table('SLA').select('*').eq('priority', obj['priority']).execute()
            if sla_res.data:
                sla = sla_res.data[0]
                creation = datetime.fromisoformat(current['creation'].replace('Z', '+00:00'))
                if creation.tzinfo and not now.tzinfo:
                    now = now.replace(tzinfo=timezone.utc)

                updates = {}
                if sla.get('first_response_time'):
                    delta = self._parse_interval(sla['first_response_time'])
                    updates['response_by'] = (creation + delta).isoformat()
                    if not current.get('first_responded_on'):
                        updates['agreement_status'] = AgreementStatus.FIRST_RESPONSE_DUE

                if sla.get('resolution_time'):
                    delta = self._parse_interval(sla['resolution_time'])
                    if current.get('total_hold_time'):
                        hold_delta = self._parse_interval(current['total_hold_time'])
                        updates['resolution_by'] = (creation + delta + hold_delta).isoformat()
                    else:
                        updates['resolution_by'] = (creation + delta).isoformat()

                    if not updates.get('agreement_status') and not current.get('resolution_date'):
                         updates['agreement_status'] = AgreementStatus.RESOLUTION_DUE

                if updates:
                    obj.update(updates)
                    self.supabase.table('Ticket').update(updates).eq('name', id).execute()

        if obj.get('status') == 'On Hold' and current.get('status') != 'On Hold':
            self.supabase.table('Ticket_Hold').insert({
                'ticket': id,
                'hold_start': now.isoformat()
            }).execute()

        elif current.get('status') == 'On Hold' and obj.get('status') and obj.get('status') != 'On Hold':
            hold_res = self.supabase.table('Ticket_Hold')\
                .select('*')\
                .eq('ticket', id)\
                .is_('hold_end', 'null')\
                .order('hold_start', desc=True)\
                .limit(1)\
                .execute()

            if hold_res.data:
                hold_record = hold_res.data[0]
                hold_start = datetime.fromisoformat(hold_record['hold_start'].replace('Z', '+00:00'))

                if hold_start.tzinfo and not now.tzinfo:
                    now = now.replace(tzinfo=timezone.utc)

                duration = now - hold_start

                self.supabase.table('Ticket_Hold').update({
                    'hold_end': now.isoformat(),
                    'duration': str(duration)
                }).eq('id', hold_record['id']).execute()

                current_hold_time = self._parse_interval(current.get('total_hold_time'))
                new_total_hold_time = current_hold_time + duration

                updates = {
                    'total_hold_time': str(new_total_hold_time)
                }

                if current.get('resolution_by'):
                    resolution_by = datetime.fromisoformat(current['resolution_by'].replace('Z', '+00:00'))
                    new_resolution_by = resolution_by + duration
                    updates['resolution_by'] = new_resolution_by.isoformat()

                self.supabase.table('Ticket').update(updates).eq('name', id).execute()
                obj.update(updates)

        if 'agent' in obj and obj['agent']:
            team_name = obj.get('team') or current.get('team')
            if team_name:
                self.supabase.table('Team').update({'last_assigned_agent': obj['agent']}).eq('name', team_name).execute()

        res = self.supabase.table('Ticket')\
        .update(obj).eq('name', id).execute()

        updated = res.data[0] if res.data else {}

        if current and updated:
            self._check_and_log_changes(id, current, updated)

        return updated


    def get_next_agent_for_team(self, team_name: str) -> str | None:
        team_res = self.supabase.table('Team').select('last_assigned_agent').eq('name', team_name).execute()
        if not team_res.data:
            return None

        last_agent = team_res.data[0].get('last_assigned_agent')

        members_res = self.supabase.table('Agent_Membership')\
            .select('user')\
            .eq('team', team_name)\
            .order('user')\
            .execute()

        if not members_res.data:
            return None

        agents = [m['user'] for m in members_res.data]

        if len(agents) == 0:
            return None

        if last_agent is None or last_agent not in agents:
            next_agent = agents[0]
        else:
            current_idx = agents.index(last_agent)
            next_idx = (current_idx + 1) % len(agents)
            next_agent = agents[next_idx]

        self.supabase.table('Team').update({'last_assigned_agent': next_agent}).eq('name', team_name).execute()

        return next_agent



    def get_by_id(self, id: str) -> dict:
        res = self.supabase.table('Ticket')\
        .select('*, Communication(*), Priority(*)').eq('name', id).execute()

        if not res.data:
            return {}

        ticket = res.data[0]
        if ticket.get('priority'):
            sla_res = self.supabase.table('SLA')\
            .select('*')\
            .eq('priority', ticket['priority'])\
            .execute()
            if sla_res.data:
                ticket['SLA'] = sla_res.data[0]
            if sla_res.data:
                ticket['SLA'] = sla_res.data[0]

        if ticket.get('agent'):
            try:
                profile_res = self.supabase.table('Profile').select('full_name, email').eq('id', ticket['agent']).execute()
                if profile_res.data:
                    profile = profile_res.data[0]
                    ticket['assigneeName'] = profile.get('full_name') or profile.get('email')
            except Exception:
                pass

        if ticket.get('customer'):
            try:
                customer_res = self.supabase.table('Customer').select('full_name, email, phone').eq('name', ticket['customer']).execute()
                if customer_res.data:
                    customer = customer_res.data[0]
                    ticket['customerName'] = customer.get('full_name') or customer.get('email') or customer.get('phone') or ticket['customer']
                    ticket['customerEmail'] = customer.get('email')
                    ticket['customerPhone'] = customer.get('phone')
            except Exception:
                pass

        return ticket

    def _parse_interval(self, interval_str: str):
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
        res = self.supabase.table('Ticket')\
        .select('*, Priority(*)').execute()
        tickets = res.data

        sla_res = self.supabase.table('SLA').select('*').execute()
        sla_map = {sla['priority']: sla for sla in sla_res.data}
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

        agent_ids = [t['agent'] for t in tickets if t.get('agent')]
        if agent_ids:
            try:
                profiles_res = self.supabase.table('Profile').select('id, full_name, email').in_('id', agent_ids).execute()
                profile_map = {p['id']: p for p in profiles_res.data}

                for t in tickets:
                    if t.get('agent') and t['agent'] in profile_map:
                        profile = profile_map[t['agent']]
                        t['assigneeName'] = profile.get('full_name') or profile.get('email')
            except Exception as e:
                print(f"Error fetching agent profiles: {e}")

        customer_ids = [t['customer'] for t in tickets if t.get('customer')]
        if customer_ids:
            try:
                customers_res = self.supabase.table('Customer').select('name, full_name, email, phone').in_('name', customer_ids).execute()
                customer_map = {c['name']: c for c in customers_res.data}

                for t in tickets:
                    if t.get('customer') and t['customer'] in customer_map:
                        customer = customer_map[t['customer']]
                        t['customerName'] = customer.get('full_name') or customer.get('email') or customer.get('phone') or t['customer']
                        t['customerEmail'] = customer.get('email')
                        t['customerPhone'] = customer.get('phone')
            except Exception as e:
                print(f"Error fetching customer info: {e}")

        return tickets


    def _get_actor_identity(self):
        if not self.token:
            return os.environ.get('BOT_NAME', 'AI Bot')
        try:
            user_res = self.supabase.auth.get_user(self.token)
            if user_res and user_res.user:
                metadata = user_res.user.user_metadata or {}
                name = metadata.get('full_name') or metadata.get('name') or user_res.user.email or "Agent"
                return f"Agent {name}" if "@" not in name else name
        except Exception:
            pass
        return "Agent"

    def _check_and_log_changes(self, ticket_id: str, old: dict, new: dict):
        events = []
        actor = self._get_actor_identity()

        if old.get('status') != new.get('status'):
            old_status = old.get('status') or 'Open'
            new_status = new.get('status')
            events.append({
                "body": f"{actor} set ticket status to {new_status} (previously {old_status})",
                "direction": "System"
            })

        if old.get('team') != new.get('team'):
            old_team = old.get('team') or 'Unassigned'
            new_team = new.get('team') or 'Unassigned'

            is_escalation = (new.get('escalation_count') or 0) > (old.get('escalation_count') or 0)

            if is_escalation:
                events.append({
                    "body": f"{actor} escalated ticket from {old_team} to {new_team}",
                    "direction": "Escalation"
                })
            else:
                events.append({
                    "body": f"{actor} reassigned ticket from {old_team} to {new_team}",
                    "direction": "System"
                })

        if old.get('priority') != new.get('priority'):
            old_priority = old.get('priority') or 'None'
            new_priority = new.get('priority') or 'None'
            events.append({
                "body": f"{actor} set ticket priority to {new_priority} (previously {old_priority})",
                "direction": "System"
            })

        if old.get('agent') != new.get('agent'):
            events.append({
                "body": f"{actor} updated ticket assignee",
                "direction": "System"
            })


        if events:
            user = None
            if self.token:
                try:
                    user_res = self.supabase.auth.get_user(self.token)
                    user = user_res.user if user_res else None
                except Exception:
                    pass

            sender_id = user.id if user else None

            for event in events:
                self.supabase.table('Communication').insert({
                    'ticket': ticket_id,
                    'body': event['body'],
                    'direction': event['direction'],
                    'channel': 'System',
                    'raised_by': new.get('raised_by'),
                    'sender': sender_id,
                    'event_type': 'system_event'
                }).execute()

    def add_reply(self, id: str, obj: dict) -> dict:
        obj['ticket'] = id

        user = self.supabase.auth.get_user(self.token)
        obj['sender'] = user.user.id
        obj['direction'] = CommunicationDirection.OUTBOUND

        if not obj.get('raised_by') and user.user.email:
            obj['raised_by'] = user.user.email

        res = self.supabase.table('Communication')\
        .insert(obj).execute()

        ticket = self.get_by_id(id)
        if not ticket.get('first_responded_on'):
            now = datetime.now()
            creation = datetime.fromisoformat(ticket['creation'].replace('Z', '+00:00'))
            if creation.tzinfo and not now.tzinfo:
                now = now.replace(tzinfo=timezone.utc)

            delta = now - creation

            updates = {
                'first_responded_on': now.isoformat(),
                'first_response_time': str(delta)
            }

            if ticket.get('response_by'):
                response_by = datetime.fromisoformat(ticket['response_by'].replace('Z', '+00:00'))
                if now > response_by:
                    updates['agreement_status'] = AgreementStatus.FAILED
                else:
                    if ticket.get('resolution_by'):
                        updates['agreement_status'] = AgreementStatus.RESOLUTION_DUE
                    else:
                        updates['agreement_status'] = AgreementStatus.FULFILLED

            self.supabase.table('Ticket').update(updates).eq('name', id).execute()

        return res.data[-1] if res.data else {}

    def add_communication(self, ticket_id: str, body: str, direction: str, channel: str, raised_by: str, **kwargs) -> dict:
        comm = {
            'ticket': ticket_id,
            'body': body,
            'direction': direction,
            'channel': channel,
            'raised_by': raised_by,
            **kwargs
        }
        res = self.supabase.table('Communication').insert(comm).execute()

        if raised_by == 'AI Orchestrator':
            ticket = self.get_by_id(ticket_id)
            if not ticket.get('bot_first_response_time'):
                now = datetime.now()
                creation = datetime.fromisoformat(ticket['creation'].replace('Z', '+00:00'))
                if creation.tzinfo and not now.tzinfo:
                    now = now.replace(tzinfo=timezone.utc)

                delta = now - creation

                updates = {
                    'bot_first_response_time': str(delta),
                    'bot_first_responded_on': now.isoformat()
                }

                if ticket.get('response_by'):
                    response_by = datetime.fromisoformat(ticket['response_by'].replace('Z', '+00:00'))
                    if now > response_by:
                        updates['agreement_status'] = AgreementStatus.FAILED
                    else:
                         if ticket.get('resolution_by'):
                            updates['agreement_status'] = AgreementStatus.RESOLUTION_DUE
                         else:
                            updates['agreement_status'] = AgreementStatus.FULFILLED

                self.supabase.table('Ticket').update(updates).eq('name', ticket_id).execute()

        return res.data[0] if res.data else {}

    def get_channels(self) -> list[dict]:
        res = self.supabase.table('Channel').select('*').eq('is_active', True).execute()
        return res.data
