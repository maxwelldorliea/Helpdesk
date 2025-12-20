#!/usr/bin/python3

from src.management.store.base import BaseStore

class MembershipStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'Agent_Membership')

    def get_by_team(self, team_name: str):
        members = self.get_all_filtered('team', team_name)
        if not members:
            return []

        user_ids = [m['user'] for m in members]
        if user_ids:
            try:
                profiles_res = self.supabase.table('Profile').select('id, full_name, email').in_('id', user_ids).execute()
                profile_map = {p['id']: p for p in profiles_res.data}

                for m in members:
                    if m['user'] in profile_map:
                        profile = profile_map[m['user']]
                        m['userInfo'] = {
                            'id': profile['id'],
                            'email': profile.get('email'),
                            'full_name': profile.get('full_name')
                        }
            except Exception as e:
                print(f"Error fetching member profiles: {e}")

        return members

    def add_member(self, team_name: str, user: str):
        return self.create({
            "team": team_name,
            "user": user
        })

    def remove_member(self, team_name: str, user: str):
        res = self.table.delete().eq('team', team_name).eq('user', user).execute()
        return res.data
