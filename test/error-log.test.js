var fs = require('fs');
var path = require('path');
var expect = require('expect.js');
var FileLog = require('../src/FileLog');

const INFO_LOG_PATH=path.join(__dirname,'log/info.log');
var multiLogBackUp;
describe('/src/file-log.js', function() {
    var fileLog;
    before(function() {
        multiLogBackUp = fs.readFileSync(INFO_LOG_PATH, 'utf8');

        fileLog = new FileLog({
            logPath: [INFO_LOG_PATH]
        });
    });

    after(() => {
        fs.writeFileSync(INFO_LOG_PATH, multiLogBackUp);
    });

    it('should ok', function(done) {
        var errPath = INFO_LOG_PATH;
        var errbackup = `\n2014-07-07 15:11:26.421 nodejs.ErrorException: DUPLICATEError: test1 error (127.0.0.1)
    at Object.<anonymous> (/Users/deadhorse/git/error-formatter/test/index.test.js:15:11)
    at Module._compile (module.js:449:26)`;

        fs.appendFileSync(errPath, errbackup);

        fileLog.run(function(err) {
            expect(err).not.to.be.ok();
        });
        done();

    });
});
