from rest_framework.response import Response


def build_response(code=0, msg='', data=''):
    return Response({'code': code, 'msg': msg, 'data': data})
