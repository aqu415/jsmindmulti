from datetime import datetime as dt

from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import *
from rest_framework.views import APIView

from server.filters import CooperationMindFilter
from server.serializers import *
from server.util.mix_util import build_response
from server.util.pagination import NewPagination


def to_list(request):
    """
    列表界面
    """
    return render(request, "html/list.html")


def to_detail(request):
    """
    详情页面
    """
    param = {'id': request.GET.get('id')}
    return render(request, "html/detail.html", param)


class JsMindView(ListAPIView):
    """
    思维导图view
    """
    queryset = CooperationMind.objects.all()
    serializer_class = CooperationMindSerializer
    filter_backends = [DjangoFilterBackend]
    filter_class = CooperationMindFilter
    pagination_class = NewPagination

    def get(self, request, *args, **kwargs):
        """
        查询思维导图
        """
        pk = request.GET.get('id')
        if pk is not None:
            mind = CooperationMind.objects.filter(id=pk).first()
            # 序列化
            serializer = CooperationMindSerializer(mind)
            return build_response(data=serializer.data)
        return self.list(request, *args, **kwargs)

    def post(self, request):
        """
        创建思维导图
        """
        coop_mind_name = request.data.get('mind_name')
        snapshot_data = request.data.get('snapshot_data')
        data_format = request.data.get('data_format')
        mind = CooperationMind(coop_mind_name=coop_mind_name, client_id='', log_id=-1, creator=9527, snapshot_data=snapshot_data, data_format=data_format)
        mind.save()
        return build_response(data=mind.id)

    def delete(self, request):
        # 删除
        pk = request.POST.get('id')
        res = CooperationMind.objects.filter(id=pk).delete()
        return build_response()


# Create your views here.
class JsMindLogView(APIView):
    """
    日志获取，快照保存
    """

    def get(self, request):
        """
        查询日志
        """
        param = request.GET
        coop_mind_id = param.get('coop_mind_id')
        cooperation_mind_log_id = param.get('cooperation_mind_log_id')
        query_set = CooperationMindLog.objects.filter(coop_mind_id=coop_mind_id, id__gt=cooperation_mind_log_id)
        log_list = CooperationMindLogSerializer(query_set, many=True)
        return build_response(data=log_list.data)

    def post(self, request):
        """
        更新保存快照
        """

        post_body = request.POST
        client_id = post_body.get('client_id')
        type = post_body.get('type')
        if 'snapshot' == type:
            # 保存快照
            coop_mind_id = post_body.get('coop_mind_id')
            data = post_body.get('data')
            coop_mind_log_id = post_body.get('coop_mind_log_id')
            data_format = post_body.get('data_format')
            CooperationMind.objects.filter(id=coop_mind_id, log_id__lt=coop_mind_log_id).update(data_format=data_format, snapshot_data=data, log_id=coop_mind_log_id, update_time=dt.now(), client_id=client_id)
        return build_response()
