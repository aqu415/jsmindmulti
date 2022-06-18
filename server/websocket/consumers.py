from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from server.lib.coope_mind_lib import CooperationMindLogLib
import json


class ChatConsumer(WebsocketConsumer):
    log_lib = CooperationMindLogLib()

    def connect(self):
        self.room_group_name = 'chat%s' % bytes.decode(self.scope['query_string'])
        # print(self.room_group_name)

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        # Send message to room group
        log_dict = self.log_lib.save_log(text_data)
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                # chat_message 方法
                'type': 'chat_message',
                'message': text_data if log_dict is None else json.dumps(log_dict)
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=message)
