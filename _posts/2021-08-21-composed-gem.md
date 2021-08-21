---
layout: post
title:  宝石合成问题
date:   2021-08-21 09:40:26 +0800
tag:    issue
---

2017年初，已经快五年了，当时我初出茅庐，菜的不行，在一款arpg手游项目中担任游戏后端C++开发；接到一个钻石合成的功能，搞的我直接跪了，怎么都写不对，也没有头绪，最后没办法就qq找另外一个办公室的同事求救，我写了个函数，有传入参数和传出参数，求补全代码实现，几个小时后他把实现后的代码发我，我嵌入到项目中，跑了一下，哎呦，还真行，几天后前端开发人员反馈有种情况不符合预期，然后我反馈给那个同事，他又改了改给我了，接下来就再也没理过这个功能，我也不知道他写的是否完美，只感觉里面有好几个硬编码，好像还有4，5层for循环，直觉不完美，但是能用，我觉得里面还是有隐藏bug的，只是没有专业的测试人员去测，暴露不出来，就应付过去了，算是留下一个坑；现在想了想，那个之前的自己实在是差劲，技术差劲，人品也差劲，心态也差劲，对后面为我填坑的兄弟，我倍感惭愧；后面一直都是独立负责项目，做的项目也不涉及太复杂的逻辑，相当于一直躲在安全区。不过随着工作经验的增加，知识宽度确实提升很大，心态也越来越正，感觉是时候提升下知识深度了，这样自己才能自信的参与任何项目。最近就想到了之前的这个宝石合成的问题，假设以后再遇到，还是懵逼，那就不仅仅是耽误别人的事，对自己内心的也是打击很大。我这边花了一天的时间把这个问题搞定了，总的来说两步就可搞定；第一步是合成，足够合成就接着合成更高级，合成更高级后发现有多出的就归还回去，不够合成就将之前的扣除全部归还回去，然后接着合成更高级；第二步是归还宝石，合成指定级别的宝石后，将多出的归还回去。

- 问题:
    - 已知玩家背包中有不定数量的1-9级宝石，并且4个一级宝石可以合成1个二级宝石，4个二级宝石可以合成1个三级宝石，... 4个八级宝石可以合成1个九级宝石.
    - 编写代码实现以下功能:
        - 输入合成指定宝石的等级和数量
        - 输出合成宝石在背包中需要扣除的宝石等级以及数量列表，扣除规则必须是先扣除一级，不够再扣除二级来补，还不够再扣除三级来补，...
- 实现:
    ```c++
    #include <iostream>
    #include <map>
    using namespace std;

    void give_back_remain(int begin_index, int give_back_amount, map<int, int> &need_map)
    {
        for (int i = begin_index; i >= 1; i--)
        {
            map<int, int>::iterator it = need_map.find(i);
            if (it != need_map.end())
            {
                int after_give_back_amount = it->second - give_back_amount * 4;
                if (after_give_back_amount > 0)
                {
                    it->second = after_give_back_amount;
                    break;
                }
                else if (after_give_back_amount == 0)
                {
                    need_map.erase(it);
                    break;
                }
                else
                {
                    need_map.erase(it);
                    give_back_amount = 0 - after_give_back_amount;
                }
            }
            else
            {
                give_back_amount = give_back_amount * 4;
            }
        }
    }

    short compose_gem(map<int, int> &self_map, int need_composed_id, int need_composed_amount, map<int, int> &need_map)
    {
        int composed_amount = 0;
        for (int i = 1; i < need_composed_id; i++)
        {
            int amount = 0;
            if (self_map.find(i) != self_map.end())
            {
                amount = self_map[i];
            }
            int composed_amount_next = (amount + composed_amount) / 4;
            if (composed_amount_next > 0)
            {
                int real_need_amount = composed_amount_next * 4 - composed_amount;
                if (real_need_amount > 0)
                    need_map[i] = real_need_amount;
                else if (real_need_amount < 0)
                {
                    // 发现扣多了就还回去
                    int give_back_amount = 0 - real_need_amount;
                    give_back_remain(i - 1, give_back_amount, need_map);
                }
                composed_amount = composed_amount_next;
            }
            else
            {
                // 不够合成了就清空之前的记录
                for (int j = i - 1; j >= 1; j--)
                {
                    map<int, int>::iterator it = need_map.find(j);
                    if (it != need_map.end())
                        need_map.erase(it);
                }
                composed_amount = 0;
            }
        }
        int give_back_amount = composed_amount - need_composed_amount;
        if (give_back_amount < 0)
            return -1;
        else if (give_back_amount > 0)
            give_back_remain(need_composed_id - 1, give_back_amount, need_map);
        return 0;
    }

    int main()
    {
        int need_composed_id = 9;
        int need_composed_amount = 2;
        map<int, int> self_map;
        self_map[1] = 10;
        self_map[2] = 10;
        self_map[4] = 1000;
        self_map[5] = 100;
        self_map[6] = 100;
        
        map<int, int> need_map;
        int ret = compose_gem(self_map, need_composed_id, need_composed_amount, need_map);
        if (ret != 0)
        {
            cout << "Material are not enough! Synthesis failed." << endl;
            return -1;
        }
        cout << "need_map:" << endl;
        for (map<int, int>::iterator it = need_map.begin(); it != need_map.end(); it++)
        {
            cout << "k:" << it->first << " v:" << it->second << endl;
        }
        return 0;
    }
    ```