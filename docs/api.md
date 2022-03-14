## Classes

<dl>
<dt><a href="#LogAgent">LogAgent</a> ⇐ <code>EventEmitter</code></dt>
<dd></dd>
<dt><a href="#LogAgent">LogAgent</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#RunCallback">RunCallback(err, param)</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AgentConfig">AgentConfig</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#LogObject">LogObject</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="LogAgent"></a>

## LogAgent ⇐ <code>EventEmitter</code>
**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [LogAgent](#LogAgent) ⇐ <code>EventEmitter</code>
    * [new LogAgent(config, callback)](#new_LogAgent_new)
    * _instance_
        * [.run([callback])](#LogAgent+run)
        * [.stop()](#LogAgent+stop)
    * _static_
        * [.READ_ERROR](#LogAgent.READ_ERROR)
        * [.SEND_LOG_ERROR](#LogAgent.SEND_LOG_ERROR)
        * [.SEND_LOG_OK](#LogAgent.SEND_LOG_OK)

<a name="new_LogAgent_new"></a>

### new LogAgent(config, callback)

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>AgentConfig</code>](#AgentConfig) | 配置信息 |
| callback | [<code>RunCallback</code>](#RunCallback) | 回调函数 ，第一个参数为err,第二个参数为Array 其中每一个元素为一个[LogObject](#LogObject) |

<a name="LogAgent+run"></a>

### logAgent.run([callback])
启动日志监听

**Kind**: instance method of [<code>LogAgent</code>](#LogAgent)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>RunCallback</code>](#RunCallback) | 回调函数 |

<a name="LogAgent+stop"></a>

### logAgent.stop()
停止日志监听

**Kind**: instance method of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.READ_ERROR"></a>

### LogAgent.READ\_ERROR
读取日志出错事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.SEND_LOG_ERROR"></a>

### LogAgent.SEND\_LOG\_ERROR
发送日志出错事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.SEND_LOG_OK"></a>

### LogAgent.SEND\_LOG\_OK
发送日志成功事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent"></a>

## LogAgent
**Kind**: global class  

* [LogAgent](#LogAgent)
    * [new LogAgent(config, callback)](#new_LogAgent_new)
    * _instance_
        * [.run([callback])](#LogAgent+run)
        * [.stop()](#LogAgent+stop)
    * _static_
        * [.READ_ERROR](#LogAgent.READ_ERROR)
        * [.SEND_LOG_ERROR](#LogAgent.SEND_LOG_ERROR)
        * [.SEND_LOG_OK](#LogAgent.SEND_LOG_OK)

<a name="new_LogAgent_new"></a>

### new LogAgent(config, callback)

| Param | Type | Description |
| --- | --- | --- |
| config | [<code>AgentConfig</code>](#AgentConfig) | 配置信息 |
| callback | [<code>RunCallback</code>](#RunCallback) | 回调函数 ，第一个参数为err,第二个参数为Array 其中每一个元素为一个[LogObject](#LogObject) |

<a name="LogAgent+run"></a>

### logAgent.run([callback])
启动日志监听

**Kind**: instance method of [<code>LogAgent</code>](#LogAgent)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>RunCallback</code>](#RunCallback) | 回调函数 |

<a name="LogAgent+stop"></a>

### logAgent.stop()
停止日志监听

**Kind**: instance method of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.READ_ERROR"></a>

### LogAgent.READ\_ERROR
读取日志出错事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.SEND_LOG_ERROR"></a>

### LogAgent.SEND\_LOG\_ERROR
发送日志出错事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="LogAgent.SEND_LOG_OK"></a>

### LogAgent.SEND\_LOG\_OK
发送日志成功事件

**Kind**: static property of [<code>LogAgent</code>](#LogAgent)  
<a name="RunCallback"></a>

## RunCallback(err, param)
**Kind**: global function  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 
| param | [<code>Array.&lt;LogObject&gt;</code>](#LogObject) | 

<a name="AgentConfig"></a>

## AgentConfig : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| logPath | <code>Array.&lt;String&gt;</code> |  | 监听日志文件地址，支持通配符匹配 |
| [queueScheduleProducer] | <code>Object</code> |  | 选填，kafka发送消息的对象 参见[queue-schedule](https://github.com/yunnysunny/queue-schedule#readme) |
| [mutliLineRegexStart] | <code>RegExp</code> \| <code>String</code> |  | 选填，多行匹配开始匹配符，输入正则表达式，匹配多行日志时作为日志起始点； |
| [mutliLineRegexContent] | <code>RegExp</code> \| <code>String</code> | <code>&#x27;at &#x27;</code> | 选填，多行匹配内容匹配符 输入正则表达式，作为日志内容内容匹配标志符 如果开始匹配符校验通过， 但是内容匹配符校验不通过，则当前多行匹配结束，默认值：'at ' |
| [mutliLineRegexEnd] | <code>RegExp</code> \| <code>String</code> | <code>&#x27;&#x27;</code> | 选填，多行匹配结尾匹配符，输入正则表达式，匹配多行日志时选填，作为日志结尾结束点 |
| [filterRegex] | <code>String</code> |  | 选填，过滤匹配完成的日志内容，输入正则表达式 |
| [limit] | <code>Number</code> | <code>1024</code> | 选填， <a name="limit"></a> 一次性读取一个日志文件中日志（过滤完成后）数量，默认为1024 |
| [nowRun] | <code>Boolean</code> | <code>false</code> | 选填，是否在初始化时启动 |
| [reportInterval] | <code>Number</code> | <code>1000</code> | 选填，轮询间隔 |
| [alarm] | <code>Object</code> |  | 选填，发送日志对象 参见[@yunnysunny/node-alarm](https://www.npmjs.com/package/@yunnysunny/node-alarm) |
| [alarmTitle] | <code>String</code> | <code>&#x27;Error occured&#x27;</code> | 报警信息的标题 |

<a name="LogObject"></a>

## LogObject : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| log | <code>String</code> | 日志信息，换行符(\n)隔开 |
| isMutliLine | <code>Boolean</code> | true：多行匹配；false 单行匹配 |

