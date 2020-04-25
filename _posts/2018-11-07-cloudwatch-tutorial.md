---
layout: post
title:  "cloudwatch操作笔记"
date:   2018-11-07 12:20:26 +0800
tag: code
---

![](/images/2018-11-07-cloudwatch-tutorial.png)


``` bash
aws cloudwatch put-metric-data --metric-name RequestLatency --namespace GetStarted \
--timestamp 2016-10-14T20:30:00Z --value 87 --unit Milliseconds
aws cloudwatch put-metric-data --metric-name RequestLatency --namespace GetStarted \
--timestamp 2016-10-14T20:30:00Z --value 51 --unit Milliseconds
aws cloudwatch put-metric-data --metric-name RequestLatency --namespace GetStarted \
--timestamp 2016-10-14T20:30:00Z --value 125 --unit Milliseconds
aws cloudwatch put-metric-data --metric-name RequestLatency --namespace GetStarted \
--timestamp 2016-10-14T20:30:00Z --value 235 --unit Milliseconds
```

 The parameter MetricData.member.1.Unit must be a value in the set [ Seconds, Microseconds, Milliseconds, Bytes, Kilobytes, Megabytes, Gigabytes, Terabytes, Bits, Kilobits, Megabits, Gigabits, Terabits, Percent, Count, Bytes/Second, Kilobytes/Second, Megabytes/Second, Gigabytes/Second, Terabytes/Second, Bits/Second, Kilobits/Second, Megabits/Second, Gigabits/Second, Terabits/Second, Count/Second, None ].

 意思是：--unit这个字段必须选择以上中括号中的单位，不允许自定义.

``` bash
aws cloudwatch get-metric-statistics --namespace GetStarted --metric-name RequestLatency --statistics Average --start-time 2016-10-14T00:00:00Z --end-time 2016-10-15T00:00:00Z --period 60
```

时间戳格式获取：
``` bash
date -v-0H +%Y-%m-%dT%H:%M:%SZ
```
