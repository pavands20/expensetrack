from datetime import UTC

from app.models import Claim, User


def test_ac096_timestamps_load_timezone_aware(db_session):
    u = User(name="n", email="a@example.com", password_hash="x", role="Employee")
    db_session.add(u)
    db_session.commit()
    c = Claim(owner_id=u.id)
    db_session.add(c)
    db_session.commit()
    db_session.expire_all()
    assert db_session.get(Claim, c.id).updated_at.tzinfo is not None
    assert db_session.get(Claim, c.id).updated_at.utcoffset() == UTC.utcoffset(None)
