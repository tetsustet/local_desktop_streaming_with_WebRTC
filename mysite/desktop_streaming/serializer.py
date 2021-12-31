from rest_framework import serializers

from .models import Room, Sdp

class RoomsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["room_id", "organizer_uuid"]
        
class SdpSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sdp
        fields = ["room_id", "from_uuid", "to_uuid",  "sdp_text", "is_solved"]        