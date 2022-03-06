var fs = require('fs');
const { promisify } = require('util');
var glob = promisify(require('glob'));
var Parser = require('./Parser');

class ParserCache {
    constructor(parser, start) {
        this.parser = parser;
        this.start = start;
    }
}
class FileLog{
    constructor(config) {
        // this._keyMap = new Map(); // 记录每个key实际对应的路径值
        // this._map = new Map(); // 记录每个文件访问的位置
        this._parsers = new Map(); // 每个key都有一个parser path-> {start, parser}
        // this._localLogs;
        this._processing = false;
        this._mutliLineRegexStart = config.mutliLineRegexStart;
        this._mutliLineRegexEnd = config.mutliLineRegexEnd;
        this._mutliLineRegexContent = config.mutliLineRegexContent;
        this._limit = config.limit;
        this._filterRegex=config.filterRegex;
        if (!config.logPath) {
            throw new TypeError('logPath is empty');
        }
        if (!Array.isArray(config.logPath)) {
            config.logPath = [config.logPath];
        }
 

        this._logPath = config.logPath;
    }

    _checkFiles(callback) {
        const set = new Set();
        if (this._logPath.length === 0) {
            return callback(null, 0);
        }
        const logs = this._logPath;
        const len = logs.length;
        const promises = new Array(len);
        for (var i = 0; i < len; i++) {
            const key = logs[i];

            promises[i] = glob(key);
        }
        const _this = this;
        Promise.all(promises).then(function(list) {
            if (!list || list.length === 0) {
                return callback(new Error('file list is empty'));
            }
            if (list.length === 1 && list[0].length === 0) {
                return callback(new Error('file list is empty'));
            }
            for (const files of list) {
                files.forEach(path => {
                    // 设置所有日志文件起始读取位置（文件最末）
                    set.add(path);
                    // that._map.set(path, fs.statSync(path).size);
                });
            }
            for (const path of set) {
                let cache = _this._parsers.get(path);
                if (!cache) {
                    cache = new ParserCache(
                        new Parser({
                            limit: _this._limit,
                            mutliLineRegexStart: _this._mutliLineRegexStart,
                            mutliLineRegexEnd: _this._mutliLineRegexEnd,
                            mutliLineRegexContent: _this._mutliLineRegexContent,
                            filterRegex: _this._filterRegex
                        }),
                        fs.statSync(path).size//从文件末尾开始读
                    );
                    _this._parsers.set(path, cache);
                }
            }
            callback(null, set.size);
        }).catch(function(err) {
            callback(err);
        });
        
    }
    _readFile(path, cache) {
        var that = this;
        return new Promise(function(resolve, reject) {
            var statCallback = function(err, stats) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        return resolve(null);
                    }
                    return reject(err);
                }
    
                if (!stats.isFile()) {
                    err = new Error(path + ' is not a file');
                    return reject(err);
                }
    
                var start = cache.start || 0;
                // 如果start和stats.size，说明错误日志文件内容没有增加，读取数据为[]
                if (stats.size === start) {
                    return resolve(null);
                }
    
                // 如果文件大小小于上次读取的地方，说明是一个新文件
                if (stats.size < start) {
                    start = 0;
                }
    
    
                // console.log(`\nstats.size ===> ${stats.size}\nstart ===> ${start}`);
                that._processing = true;
                var readable = fs.createReadStream(path, {
                    start: start,
                    encoding: 'utf8'
                });
                // data中是文件全部新增的部分
                readable.on('data', function(data) {
                    start += Buffer.byteLength(data);
                });
    
                readable.on('end', function() {
                    // that._map.set(filepath, start);
                    cache.start = start;
                    that._processing = false;
                });
    
                var parser = cache.parser;

                parser.parseStream(readable, function(innerErr) {
                    if (innerErr) {
                        return reject(innerErr);
                    }
                    resolve(parser.pop());
                });
            };
            fs.stat(path, statCallback);
        });
        
    }

    run(callback) {
        const _this = this;
        this._checkFiles(function(err, size) {
            if (err) {
                return callback(err);
            }
            if (size === 0) {
                return callback(null, null);
            }
            const promises = [];
            for (const [path, cache] of _this._parsers) {
                promises.push(_this._readFile(path, cache));
            }
            Promise.all(promises).then(function(lists) {
                let list = [];
                for (let i=0,len=lists.length; i<len; i++) {
                    const items = lists[i];
                    if (items && items.length > 0) {
                        list = list.concat(items);
                    }
                }
                callback(null, list);
            }).catch(function(err) {
                callback(err);
            });
        });
    }
}
module.exports = FileLog;