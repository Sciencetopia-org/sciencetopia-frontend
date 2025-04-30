// 模拟不同类型搜索结果
export const mockSearchResults = {
    knowledge: [
      {
        id: 1,
        type: 'knowledge',
        title: 'Vue3 组合式API指南',
        excerpt: '学习如何使用Vue3的组合式API进行开发...',
        createdAt: '2023-05-15'
      },
      // 更多知识类结果...
    ],
    plan: [
      {
        id: 101,
        type: 'plan',
        title: '2023前端学习计划',
        excerpt: '完整的前端开发学习路线图...',
        createdAt: '2023-01-10'
      },
      // 更多计划类结果...
    ],
    group: [
      {
        id: 201,
        type: 'group',
        title: 'Vue技术交流组',
        excerpt: '讨论最新Vue技术和实践...',
        createdAt: '2023-03-20'
      },
      // 更多小组类结果...
    ]
  }
  
  // 模拟搜索API响应
  export const mockSearchAPI = (query, page = 1, size = 5) => {
    // 模拟延迟
    const delay = Math.random() * 500 + 200
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const allResults = []
        
        // 根据查询关键词过滤模拟数据
        Object.keys(mockSearchResults).forEach(type => {
          mockSearchResults[type].forEach(item => {
            if (item.title.includes(query) || item.excerpt.includes(query)) {
              allResults.push(item)
            }
          })
        })
        
        // 模拟分页
        const start = (page - 1) * size
        const end = start + size
        const paginatedResults = allResults.slice(start, end)
        
        resolve({
          data: paginatedResults,
          total: allResults.length
        })
      }, delay)
    })
  }