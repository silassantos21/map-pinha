import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.security import require_internal_secret_or_mobile_user
from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationListRead, NotificationRead

router = APIRouter()


@router.get("/notifications", response_model=NotificationListRead)
def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    # `ORDER BY created_at DESC, id DESC`: tiebreak determinístico — sem ele,
    # notificações criadas no mesmo instante (ex: fan-out em lote de "novo
    # POI de quem você segue") podem mudar de ordem entre páginas.
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .options(selectinload(Notification.actor))
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
        .offset(offset)
    )
    notifications = db.scalars(stmt).all()
    unread_count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id, Notification.read_at.is_(None)
        )
    ) or 0

    items = [
        NotificationRead(
            id=n.id,
            type=n.type,
            actor_id=n.actor_id,
            actor_name=n.actor.name,
            actor_avatar_url=n.actor.avatar_choice_url or n.actor.avatar_url,
            poi_id=n.poi_id,
            group_id=n.group_id,
            # `group_name` já vem denormalizado no `payload` (preenchido na
            # criação, em `groups.py::invite_member`) — evita mais um join/
            # selectinload só pra exibir o nome do grupo na lista.
            group_name=n.payload.get("group_name"),
            payload=n.payload,
            read_at=n.read_at,
            created_at=n.created_at,
        )
        for n in notifications
    ]
    return NotificationListRead(items=items, unread_count=unread_count)


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        db.commit()


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    mobile_user_id: uuid.UUID | None = Depends(require_internal_secret_or_mobile_user),
    user_id: uuid.UUID | None = None,
):
    user_id = mobile_user_id if mobile_user_id is not None else user_id
    db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        .values(read_at=func.now())
    )
    db.commit()
