from datetime import time
from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Room
from .serializer import RoomsSerializer

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

def organizer(request, room_id):
    return HttpResponse("This is organizer's page")

def participant(request, room_id):
    return HttpResponse("This is participant's page")

def create_room(request):
    return render(request, "desktop_streaming/create_room.html", None)

def index(request):
    return render(request, "desktop_streaming/index.html", None)

    