"""Entry point: python -m rezolotion_harness"""
import uvicorn
from core.config import settings


def main():
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info",
    )


if __name__ == "__main__":
    main()

# Also expose as typer CLI
import typer
cli = typer.Typer()

@cli.command()
def run(
    host: str = typer.Option(settings.host, help="Host to bind"),
    port: int = typer.Option(settings.port, help="Port to listen on"),
    debug: bool = typer.Option(settings.debug, help="Enable debug/reload mode"),
):
    """Start the Rezolotion Harness server."""
    uvicorn.run("app:app", host=host, port=port, reload=debug)

app_cli = cli
