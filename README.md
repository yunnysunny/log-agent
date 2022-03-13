# log-agent

[![build status][action-image]][action-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![GitHub license](https://img.shields.io/github/license/yunnysunny/log-agent)](https://github.com/yunnysunny/log-agent)
[![node version][node-image]][node-url]

[npm-url]: https://npmjs.org/package/@yunnysunny/log-agent
[action-image]: https://github.com/yunnysunny/log-agent/workflows/CI/badge.svg
[action-url]: https://github.com/yunnysunny/log-agent/actions/workflows/ci.yml
[coveralls-image]: https://img.shields.io/coveralls/yunnysunny/log-agent.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yunnysunny/log-agent?branch=master
[node-image]: https://img.shields.io/badge/node.js-%3E=_12-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/

[![NPM](https://nodei.co/npm/log-agent.png?downloads=true)](https://nodei.co/npm/log-agent/) 

本项目用于监听日志文件变动，并根据需求进行筛选、上报 kafka 或者通过邮件或者 IM 工具方式报警。

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
const LogAgent = require('log-agent');
const NodeAlarm = require('@yunnysunny/node-alarm');
const WXWORK_CONFIG = {
    type: NodeAlarm.ALARM_TYPE_WXWORK,
    options: {
        // 机器人地址
        url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=637cc457-6e6f-44a5-99ad-2e3d825482b2',
        msgType: 'markdown'//支持 text 和 markdown 两种类型
    }
};
const alarm = new NodeAlarm([WXWORK_CONFIG]);
/*
 * 默认每一行都会作为一个日志实例，输入 mutliLineRegexStart 则支持多行匹配。
 * mutliLineRegexStart 的正则匹配成功后，说明当前日志项还未结束，
 * 直到遇到非 mutliLineRegexContent 正则匹配的行算结束。
 * 
 * 指定 filterRegex 后，当前条目日志只有含有 Error 关键字才会被处理。
 * 
 * 指定 alarm 后，所有 run 函数返回的日志条目，同时也会被通过 alarm 对象发送出去。
 */
const config = {
    logPath:['/app/log/pm2-error-*.log'],
    reportInterval:1000,
    mutliLineRegexStart:'Error',
    mutliLineRegexContent:'at ',
    filterRegex: 'Error',
    alarm
};

const agent = new LogAgent(config);
agent.run(function(err, logs) {
    console.log(logs);
});
agent.stop();
```

## 文档

参见[这里](docs/api.md).