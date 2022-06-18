from rest_framework import serializers
from server.models import *


class CooperationMindSerializer(serializers.ModelSerializer):
    """
    思维导图序列
    """

    class Meta:
        model = CooperationMind
        fields = "__all__"


class CooperationMindLogSerializer(serializers.ModelSerializer):
    """
    思维导图日志序列
    """

    class Meta:
        model = CooperationMindLog
        fields = "__all__"
