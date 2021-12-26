from rest_framework import serializers

from .models import Answer, Room, Offer

class RoomsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["room_id", "organizer_uuid"]
        
class OffersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ["room_id", "participant_uuid", "offer_sdp", "is_solved"]

class AnswersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ["room_id", "participant_uuid", "answer_sdp", "is_solved"]
        