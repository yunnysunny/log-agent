var fs = require('fs');
var path = require('path');
var expect = require('expect.js');
const NodeAlarm = require('@yunnysunny/node-alarm');
var LogAgent = require('../src/LogAgent');

const INFO_LOG_PATH=path.join(__dirname,'log/info.log');
const INFO2_LOG_PATH=path.join(__dirname,'log/info2.log');
const INFO3_LOG_PATH=path.join(__dirname,'log/info3.log');
const PM2_ERROR_LOG_PATH=path.join(__dirname,'log/pm2-error-4.log');
const PM2_BREAK_LOG_PATH=path.join(__dirname,'log/pm2-break.log');
const PM2_PLAIN_LOG_PATH=path.join(__dirname,'log/pm2-plain.log');
const REPORT_INTERVAL = 1000;
var commonConfigObj = {
    logPath:[INFO_LOG_PATH],
    reportInterval: REPORT_INTERVAL,
    limit:20,
    nowRun:false
};

function _pop(stackList){
    stackList.pop();
    return stackList;
}

const BACKUP = '测试文件';
function _fileRollBack(){
    fs.writeFileSync(INFO_LOG_PATH, BACKUP);
    fs.writeFileSync(INFO2_LOG_PATH, BACKUP);
    fs.writeFileSync(INFO3_LOG_PATH, BACKUP);
}

describe('/src/agent.js', function() {

    var agent;
    var config;

    before(() => {
        _fileRollBack();
    });

    after(() => {
    // console.info('LOG FILES ROLLBACK');
    });

    this.afterEach(() => {
        commonConfigObj = {
            logPath:[INFO_LOG_PATH],
            reportInterval:REPORT_INTERVAL,
            limit:20,
            nowRun:false
        };
        _fileRollBack();

        if(agent && agent.stop instanceof Function){
            agent.stop();
        }
    // console.log('FINISH');
    });

    describe('Mutliple log test',(function() {  


        describe('Should throw KafKa Error',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    queueScheduleProducer:{}
                });

            });

            it('Should throw KafKa Error', function(done) {
                try{
                    agent = new LogAgent(config);  
                }catch(err){
                    expect(err.message).to.be('KafKa 启用失败，请检查参数！');
                    done();
                }
            });
        }));

        describe('Should trigger READ_ERROR Event',(function() {  
            before(function(){
                
            });
      
            it('Should trigger READ_ERROR Event', function(done) {
                config = Object.assign(commonConfigObj,{
                    logPath:['xxx'],
                    reportInterval:4000
                });
                agent = new LogAgent(config);  
                fs.appendFileSync(INFO_LOG_PATH, 'logContent');
                agent.on(LogAgent.READ_ERROR,(err) => {
                    expect(err.message).to.be('file list is empty');
                    done();
                });
                agent.run();
            });
        }));

    
        describe('Agent attribute',(function() {

            before(() => {
        
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                });

                agent = new LogAgent(config);
            });

            it('Agent attribute', function(done) {
                expect(agent._alarm).to.be(null);
                expect(agent._reportInterval).to.be(REPORT_INTERVAL);
                expect(agent._nowRun).to.be(false);
                expect(agent._mutliLineRegexStart).to.be('Error');
                done();
            });

        }));
    
        describe('verify regexStart multi log',(function() {
            before(() => {
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                });

                agent = new LogAgent(config);
            });
            it('verify regexStart multi log', function(done) {
  
                var logContent = `
      2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
          at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
          at Module._compile (module.js:449:26)
          `;
  
 
                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(1);
                    var stackList = _pop(param[0].log.split('\n'));
                    expect(stackList).to.have.length(3);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/nodejs.ErrorException: DUPLICATEError/)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.trim().indexOf('at ')).to.be(0));
                    done();
                });
                
            });
        }));


    
        describe('verify regexEnd multi log',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                    mutliLineRegexEnd:'---[A-Z]+---',
                });

                agent = new LogAgent(config);
            });

            it('verify regexEnd multi log', function(done) {

                var logContent = `
  2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
      at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      at Module._compile (module.js:449:26)
      ---END---
      at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      `;

                

                agent.run(function(err,param){
                    if (err) {
                        done(err);
                        return;
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(1);
                    var stackList = _pop(param[0].log.split('\n'));
                    expect(stackList).to.have.length(6);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/nodejs.ErrorException: DUPLICATEError/)).not.to.be(null);
                    var stackEnd = stackList.pop();
                    expect(stackEnd).to.be('---END---');
                    stackList.forEach(stack => expect(stack.trim().indexOf('at ')).to.be(0));
                    done();
                });
            });
        }));
    
        describe('verify regexContent multi log',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'---',
                    filterRegex:'DUPLICATEError'
                });
                agent = new LogAgent(config);
            });
            it('verify regexContent multi log', function(done) {

                var logContent = `
2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    ---END---
    at Obj---ect.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    `;

                

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(1);
                    var stackList = _pop(param[0].log.split('\n'));
                    expect(stackList).to.have.length(5);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(agent._mutliLineRegexStart)).not.to.be(null);
                    stackList.forEach(stack => 
                        expect(stack.trim().match(agent._mutliLineRegexContent)).not.to.be(null));
                    done();
                });
            });
        }));

        describe('verify regexStart regexContent regexEnd multi log',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'---',
                    mutliLineRegexEnd:'---[A-Z]+---',
                    filterRegex:'DUPLICATEError'
                });

                agent = new LogAgent(config);
            });
            it('verify regexStart regexContent regexEnd multi log', function(done) {

                var logContent = `
2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    ---END---
    at Obj---ect.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    `;

                

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(1);
                    var stackList = _pop(param[0].log.split('\n'));
                    expect(stackList).to.have.length(4);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/nodejs.ErrorException: DUPLICATEError/)).not.to.be(null);
                    var stackEnd = stackList.pop();
                    expect(stackEnd).to.be('---END---');
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));
                    done();
                });
            });
        }));

        describe('verify multi log double item',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'---',
                    mutliLineRegexEnd:'---[A-Z]+---',
                    filterRegex:'DUPLICATEError'
                });

                agent = new LogAgent(config);
            });
            it('verify multi log double item', function(done) {

                var logContent = `
2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    ---END---
    at Obj---ect.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)

    2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    ---END---
    `;

                

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(2);
                    var stackList = _pop(param[0].log.split('\n'));
                    expect(stackList).to.have.length(4);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/nodejs.ErrorException: DUPLICATEError/)).not.to.be(null);
                    var stackEnd = stackList.pop();
                    expect(stackEnd).to.be('---END---');
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));

                    stackList = _pop(param[1].log.split('\n'));
                    expect(stackList).to.have.length(3);
                    firstStack = stackList.shift();
                    expect(firstStack.match(/nodejs.ErrorException: DUPLICATEError/)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));
                    done();
                });
            });
        }));

        describe('verify double log files',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    logPath:[INFO_LOG_PATH,INFO2_LOG_PATH],
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'---',
                    mutliLineRegexEnd:'---[A-Z]+---',
                    filterRegex:'DUPLICATEError'
                });

                agent = new LogAgent(config);
            });
            it('verify double log files', function(done) {

                var infoLogContent = `
2014-07-07 15:11:26.421 INFO_LOG_PATHnodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    ---END---
    `;

                var infoLogContent2 = `
    2014-07-07 15:11:26.421 PM2_ERROR_LOG_PATHnodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.5)
        --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
        ---END---
        `;

                

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        fs.appendFileSync(INFO_LOG_PATH, infoLogContent);
                        fs.appendFileSync(INFO2_LOG_PATH, infoLogContent2);
                        return;
                    }
                    expect(param).to.have.length(2);
                    var infoLog = param[0];
                    var errorLog = param[1];
                    var stackList = _pop(infoLog.log.split('\n'));
                    expect(stackList).to.have.length(4);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/INFO_LOG_PATH/)).not.to.be(null);
                    var stackEnd = stackList.pop();
                    expect(stackEnd).to.be('---END---');
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));

                    stackList = _pop(errorLog.log.split('\n'));
                    expect(stackList).to.have.length(3);
                    firstStack = stackList.shift();
                    expect(firstStack.match(/PM2_ERROR_LOG_PATH/)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));
                    done();
                });
            });
        }));
        describe('verify wildcard match',(function() { 

            before(() => {
                config = Object.assign(commonConfigObj,{
                    logPath:[path.join(__dirname,'log/info*.log')],
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'---',
                    mutliLineRegexEnd:'---[A-Z]+---',
                    filterRegex:'DUPLICATEError'
                });

                agent = new LogAgent(config);
            });
            it('verify wildcard match', function(done) {

                var infoLogContent = `
2014-07-07 15:11:26.421 INFO_LOG_PATHnodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
  --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
  --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
  ---END---
  `;

                var infoLogContent2 = `
  2014-07-07 15:11:26.421 PM2_ERROR_LOG_PATHnodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.4)
      --- Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
      ---END---
      `;


                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        fs.appendFileSync(INFO_LOG_PATH, infoLogContent);
                        fs.appendFileSync(INFO2_LOG_PATH, infoLogContent2);
                        return;
                    }
                    expect(param).to.have.length(2);
                    var infoLog = param[0];
                    var errorLog = param[1];
                    var stackList = _pop(infoLog.log.split('\n'));
                    expect(stackList).to.have.length(4);
                    var firstStack = stackList.shift();
                    expect(firstStack.match(/INFO_LOG_PATH/)).not.to.be(null);
                    var stackEnd = stackList.pop();
                    expect(stackEnd).to.be('---END---');
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));

                    stackList = _pop(errorLog.log.split('\n'));
                    expect(stackList).to.have.length(3);
                    firstStack = stackList.shift();
                    expect(firstStack.match(/PM2_ERROR_LOG_PATH/)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.trim().match('---')).not.to.be(null));
                    done();
                });
            });
        }));
    }));
    describe('Single log test',(function() {  
    
        describe('Agent attribute',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                });
                agent = new LogAgent(config);

            });
            it('Agent attribute', function(done) {
                expect(agent._alarm).to.be(null);
                expect(agent._reportInterval).to.be(REPORT_INTERVAL);
                expect(agent._nowRun).to.be(false);
                done();
            });
        }));

        describe('verify no regex single log',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                });
                agent = new LogAgent(config);

            });
            it('verify no regex single log', function(done) {


                var logContent = `
      =======0======
      =======1======
      =======2======
      =======3======
      asdljkahwljdhalk
      `;

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(5);
                    param = param.map(p => {
                        p.log = p.log.split('\n')[0];
                        return p;
                    });
                    expect(param[0].log).to.be('=======0======');
                    expect(param[1].log).to.be('=======1======');
                    expect(param[2].log).to.be('=======2======');
                    expect(param[3].log).to.be('=======3======');
                    expect(param[4].log).to.be('asdljkahwljdhalk');
                    done();
                });
            });

        }));
    
        describe('verify have regex single log',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    filterRegex:'[a-z]+',
                });
                agent = new LogAgent(config);

            });
            it('verify have regex single log', function(done) {


                var logContent = `
        asdljkahwljdhalk
        alskdjalkwjd
        aslkdkd
        sdwqw
        kjkzx
        weskkqjwe
      =======0======
      =======1======
      =======2======
      =======3======
      asdljkahwljdhalk
      `;

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(7);
                    param = param.map(p => {
                        p.log = p.log.split('\n')[0];
                        return p;
                    });
                    expect(param[0].log).to.be('asdljkahwljdhalk');
                    expect(param[1].log).to.be('alskdjalkwjd');
                    expect(param[2].log).to.be('aslkdkd');
                    expect(param[3].log).to.be('sdwqw');
                    expect(param[4].log).to.be('kjkzx');
                    expect(param[5].log).to.be('weskkqjwe');
                    expect(param[6].log).to.be('asdljkahwljdhalk');
                    done();
                });
            });

        }));
    }));

    describe('Single And Mulitple log test',(function() {  
    
        describe('Should throw alarm Error',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    alarm:{}
                });
            });

            it('Should throw alarm Error', function(done) {
                try{
                    agent = new LogAgent(config);
                }catch(err){
                    expect(err.message).to.be('Alarm 启用失败，请检查参数！');
                    done();
                }
            });
        }));

        describe('Agent attribute',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                });
                agent = new LogAgent(config);

            });
            it('Agent attribute', function(done) {
                expect(agent._alarm).to.be(null);
                expect(agent._reportInterval).to.be(REPORT_INTERVAL);
                expect(agent._nowRun).to.be(false);
                expect(agent._mutliLineRegexStart).to.be('Error');
                done();
            });
        }));

        describe('Should ok',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'Error',
                    mutliLineRegexContent:'er ',
                    mutliLineRegexEnd:'END',
                });
                agent = new LogAgent(config);

            });
            it('Should ok', function(done) {
                var logContent = `
       22222222222222
       11111111111111
       333333Error4444444
       er 23423423424
       er oieruioso
       er oieukdf
       6666666END666666
       8888888888888
      `;

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(4);
                    expect(param[0].log.split('/n')[0]).to.be('22222222222222');
                    expect(param[1].log.split('/n')[0]).to.be('11111111111111');
                    expect(param[3].log.split('/n')[0]).to.be('8888888888888');
                    var stackList = _pop(param[2].log.split('\n'));
                    expect(stackList).to.have.length(5);
                    expect(stackList.shift().match(agent._mutliLineRegexStart)).not.to.be(null);
                    expect(stackList.pop().match(agent._mutliLineRegexEnd)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.match(agent._mutliLineRegexContent)).not.to.be(null));
                    done();
                });
            });
        }));
    }));

    describe('Real log test',(function() {  
        describe('pm2 error log test',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    mutliLineRegexStart:'TypeError',
                    mutliLineRegexContent:'at.*',
                    logPath:[INFO3_LOG_PATH]
                });
                agent = new LogAgent(config);

            });

            it('pm2 error log test',function(done){
                var logContent =fs.readFileSync(PM2_ERROR_LOG_PATH);

                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO3_LOG_PATH, logContent);
                    }
                    expect(param).to.have.length(17);
                    var stackList = _pop(param[12].log.split('\n'));
                    expect(stackList).to.have.length(7);
                    expect(stackList.shift().match(agent._mutliLineRegexStart)).not.to.be(null);
                    stackList.forEach(stack => expect(stack.match(agent._mutliLineRegexContent)).not.to.be(null));
                    done();
                });
            });
        }));

        describe('pm2 plain log test',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    logPath:[INFO3_LOG_PATH],
                    mutliLineRegexStart:/201[7-9]-\d{2}-\d{2} \d{2}:\d{2}:\d{2}: ={30,}/,
                    mutliLineRegexContent:/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}: */,
                    filterRegex:/201[7-9]-\d{2}-\d{2} \d{2}:\d{2}:\d{2}: ={30,}/
                });
                agent = new LogAgent(config);

            });

            it('pm2 plain log test',function(done){
                var logContent =fs.readFileSync(PM2_PLAIN_LOG_PATH);
                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO3_LOG_PATH, logContent);
                    }
                    // param.forEach(p => console.log(p.log));
                    expect(param).to.have.length(16);
                    var laststackList = _pop(param.pop().log.split('\n'));
                    expect(laststackList).to.have.length(3);
                    expect(laststackList[1].trim().match('RPC closed')).not.to.be(null);
                    expect(laststackList[2].trim().match('PUB closed')).not.to.be(null);
                    laststackList = _pop(param.pop().log.split('\n'));
                    expect(laststackList[1].trim().match('Stopping PM2')).not.to.be(null);
                    var firstStackList = _pop(param.shift().log.split('\n'));
                    expect(firstStackList[1].trim().match('New PM2 Daemon started')).not.to.be(null);
                    done();
                });
            });
        }));

        describe('pm2 break log test',(function() {  
            before(function(){
                config = Object.assign(commonConfigObj,{
                    logPath:[INFO3_LOG_PATH],
                    mutliLineRegexStart:/<--- Last few GCs --->/,
                    mutliLineRegexContent:/^(?!(\d{4})).*/,
                    filterRegex:/^(?!(\d{4})).*/
                });
                agent = new LogAgent(config);

            });

            it('pm2 break log test',function(done){
                var logContent =fs.readFileSync(PM2_BREAK_LOG_PATH);
                agent.run(function(err,param){
                    if (err) {
                        return done(err);
                    }
                    if (param.length === 0) {
                        return fs.appendFileSync(INFO3_LOG_PATH, logContent);
                    }
                    // param.forEach(p => console.log(p.log));
                    expect(param).to.have.length(3);
                    var firstStackList = _pop(param.shift().log.split('\n'));
                    expect(firstStackList.shift().trim().match(agent._mutliLineRegexStart)).not.to.be(null);
                    expect(firstStackList).to.have.length(25);
                    firstStackList.forEach(stack => 
                        expect(stack.trim().match(agent._mutliLineRegexContent)).not.to.be(null));
                    done();
                });
            });
        }));
    }));
    describe('Alarm test', function() {
        before(function() {
            const WXWORK_CONFIG = {
                type: NodeAlarm.ALARM_TYPE_WXWORK,
                options: {
                    // 机器人地址
                    url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=637cc457-6e6f-44a5-99ad-2e3d825482b2',
                    msgType: 'markdown'//支持 text 和 markdown 两种类型
                }
            };
            const alarm = new NodeAlarm([WXWORK_CONFIG]);
            const conf = Object.assign(commonConfigObj,{
                mutliLineRegexStart:'TypeError',
                mutliLineRegexContent:'at ',
                filterRegex: 'TypeError',
                logPath:[INFO3_LOG_PATH],
                alarm,
            });
            agent = new LogAgent(conf);
        });

        it('should send alarm success', function(done) {
            var logContent = fs.readFileSync(PM2_ERROR_LOG_PATH);
            agent.run(function(err,param){
                if (err) {
                    return done(err);
                }
                if (param.length === 0) {
                    return fs.appendFileSync(INFO3_LOG_PATH, logContent);
                }
            });
            agent.on(LogAgent.SEND_LOG_OK, function(logs) {
                expect(logs).to.have.length(1);
                done();
            });
            agent.on(LogAgent.SEND_LOG_ERROR, function(err) {
                done(err);
            });
        });
    });
});