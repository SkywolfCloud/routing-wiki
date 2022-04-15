---
title: 阶段1 BGP Player
lang: zh-CN
---

# 阶段1 BGP Player

从这篇文章开始，我们就要安装bird并开始往外广播了。

## 开始之前

我们假设：

- 你只拥有IPv6段

- 你的ASN是 `AS114514`
- 你的IPv6段为 `2404::/48`，你计划能使用 `2404::1`访问这台机器
- 该机器的公网IPv4为 `1.1.1.1` 公网IPv6为 `2405::1`
- 你的BGP邻居为`AS7720`，对方的IPv6为`2405::2`
- 你与你的邻居在同一个子网且一跳可达

**该设置将通用于本篇文章**

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

## 配置虚拟网卡

如果你需要使用`2404::1`来访问你的机器，那么你的机器就需要有一个网卡绑定这个地址。由于这个IP并不在任意一个物理接口中可用（或者在多个物理接口中可用），所以你需要使用一个虚拟网卡来绑定它。

dummy网卡的作用，就是绑定一个并不实际关联到物理接口的地址到你的机器。它的工作方式与loopback接口类似，但你可以创建非常多的dummy接口用来绑定非常多的地址（尽管我**非常**不建议这么做，这样可能会导致bird在扫描网卡的时候占用大量CPU导致BGP断连）。

我们可以用下面的命令创建一个dummy网卡并绑定地址。

```shell
ip link add dummy0 type dummy # 新建一个dummy网卡，命名为dummy0（强烈建议使用一个规则的命名方式，比如dummy+数字）
ip link set dummy0 up # 标记网卡状态为UP
ip addr add 2404:f4c0::1/128 dev dummy0 # 向dummy网卡添加地址
```

**通过命令创建的网卡每次重启会消失，建议让它在开机时自行启动（比如rc.local）或写入interfaces文件，具体方法请自行Google**

**强烈建议dummy只绑定/128（IPv6）或/32（IPv4）地址，否则可能跟接下来在bird内配置的地址导致冲突从而出现错误**

## 撰写配置文件

bird在debian的默认配置文件在`/etc/bird/bird.conf`

你可以复制一份以备之后详细阅读他的注释（有很多有用的示例），现在我们要做的就是清空它。

运行如下命令：

```
echo > /etc/bird/bird.conf
```

现在bird.conf已经清空了。

### 基本配置

我们先写一个基本的配置文件。

```
log syslog all;
router id 1.1.1.1; # 指定路由ID，通常而言需要全球单播ipv4作为routerid
define ASN=114514; # 定义常量ASN，提升可扩展性
define OWNIPv6s=[2404::/48]; # 定义OWNIPv6s，包括自己的IPv6，提升可扩展性，为后续过滤器做准备
protocol device { # 扫描设备IP，这么写即可
};
protocol kernel {
    ipv6 {
        export all; # 将所有路由都导入系统路由表
    };
};
protocol static static_v6 {
    ipv6;
    route 2404::/48 reject; #在STATIC中添加路由
};
```

上面配置文件比较重要的是`static`。一般，我们在static的第一行用`ipv4;`或`ipv6;`指定该static的类型，然后在下面用`route xxxxx/xx reject;`来宣告路由。由于该整段都分配在该设备上，并且更细分的路由（如/128 /64）会比该路由优先，所以这里`reject`（也可用`unreachable`，即向请求方返回`icmp unreachable`信息）起到保底的作用。

### 过滤器

**过滤器非常的重要，做好自己的过滤是对与你建立BGP连接的人的尊敬**

所幸，作为一个只有一个接点的BGP Player，我们不需要太过于复杂的过滤器，对于导出，我们只需要下面这些即可

```
filter export_filter_v6 {
if net ~ OWNIPv6s then accept; # 如果前缀包括在OWNIPv6s内则放出
reject; # 否则全部拒绝
};
```

而对于导入，可以直接不过滤，收全表

```
filter import_filter_v6 {
accept; # 接收所有路由
};
```

也可以如下所示过滤掉默认路由

```
filter import_filter_v6 {
if net ~ [::/0] then reject; # 如果为默认路由则拒绝
accept; # 接收所有其他路由
};
```

写好过滤器后，我们就可以开始配置BGP会话了。

### 配置BGP会话

如下所示

```
protocol bgp bgp_as7720_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as ASN; # 指定本端地址与ASN
	neighbor 2405::2 as 7720;  # 指定对端地址与ASN
	ipv6 { # 指定要在该BGP邻居上跑的协议
		import import_filter_v6; # 指定导入过滤器
		export export_filter_v6; # 指定导出过滤器
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器配糊导致session爆炸需要联系对方NOC手动重启（比如HE）
	};
	graceful restart; # 平滑重启，建议支持，防止重启bird的时候造成路由撤回导致服务中断
};
```

在BGP中，是可以在一个会话上传递多种协议的，也就是`Multiprotocol extensions for BGP`（也简称`MP-BGP`）（[RFC 4760](http://www.rfc-editor.org/info/rfc4760)）。但是，如果没有明确约定，一般都是每种协议起一个会话。

### 收尾

通常而言，如果一切正常，你的前缀应该已经广播出去，并将在24-72小时内传递至全球互联网，并且你应该能用你所广播的地址（在本篇文章中是`2404::1`）访问你的机器。

通常而言，如果你只为自己服务，那目前的配置已经足够了。但如果你想为别人提供服务，那目前的配置就力有不逮。下一章，我们将讲解当需要给别人配置的时候该如何配置。



## 附录：完整配置文件

```
log syslog all;
router id 1.1.1.1; # 指定路由ID，通常而言需要全球单播ipv4作为routerid
define ASN=114514; # 定义常量ASN，提升可扩展性
define OWNIPv6s=[2404::/48]; # 定义OWNIPv6s，包括自己的IPv6，提升可扩展性，为后续过滤器做准备
protocol device { # 扫描设备IP，这么写即可
};
protocol kernel {
    ipv6 {
        export all; # 将所有路由都导入系统路由表
    };
};
protocol static static_v6 {
    ipv6;
    route 2404::/48 reject; #在STATIC中添加路由
};
filter export_filter_v6 {
if net ~ OWNIPv6s then accept; # 如果前缀包括在OWNIPv6s内则放出
reject; # 否则全部拒绝
};
filter import_filter_v6 {
if net ~ [::/0] then reject; # 如果为默认路由则拒绝
accept; # 接收所有其他路由
};
protocol bgp bgp_as7720_v6 { # 建议给自己指定一个命名规则
	local 2405::1 as ASN; # 指定本端地址与ASN
	neighbor 2405::2 as 7720;  # 指定对端地址与ASN
	ipv6 { # 指定要在该BGP邻居上跑的协议
		import import_filter_v6; # 指定导入过滤器
		export export_filter_v6; # 指定导出过滤器
		export limit 10; # 限制导出前缀数量，根据需要调整，防止过滤器配糊导致session爆炸需要联系对方NOC手动重启（比如HE）
	};
	graceful restart; # 平滑重启，建议支持，防止重启bird的时候造成路由撤回导致服务中断
};
```
