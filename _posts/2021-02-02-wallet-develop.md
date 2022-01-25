---
layout: post
title:  "USDT钱包服务搭建并测试"
date:   2021-02-02 14:51:26 +0800
tag:    notes
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
testnet=0
# 是否启用RPC客户端
server=1
# 监听
rpcbind=0.0.0.0:8332
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
```

创建钱包
```bash
# param1: wallet_name 钱包名称
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"createwallet","params":["johnwallet222"]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```

对钱包设置密码
```bash
# param1: passphrase 密码
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"encryptwallet","params":["qazwsx123"]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet222 -s | python3 -m json.tool
```

解锁钱包 调用在内存中保存钱包的解密密钥，并在 指定的超时时间后自动锁定钱包
```bash
# param1: passphrase 密码
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"walletpassphrase","params":["qazwsx123", 60]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet -s | python3 -m json.tool
```

新建钱包地址
```bash
# param1: lable 标签 用于地址分类
# param2: output_type 地址类型(legacy|p2sh-segwit|bech32) 默认是p2sh-segwit
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getnewaddress","params":["HelloWorld", "p2sh-segwit"]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet222 -s | python3 -m json.tool
```

获取钱包地址
```bash
# param1: lable 标签 用于地址分类
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getaddressesbylabel","params":["HelloWorld"]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet222 -s | python3 -m json.tool
```

导出指定地址的私钥
```bash
# param1: address 钱包地址
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"dumpprivkey","params":["2MzAwwvoBqEfoADpRPFZV8HDwCBYfnhKP1R"]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet222 -s | python3 -m json.tool
```

获取USDT数量:
```bash
# param1: address 钱包地址
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"omni_getbalance","params":["2MzAwwvoBqEfoADpRPFZV8HDwCBYfnhKP1R",31]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```

获取钱包信息
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"getwalletinfo"}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet222 -s | python3 -m json.tool
```

---

调用将指定的地址或公钥脚本添加到钱包中
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"importaddress","params":["2MzAwwvoBqEfoADpRPFZV8HDwCBYfnhKP1R", "johnwallet"]}' --user test:123456 http://127.0.0.1:18332/wallet/ -s | python3 -m json.tool
```

调用将指定的私钥导入钱包
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"importprivkey","params":["cQPEnyZM76XeN27NvZ4Whkyaa26Yhz47qXquHyDTxyvSUGqgV2x2", "johnwallet"]}' --user test:123456 http://127.0.0.1:18332/wallet/ -s | python3 -m json.tool
```

获取钱包中的地址
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"listaddressgroupings"}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet -s | python3 -m json.tool
```

调用将钱包里的所有密钥导出到指定的文件
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"dumpwallet","params":["/tmp/johnwallet.txt"]}' --user test:123456 http://127.0.0.1:18332/wallet/johnwallet -s | python3 -m json.tool
```

挖矿并将奖励发送到指定钱包地址
```bash
curl -H 'Content-Type:application/json' -X POST --data '{"id":"1","jsonrpc":"2.0","method":"generatetoaddress", "params":[2,"2MzAwwvoBqEfoADpRPFZV8HDwCBYfnhKP1R", 500000]}' --user test:123456 http://127.0.0.1:18332 -s | python3 -m json.tool
```