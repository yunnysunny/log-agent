# log-agent

本项目用于监听日志文件变动，并根据需求进行筛选、上报 kafka 或者报警。

## 安装

```
yarn add log-agent
```

## 测试
```
npm run test
```

## 示例

```javascript
var LogAgent = require('log-agent');
/*
 * 默认每一行都会作为一个日志实例，输入 mutliLineRegexStart 则支持多行匹配。
 * mutliLineRegexStart 的正则匹配成功后，说明当前日志项还未结束，直到遇到非 mutliLineRegexContent 正则匹配的行算结束。
 */
var config = {
    logPath:['/data/app/log/pm2-error-*.log'],
    reportInterval:1000,
    mutliLineRegexStart:'Error',
    mutliLineRegexContent:'---',
};

var agent = new LogAgent(config);
agent.run(function(err, logs) {
    console.log(logs);
});
agent.stop();
```

## 文档

参见[这里](docs/api.md).