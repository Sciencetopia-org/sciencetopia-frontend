// useKnowledgeGraph.js
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { apiClient } from '@/api'
import * as d3 from 'd3'
import { useGlobalLoading } from './GlobalLoader.vue'

export default function useKnowledgeGraph(endpoint) {
  // Context menu state
  const contextMenuState = reactive({
    visible: false,
    position: { x: 0, y: 0 },
  })

  const links = ref([]) // Reactive reference for links
  const nodes = ref([]) // Reactive reference for nodes
  const store = useStore()
  const svgRef = ref(null)
  const isFullScreen = ref(false)
  let link, node, svg, labels, zoom, simulation
  const selectedNodes = computed(() => store.state.selectedNodes)
  let currentZoomLevel = 1
  // let lastZoomLevel = 1; // 或者根据你的需求赋予一个默认值
  // let lastParentIds = [];  // 初始化为空数组，或你想要的值

  const strokeWidth = 1 // Default stroke width for nodes
  const linkColor = '#000' // Default link color
  const linkOpacity = 0.5 // Default link opacity
  const labelFillColor = '#000' // Default label fill color
  const labelStrokeColor = '#fff' // Default label stroke color
  const highlightColor = '#00ffff' // Highlight color for selected nodes
  const highlightStrokeWidth = 4 // Highlight stroke width for selected nodes

  const fieldThreshold = 0.2
  const topicThreshold = 0.5
  const keywordThreshold = 1.2

  // Reactive width and height
  const width = ref(0)
  const height = ref(0)

  const { showLoading, hideLoading } = useGlobalLoading()
  const isEditing = computed(() => store.state.isEditing)

  let resizeObserver

  // 根据全屏或容器尺寸更新 SVG 尺寸
  const resizeSvg = (entries) => {
    for (let entry of entries) {
      if (isFullScreen.value) {
        width.value = window.innerWidth
        height.value = window.innerHeight
      } else {
        width.value = entry.contentRect.width
        height.value = entry.contentRect.height
      }
      if (svg) {
        svg.attr('width', width.value).attr('height', height.value)
        simulation
          .force('center', d3.forceCenter(width.value / 2, height.value / 2))
          .alpha(1)
          .restart()
      }
    }
  }

  // D3 drag behavior
  const drag = (simulation) => {
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }
    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }

  // 创建力导向图
  const createForceDirectedGraph = async () => {
    showLoading()

    zoom = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', handleZoom)

    svg = d3.select(svgRef.value)
      .append('svg')
      .attr('width', width.value)
      .attr('height', height.value)
      .call(zoom)
      .on('contextmenu', handleSvgRightClick)

    simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => d.id).strength(1))
      .force('charge', d3.forceManyBody().strength((d) => -50 - (d.degree || 0) * 10))
      .force('center', d3.forceCenter(width.value / 2, height.value / 2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())

    link = svg.append('g').selectAll('path')
    node = svg.append('g').selectAll('circle')
    labels = svg.append('g').attr('class', 'labels').selectAll('text')

    await fetchData()
    console.log('Graph data fetched:', nodes.value, links.value)

    // 设置初始缩放和平移
    const initialTransform = d3.zoomIdentity
      .translate(-width.value / 4, -height.value / 4)
      .scale(1.5)
    svg.call(zoom.transform, initialTransform)

    hideLoading()
  }

  // 更新图数据
  const updateD3Graph = (allNodes, allLinks) => {
    // —— O(N+M) 计算度数（兼容 link.source/target 为 id 或对象）——
    const deg = new Map()
    for (const e of allLinks) {
      const s = typeof e.source === 'object' ? e.source.id : e.source
      const t = typeof e.target === 'object' ? e.target.id : e.target
      if (!s || !t) continue
      deg.set(s, (deg.get(s) || 0) + 1)
      deg.set(t, (deg.get(t) || 0) + 1)
    }

    // id->node 索引，少用 .find
    const id2node = new Map(allNodes.map(n => [n.id, n]))

    // 节点底色/描边 & 度数
    for (const n of allNodes) {
      n.degree = deg.get(n.id) || 0
      if (!n.color) n.color = assignNodeColor(n)
      const baseColor = d3.color(n.color)
      n.strokeColor = baseColor ? baseColor.darker(0.8).toString() : '#000'
    }

    // —— 链接 join：用稳定 key（source-target-type）——
    link = link
      .data(allLinks, d => {
        const s = typeof d.source === 'object' ? d.source.id : d.source
        const t = typeof d.target === 'object' ? d.target.id : d.target
        const rel = d.relationshipType || d.relation || d.type || ''
        return `${s}-${t}-${rel}`
      })
      .join('path')
      .attr('fill', 'none')
      .attr('stroke-opacity', linkOpacity)
      .attr('stroke', d => {
        const s = id2node.get(typeof d.source === 'object' ? d.source.id : d.source)
        const t = id2node.get(typeof d.target === 'object' ? d.target.id : d.target)
        if (!s || !t) return '#000'
        const sc = d3.rgb(s.color || '#000'), tc = d3.rgb(t.color || '#000')
        return d3.rgb((sc.r + tc.r) / 2, (sc.g + tc.g) / 2, (sc.b + tc.b) / 2).toString()
      })
      .attr('stroke-width', d => {
        const t = id2node.get(typeof d.target === 'object' ? d.target.id : d.target)
        if (!t) return 2 / Math.sqrt(currentZoomLevel)
        if (t.tagLevel === 'Field') return 2.5 / Math.sqrt(currentZoomLevel)
        if (t.tagLevel === 'Topic') return 2.3 / Math.sqrt(currentZoomLevel)
        return 2 / Math.sqrt(currentZoomLevel)
      })

    // —— 节点 join —— 
    node = node
      .data(allNodes, d => d.id)
      .join('circle')
      .attr('stroke', d => d.strokeColor)
      .attr('stroke-width', strokeWidth)
      .attr('r', d => {
        const degree = isNaN(d.degree) ? 0 : d.degree
        if (d.tagLevel === 'Subject') return 12 + degree * 0.5
        if (d.tagLevel === 'Field') return 8 + degree * 0.4
        if (d.tagLevel === 'Topic') return 5 + degree * 0.2
        return 4 + degree * 0.2
      })
      .attr('fill', d => d.color)
      .call(drag(simulation))
      .on('click', (event, d) => {
        // —— 保留你的点击逻辑不变 —— 
        if (store.state.isEditing) {
          if (store.state.displayNodeCreationForm) {
            if (confirm('确定离开创建节点页面？创建的节点将不会被保存！')) {
              store.dispatch('toggleNodeCreationForm', false)
              store.commit('setSelectedNodes', d)
            }
          } else if (store.state.displayLinkCreationForm) {
            if (confirm('确定离开创建关系页面？创建的关系将不会被保存！')) {
              store.dispatch('toggleLinkCreationForm', false)
              store.commit('setSelectedNodes', d)
            }
          } else if (event.shiftKey) {
            const isSelected = store.state.selectedNodes.some(n => n.id === d.id)
            if (isSelected) store.commit('removeSelectedNode', d)
            else store.commit('addSelectedNode', d)
          } else {
            store.commit('setSelectedNodes', d)
          }
        } else {
          store.commit('setSelectedNodes', d)
        }
      })

    // —— 标签 join —— 
    labels = labels
      .data(allNodes, d => d.id)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    node.on('mouseover', function (event, d) {
      labels.filter(l => l.id === d.id).text(l => l.name)
    })

    // —— 轻唤醒力导向（避免 alpha(1) 重启）——
    simulation.nodes(allNodes).on('tick', ticked)
    simulation.force('link').links(allLinks)
    simulation.alphaTarget(1).restart()
    setTimeout(() => simulation.alphaTarget(0), 500)

    updateVisibilityBasedOnZoom()
  }

  // // 获取当前视图内所有节点的 ID
  // const getParentIdsInView = () => {
  //   console.log('getParentIdsInView called, nodes:', nodes.value)
  //   return nodes.value.map(node => node.id)
  // }

  // // —— 无序数组相等（把 parentIds 当集合比较）——
  // function arraysEqualUnordered(a, b) {
  //   if (a === b) return true
  //   if (!Array.isArray(a) || !Array.isArray(b)) return false
  //   if (a.length !== b.length) return false
  //   const freq = new Map()
  //   for (const x of a) freq.set(x, (freq.get(x) || 0) + 1)
  //   for (const y of b) {
  //     const c = freq.get(y)
  //     if (!c) return false
  //     c === 1 ? freq.delete(y) : freq.set(y, c - 1)
  //   }
  //   return freq.size === 0
  // }

  // // —— 连续缩放比例 k 映射到离散层级 ——
  // // 按你之前的判断顺序：k 小→Subject→Field→Topic→Keyword
  // function levelOf(k, keywordThreshold, topicThreshold, fieldThreshold) {
  //   if (k <= fieldThreshold) return 'Subject'
  //   if (k <= topicThreshold) return 'Field'
  //   if (k <= keywordThreshold) return 'Topic'
  //   return 'Keyword'
  // }

  // // —— 记忆上次触发的层级与父节点 —— 
  // let lastLevelName = null
  // let lastParentIds = null

  // // 你原来的 handleZoom（JS 版）
  // const handleZoom = (event) => {
  //   currentZoomLevel = event.transform.k
  //   svg.selectAll('g').attr('transform', event.transform)
  //   updateVisibilityBasedOnZoom()

  //   const levelName = levelOf(currentZoomLevel, keywordThreshold, topicThreshold, fieldThreshold)

  //   // 获取视图内所有节点并去重
  //   const currentParentIdsRaw = getParentIdsInView()
  //   const currentParentIds = Array.from(new Set(currentParentIdsRaw || []))

  //   console.log('currentParentIds:', currentParentIds, 'levelName:', levelName)

  //   // 视图为空则短路（与你的后端“空传空返”一致）
  //   if (currentParentIds.length === 0) {
  //     lastLevelName = levelName
  //     lastParentIds = []
  //     return
  //   }

  //   const levelChanged = levelName !== lastLevelName
  //   const idsChanged = !arraysEqualUnordered(currentParentIds, lastParentIds || [])

  //   // 规则：层级变 AND parentIds 变 才懒加载
  //   if (levelChanged && idsChanged) {
  //     fetchLazyLoadData(currentParentIds, levelName)
  //     lastLevelName = levelName
  //     lastParentIds = currentParentIds.slice() // 快照
  //   }
  // }

  const handleZoom = (event) => {
    currentZoomLevel = event.transform.k
    svg.selectAll('g').attr('transform', event.transform)
    updateVisibilityBasedOnZoom()

    // onViewportChanged()
  }

  // 根据缩放级别更新节点、标签及链接的显示
  const updateVisibilityBasedOnZoom = () => {
    // 阈值设置
    const fieldLabelThreshold = 0.6
    const topicLabelThreshold = 1.5
    const keywordLabelThreshold = 3.5

    node.style('visibility', d => {
      if (d.tagLevel === 'Subject') return 'visible'
      else if (currentZoomLevel > fieldThreshold && d.tagLevel === 'Field') return 'visible'
      else if (currentZoomLevel > topicThreshold && d.tagLevel === 'Topic') return 'visible'
      return currentZoomLevel > keywordThreshold ? 'visible' : 'hidden'
    })
      .on('mouseout', function (event, d) {
        // 随缩放隐藏部分节点名称
        if (currentZoomLevel <= fieldLabelThreshold && d.tagLevel !== 'Subject') {
          labels.filter(l => l.id === d.id).text('')
        } else if (currentZoomLevel <= topicLabelThreshold && !['Subject', 'Field'].includes(d.tagLevel)) {
          labels.filter(l => l.id === d.id).text('')
        } else if (currentZoomLevel <= keywordLabelThreshold && d.tagLevel === 'Topic') {
          labels.filter(l => l.id === d.id).text('')
        }
      })

    labels
      .style('font-size', 16 / currentZoomLevel)
      .style('font-family', 'Arial')
      .style('fill', labelFillColor)
      .style('font-weight', 'bold')
      .style('stroke', labelStrokeColor)
      .style('stroke-width', 0.5 / currentZoomLevel)
      .text(d => {
        if (d.tagLevel === 'Subject') return d.name
        else if (currentZoomLevel > fieldLabelThreshold && d.tagLevel === 'Field') return d.name
        else if (currentZoomLevel > topicLabelThreshold && d.tagLevel === 'Topic') return d.name
        return currentZoomLevel > keywordLabelThreshold ? d.name : ''
      })
      .attr('alignment-baseline', 'ideographic')
      .attr('dy', d => (d.tagLevel === 'Subject' || d.tagLevel === 'Field' || d.tagLevel === 'Topic') ? 0 : '-1.2em')

    link.style('visibility', d => {
      // 注意：此处由于 simulation 会将 link.source 和 link.target 替换为节点对象，
      // 因此这里判断可以继续使用 d.source.id，但部分其它地方（例如在过滤函数中）需要使用 nodes.value
      if (!d.source || !d.target) return 'hidden'
      // 这里简单根据 zoom 级别调整链接显示，可按需调整
      if (currentZoomLevel <= fieldThreshold) {
        return d.target.tagLevel === 'Subject' ? 'visible' : 'hidden'
      } else if (currentZoomLevel <= topicThreshold) {
        return ['Subject', 'Field'].includes(d.target.tagLevel) ? 'visible' : 'hidden'
      } else if (currentZoomLevel <= keywordThreshold) {
        return ['Subject', 'Field', 'Topic'].includes(d.target.tagLevel) ? 'visible' : 'hidden'
      } else {
        return 'visible'
      }
    })
  }

  // 分配节点颜色，改为根据 d.tagLevel 判断
  const assignNodeColor = (d) => {
    if (d.tagLevel === 'Subject') return '#AA1B1D'
    if (d.tagLevel === 'Field') return '#E75A2A'
    if (d.tagLevel === 'Topic') return '#DFCBA4'
    else if (d.tagLevel === 'Keyword') return '#f4eee1'
    return '#ccc'
  }

  const ticked = () => {
    link.attr('d', (d) => {
      const dx = d.target.x - d.source.x
      const dy = d.target.y - d.source.y
      const dr = Math.sqrt(dx * dx + dy * dy)
      const xMidpoint = (d.source.x + d.target.x) / 2
      const yMidpoint = (d.source.y + d.target.y) / 2
      const xCenter = width.value / 2
      const blendFactor = (xMidpoint - xCenter) / (width.value / 2)
      const smoothFactor = Math.tanh(blendFactor)
      const curvatureIntensity = dr * 0.25
      const yOffset = smoothFactor * curvatureIntensity
      const cx = xMidpoint
      const cy = yMidpoint + yOffset
      return `M ${d.source.x},${d.source.y} Q ${cx},${cy} ${d.target.x},${d.target.y}`
    });
    node.attr('cx', d => d.x).attr('cy', d => d.y)
    labels.attr('x', d => d.x).attr('y', d => d.y)
  }

  // 获取数据并更新图（兼容两种返回体，并种子去重缓存）
  // 获取数据并更新图（兼容 {nodes,links} 与 {data:{nodes,links}}，并把初始数据写入去重缓存）
  const fetchData = async () => {
    try {
      const res = await apiClient.get(endpoint)
      const body = (res && 'data' in res) ? res.data : res
      const payload = body?.data ? body.data : body

      const newNodes = (payload?.nodes || []).map(n => ({
        id: n.id,
        name: n.name,
        tagLevel: n.tagLevel || '',
      }))

      const newLinks = (payload?.links || [])
        .map(normalizeEdge)
        .filter(l => l.source && l.target)

      // 种子写入去重缓存（避免后台懒加载重复合入）
      newNodes.forEach(n => loadedNodeIds.add(n.id))
      newLinks.forEach(l => loadedEdgeKeys.add(edgeKey(l)))

      nodes.value = newNodes
      links.value = newLinks
      updateD3Graph(nodes.value, links.value)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // ====== 配置 ======
  const LEVELS = ['Subject', 'Field', 'Topic', 'Keyword']
  const TARGET_LEVEL = 'Keyword'      // 预热到的最深层
  const MAX_CONCURRENCY = 2           // 同时跑几条请求
  const BATCH_SIZE = 25               // 每批带多少 parentId，避免一次太大

  // // ===== 增量渲染队列，避免每批都全量重绘 =====
  // const RENDER_BATCH = 180   // 每帧最多合入多少条（可按机器调 120~300）
  // let renderScheduled = false
  // const pendingRender = { nodes: [], links: [] }

  // function enqueueRender(newNodes = [], newLinks = []) {
  //   if (Array.isArray(newNodes) && newNodes.length) pendingRender.nodes.push(...newNodes)
  //   if (Array.isArray(newLinks) && newLinks.length) pendingRender.links.push(...newLinks)
  //   if (!renderScheduled) {
  //     renderScheduled = true
  //     requestAnimationFrame(flushRender)
  //   }
  // }

  // function flushRender() {
  //   renderScheduled = false

  //   // 1) 一小批增量
  //   const takeNodes = pendingRender.nodes.splice(0, RENDER_BATCH)
  //   const takeLinksRaw = pendingRender.links.splice(0, RENDER_BATCH)

  //   // 2) 先合并节点
  //   if (takeNodes.length) nodes.value.push(...takeNodes)

  //   // 3) 只合并端点都已存在的链接；孤儿边回队列重试
  //   const knownIds = new Set(nodes.value.map(n => n.id))
  //   const readyLinks = []
  //   const orphanLinks = []
  //   for (const e of takeLinksRaw) {
  //     const s = typeof e.source === 'object' ? e.source?.id : e.source
  //     const t = typeof e.target === 'object' ? e.target?.id : e.target
  //     if (s && t && knownIds.has(s) && knownIds.has(t)) readyLinks.push(e)
  //     else orphanLinks.push(e)
  //   }
  //   if (readyLinks.length) links.value.push(...readyLinks)
  //   if (orphanLinks.length) pendingRender.links.unshift(...orphanLinks) // 下一帧优先

  //   // 4) 新到某层 → 立即为“下一层”排任务（链式预热）
  //   if (takeNodes.length) {
  //     const byLevel = takeNodes.reduce((acc, n) => {
  //       (acc[n.tagLevel] ||= []).push(n.id)
  //       return acc
  //     }, {})
  //       ; (['Subject', 'Field', 'Topic'].forEach(L => {
  //         const next = NEXT_OF[L]
  //         const parents = byLevel[L] || []
  //         if (next && parents.length) addPreloadTask(next, parents)
  //       }))
  //   }

  //   // 5) 一帧一次全量 join
  //   updateD3Graph(nodes.value, links.value)

  //   // 6) 队列未空 → 下一帧继续
  //   if (pendingRender.nodes.length || pendingRender.links.length) {
  //     renderScheduled = true
  //     requestAnimationFrame(flushRender)
  //   }
  // }

  // ===== 批渲染队列（保证一批的节点和边同帧进入）=====
  const RENDER_BUNDLES_PER_FRAME = 1  // 每帧吃几批；1 最稳，2 更快
  const pendingBundles = []           // 队列元素：{nodes, links}
  let renderScheduled = false

  function enqueueBundle(nodesBatch = [], linksBatch = []) {
    // 过滤空批
    if ((!nodesBatch || !nodesBatch.length) && (!linksBatch || !linksBatch.length)) return
    pendingBundles.push({ nodes: nodesBatch, links: linksBatch })
    if (!renderScheduled) {
      renderScheduled = true
      requestAnimationFrame(flushBundles)
    }
  }

  function flushBundles() {
    renderScheduled = false
    let count = 0
    while (count < RENDER_BUNDLES_PER_FRAME && pendingBundles.length) {
      const { nodes: nb, links: lb } = pendingBundles.shift()
      // 先把本批节点并入
      if (nb?.length) nodes.value.push(...nb)

      // 现在 knownIds 包含“老节点 + 本批新节点”，本批边基本不会“找不到端点”
      if (lb?.length) links.value.push(...lb)

      // 全量 join（频率已被限制成“按批”）
      updateD3Graph(nodes.value, links.value)
      count++
    }
    if (pendingBundles.length) {
      renderScheduled = true
      requestAnimationFrame(flushBundles)
    }
  }


  // ====== 已有缓存 ======
  const loadedNodeIds = new Set()
  const loadedEdgeKeys = new Set()
  const loadedChildrenByParent = {
    Subject: new Set(), Field: new Set(), Topic: new Set(), Keyword: new Set()
  }
  // —— 父子层级映射 ——（用来确定“下一层”与“合法父层”）
  const NEXT_OF = { Subject: 'Field', Field: 'Topic', Topic: 'Keyword' }
  // 新增：允许的父层集合（可按需扩展）
  const ALLOWED_PARENTS = {
    Field: new Set(['Subject']),
    Topic: new Set(['Subject', 'Field']),
    Keyword: new Set(['Subject', 'Field', 'Topic']),   // ✅ 允许 Field 直接出发 Keyword
  }

  // —— 正在加载中的父节点（防止同父并发重复）——
  const loadingChildrenByParent = {
    Subject: new Set(), Field: new Set(), Topic: new Set(), Keyword: new Set()
  }

  // —— 统一规范化边 —— 
  function normalizeEdge(e) {
    const s = typeof e.source === 'object' ? e.source?.id : e.source
    const t = typeof e.target === 'object' ? e.target?.id : e.target
    const rel = e.relation || e.relationshipType || e.type || ''
    return { source: s, target: t, relationshipType: rel }
  }

  // —— 统一边 Key（与 D3 join key 保持一致最好）——
  function edgeKey(e) {
    const s = typeof e.source === 'object' ? e.source?.id : e.source
    const t = typeof e.target === 'object' ? e.target?.id : e.target
    const rel = e.relationshipType || e.relation || e.type || ''
    return `${s}~${t}~${rel}`
  }

  // ====== 工具 ======
  function arraysEqualUnordered(a, b) {
    if (a === b) return true
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    const freq = new Map()
    for (const x of a) freq.set(x, (freq.get(x) || 0) + 1)
    for (const y of b) {
      const c = freq.get(y); if (!c) return false
      c === 1 ? freq.delete(y) : freq.set(y, c - 1)
    }
    return freq.size === 0
  }
  const chunk = (arr, n) => {
    const out = []
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
    return out
  }
  // const computeSig = (ids) => (ids || []).slice().sort().join(',')

  // ====== 预加载队列/控制 ======
  const preloadQueue = []
  let running = 0
  let currentGen = 0
  let currentSig = null
  const inflight = new Map()   // key: `${gen}|${sig}|${level}|${batchIndex}` -> AbortController

  // // 你已有：根据当前缩放 k 算层级名
  // function levelOf(k, keywordThreshold, topicThreshold, fieldThreshold) {
  //   if (k <= fieldThreshold) return 'Subject'
  //   if (k <= topicThreshold) return 'Field'
  //   if (k <= keywordThreshold) return 'Topic'
  //   return 'Keyword'
  // }

  // 取消所有在飞请求，并回滚 loading 标记
  function abortAllInflight() {
    inflight.forEach(meta => {
      try { meta.controller?.abort() } catch { }
      if (meta?.parents && meta?.level) {
        meta.parents.forEach(pid => loadingChildrenByParent[meta.level].delete(pid))
      }
    })
    inflight.clear()
  }

  function addPreloadTask(level, parentIds) {
    if (!level || !Array.isArray(parentIds) || parentIds.length === 0) return
    preloadQueue.push({ gen: currentGen, sig: currentSig, level, parentIds })
    pump()
  }

  // // —— 外部会调用：开始/更新预加载（在挂载后或视图改变后调用）——
  // function startPreloadingFor(parentIds, fromLevelName) {
  //   // 先取消/回滚旧代，避免旧请求回流 & 重复加载
  //   abortAllInflight()

  //   const sig = computeSig(parentIds)
  //   currentSig = sig
  //   const gen = ++currentGen

  //   preloadQueue.length = 0

  //   const startIdx = Math.max(0, LEVELS.indexOf(fromLevelName))
  //   const targetIdx = LEVELS.indexOf(TARGET_LEVEL)

  //   for (let i = startIdx + 1; i <= targetIdx; i++) {
  //     const level = LEVELS[i]
  //     preloadQueue.push({ gen, sig, level, parentIds })
  //   }
  //   pump()
  //   console.log('Preload started:', { gen, sig, fromLevelName, parentIds, queueLength: preloadQueue.length })
  // }

  // —— 队列执行器（并发控制）——
  function pump() {
    console.log('Pump called, running:', running, 'queue:', preloadQueue)
    while (running < MAX_CONCURRENCY && preloadQueue.length) {
      const task = preloadQueue.shift()
      runTask(task)
    }
  }

  // function seedPositionsForNewNodes(incNodes, normLinks) {
  //   if (!incNodes.length) return
  //   const byIdNew = new Map(incNodes.map(n => [n.id, n]))
  //   const pos = new Map(nodes.value.map(n => [n.id, { x: n.x ?? (width.value / 2), y: n.y ?? (height.value / 2) }]))
  //   const siblingIdx = new Map()  // parentId -> 已分配序号

  //   function placeNear(n, parentId, baseRadius) {
  //     if (n.x != null && n.y != null) return
  //     const parentPos = pos.get(parentId)
  //     if (!parentPos) return
  //     const i = (siblingIdx.get(parentId) || 0) + 1
  //     siblingIdx.set(parentId, i)
  //     const ringSize = 12
  //     const ring = Math.floor((i - 1) / ringSize)
  //     const angle = ((i - 1) % ringSize) * (2 * Math.PI / ringSize)
  //     const r = (baseRadius || 36) + ring * 14
  //     n.x = parentPos.x + r * Math.cos(angle)
  //     n.y = parentPos.y + r * Math.sin(angle)
  //   }

  //   // 只用“本批次边”里与老节点相连的关系来布点
  //   for (const e of normLinks) {
  //     const s = idOf(e.source), t = idOf(e.target)
  //     const sNew = byIdNew.get(s), tNew = byIdNew.get(t)
  //     const sOld = pos.has(s), tOld = pos.has(t)
  //     const baseR = n => (n?.tagLevel === 'Keyword' ? 30 : 50)

  //     if (sNew && tOld) placeNear(sNew, t, baseR(sNew))
  //     if (tNew && sOld) placeNear(tNew, s, baseR(tNew))
  //   }
  // }

  // —— 用“本次 parent 批次”的几何中心给新节点就近布点 ——
  // parentsBatch: 本次 runTask 的 parentIds（来自上层）
  // level: 本次加载的层级（Field/Topic/Keyword）
  function seedPositionsNearParents(incNodes, parentsBatch, level) {
    if (!incNodes?.length) return
    const id2node = new Map(nodes.value.map(n => [n.id, n]))

    // 找到有坐标的父节点位置；没有的话退回到画布中心
    const parentPos = parentsBatch
      .map(pid => id2node.get(pid))
      .filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))
    const cx = parentPos.length
      ? parentPos.reduce((a, p) => a + p.x, 0) / parentPos.length
      : (width.value / 2)
    const cy = parentPos.length
      ? parentPos.reduce((a, p) => a + p.y, 0) / parentPos.length
      : (height.value / 2)

    // 不同层级不同“簇半径”
    const baseR = level === 'Keyword' ? 26 : level === 'Topic' ? 36 : 48
    const ringSize = 10
    let i = 0

    for (const n of incNodes) {
      if (Number.isFinite(n.x) && Number.isFinite(n.y)) continue
      const ring = Math.floor(i / ringSize)
      const angle = (i % ringSize) * (2 * Math.PI / ringSize)
      const r = baseR + ring * 12
      n.x = cx + r * Math.cos(angle)
      n.y = cy + r * Math.sin(angle)
      // 临时“钉住”，避免刚加入就被远处力场拉走
      n.fx = n.x; n.fy = n.y
      i++
    }

    // 200~350ms 后释放，让它们在父节点附近微调到位
    setTimeout(() => {
      for (const n of incNodes) { if (n.fx != null) { n.fx = null; n.fy = null } }
    }, level === 'Keyword' ? 260 : 200)
  }

  async function runTask(task) {
    running++
    const { gen, sig, level } = task
    if (gen !== currentGen || sig !== currentSig) { running--; pump(); return }

    const uniqueParents = Array.from(new Set(task.parentIds || []))

    // 允许集合中的任意父层
    const id2level = new Map(nodes.value.map(n => [n.id, n.tagLevel]))
    const allowed = ALLOWED_PARENTS[level] || null
    const validParents = allowed
      ? uniqueParents.filter(id => allowed.has(id2level.get(id)))
      : uniqueParents.slice()

    // 避开：已加载 + 正在加载
    const toQuery = validParents.filter(id =>
      !loadedChildrenByParent[level].has(id) &&
      !loadingChildrenByParent[level].has(id)
    )
    if (!toQuery.length) { running--; pump(); return }

    const batches = chunk(toQuery, BATCH_SIZE)

    try {
      for (let b = 0; b < batches.length; b++) {
        if (gen !== currentGen || sig !== currentSig) break

        const parentsBatch = batches[b]
        parentsBatch.forEach(pid => loadingChildrenByParent[level].add(pid))

        const key = `${gen}|${sig}|${level}|${b}`
        if (inflight.has(key)) { inflight.get(key).controller?.abort(); inflight.delete(key) }

        const controller = new AbortController()
        inflight.set(key, { controller, level, parents: parentsBatch })

        showLoaderWithDelay(level)
        addSkeletonChildrenFor(level)

        try {
          const res = await apiClient.post(
            '/knowledgegraph/lazyload',
            { parentIds: parentsBatch, zoomLevel: level },
            { signal: controller.signal }
          )
          const body = (res && 'data' in res) ? res.data : res
          const respNodes = Array.isArray(body?.nodes) ? body.nodes : []
          const respLinks = Array.isArray(body?.links) ? body.links : []

          if (gen !== currentGen || sig !== currentSig) break

          // 节点去重（全局）
          const incNodes = respNodes.filter(n => n && n.id && !loadedNodeIds.has(n.id))
          incNodes.forEach(n => loadedNodeIds.add(n.id))

          // 边规范化 + 去重（全局）
          const normalized = respLinks.map(normalizeEdge).filter(l => l.source && l.target)
          const incLinks = normalized.filter(l => {
            const k = edgeKey(l)
            if (loadedEdgeKeys.has(k)) return false
            loadedEdgeKeys.add(k)
            return true
          })

          // 设置 Keyword/Topic 新节点的初始位置在父附近
          seedPositionsNearParents(incNodes, normalized)

          // 交给增量渲染队列（避免每批全量重绘）
          enqueueBundle(incNodes, incLinks)

          // 成功后：把“正在加载”→“已加载”
          parentsBatch.forEach(pid => {
            loadingChildrenByParent[level].delete(pid)
            loadedChildrenByParent[level].add(pid)
          })

        } catch (e) {
          if (e?.name !== 'AbortError' && e?.name !== 'CanceledError') {
            console.warn('preload error:', e)
          }
        } finally {
          parentsBatch.forEach(pid => loadingChildrenByParent[level].delete(pid))
          inflight.delete(key)
          hideLoaderNow()
          removeSkeletonChildrenFor(level)
        }
      }
    } finally {
      running--
      pump()
    }
  }

  // ====== 这些是可选的 UI 钩子（留空也行，按需实现）======
  let loaderTimer = null
  function showLoaderWithDelay() { clearTimeout(loaderTimer); loaderTimer = setTimeout(() => {/* 显示HUD */ }, 180) }
  function hideLoaderNow() { clearTimeout(loaderTimer); /* 隐藏HUD */ }
  function addSkeletonChildrenFor(level) { /* 在父节点附近画骨架 */ }
  function removeSkeletonChildrenFor(level) { /* 移除骨架 */ }

  // ====== 供外部调用的帮助函数 ======
  function resetPreloadCaches() {
    loadedNodeIds.clear()
    loadedEdgeKeys.clear()
    Object.keys(loadedChildrenByParent).forEach(k => loadedChildrenByParent[k].clear())
    preloadQueue.length = 0
    running = 0
    currentGen++
    currentSig = null
    inflight.forEach(c => c.abort())
    inflight.clear()
  }

  // // 懒加载数据函数
  // const fetchLazyLoadData = async (parentIds = [], zoomLevel = 'Field') => {
  //   try {
  //     const response = await apiClient.post('/knowledgegraph/lazyload', {
  //       parentIds,
  //       zoomLevel
  //     })
  //     const backendData = response.data

  //     const newNodes = backendData.nodes.map(node => ({
  //       id: node.id,
  //       name: node.name,
  //       tagLevel: node.tagLevel || '',
  //     }))
  //     const newLinks = backendData.links.map(link => ({
  //       source: link.source,
  //       target: link.target,
  //       relationshipType: link.relation
  //     }))

  //     nodes.value = [...nodes.value, ...newNodes]
  //     links.value = [...links.value, ...newLinks]
  //     updateD3Graph(newNodes, newLinks)
  //   } catch (error) {
  //     console.error('Error fetching lazy load data:', error)
  //   }
  // }

  // 更新选中节点的高亮样式
  function highlightSelectedNodes(selectedNodes) {
    if (node && node.style) {
      node.style('stroke', d => d.strokeColor)
        .style('stroke-width', strokeWidth)
      node.filter(d => selectedNodes.some(n => n.id === d.id))
        .style('stroke', highlightColor)
        .style('stroke-width', highlightStrokeWidth / currentZoomLevel ** 0.5)
      node.raise()
    } else {
      console.error('Node selection is undefined.')
    }
  }

  // // 视图发生“实质改变”（例如平移到新区域、或 parent 集合变化明显）时，重启预热
  // function onViewportChanged() {
  //   const parents = Array.from(new Set(getParentIdsInView() || []))
  //   const sig = computeSig(parents)
  //   if (sig !== currentSig) {
  //     const fromLevelName = levelOf(currentZoomLevel, keywordThreshold, topicThreshold, fieldThreshold)
  //     startPreloadingFor(parents, fromLevelName)
  //   }
  // }

  // 后台从当前数据出发，按层级链式预热到最底层
  function startFullBackgroundPreload() {
    const byLevel = nodes.value.reduce((acc, n) => {
      (acc[n.tagLevel] ||= []).push(n.id)
      return acc
    }, {})

    // Subject 现有 → 直接排 Field / Topic / Keyword
    if (byLevel.Subject?.length) {
      addPreloadTask('Field', byLevel.Subject)
      addPreloadTask('Topic', byLevel.Subject)
      addPreloadTask('Keyword', byLevel.Subject)   // ✅
    }
    // Field 现有 → 直接排 Topic / Keyword
    if (byLevel.Field?.length) {
      addPreloadTask('Topic', byLevel.Field)
      addPreloadTask('Keyword', byLevel.Field)     // ✅
    }
    // Topic 现有 → 排 Keyword
    if (byLevel.Topic?.length) {
      addPreloadTask('Keyword', byLevel.Topic)
    }
  }

  // Watch selectedNodes 的变化
  watch(() => selectedNodes.value, (newNodes) => {
    highlightSelectedNodes(newNodes)
  }, { deep: true, immediate: true })

  onMounted(async () => {
    resizeObserver = new ResizeObserver(resizeSvg)
    const container = svgRef.value?.closest('.knowledgegraph-container')
    if (container) resizeObserver.observe(container)
    await createForceDirectedGraph()
    if (selectedNodes.value.length > 0) {
      highlightSelectedNodes(selectedNodes.value)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)

    // ✅ 不再依赖缩放/视图，直接后台链式加载
    startFullBackgroundPreload()
  })

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
    document.removeEventListener('fullscreenchange', handleFullScreenChange)
    abortAllInflight()
  })

  const idOf = v => (typeof v === 'object' && v) ? v.id : v

  // 修改后的获取相邻、先决和后续节点（链接对象中 source 和 target 为节点 ID）
  const getAdjacentNodes = (nodeId) => {
    return links.value
      .filter(link => link.source === nodeId || link.target === nodeId)
      .map(link => link.source === nodeId ? link.target : link.source)
  }

  const getPrerequisiteNodes = (nodeId) => {
    return links.value
      .filter(link => link.target === nodeId)
      .map(link => link.source)
  }

  const getSubsequentNodes = (nodeId) => {
    return links.value
      .filter(link => link.source === nodeId)
      .map(link => link.target)
  }

  const showAdjacentNodes = () => {
    const adjacentNodeIds = selectedNodes.value.flatMap(node =>
      getAdjacentNodes(node.id)
    );
    const uniqueAdjacentNodeIds = [...new Set(adjacentNodeIds)];
    node.style('opacity', d => uniqueAdjacentNodeIds.includes(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniqueAdjacentNodeIds.includes(d.id) ? 1 : 0.1);
    link.style('opacity', d => (uniqueAdjacentNodeIds.includes(d.source.id) ||
      uniqueAdjacentNodeIds.includes(d.target.id)) ? 1 : 0.1);
  }

  const showPrerequisiteNodes = () => {
    const prerequisiteNodeIds = selectedNodes.value.flatMap(node =>
      getPrerequisiteNodes(node.id)
    );
    const uniquePrerequisiteNodeIds = [...new Set(prerequisiteNodeIds)];
    node.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.id) ? 1 : 0.1);
    link.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.source.id) ? 1 : 0.1);
  }

  const showSubsequentNodes = () => {
    const subsequentNodeIds = selectedNodes.value.flatMap(node =>
      getSubsequentNodes(node.id)
    );
    const uniqueSubsequentNodeIds = [...new Set(subsequentNodeIds)];
    node.style('opacity', d => uniqueSubsequentNodeIds.includes(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniqueSubsequentNodeIds.includes(d.id) ? 1 : 0.1);
    link.style('opacity', d => uniqueSubsequentNodeIds.includes(d.target.id) ? 1 : 0.1);
  }

  const resetView = () => {
    node.style('opacity', 1)
    labels.style('opacity', 1)
    link.style('opacity', 1)
    const resetTransform = d3.zoomIdentity
    svg.transition().duration(750).call(zoom.transform, resetTransform)
    store.commit('resetSelectedNodes')
  }

  const highlightAndCenterNode = (nodeId, svgElement) => {
    if (!svgElement) {
      console.error('SVG Element not found')
      return
    }
    const containerWidth = svgElement.clientWidth
    const containerHeight = svgElement.clientHeight
    const zoomLevel = 1 // 可根据需求调整
    const transitionDuration = 750
    const nodeData = node.data().find(n => n.id === nodeId)
    if (!nodeData) {
      console.error('Node not found:', nodeId)
      return
    }
    if (!zoom) {
      console.error('zoom behavior is not defined')
      return
    }
    const targetX = containerWidth / 2 - nodeData.x * zoomLevel
    const targetY = containerHeight / 2 - nodeData.y * zoomLevel
    const transform = d3.zoomIdentity.translate(targetX, targetY).scale(zoomLevel)
    svg.transition().duration(transitionDuration).call(zoom.transform, transform)
    store.commit('setSelectedNodes', nodeData)
  }

  async function searchNode(searchQuery) {
    if (!searchQuery.trim()) return null
    try {
      const response = await apiClient.get('/KnowledgeGraph/Search', { params: { query: searchQuery } })
      return response.data.identity
    } catch (error) {
      console.error('Error during search:', error)
      return null
    }
  }

  const showContextMenu = (x, y) => {
    contextMenuState.position = { x, y }
    contextMenuState.visible = true
  }

  const hideContextMenu = () => {
    contextMenuState.visible = false
  }

  const handleSvgRightClick = (event) => {
    event.preventDefault()
    if (!isEditing.value) return
    const [x, y] = d3.pointer(event)
    if (isEditing.value) {
      showContextMenu(x, y)
    }
  }

  const showFavoritedNodes = async () => {
    try {
      const response = await apiClient.get('/KnowledgeGraph/Favorites/MyFavorites')
      const favoriteData = response.data
      const favoritedNodeIds = new Set(favoriteData.map(node => node.identity))
      node.style('opacity', d => favoritedNodeIds.has(d.id) ? 1 : 0.1)
      labels.style('opacity', d => favoritedNodeIds.has(d.id) ? 1 : 0.1)
      llink.style('opacity', d =>
        favoritedNodeIds.has(idOf(d.source)) && favoritedNodeIds.has(idOf(d.target)) ? 1 : 0.1
      )
    } catch (error) {
      console.error('Error fetching favorite nodes:', error)
    }
  }

  const toggleFullScreen = () => {
    if (!svgRef.value) return
    if (!document.fullscreenElement) {
      svgRef.value.requestFullscreen().then(() => {
        isFullScreen.value = true
        resizeSvg([{ contentRect: { width: window.innerWidth, height: window.innerHeight } }])
        svg.style('background-color', 'white')
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen().then(() => {
        isFullScreen.value = false
        const container = svgRef.value?.parentElement
        if (container) resizeSvg([{ contentRect: container.getBoundingClientRect() }])
        svg.style('background-color', null)
      }).catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message}`)
      })
    }
  }

  const handleFullScreenChange = () => {
    isFullScreen.value = !!document.fullscreenElement
    if (!isFullScreen.value) {
      const container = svgRef.value?.parentElement
      if (container) resizeSvg([{ contentRect: container.getBoundingClientRect() }])
      svg.style('background-color', null)
    }
  }

  return {
    svgRef,
    selectedNodes,
    fetchData,
    showAdjacentNodes,
    showPrerequisiteNodes,
    showSubsequentNodes,
    resetView,
    highlightAndCenterNode,
    searchNode,
    width,
    height,
    toggleFullScreen,
    isFullScreen,
    isEditing,
    contextMenuState,
    hideContextMenu,
    showContextMenu,
    showFavoritedNodes,
  }
}
