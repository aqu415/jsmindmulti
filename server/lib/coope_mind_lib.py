from server.models import CooperationMindLog
import ast
from server.serializers import CooperationMindLogSerializer


class CooperationMindLogLib(object):
    """
    操作日志
    """

    def save_log(self, json_msg):
        """
        保存操作日志
        """
        if self.should_handle(json_msg):
            # 避免json解析失败
            json_msg = json_msg.replace(',null]', ']')
            print(json_msg)
            json_msg_dict = ast.literal_eval(json_msg)

            log = CooperationMindLog(
                coop_mind_id=json_msg_dict.get('coop_mind_id'),
                log_uuid=json_msg_dict.get('log_uuid'),
                log_content=json_msg,
                client_id=json_msg_dict.get('client_id')
            )
            log.save()
            return CooperationMindLogSerializer(log).data
        return None

    def should_handle(self, json_msg):
        return 'coop_mind_id' in json_msg and 'select_node' not in json_msg
