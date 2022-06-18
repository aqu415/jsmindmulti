/*
 * Released under BSD License
 * Copyright (c) cy20081118148@163.com
 *
 */
(function ($w, temp) {
    const Jm = $w[temp]
    if (!Jm) return

    function jsMindCallBackFacade(type, body) {
        const coop = $w.coop
        if (coop) {
            coop.js_mind_callback_(type, body)
        } else {
            console.error('coop is undefined')
        }
    }

    Jm.coop = function (_jm) {
        this._init(_jm)
    }
    Jm.coop.prototype = {
        // jsMind 对象
        _jm: null,
        // 后台api 接口地址
        coop_api_url: null,
        // websocket 地址
        coop_ws_url: null,
        // 标记当前客户端（同一个IP可能打开多个浏览器，需要用client_id区分）
        client_id: null,
        // 当前脑图ID
        coop_mind_id: null,
        // 上一次操作日志ID
        coop_mind_log_last_id: 0,
        // 默认操作日志IDh
        coop_mind_log_id: 0,
        // 定时备份数据
        timer_push_task: null,
        // web_socket
        web_socket: null,
        // init
        _init: function (_jm) {
            if (!this._jm) {
                this._jm = _jm

                // 添加事件处理
                _jm.add_event_listener(jsMindCallBackFacade)

                // 初始化属性
                this._init_properties(_jm)

                // 初始化websocket
                this._init_ws()

                // 获取一次日志
                this.fetch_log()

                // 定时提交
                this.timerPush()
            }
        },
        _init_properties: function (_jm) {
            // 设置属性
            this.client_id = Jm.util.uuid.newid()
            this.coop_api_url = _jm.options.coop_api_url
            this.coop_ws_url = _jm.options.coop_ws_url
            this.coop_mind_id = _jm.options.coop_mind_id
            this.coop_mind_log_id = _jm.options.coop_mind_log_id
            this.coop_mind_log_last_id = _jm.options.coop_mind_log_id
        },
        // 初始化websocket
        _init_ws: function () {
            const me = this
            if (!this.web_socket && this.coop_mind_id) {
                const ws = new WebSocket(this.coop_ws_url + '?_' + this.coop_mind_id)
                this.web_socket = ws
                //申请一个WebSocket对象，参数是服务端地址，同http协议使用http://开头一样，WebSocket协议的url使用ws://开头，另外安全的WebSocket协议使用wss://开头
                ws.onopen = function () {
                    //当WebSocket创建成功时，触发onopen事件
                    ws.send(`{"h":"w"}`); //将消息发送到服务端
                }
                ws.onmessage = function (e) {
                    //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
                    me._handle_jsmind_with_ws_message(e.data)
                }
                ws.onclose = function (e) {
                    //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
                    this.web_socket = null
                }
                ws.onerror = function (e) {
                    //如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
                    console.log('error');
                    this.web_socket = null
                }
            } else {
                console.error('_init_ws failed,this.coop_mind_id is' + this.coop_mind_id)
            }
        },
        // 获得一次日志
        fetch_log: function () {
            const me = this
            Jm.util.ajax.get(`${this.coop_api_url}?coop_mind_id=${this.coop_mind_id}&cooperation_mind_log_id=${this.coop_mind_log_id}`, function (resp) {
                //
                const resp_data_array = resp.data
                resp_data_array.forEach(item => {
                    me._handle_msg_inner(item, true)
                })
            })
        },
        // 清理定时任务
        clear_timer: function () {
            if (this.timer_push_task) {
                $w.clearInterval(this.timer_push_task)
            }
        },
        /**
         * 是否为空
         * @param obj
         */
        _not_null: function (obj) {
            return obj !== null && obj !== undefined
        },
        _is_null: function (obj) {
            return !this._not_null(obj)
        },
        /**
         * 构建公共参数
         */
        _build_evt_param: function () {
            return {'client_id': this.client_id, 'log_uuid': Jm.util.uuid.newid(), 'coop_mind_id': this.coop_mind_id}
        },
        // 调用jsmind接口
        _handle_jsmind_with_ws_message: function (message) {
            const msg_json = JSON.parse(message)
            this._handle_msg_inner(msg_json, false)
        },
        // 处理消息广告方法
        _handle_msg_inner(msg_json, is_batch) {

            // 校验 client_id
            const client_id = msg_json.client_id
            if (!client_id) {
                return
            }
            const log_content = JSON.parse(msg_json.log_content)
            const log_id = msg_json.id
            if (log_id > this.coop_mind_log_id) {
                // 第一次批量获得日志和被动接收日志，设置coop_mind_log_last_id和coop_mind_log_id 相同，不进行批量保存快照
                if (is_batch || client_id !== this.client_id) {
                    this.coop_mind_log_last_id = log_id
                } else {
                    // 设置 coop_mind_log_last_id 便于批量保存快照
                    this.coop_mind_log_last_id = this.coop_mind_log_id
                }
                this.coop_mind_log_id = log_id
            }

            // 回放
            if (client_id === this.client_id) {
                console.log('self msg')
            } else {
                const evt = log_content.evt
                const data_array = log_content.data
                // console.log(msg_json)
                if ('add_node' === evt) {
                    this._jm.add_node(data_array[0], data_array[1], data_array[2], null, true)
                } else if ('insert_node_before' === evt) {
                    this._jm.insert_node_before(data_array[0], data_array[1], data_array[2], null, true)
                } else if ('insert_node_after' === evt) {
                    this._jm.insert_node_after(data_array[0], data_array[1], data_array[2], null, true)
                } else if ('remove_node' === evt) {
                    this._jm.remove_node(data_array[0], true)
                } else if ('update_node' === evt) {
                    this._jm.update_node(data_array[0], data_array[1], true)
                } else if ('move_node' === evt) {
                    this._jm.move_node(data_array[0], data_array[1], data_array[2], data_array[3], true)
                }
            }
        },
        /**
         * body:
         * # {evt:'add_node',data:[parent_node.id,nodeid,topic,data],node:nodeid}
         * # {evt:'insert_node_before',data:[beforeid,nodeid,topic,data],node:nodeid}
         * # {evt:'insert_node_after',data:[afterid,nodeid,topic,data],node:nodeid}
         * # {evt:'remove_node',data:[nodeid],node:parentid}
         * # {evt:'update_node',data:[nodeid,topic],node:nodeid}
         * # {evt:'move_node',data:[nodeid,beforeid,parentid,direction],node:nodeid}
         * @param type
         * @param body
         * @private
         */
        js_mind_callback_: function (type, body) {
            const evt = body.evt
            if (this.should_handle_evt(evt)) {
                const param = this._build_evt_param()
                Jm.util.json.merge(body, param)

                // 序列化数据，处理特殊字符
                let msg = Jm.util.json.json2string(body)
                msg = this.handle_spec_str(msg)
                this._send_ws_message(msg)
            }
        },
        should_handle_evt: function (evt) {
            return evt && ['add_node', 'insert_node_before', 'insert_node_after', 'remove_node', 'update_node', 'move_node'].includes(evt)
        },
        // 处理特殊字符
        handle_spec_str: function (msg) {
            if (!!msg) {
                return msg.replaceAll('\\n', '<br/>')
            }
            return msg
        },
        // 发送ws消息
        _send_ws_message: function (msg) {
            if (this.web_socket != null) {
                this.web_socket.send(msg)
            } else {
                console.error('web_socket is not ready!')
            }
        },
        /**
         * 每隔n秒钟同步一次数据到db
         */
        timerPush: function () {
            // 把操作日志最大的data 持久化到数据库
            const me = this
            if (this._is_null(me.timer_push_task)) {
                me.timer_push_task = setInterval(function () {
                    const param = {
                        'data': Jm.util.json.json2string(me._jm.get_data('node_tree').data),
                        'client_id': me.client_id,
                        'coop_mind_id': me.coop_mind_id,
                        'coop_mind_log_id': me.coop_mind_log_id,
                        'type': 'snapshot',
                        'data_format': 'node_tree'
                    }
                    // 保存快照，保存完毕后设置 coop_mind_log_last_id 和 coop_mind_log_id
                    if (me.coop_mind_log_id > me.coop_mind_log_last_id) {
                        Jm.util.ajax.post(me.coop_api_url, param, function (resp) {
                            me.coop_mind_log_last_id = me.coop_mind_log_id
                        })
                    }
                }, 10000)
            }
        }
    }

    var plugin = new Jm.plugin('coop', function (_jm) {
        // _jm 已经实例化好的jm对象
        $w.coop = new Jm.coop(_jm)
        // coop 对象 与 _jm 对象互相设置关联关系
        coop.jm = _jm
        _jm.coop = coop
    })
    Jm.register_plugin(plugin)

})(window, 'jsMind')
