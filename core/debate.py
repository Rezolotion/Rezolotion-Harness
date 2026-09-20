"""
Rezolotion Harness — Debate Manager
Runs a structured multi-round debate between two or more harnesses.
"""
import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from adapters.base import BaseAdapter
    from core.context import SharedContext


class DebateManager:
    """
    Orchestrates a debate between multiple harnesses.

    Each round:
    1. All participants answer the current question simultaneously (async).
    2. Their responses are added to shared context.
    3. Next round — each participant now sees what the others said.
    """

    def __init__(self, context: "SharedContext") -> None:
        self.context = context

    async def run(
        self,
        topic: str,
        participants: list["BaseAdapter"],
        rounds: int = 2,
    ):
        """
        Yields debate events as dicts so the caller (WebSocket handler)
        can stream them to the UI in real time.
        """
        await self.context.add(role="user", content=f"[DEBATE TOPIC] {topic}")

        for round_num in range(1, rounds + 1):
            yield {"event": "debate_round_start", "round": round_num, "total": rounds}

            history = await self.context.get_messages(limit=100)

            # All participants respond simultaneously
            tasks = [
                participant.send(message=topic, history=history)
                for participant in participants
            ]
            responses: list[str] = await asyncio.gather(*tasks)

            for participant, response in zip(participants, responses):
                # Save to shared context so next round participants see it
                await self.context.add(
                    role="assistant",
                    harness=participant.harness_id,
                    model=participant.current_model,
                    content=response,
                )
                yield {
                    "event": "debate_response",
                    "round": round_num,
                    "harness": participant.harness_id,
                    "model": participant.current_model,
                    "content": response,
                }

            if round_num < rounds:
                yield {"event": "debate_round_end", "round": round_num}

        yield {"event": "debate_complete", "rounds": rounds}
