---
layout: post
title:  "美光Rev.E单通道超频：从3000CL15到4600CL18"
categories: blog
---

<div id="google_translate_element"></div>

<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'zh'}, 'google_translate_element');
}
</script>

<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<br>

在购买美光科技（NASDAQ: MU）股票的同时，我还购买了一条平凡的美光[Crucial Ballistix Sport LT](https://www.crucial.com/memory/ddr4/bls16g4d30aese)内存，有效速度3000MT/s，时序15-16-16-36，电压1.35V。

<img src="/images/ballistix-sport.webp" alt="包装" width="500"/>

英睿达（Crucial）是美光的旗下品牌，因此Ballistix系列的3000CL15、3200CL16、3600CL16和4000CL18产品都搭载了美光的颗粒。这些颗粒正是传说中物美价廉，超频性价比超高的[8Gbit Revision E](https://www.micron.com/-/media/client/global/documents/products/data-sheet/dram/ddr4/8gb_ddr4_sdram.pdf)（又称E-Die）。

### 3666CL14和3600CL14
经过一整天的尝试，3733CL14@1.5V总是不稳定，因此我降频至**3666CL14**和**3600CL14**进行测试。

> 注：
> 
> * Gear Down Mode已关闭。
> * Power Down Mode已关闭。
> * VDDP电压设置为950mV；VDDG电压设置为1050mV。
> * 内存电压（VDDR）设定为 1.5V。
> * tRRDS = 4, tRRDL = 6, tFAW = 16, tWR = 10
> * 第三时序（tertiary timings）使用了主板的自动值。

MemClk = FClk = 1833MHz（内存有效速度为**3666MT/s**）

| **tCL**     | 14   | 14   | 14   | 14   | **14**   |
| **tRCD(RD)**| 14   | 15   | 16  | 18   | **19**   |
| **tRP**     | 14   | 14   | 14   | 14   | **14**   |
| **tRAS**    | 28   | 29   | 30  | 32   | **33**   |
| **是否POST？** | 无POST | 无POST | 无POST | POST | POST |
| **是否稳定？** | - | - | - | 不稳定 | 稳定 |

tRCDRD似乎成了无法突破的障碍。根据以上测试的结果，最紧且稳定的**主要时序**（primary timings）为**14-19-14-33-1T**。

适当调整的**第二时序/次要时序**（secondary timings）：

| tRC | tWR | tCWL | tRRDS | tRRDL   | tWTRS | tWTRL | tRFC | tRTP | tFAW |
|-----|-----|------|-------|---------|-------|-------|------|------|------|
| 54  | 10  | 14   | 4     | 6       | 4     | 10     | 533  | 8    | 16   |

> tRC和tRFC相对于其他颗粒而言相当高。B-Die的tRFC甚至可以是Rev.E的一半？

以下是使用[AIDA64 Extreme](https://www.aida64.com/) 6.20.5300测试内存的读取、写入、复制和延迟的结果：

***注意：本文中的测试都只使用了单通道！***

|                  | Trial 1 | Trial 2 | Trial 3 | **Avg**   |
|------------------|---------|---------|---------|-----------|
| **读（MB/s）**   | 28111   | 28025   | 28069   | **28068** |
| **写（MB/s）**   | 27968   | 27967   | 27968   | **27968** |
| **复制（MB/s）** | 29360   | 29245   | 29519   | **29375** |
| **延迟 (ns)**    | 68.5    | 68.2    | 68.9    | **68.5**  |

另附**3600CL14**（tRFC=524）的测试结果：

|                  | Trial 1 | Trial 2 | Trial 3 | **Avg**   |
|------------------|---------|---------|---------|-----------|
| **读（MB/s）**   | 27541   | 27611   | 27569   | **27574** |
| **写（MB/s）**   | 27450   | 27440   | 27446   | **27445** |
| **复制（MB/s）** | 28651   | 28895   | 28963   | **28836** |
| **延迟 (ns)**    | 69.5    | 69.6    | 69.5    | **69.5**  |

### 4400CL18
在手动设置**ProcODT**为**32**之后，4400MT/s是能稳定的最高频率。

> 注：
> 
> * Gear Down Mode已开启。
> * Power Down Mode已关闭。
> * 内存电压（VDDR）设定为 1.55V。
> * 主要时序没有进行微调；第二和第三时序使用了主板的自动值。

MemClk = 2200MHz，FClk = 1100MHz（内存有效速度为**4400MT/s**）

| **tCL**     | **18**   |
| **tRCD(RD)**| **26**   |
| **tRP**     | **26**   |
| **tRAS**    | **44**   |
| **是否POST？** | POST |
| **是否稳定？** | 稳定 |

测试结果：

|                  | 试验 1 | 试验 2 | 试验 3 | ** 平均值**   |
|------------------|---------|---------|---------|-----------|
| **读（MB/s）**   | 32480   | 32424   | 32406   | **32437** |
| **写（MB/s）**   | 27958   | 28062   | 28006   | **28009** |
| **复制（MB/s）** | 32206   | 32315   | 31996   | **32172** |
| **延迟 (ns)**    | 82.3    | 81.9    | 82.6    | **82.3**  |

### 4600CL18（不稳定）
尽管主板（X570 I AORUS PRO WIFI）的QVL中有高达4700MT/s的内存，**4600MT/s**似乎已经是开机的极限了。

<a href="https://valid.x86.fr/aqa3at"><img src="https://valid.x86.fr/cache/banner/aqa3at-6.png" alt="https://valid.x86.fr/aqa3at"></a>

希望在未来的某天，这条内存能找到发挥真正实力——5000MT/s，甚至更高的地方。
