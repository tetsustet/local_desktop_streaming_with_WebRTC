from django.urls import include, path
from rest_framework import routers

from . import views

router = routers.DefaultRouter()
router.register(r'rooms', views.RoomsViewSet)

urlpatterns = [
    path('', views.index),
    path('create-room/', views.create_room),
    path('rooms/<str:room_id>/organizer/', views.organizer),
    path('rooms/<str:room_id>/participant/', views.participant),
    #path('user/<str:account_name>/', User.as_view(), name='account_name'), #ここ追加する
    path('api/', include(router.urls)),

    path('api-auth/', include('rest_framework.urls'))
]
