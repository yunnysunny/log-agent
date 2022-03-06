class LogObject {
    constructor(item) {
        this.log = item.log;
        this.isMutliLine = item.isMutliLine;
    }
    toString() {
        return `${this.log}`;
    }
}

class Parser {
    constructor({ 
        limit, mutliLineRegexStart,filterRegex,mutliLineRegexEnd,mutliLineRegexContent
    }) {
        this._list = [];
        this._current = null;
        this.limit = limit || 0;
        this._mutliLineRegexStart = mutliLineRegexStart;
        this._mutliLineRegexEnd = mutliLineRegexEnd;
        this._mutliLineRegexContent = mutliLineRegexContent;
        this._filterRegex = filterRegex;
    }
    pop() {
        return this._list.splice(0);
    }
    // 解析每行日志信息
    _execute(data) {
    // var parse = this.parseSingleAndMutliLog.bind(this);
        var lines = data.split('\n');
    
        while(lines.length > 0){
            var first = lines.shift().trim();
            if(first === ''){
                continue;
            }
            this._parseSingleAndMutliLog(first);
        }
    }
    _pushLog() {
        const list = this._list;
        if (this._current) {
            this._current.log = this._current.log.replace(/\n{2,}/g,'\n');
            if(this._filterRegex) {
                if(this._current.log.trim().match(this._filterRegex)){
                    list.push(new LogObject(this._current));
                }
            } else {
                list.push(new LogObject(this._current));
            }
            if (this.limit > 0 && this.limit < list.length) {
                list.shift(); // 删掉前面的
            }
        }
        this._current = null;
    }
  
    _processOneItem(line){
        if(!this._current){
            this._current = { 
                log: line, 
                isMutliLine: false, 
                // extra: '' 
            };
            this._pushLog();
        }
    }

    _parseSingleAndMutliLog(line) {
        if (!line) {
            return;
        }
        if(!this._mutliLineRegexStart ){
            this._processOneItem(line);
        } else if (line.match(this._mutliLineRegexStart)) {
            if(this._current) {//上一个多行结束
                this._pushLog();
            }
            // 
            this._current = { 
                log: line + '\n', 
                isMutliLine: true, 
            };
        } else if (this._mutliLineRegexEnd && line.match(this._mutliLineRegexEnd)) {
            if(this._current){
                this._current.log += line + '\n';
            } 
            this._pushLog(); // 保存最近解析到的log
        } else if (this._mutliLineRegexContent && line.match(this._mutliLineRegexContent)) {
            if (this._current) {
                this._current.log += line + '\n';
            }
        } else {
            if (this._current) {//没有指定 mutliLineRegexEnd 且当前行不匹配 mutliLineRegexContent 的情况
                this._pushLog();//多行结束
            }
            this._processOneItem(line);//处理当前普通行
        }
    }
  
    parseStream(readable, callback) {
        var that = this;
        var cleanup;

        var onData = function(data) {
            that._execute(data);
        };

        var onEnd = function() {
            cleanup();
            // // 保存最后解析到的这条日志
            if(that._current){
                that._pushLog();
            }
            callback(null, that._list);
        };

        var onError = function(err) {
            cleanup();
            callback(err);
        };

        cleanup = function() {
            readable.removeListener('data', onData);
            readable.removeListener('end', onEnd);
            readable.removeListener('error', onError);
        };

        readable.on('data', onData);
        readable.on('end', onEnd);
        readable.on('error', onError);
    }
}

var parse = function(readable, limit, callback) {
    if (typeof limit === 'function') {
        callback = limit;
        limit = 0;
    }

    var parser = new Parser(limit);
    parser.parseStream(readable, callback);
};

Parser.parse = parse;

module.exports = Parser;
