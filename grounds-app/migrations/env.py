from alembic import context
from grounds import create_app
from grounds.models import db

app = create_app()
with app.app_context():
    with db.engine.connect() as connection:
        context.configure(
            connection=connection, target_metadata=db.metadata, compare_type=True
        )
        with context.begin_transaction():
            context.run_migrations()
