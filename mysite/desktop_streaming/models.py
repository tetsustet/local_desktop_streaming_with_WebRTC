import uuid
from django.db import models
from django.db.models.deletion import CASCADE


# モデル変更の反映手順は https://docs.djangoproject.com/ja/4.0/intro/tutorial02/#activating-models

class Room(models.Model):
    room_uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # unique=True についてはhttps://docs.djangoproject.com/ja/4.0/ref/models/fields/#django.db.models.ForeignKey.to_field を参照 
    room_id = models.CharField(unique=True, max_length=200) 
    organizer_uuid = models.UUIDField()
    # 最終アクセスからしばらくしたら消す．
    last_accessed_datetime = models.DateTimeField()

class Sdp(models.Model):
    room_id = models.ForeignKey(Room, to_field="room_id", on_delete=CASCADE)
    from_uuid = models.UUIDField()
    to_uuid = models.UUIDField()
    sdp_text = models.TextField(max_length=10000) 
    is_solved = models.BooleanField(default=False)