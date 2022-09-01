---
layout: post
title:  A星寻路
date:   2022-08-21 10:08:00 +0800
tag:    skill
---

一直计划把寻路的原理搞懂，首先我是从《算法》这本书下手的的，看了深度优先，广度优先，然后才知道深度优先是解决可达性问题的，虽然同时也可以探索出一条路径，不过这条路径会绕很多多余的弯子，而广度优先确实是解决寻路问题的，会探索出一条没有弯子的最短路径，不过吧效率很低，探索这条最短路径的时候会扫描很多不必要的地方。所以自然就想有一个方法既能探索到最短路径，同时在探索的过程中尽可能少的扫描不必要的地方，这就是A*，通过查找资料理解原理后，实现了以下代码，其中最核心的find_path是探索路径，dump_path是将探索到的路径以回溯的方式依次将路径中的每个节点打印出来。可见探索路径代码并不多，其实就是用的曼哈顿距离来从所有可行的方向中找到一个最优的方向（我觉得用“方向”这个词比较合适），继续向前探索，直到探索到目标位置为止。


```cpp
#include <iostream>
#include <bitset>
#include <array>
#include <queue>

using namespace std;

#define WIDTH 7
#define HIGHT 5
#define NODE_SIZE WIDTH * HIGHT

class Grid
{
    enum EDirectionType
    {
        EDT_Upper,
        EDT_Lower,
        EDT_Left,
        EDT_Right,
        EDT_Max
    };
    struct Node
    {
        int id;
        int x;
        int y;
        int fv;
        Node *prev;
        array<Node *, EDT_Max> neighbors;

        bool operator < (const Node &node) const
        {
            return fv < node.fv;
        }
    };

    public:
        void init()
        {
            for (int i = 0; i < m_nodes.size(); ++i)
            {
                Node &node = m_nodes[i];
                node.id = i;
                node.y = i % HIGHT;
                node.x = i / HIGHT;
                node.neighbors.fill(NULL);
                int upper_idx = i - 1;
                if (i % HIGHT > 0)
                {
                    node.neighbors[EDT_Upper] = &m_nodes[upper_idx];
                }
                int lower_idx = i + 1;
                if (lower_idx % HIGHT > 0)
                {
                    node.neighbors[EDT_Lower] = &m_nodes[lower_idx];
                }
                int left_idx = i - HIGHT;
                if (left_idx >= 0)
                {
                    node.neighbors[EDT_Left] = &m_nodes[left_idx];
                }
                int right_idx = i + HIGHT;
                if (right_idx < m_nodes.size())
                {
                    node.neighbors[EDT_Right] = &m_nodes[right_idx];
                }
            }
        }

        bool find_path(int src_id = 0, int des_id = 0)
        {
            std::bitset<NODE_SIZE> marked;
            priority_queue<Node *, std::vector<Node *>, less<Node *>> open_pq;
            m_nodes[src_id].fv = 0;
            marked.set(src_id);
            open_pq.push(&m_nodes[src_id]);

            while(!open_pq.empty())
            {
                Node *nearest_node_ptr = open_pq.top();
                open_pq.pop();
                if (nearest_node_ptr->id == des_id)
                {
                    return true;
                }
                for (Node *node_ptr : nearest_node_ptr->neighbors)
                {
                    if (node_ptr == NULL || marked.test(node_ptr->id))
                    {
                        continue;
                    }
                    node_ptr->fv = _mht_dis(node_ptr->id, src_id) + _mht_dis(node_ptr->id, des_id);
                    node_ptr->prev = nearest_node_ptr;
                    marked.set(node_ptr->id);
                    open_pq.push(node_ptr);
                }
            }
            return false;
        }

        void dump_path(int src_id = 0, int des_id = 0)
        {
            cout << "path: ";
            int curr_id = des_id;
            while(curr_id != src_id)
            {
                cout << m_nodes[curr_id].id << "\t";
                Node *prev = m_nodes[curr_id].prev;
                if (prev == NULL)
                {
                    break;
                }
                curr_id = prev->id;
            }
            cout << endl;
        }
        
        void dump()
        {
            for (Node &node : m_nodes)
            {
                cout << "id:" << node.id << "\t";
                cout << "y:" << node.y << "\t";
                cout << "x:" << node.x << "\t";
                for (Node *node_ptr : node.neighbors)
                {
                    if (node_ptr == NULL)
                    {
                        cout << "neighbor:" << -1 << "\t";
                    }
                    else
                    {
                        cout << "neighbor:" << node_ptr->id << "\t";
                    }
                }
                cout << endl;
            }

        }

    private:
        int _mht_dis(int aid, int bid)
        {
            return abs(m_nodes[aid].x - m_nodes[bid].x) + abs(m_nodes[aid].y - m_nodes[bid].y);
        }

    private:
        array<Node, NODE_SIZE> m_nodes;
};

int main()
{
    Grid grid;
    grid.init();
    grid.dump();
    
    int src_id = 7;
    int des_id = 34;
    if (grid.find_path(src_id, des_id))
    {
        cout << "src_id:" << src_id << endl;
        cout << "des_id:" << des_id << endl;
        grid.dump_path(src_id, des_id);
    }
    return 0;
}
```