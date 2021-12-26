from datetime import time

from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.utils import timezone

from rest_framework import viewsets, status, filters
from rest_framework.response import Response

from .models import Offer, Room
from .serializer import RoomsSerializer, OffersSerializer

class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomsSerializer
    lookup_field = "room_id"

    def create(self, request):
        room_id = request.data.get('room_id')
        organizer_uuid = request.data.get('organizer_uuid')
        print(room_id)
        print(organizer_uuid)
        print(timezone.now())
        print(Room.objects.filter(room_id=room_id).exists())
        if (Room.objects.filter(room_id=room_id).exists()):
            return Response("a", status=status.HTTP_409_CONFLICT)
        Room.objects.create(room_id=room_id, organizer_uuid=organizer_uuid, last_accessed_datetime=timezone.now())
        return HttpResponse(room_id + organizer_uuid)

class OffersViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OffersSerializer
    lookup_field = "room_id"

    def create(self, request):
        room_id = Room.objects.get(room_id = request.data.get('room_id'))
        participant_uuid = request.data.get('participant_uuid')
        offer_sdp = request.data.get('offer_sdp')
        print(room_id)
        print(participant_uuid)
        print(timezone.now())
        print(Offer.objects.filter(room_id=room_id).exists())
        Offer.objects.create(room_id=room_id, participant_uuid=participant_uuid, offer_sdp=offer_sdp)
        return HttpResponse(participant_uuid + offer_sdp)

    def list(self, request):
        print(request.query_params.get('room_id'))
        #offer = Offer.objects.get(room_id = request.query_params.get('room_id'))
        #print(str(offer))
        offers = Offer.objects.filter(room_id = request.query_params.get('room_id'), is_solved=request.query_params.get('is_solved')).values()
        print(offers)
        return Response(offers, status=status.HTTP_200_OK)



def organizer(request, room_id):
    return render(request, "desktop_streaming/organizer.html", None)

def participant(request, room_id):
    return render(request, "desktop_streaming/participant.html", None)

def create_room(request):
    return render(request, "desktop_streaming/create_room.html", None)

def index(request):
    return render(request, "desktop_streaming/index.html", None)

    