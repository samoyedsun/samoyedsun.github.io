---
layout: post
title:  "USDT钱包服务搭建并测试"
date:   2021-02-02 14:51:26 +0800
tag: code
---

安装:
```bash
wget https://github.com/OmniLayer/omnicore/releases/download/v0.9.0/omnicore-0.9.0-x86_64-linux-gnu.tar.gz
tar -zxvf omnicore-0.9.0-x86_64-linux-gnu.tar.gz
mv omnicore-0.9.0 /usr/local/omnicore

ln -s /usr/local/omnicore/bin/omnicored /usr/local/bin/omnicored
ln -s /usr/local/omnicore/bin/omnicore-cli /usr/local/bin/omnicore-cli
```

配置:
```bash
mkdir /root/.omnicore
vim /root/.omnicore/bitcoin.conf
```
必要的配置信息: bitcoin.conf
```bitcoin.conf
# 测试网络为1，主网络为0
testnet=1
# 是否启用RPC客户端
server=1
# RPC客户端的用户名
rpcuser=test
# RPC客户端的密码
rpcpassword=123456
# RPC客户端的访问权限，这样写的意思是允许所有访问
rpcallowip=0.0.0.0/0
# RPC客户端的监听端口
rpcport=8332
# 与bitcoind的不同之处，omnicored必须指定这一项，否则启动会提示错误
txindex=1
```

启动服务:
```bash
omnicored -testnet #连接test3测试网络，会同步test3网络的区块数据（约20G）
omnicored          #连接比特币主网网络，会同步真实区块数据（约250G，要4-5天时间同步完成）

omnicored -testnet -datadir=/root/.omnicore -conf=/root/.omnicore/bitcoin.conf -daemon
```

测试服务:
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getnetworkinfo"}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool

curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getblockchaininfo"}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool

curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getwalletinfo"}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```

新建钱包地址:
```bash
# param1: lable 钱包账户名称 一个账户名可以对应多个地址
# param2: output_type 地址类型(legacy|p2sh-segwit|bech32) 默认是p2sh-segwit
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getnewaddress","params":["HelloWorld", "p2sh-segwit"]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```

获取钱包地址:
```bash
# param1: lable 钱包账户名称 一个账户名可以对应多个地址
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getaddressesbylabel","params":["HelloWorld"]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```

获取USDT数量:
```bash
# param1: address 钱包地址
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"omni_getbalance","params":["2MzAwwvoBqEfoADpRPFZV8HDwCBYfnhKP1R",31]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```