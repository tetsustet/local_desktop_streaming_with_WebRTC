from datetime import time

from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.utils import timezone

from rest_framework import viewsets, status, filters
from rest_framework.response import Response

from .models import Room, Sdp
from .serializer import RoomsSerializer, SdpSerializer

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

class SdpViewSet(viewsets.ModelViewSet):
    queryset = Sdp.objects.all()
    serializer_class = SdpSerializer
    lookup_field = "id"

    def list(self, request):
        sdp = Sdp.objects.filter(to_uuid = request.query_params.get('to_uuid'), is_solved=request.query_params.get('is_solved')).values()
        return Response(sdp, status=status.HTTP_200_OK)

    def create(self, request):
        room_id = Room.objects.get(room_id = request.data.get('room_id'))
        from_uuid = request.data.get('from_uuid')
        to_uuid = request.data.get('to_uuid')
        sdp_text = request.data.get('sdp_text')
        Sdp.objects.create(room_id=room_id, from_uuid=from_uuid, to_uuid=to_uuid, sdp_text=sdp_text)
        return HttpResponse(from_uuid + sdp_text)

def organizer(request, room_id):
    return render(request, "desktop_streaming/organizer.html", None)

def participant(request, room_id):
    return render(request, "desktop_streaming/participant.html", None)

def create_room(request):
    return render(request, "desktop_streaming/create_room.html", None)

def index(request):
    return render(request, "desktop_streaming/index.html", None)

    