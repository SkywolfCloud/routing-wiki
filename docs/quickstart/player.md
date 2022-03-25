---
title: 阶段1 BGP Player
lang: zh-CN
---

# 阶段1 BGP Player

从这篇文章开始，我们就要安装bird并开始往外广播了。

## 安装Bird

目前而言，在bullseye（Debian 11）中，stable源里的bird是2.0.7，backports源里的bird是2.0.8，最新版本是2.0.9。我们建议使用2.0.9，里面有对一些错误提示的改善修复，方便新手排查问题。如果您想使用2.0.8，将debian添加backports源后用apt安装即可。

下面这段shell脚本直接复制到ssh执行即可快捷安装bird 2.0.9

```bash
apt update
apt install -y build-essential autoconf git flex bison m4 libssh-dev libncurses-dev libreadline-dev 
cd ~
git clone https://gitlab.nic.cz/labs/bird.git BIRD
cd BIRD
autoreconf
./configure --prefix= --sysconfdir=/etc/bird --runstatedir=/var/run/bird
make
make install
```

安装完后执行`service bird start`，后执行` birdc show status`

返回内容第一行应该与如下相似：

```
BIRD v2.0.9-6-g4b1aa37f ready.
```

如果该行相似，并且版本号确认为2.0.9.且最后一行为

```
Daemon is up and running
```

那么bird就安装成功了。

## 撰写配置文件

bird在debian的默认配置文件在`/etc/bird/bird.conf`

你可以复制一份以备之后详细阅读，现在我们要做的就是清空它。

运行如下命令：

```
echo > /etc/bird/bird.conf
```

现在bird.conf已经清空了。