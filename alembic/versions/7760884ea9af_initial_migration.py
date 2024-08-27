"""Initial migration

Revision ID: 7760884ea9af
Revises: 
Create Date: 2024-08-27 14:58:06.950678

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7760884ea9af'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('carts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('chat_id', sa.String(), nullable=True),
    sa.Column('data', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_carts_chat_id'), 'carts', ['chat_id'], unique=True)
    op.create_index(op.f('ix_carts_id'), 'carts', ['id'], unique=False)
    op.create_table('conversations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('chat_id', sa.String(), nullable=True),
    sa.Column('thread_id', sa.String(), nullable=True),
    sa.Column('last_activity', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('thread_id')
    )
    op.create_index(op.f('ix_conversations_chat_id'), 'conversations', ['chat_id'], unique=True)
    op.create_index(op.f('ix_conversations_id'), 'conversations', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_conversations_id'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_chat_id'), table_name='conversations')
    op.drop_table('conversations')
    op.drop_index(op.f('ix_carts_id'), table_name='carts')
    op.drop_index(op.f('ix_carts_chat_id'), table_name='carts')
    op.drop_table('carts')
    # ### end Alembic commands ###
