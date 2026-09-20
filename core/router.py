"""
Rezolotion Harness — Harness Router
Parses @mention tags from user input and dispatches to the right adapters.
"""
import re
from dataclasses import dataclass, field
from enum import Enum


class HarnessID(str, Enum):
    CLAUDE = "claude"
    AGY = "agy"
    CODEX = "codex"
    HERMES = "hermes"
    ALL = "all"


@dataclass
class RoutedMessage:
    """The result of routing a user message."""
    targets: list[HarnessID]
    content: str
    is_debate: bool = False
    raw_input: str = ""


class HarnessRouter:
    """
    Parses @mention syntax and routes messages to the correct harness(es).

    Syntax examples:
        @claude write a function to sort a list
        @agy review this code
        @debate @claude @agy should we use Redis for session storage?
        @all what is the project status?
        hello world   (no tag → routes to last used harness)
    """

    TAG_PATTERN = re.compile(r"@(\w+)")
    KNOWN_CONTROL_TAGS = {"debate", "all"}

    def __init__(self) -> None:
        self._last_used: HarnessID = HarnessID.CLAUDE

    def route(self, user_input: str) -> RoutedMessage:
        tags_found = self.TAG_PATTERN.findall(user_input.lower())
        content = self.TAG_PATTERN.sub("", user_input).strip()
        is_debate = "debate" in tags_found

        # @all → broadcast to every harness
        if "all" in tags_found:
            return RoutedMessage(
                targets=list(HarnessID),
                content=content,
                is_debate=False,
                raw_input=user_input,
            )

        # Collect specific harness targets
        targets: list[HarnessID] = []
        for tag in tags_found:
            if tag in self.KNOWN_CONTROL_TAGS:
                continue
            try:
                targets.append(HarnessID(tag))
            except ValueError:
                pass  # unknown tag — ignore

        # No tag → re-use last harness
        if not targets:
            targets = [self._last_used]
        else:
            self._last_used = targets[-1]

        return RoutedMessage(
            targets=targets,
            content=content,
            is_debate=is_debate,
            raw_input=user_input,
        )
