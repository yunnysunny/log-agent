var FileLog = require('./FileLog');
const EventEmitter = require('events');

/**
 * @typedef {Object} AgentConfig
 * 
 * @property {Array.<String>} logPath 监听日志文件地址，支持通配符匹配
 * @property {Object=} queueScheduleProducer 选填，kafka发送消息的对象
 * 参见[queue-schedule](https://github.com/yunnysunny/queue-schedule#readme)
 * @property {RegExp|String} [mutliLineRegexStart] 选填，多行匹配开始匹配符，输入正则表达式，匹配多行日志时作为日志起始点；
 * @property {RegExp|String} [mutliLineRegexContent = 'at '] 选填，多行匹配内容匹配符 输入正则表达式，作为日志内容内容匹配标志符 如果开始匹配符校验通过，
 * 但是内容匹配符校验不通过，则当前多行匹配结束，默认值：'at '
 * @property {RegExp|String} [mutliLineRegexEnd = ''] 选填，多行匹配结尾匹配符，输入正则表达式，匹配多行日志时选填，作为日志结尾结束点
 * @property {String=} filterRegex 选填，过滤匹配完成的日志内容，输入正则表达式
 * @property {Number} [limit=1024] 选填， <a name="limit"></a> 一次性读取一个日志文件中日志（过滤完成后）数量，默认为1024
 * @property {Boolean} [nowRun=false] 选填，是否在初始化时启动
 * @property {Number} [reportInterval=1000] 选填，轮询间隔
 * @property {Object=} alarm 选填，发送日志对象 参见[@yunnysunny/node-alarm](https://www.npmjs.com/package/@yunnysunny/node-alarm)
 */
/**
 * @function RunCallback
 * 
 * @param {Error} err
 * @param {Array.<LogObject>} param
 */

/**
  * @typedef {Object} LogObject
  * 
  * @property {String} log 日志信息，换行符(\n)隔开
  * @property {Boolean} isMutliLine true：多行匹配；false 单行匹配
  */
/**
  * @class LogAgent
  * @extends EventEmitter
  * 日志读取类
  * 
  * 
  * 根据开始结尾匹配符进行多行匹配、剩余行 为单行匹配，匹配完成后通过 filterRegex 字段过滤出用户需要的日志，最后返回{@link #limit}个{@link LogObject}<br/>
  */
class LogAgent extends EventEmitter{

    /** 
     * @param {AgentConfig} config 配置信息
     * @param {RunCallback} callback 回调函数 ，第一个参数为err,第二个参数为Array 其中每一个元素为一个{@link LogObject}
     */
    constructor({
        logPath,
        queueScheduleProducer,
        mutliLineRegexStart,
        mutliLineRegexEnd = '',
        mutliLineRegexContent = 'at ',
        filterRegex,
        reportInterval = 1000,
        alarm,
        limit = 1024,
        nowRun = false
    },callback){
        super();
        this._queueScheduleProducer = queueScheduleProducer|| null;
        this._reportInterval = reportInterval;
        this._mutliLineRegexStart = mutliLineRegexStart;
        this._mutliLineRegexEnd = mutliLineRegexEnd;
        this._mutliLineRegexContent = mutliLineRegexContent;
        this._filterRegex = filterRegex;
        this._alarm = alarm || null;
        this._interval = null;
        this._nowRun = nowRun;

        if(this._alarm !== null && !(this._alarm.send instanceof Function )){
            throw new Error('Alarm 启用失败，请检查参数！');
        }
        if(this._queueScheduleProducer !== null && !(this._queueScheduleProducer.addData instanceof Function)){
            throw new Error('KafKa 启用失败，请检查参数！');
        }
        this.fileLog = new FileLog({
            logPath,
            mutliLineRegexStart,
            mutliLineRegexEnd,
            mutliLineRegexContent,
            filterRegex,
            limit,
        });

 
        if(this._nowRun){
            this.run(callback);
        }
    }

    _doLoop(callback) {
        const that = this;
        this.fileLog.run((err,list) => {
            if(err){
                that.emit(LogAgent.READ_ERROR, err);
            }
            if(list && list.length > 0){
                that._sendLogData(list);                
            }
            if(callback instanceof Function){
                callback(err, list);
            }
        });
    }

    /**
     * 启动日志监听
     * 
     * @param {RunCallback=} callback 回调函数
     */  
    run(callback){
        var that = this;
        this._doLoop(callback);
        this._interval = setInterval(() => {
            that._doLoop(callback);
        },that._reportInterval);
    }
  
    /**
     *
     * 停止日志监听
     */
    stop(){
        if (this._interval) {
            clearInterval(this._interval);
        }

        this._interval = null;
    }


    _sendLogData(param){
        if(this._queueSchedule) {
            this._queueScheduleProducer.addData(param);
        }
    
        if(this._alarm !== null) {
            this._alarm.send(JSON.stringify(param),() => {
                // console.debug(JSON.stringify(param));
            });
        }
    }
}

/**
 * 发送报错触发LogError事件
 */
LogAgent.READ_ERROR = 'read.error';

module.exports = LogAgent;