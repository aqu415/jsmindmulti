from django.urls import path

from server.views import *

urlpatterns = [
    path('', to_list),  # 跳转列表界面
    path('detail', to_detail),  # 跳转详情界面
    path('create', JsMindView.as_view()),  # 创建思维导图
    path('delete', JsMindView.as_view()),  # 删除思维导图
    path('list', JsMindView.as_view()),  # 查询思维导图
    path(r'jsmind_op', JsMindLogView.as_view()),  # 更新快照，get日志
]
