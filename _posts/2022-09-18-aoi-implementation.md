---
layout: post
title:  AOI实现
date:   2022-09-18 18:51:00 +0800
tag:    skill
---

AOI是mmo游戏中比较核心的技术，可自己只知道个大概，从来没自己写过，在看qq群别人讨论的时候就搭不上话，感觉自己挺low的，所以最近挤出来了点时间研究一下，AOI(Area Of Interest)顾名思义就是感兴趣区域，通过感兴趣区域来判断哪些玩家是自己关注的，哪些玩家是关注自己的，对于关注自己的，自己有事就要通知别人，不能让别人失望，对吧，对于自己关注的呢，见面与离开也要通知别人一声，这样别人有事就不用通知自己了，不然人家叫你，你却收不到，岂不是浪费别人感情呀，对吧；这里有个比较绕的关系，就是如果A关注了B，那么A就是B的被观察者，毕竟B被A观察嘛，B就是A的观察者，毕竟A观察着B，反之依然，搞清楚这点就简单了，然后A,B都维护自己的观察者与被观察者列表，自己有一些改变需要AOI区域的看到的话就通知被观察者列表的人，我被谁关注就通知谁；下面是我实现的一个简单的AOI算法，通过enter,move,level三个游戏中影响AOI的操作实现了对应的功能，这是一个没有优化的AOI的算法，对于地图比较小的游戏这个机制是足够，不过mmo的话就不合适，后面我会采用其他方法逐渐优化。

```cpp
#include <iostream>
#include <algorithm>
#include <vector>

#define VISIBLE_AREA 5

struct Player
{
	public:
		void set_id(int id)
		{
			m_id = id;
		}
		
		void set_position(int x, int y)
		{
			m_x = x;
			m_y = y;
		}
		
		int x()
		{
			return m_x;
		}

		int y()
		{
			return m_y;
		}

		std::vector<Player *> &pobserved_vec()
		{
			return m_pobserved_vec;
		}

		std::vector<Player *> &pobserver_vec()
		{
			return m_pobserver_vec;
		}

	public:
		void add_observed(Player *pplayer)
		{
			// 新增一个可广播的人
			m_pobserved_vec.push_back(pplayer);
		}

		void add_observer(Player *pplayer)
		{
			// 新增一个可看到的人
			m_pobserver_vec.push_back(pplayer);
			// 需要通知前端
		}

		void del_observed(Player *pplayer)
		{
			// 删除一个可广播的人
			auto iter = std::find(m_pobserved_vec.begin(), m_pobserved_vec.end(), pplayer);
			if (iter != m_pobserved_vec.end())
			{
				Player *pp = *(m_pobserved_vec.end() - 1);
				*(m_pobserved_vec.end() - 1) = *iter;
				*iter = pp;

				m_pobserved_vec.pop_back();
			}
		}

		void del_observer(Player *pplayer)
		{
			// 删除一个可看到的人
			auto iter = std::find(m_pobserver_vec.begin(), m_pobserver_vec.end(), pplayer);
			if (iter != m_pobserver_vec.end())
			{
				Player *pp = *(m_pobserver_vec.end() - 1);
				*(m_pobserver_vec.end() - 1) = *iter;
				*iter = pp;

				m_pobserver_vec.pop_back();
			}
			// 需要通知前端
		}

		void on_move(Player *pplayer, int x, int y)
		{
			// 需要通知前端， 此人移动到了新的位置
		}

	
	private:
		int m_id;
		int m_x;
		int m_y;
		
		std::vector<Player *> m_pobserved_vec; // 被观察者列表 用于广播
		std::vector<Player *> m_pobserver_vec; // 观察者列表 主要用于通知前端展示与不展示
};


class Scene
{
	public:
		void enter(Player *pplayer)
		{
			for (auto pp : m_pplayer_vec)
			{
				if (_visible(pp, pplayer))
				{
					pplayer->add_observer(pp);
					pp->add_observed(pplayer);
				}
				if (_visible(pplayer, pp))
				{
					pp->add_observer(pplayer);
					pplayer->add_observed(pp);
				}
			}
			m_pplayer_vec.push_back(pplayer);
		}

		void move(Player *pplayer, int to_x, int to_y)
		{
			for (auto pp : m_pplayer_vec)
			{
				if (pplayer == pp)
				{
					continue;
				}
				if (std::find(pplayer->pobserved_vec().begin(),
					pplayer->pobserved_vec().end(), pp) != pplayer->pobserved_vec().end())
				{
					if (_visible(pplayer, pp))
					{
						pp->on_move(pplayer, to_x, to_y);
					}
					else
					{
						pplayer->del_observed(pp);
						pp->del_observer(pplayer);
					}
				}
				else
				{
					if (_visible(pplayer, pp))
					{
						pp->add_observer(pplayer);
						pplayer->add_observed(pp);
					}
				}
				if (std::find(pplayer->pobserver_vec().begin(),
					pplayer->pobserver_vec().end(), pp) != pplayer->pobserver_vec().end())
				{
					if (_visible(pplayer, pp))
					{
					}
					else
					{
						pplayer->del_observer(pp);
						pp->del_observed(pplayer);
					}
				}
				else
				{
					if (_visible(pplayer, pp))
					{
						pplayer->add_observer(pp);
						pp->add_observed(pplayer);
					}
				}
			}
			
			pplayer->set_position(to_x, to_y);
		}

		void leave(Player *pplayer)
		{
			for (auto pp : pplayer->pobserver_vec())
			{
				pp->del_observed(pplayer);
			}
			pplayer->pobserver_vec().clear();
			for (auto pp : pplayer->pobserved_vec())
			{
				pp->del_observer(pplayer);
			}
			pplayer->pobserved_vec().clear();
		}

	private:
		bool _visible(Player *other, Player *core)
		{
			return abs(other->x() - core->x()) <= VISIBLE_AREA && abs(other->y() - core->x()) <= VISIBLE_AREA;
		}

	private:
		std::vector<Player *> m_pplayer_vec;
};

int main()
{
	Player *pplayer = NULL;
	Scene *pscene = NULL;

	pscene = new Scene;

	pplayer = new Player;
	pplayer->set_id(1);
	pplayer->set_position(1, 2);
	pscene->enter(pplayer);
	pscene->leave(pplayer);

	pplayer = new Player;
	pplayer->set_id(2);
	pplayer->set_position(3, 4);
	pscene->enter(pplayer);
	pscene->leave(pplayer);

	return 0;
}
```