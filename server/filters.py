import django_filters
from django_filters import rest_framework

from server.models import CooperationMind


class CooperationMindFilter(django_filters.rest_framework.FilterSet):
    """
    思维导图filter
    """
    coop_mind_name = rest_framework.CharFilter(field_name='coop_mind_name', lookup_expr='icontains')

    class Meta:
        model = CooperationMind
        fields = "__all__"
