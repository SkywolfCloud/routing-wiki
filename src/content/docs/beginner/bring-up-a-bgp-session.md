---
title: 二、拉起一个BGP会话
description: 快速与上游建立连接
---
看完 [开始之前](/beginner/before/) 后，你应该对路由和 BGP 有了基本的概念，并且已经在你的机器上安装好了 BIRD。本章将带你快速与上游建立 BGP 会话，把你的前缀广播到互联网上。

考虑到大多数 BGP Player 当前主要持有 IPv6 段，本章示例将以 IPv6 为主，IPv4 的配置思路完全类同，可自行举一反三。

# 配置

![simulator](../../../assets/bring-up-a-bgp-session/simulator.png)

## 客户（Client）

- **ASN**：AS114514
- **待广播前缀**：
  - `fc00::2/64`（与上游的内网地址）
  - `fe80::2/64`（链路本地地址）
  - `2001:db8::/48`（对外广播的 IPv6 前缀）

## 上游（Upstream）

- **ASN**：AS64512
- **IP**：
  - `fc00::1/64`（与客户的内网地址）
  - `fd00::1/128`（BGP 网关地址）
  - `fe80::1/64`（链路本地地址）

> 客户端系统：Debian 12
>  BIRD 版本：2.17.1

# 虚拟网卡

广播 IP 段的最终目的是让你的机器实际使用这些地址。那么怎么用？最简单的做法，就是在本地创建一个虚拟网卡（dummy 网卡），并把你需要广播的 IP 前缀里的某个地址绑定到这个网卡上。

以 Debian 为例，你可以在 `/etc/network/interfaces` 中添加如下配置（这里以前面示例的前缀为例）：

```interface
iface dummy0 inet6 static
    address 2001:db8::1/128
    pre-up ip link add dummy0 type dummy
    post-down ip link del dummy0 type dummy
```

这里我们创建了一个名为 `dummy0` 的虚拟网卡，并为其分配了一个地址 `2001:db8::1/128`。注意这里使用的是 `/128` 而不是 `/64` 或 `/48`，因为我们只需要绑定这个段内的**一个**地址来宣布路由，机器本身并不需要在该网卡上与其他设备通信，也就不需要整个子网。

保存后，执行 `ifup dummy0` ：

```bash
root@debian:~# ifup dummy0
Waiting for DAD... Done
root@debian:~# 
```



如果如上所示，`dummy0` 启动时没有任何错误，那么恭喜你，虚拟网卡已经成功创建，可以用于后续 BGP 广播。

# 配置 BIRD

BIRD 安装好后，`/etc/bird/bird.conf` 默认会带有一份 200 多行的示例配置文件，里面展示了 BIRD 的多种用法。你可以先备份一份以备研究，但接下来我们需要先清空它，从零开始编写。执行以下命令即可：

```
bash


复制编辑
echo > /etc/bird/bird.conf
```

这样就得到了一个空白的配置文件，方便后续填写。

**注意：请不要随意修改 `envvars` 文件**。它对 BIRD 服务的正常启动非常重要。如果不小心改动了，这里是它的默认内容，供你快速恢复：

```
bash复制编辑BIRD_RUN_USER=bird
BIRD_RUN_GROUP=bird
#BIRD_ARGS=
```

## 基本配置

```bird2 showLineNumbers {2, 8, 15} 
log syslog all;
router id 10.0.0.1; # 需要替换成机器上的任意 IPv4 地址，或直接删掉该行让 BIRD 自动选择
define ASN = 114514; # 定义本地使用的 ASN
define OWN_IPv6 = [2001:db8::/48]; # 定义将要对外宣布的 IPv6 段
protocol device {
};
protocol kernel {
    ipv6 {
        export filter {
            krt_prefsrc = 2001:db8::1; # 指定使用的源地址，如dummy0接口绑定的地址
            accept;
        };
    };
};
protocol static static_v6 {
    ipv6;
    route 2001:db8::/48 reject; #在 static 中添加你需要广播的路由
};
```

这是 BIRD 配置的起手式。它主要包含以下内容：

- 定义 `router id`、`ASN` 和 `OWN_IPv6`（自有前缀）
- `protocol device`：让 BIRD 能读取系统的网络接口信息
- `protocol kernel`：用于将 BIRD 学到的路由写回内核路由表
- `protocol static`：用于声明静态路由

注意看第 7–10 行，这里我们没有简单写 `export all`，而是使用了 `filter`。这是因为我们希望所有通过 BGP 学到的路由（通常是全网路由）在被系统使用时，都能以我们自己的地址作为源地址，而不是服务商分配的地址~~BGP不用自己的地址那还有什么意义~~。所以，这里通过 `krt_prefsrc` 参数显式指定了默认源地址。**请务必确保这个地址已在某个接口（如 dummy0）上绑定**，否则你会在日志里收获大量的 `RTNETLINK answers: Invalid argument` 报错。

`static` 协议用于在 BIRD 内定义要广播的路由，示例如下（引用自 [Soha 的新手教程](https://github.com/moesoha/bird-bgp-kickstart/blob/master/main.md#协议-protocol)）：

```bird2
protocol static {
    ipv6; # 启用 ipv6 channel，否则不会收集 IPv6 路由

    route 2001:db8:100a::/48 reject;
    # 定义一条路由 2001:db8:100a::/48 为 reject/unreachable
    route 2001:db8:100b::/48 via "eth0";
    # 定义一条路由 2001:db8:100b::/48 的下一跳为 eth0，也就是说会在eth0内发邻居请求报文NS（Neighbor Solicitation）寻找IP所在的机器
    route 2001:db8:100c::/48 via 2001:db8:eeee::1;
    # 定义一条路由 2001:db8:100c::/48 的下一跳为 2001:db8:eeee::1
}
```

一般来说，如果只是为了对外宣布一个段，通常会用 `reject` 作为下一跳（见第 15 行），这是因为数据包到达后，实际的转发由 Linux 的路由表负责，而你的 Linux 路由表通常会包含更细化的路由（例如 dummy0 上绑定的 `/128`）。如果找不到更具体的匹配，说明这个段暂时未使用，可直接返回 `unreachable`。除非有特殊需求，否则没必要给整个 `/48` 设置一个实际的下一跳。

## 过滤器

之所以在讲完基本配置之后就要讲过滤器，是因为一个无论你是一个*CIE还是一个BGP Player，**管好自己发出的路由都是自己最基本的责任，也是对别人的最基本的尊敬**。由于过滤器配置疏忽而引发的路由泄漏、服务中断乃至全球事故比比皆是，去 Cloudflare Blog 随便搜就能找到一大堆案例。好消息是，对于新手来说，并不需要很复杂的过滤器：只要保证**只发自己的路由**、**收上游的全部路由**即可。

以下是最简单的示例：

```bird2 {3}
filter export_filter_v6 {
    if net ~ OWN_IPv6 then accept; # 如果前缀属于 OWN_IPv6，则放行
    reject; # 否则拒绝
};
filter import_filter_v6 {
    accept; # 照单全收
};
```

我们建议，在编写过滤器的时候，一定要**显式accept**，即明确accept的情况，并默认reject其他情况，像第 3 行一样。

更多过滤器的用法可以参考 [Soha 的教程](https://github.com/moesoha/bird-bgp-kickstart/blob/master/main.md#3-过滤过滤) 或 [BIRD 中文文档](https://bird.xmsl.dev/docs/user-guide/5-1-introduction.html)。要记住： **对于路由过滤，无论再怎么小心都不为过。你少写的每一个字符，都可能造成几百万美元的损失和几个小时的全球停机。** 

# 配置BGP

## 同段

## 多跳

## fe80

# 全部配置

以多跳为例：

```bird2
log syslog all;
router id 10.0.0.1; # 需要替换成机器上的任意 IPv4 地址，或直接删掉该行让 BIRD 自动选择
define ASN = 114514; # 定义本地使用的 ASN
define OWN_IPv6 = [2001:db8::/48]; # 定义将要对外宣布的 IPv6 段
protocol device {
};
protocol kernel {
    ipv6 {
        export filter {
            krt_prefsrc = 2001:db8::1; # 指定使用的源地址，如dummy0接口绑定的地址
            accept;
        };
    };
};
protocol static static_v6 {
    ipv6;
    route 2001:db8::/48 reject; #在 static 中添加你需要广播的路由
};
filter export_filter_v6 {
    if net ~ OWN_IPv6 then accept; # 如果前缀属于 OWN_IPv6，则放行
    reject; # 否则拒绝
};
filter import_filter_v6 {
    accept; # 照单全收
};
```



