#!/usr/bin/python3

import os
import json
from google import genai
from google.genai import types
from src.models.models import TicketAnalysis

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.client = genai.Client(api_key=self.api_key)

    def analyze_ticket(self, subject: str, description: str, teams: list[dict], priorities: list[str], kb_articles: list[dict] = None, resolved_tickets: list[dict] = None, history: list[dict] = None) -> TicketAnalysis:
        teams_context = "\n".join([f"- {t['name']}: {t['description']}" for t in teams])
        priorities_context = ", ".join(priorities)

        kb_context = ""
        if kb_articles:
            kb_context = "\nRelevant Knowledge Base Articles:\n" + "\n".join([f"Title: {a['title']}\nContent: {a['content']}" for a in kb_articles])

        resolved_context = ""
        if resolved_tickets:
            resolved_context = "\nSimilar Resolved Tickets:\n" + "\n".join([f"Subject: {t['subject']}\nResolution: {t.get('resolution', 'N/A')}" for t in resolved_tickets])

        history_context = ""
        if history:
            history_context = "\nConversation History:\n" + "\n".join([f"{h['direction']}: {h['body']}" for h in history])

        system_instruction = f"""
        You are a helpdesk orchestrator. Your job is to analyze incoming tickets and route them to the correct team with the appropriate priority.

        INTERACTIVE CHAT MODE:
        If the user's request is ambiguous or lacks critical information (e.g., "it's broken", "I can't log in" without saying which system), you should ask a clarifying question instead of just assigning it.

        Your goals:
        1. Resolve the ticket immediately if a solution is found in the Knowledge Base or past tickets.
        2. Ask clarifying questions if more information is needed to help a human agent or to find a solution.
        3. Assign to the correct team and priority once enough information is available.

        Available Teams and their responsibilities:
        {teams_context}

        Available Priorities: {priorities_context}
        {kb_context}
        {resolved_context}
        {history_context}

        Always respond with a valid JSON object containing:
        - 'team': The assigned team (use 'Level 1 Support' if unsure).
        - 'priority': The assigned priority.
        - 'reason': Brief explanation for the assignment or action.
        - 'suggested_resolution': A potential solution if one is found.
        - 'can_resolve': Boolean, true if the suggested_resolution fully solves the issue.
        - 'needs_more_info': Boolean, true if you need to ask the customer a clarifying question.
        - 'clarifying_question': The question to ask the customer if needs_more_info is true.
        """

        response = self.client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=f"Ticket Subject: {subject}\nInitial Description: {description}\n\nPlease analyze the latest state of this ticket.",
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=TicketAnalysis
            )
        )

        if hasattr(response, 'parsed') and response.parsed:
            return response.parsed
        else:
            data = json.loads(response.text)
            return TicketAnalysis(**data)
