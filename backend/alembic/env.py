from logging.config import fileConfig

import geoalchemy2.alembic_helpers  # registra os tipos Geography/Geometry e os helpers de autogenerate
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.config import settings
from app.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config
# `%%`, não `%`: o ConfigParser por trás do Config trata `%` como início de
# interpolação (`%(nome)s`) e lança ValueError em qualquer URL com `%`
# literal (ex: senha com "%40" no lugar de "@", como a do Supabase em
# produção) — escapar aqui faz o valor voltar certo (`%40`) quando o
# Alembic/SQLAlchemy relerem a URL mais adiante, e evita ter que escapar
# manualmente toda vez que essa URL for passada por variável de ambiente.
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    # Tabela interna do PostGIS — não faz parte do nosso schema
    if type_ == "table" and name == "spatial_ref_sys":
        return False
    return True

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        # A imagem postgis/postgis coloca tiger_geocoder/topology no search_path
        # do usuário; sem isso o autogenerate tenta "dropar" as tabelas delas.
        # Setado via connect_args (nível da conexão libpq) para não interferir
        # na transação que o Alembic controla.
        connect_args={"options": "-c search_path=public"},
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            render_item=geoalchemy2.alembic_helpers.render_item,
            process_revision_directives=geoalchemy2.alembic_helpers.writer,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
