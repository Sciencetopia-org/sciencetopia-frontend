// useKnowledgeGraph.js
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { apiClient } from '@/api'
import * as d3 from 'd3'
import { useGlobalLoading } from '@/components/ui/GlobalLoader.vue'
import { useNodeDetailsCache } from '@/composables/useNodeDetailsCache'

export default function useKnowledgeGraph(endpoint) {
  // 用于单/双击判定
  const lastClick = { id: null, t: 0 }
  const DOUBLE_CLICK_MS = 280   // 双击判定窗口
  const { getNodeDetail } = useNodeDetailsCache()
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

  const fieldLabelThreshold = 0.6
  const topicLabelThreshold = 1.5
  const keywordLabelThreshold = 3.5

  const ALWAYS_VISIBLE_LEVELS = new Set(['Discipline', 'Subject'])

  const canonicalId = (id) => {
    if (id === null || id === undefined) return null
    return typeof id === 'string' ? id : String(id)
  }

  function normalizeNode(raw) {
    if (!raw) return null
    const id = canonicalId(raw.id)
    if (!id) return null
    return {
      ...raw,
      id,
      tagLevel: raw.tagLevel || '',
    }
  }

  function shouldDisplayNode(level, zoom) {
    if (ALWAYS_VISIBLE_LEVELS.has(level)) return true
    if (level === 'Field') return zoom > fieldThreshold
    if (level === 'Topic') return zoom > topicThreshold
    return zoom > keywordThreshold
  }

  function shouldDisplayLabel(level, zoom) {
    if (ALWAYS_VISIBLE_LEVELS.has(level)) return true
    if (level === 'Field') return zoom > fieldLabelThreshold
    if (level === 'Topic') return zoom > topicLabelThreshold
    return zoom > keywordLabelThreshold
  }

  function updateLabelForNodeDatum(nodeDatum) {
    if (!labels) return
    labels
      .filter(l => l.id === nodeDatum.id)
      .text(l => (shouldDisplayLabel(l.tagLevel, currentZoomLevel) ? l.name : ''))
  }

  function getNodeDatum(nodeOrId) {
    if (!nodeOrId) return null
    if (typeof nodeOrId === 'object') return nodeOrId
    const canon = canonicalId(nodeOrId)
    return canon ? nodeById.get(canon) || null : null
  }

  // Reactive width and height
  const width = ref(0)
  const height = ref(0)

  const { showLoading, hideLoading } = useGlobalLoading()
  const hideLoadingSoon = () => requestAnimationFrame(() => hideLoading())
  const beginLoading = () => showLoading()
  const endLoading = () => hideLoadingSoon()
  const isEditing = computed(() => store.state.isEditing)

  // 省略号层 & 激活中的省略号集合
  let dotsLayer
  const activeEllipses = new Map()   // parentId -> { g }
  let nodeById = new Map()           // id -> node（在 updateD3Graph 里维护）

  function radiusFor(n) {
    const degree = isNaN(n.degree) ? 0 : n.degree
    if (n.tagLevel === 'Discipline') return 16 + degree * 0.6
    if (n.tagLevel === 'Subject') return 12 + degree * 0.5
    if (n.tagLevel === 'Field') return 8 + degree * 0.4
    if (n.tagLevel === 'Topic') return 5 + degree * 0.2
    return 4 + degree * 0.2
  }

  // 在父节点上方画省略号（…）
  function showEllipsisForParent(parentNode) {
    // if (!parentNode || !parentNode.id) return
    // removeEllipsisForParent(parentNode.id)

    const g = dotsLayer.append('g')
      .attr('class', 'kg-ellipsis')         // 用于动画的 CSS 类
      .attr('data-parent-id', parentNode.id)

    const spacing = 8   // 点与点的水平间距
    const r = 2.6       // 小点半径
    const cx = [-spacing, 0, spacing]

    g.selectAll('circle')
      .data([0, 1, 2])
      .enter()
      .append('circle')
      .attr('class', 'kg-ellipsis-dot')
      .attr('r', r)
      .attr('cx', (i) => cx[i])
      .attr('cy', 0)
      .attr('fill', '#bdbdbd')
      .style('opacity', 0.9)
      // 通过延迟制造“逐个跳动”的感觉
      .style('animation-delay', (i) => `${i * 0.15}s`)

    activeEllipses.set(parentNode.id, { g })
    // 放到正确位置
    updateSingleEllipsisPosition(parentNode.id)
  }

  function removeEllipsisForParent(parentId) {
    const entry = activeEllipses.get(parentId)
    if (entry) { entry.g.remove(); activeEllipses.delete(parentId) }
  }

  function updateSingleEllipsisPosition(parentId) {
    const entry = activeEllipses.get(parentId)
    const p = nodeById.get(parentId)
    if (!entry || !p) return
    const offset = radiusFor(p) + 14        // 在节点上方一点
    entry.g.attr('transform', `translate(${p.x}, ${p.y - offset})`)
  }

  // 每一帧把所有省略号挪到父节点的当前位置
  function updateAllEllipsisPositions() {
    activeEllipses.forEach((_, pid) => updateSingleEllipsisPosition(pid))
  }

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
    let startX, startY, moved

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y

      startX = event.x
      startY = event.y
      moved = false

      // // 拖拽开始就取消悬停定时，避免误触发加载
      // cancelHoverLazyLoad(d)
    }
    function dragged(event, d) {
      d.fx = event.x
      d.fy = event.y

      // 移动超过阈值时标记为拖拽
      if (Math.abs(event.x - startX) > 3 || Math.abs(event.y - startY) > 3) {
        moved = true
      }
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null

      if (!moved) {
        const now = Date.now()
        if (lastClick.id === d.id && (now - lastClick.t) < DOUBLE_CLICK_MS) {
          // —— 识别为双击 —— 
          lastClick.id = null
          // 双击只做展开，不触发单击逻辑
          if (!isEditing.value) {
            expandNodeChildren(d)        // 走你的懒加载
          }
        } else {
          // —— 单击 —— 
          lastClick.id = d.id
          lastClick.t = now
          handleNodeClick(event, d)
        }
      }
    }
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }

  // 创建力导向图
  const createForceDirectedGraph = async () => {
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

    // 省略号层：放在 labels 之上更醒目（如需在文字下方，可插到 labels 之前）
    dotsLayer = svg.append('g').attr('class', 'kg-ellipsis-layer')
  }

  // Reload graph on language change
  async function handleLangChanged(e) {
    try {
      // 先清空在飞与缓存，再清空图，最后显示 Loader 并重新获取
      abortAllInflight()
      resetPreloadCaches()
      nodes.value = []
      links.value = []
      updateD3Graph(nodes.value, links.value)
      showLoading()
      await fetchData()
      updateD3Graph(nodes.value, links.value)
    } catch (err) {
      console.error('Error reloading graph on lang change:', err)
    } finally {
      hideLoading()
    }
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
    nodeById = id2node

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
        if (d.tagLevel === 'Discipline') return 16 + degree * 0.6
        if (d.tagLevel === 'Subject') return 12 + degree * 0.5
        if (d.tagLevel === 'Field') return 8 + degree * 0.4
        if (d.tagLevel === 'Topic') return 5 + degree * 0.2
        return 4 + degree * 0.2
      })
      .attr('fill', d => d.color)
      .call(drag(simulation))
      .on('mouseover', (event, d) => {
        // 显示标签（你原有的行为）
        labels.filter(l => l.id === d.id).text(l => l.name)
        // 鼠标变成手指
        d3.select(event.currentTarget).style('cursor', 'pointer')
        // // 👉 开始计时：1s 后按 tagLevel 推断下一层并懒加载
        // scheduleHoverLazyLoad(d)
        setTimeout(() => { getNodeDetail(d.id, { revalidate: false }).catch(() => { }) }, 300)
      })
      .on('mouseout', (event, d) => {
        // 变回鼠标
        d3.select(event.currentTarget).style('cursor', 'default')
        // 恢复缩放级别对应的标签默认显示状态
        updateLabelForNodeDatum(d)
        // // 退出悬停：取消定时器
        // cancelHoverLazyLoad(d)
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation()  // prevent zoom or other handlers from firing
        if (!isEditing.value) {
          expandNodeChildren(d)   // Load children of this node’s next level
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

    // —— 轻唤醒力导向（避免 alpha(1) 重启）——
    simulation.nodes(allNodes).on('tick', ticked)
    simulation.force('link').links(allLinks)
    simulation.alphaTarget(1).restart()
    setTimeout(() => simulation.alphaTarget(0), 500)

    updateVisibilityBasedOnZoom()
  }

  const handleZoom = (event) => {
    currentZoomLevel = event.transform.k
    svg.selectAll('g').attr('transform', event.transform)
    updateVisibilityBasedOnZoom()
  }

  // 根据缩放级别更新节点、标签及链接的显示
  const updateVisibilityBasedOnZoom = () => {
    node
      .style('visibility', d => shouldDisplayNode(d.tagLevel, currentZoomLevel) ? 'visible' : 'hidden')

    labels
      .style('font-size', 16 / currentZoomLevel)
      .style('font-family', 'Arial')
      .style('fill', labelFillColor)
      .style('font-weight', 'bold')
      .style('stroke', labelStrokeColor)
      .style('stroke-width', 0.5 / currentZoomLevel)
      .text(d => (shouldDisplayLabel(d.tagLevel, currentZoomLevel) ? d.name : ''))
      .attr('alignment-baseline', 'ideographic')
      .attr('dy', d => (d.tagLevel === 'Discipline' || d.tagLevel === 'Subject' || d.tagLevel === 'Field' || d.tagLevel === 'Topic') ? 0 : '-1.2em')

    link.style('visibility', d => {
      if (!d.source || !d.target) return 'hidden'
      const source = getNodeDatum(d.source)
      const target = getNodeDatum(d.target)
      if (!source || !target) return 'hidden'
      const sourceVisible = shouldDisplayNode(source.tagLevel, currentZoomLevel)
      const targetVisible = shouldDisplayNode(target.tagLevel, currentZoomLevel)
      return sourceVisible && targetVisible ? 'visible' : 'hidden'
    })
  }

  // 分配节点颜色，改为根据 d.tagLevel 判断
  const assignNodeColor = (d) => {
    if (d.tagLevel === 'Discipline') return '#6D0E10'
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

    updateAllEllipsisPositions()
  }

  // 获取数据并更新图（兼容两种返回体，并种子去重缓存）
  // 获取数据并更新图（兼容 {nodes,links} 与 {data:{nodes,links}}，并把初始数据写入去重缓存）
  const fetchData = async () => {
    showLoading()
    try {
      const res = await apiClient.get(endpoint)
      const body = (res && 'data' in res) ? res.data : res
      const payload = body?.data ? body.data : body

      const newNodes = (payload?.nodes || [])
        .map(normalizeNode)
        .filter(Boolean)

      const newLinks = (payload?.links || [])
        .map(normalizeEdge)
        .filter(l => l.source && l.target)

      // 种子写入去重缓存（避免后台懒加载重复合入）
      resetLoadedCaches()
      newNodes.forEach(n => loadedNodeIds.add(n.id))
      newLinks.forEach(l => loadedEdgeKeys.add(edgeKey(l)))

      nodes.value = newNodes
      links.value = newLinks
      updateD3Graph(nodes.value, links.value)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      hideLoadingSoon()
    }
  }

  const loadGraphData = (payload) => {
    showLoading()
    try {
      const newNodes = (payload?.nodes || [])
        .map(normalizeNode)
        .filter(Boolean)

      const newLinks = (payload?.links || [])
        .map(normalizeEdge)
        .filter(l => l.source && l.target)

      resetLoadedCaches()
      newNodes.forEach(n => loadedNodeIds.add(n.id))
      newLinks.forEach(l => loadedEdgeKeys.add(edgeKey(l)))

      nodes.value = newNodes
      links.value = newLinks
      updateD3Graph(nodes.value, links.value)
    } finally {
      hideLoadingSoon()
    }
  }

  let clickTimeout = null

  async function handleNodeClick(event, d) {
    // 如果已经有 clickTimeout，说明可能是双击 → 延迟取消
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      clickTimeout = null
      return
    }

    // —— 保留你的点击逻辑不变 —— 
    if (store.state.isEditing) {
      if (store.state.displayNodeCreationForm) {
        const { default: i18n } = await import('@/i18n.js')
        if (confirm(i18n.global.t('knowledgeGraph.confirmNodeCancel'))) {
          store.dispatch('toggleNodeCreationForm', false)
          store.commit('setSelectedNodes', d)
          // 点击后（你原来的选中逻辑之后）：
          getNodeDetail(d.id, { revalidate: true }).catch(() => { })
        }
      } else if (store.state.displayLinkCreationForm) {
        const { default: i18n } = await import('@/i18n.js')
        if (confirm(i18n.global.t('knowledgeGraph.confirmLinkCancel'))) {
          store.dispatch('toggleLinkCreationForm', false)
          store.commit('setSelectedNodes', d)
          // 点击后（你原来的选中逻辑之后）：
          getNodeDetail(d.id, { revalidate: true }).catch(() => { })
        }
      } else if (event.shiftKey) {
        const isSelected = store.state.selectedNodes.some(n => n.id === d.id)
        if (isSelected) store.commit('removeSelectedNode', d)
        else store.commit('addSelectedNode', d)
        // 点击后（你原来的选中逻辑之后）：
        getNodeDetail(d.id, { revalidate: true }).catch(() => { })
      } else {
        store.commit('setSelectedNodes', d)
        // 点击后（你原来的选中逻辑之后）：
        getNodeDetail(d.id, { revalidate: true }).catch(() => { })
      }
    } else {
      store.commit('setSelectedNodes', d)
      // 点击后（你原来的选中逻辑之后）：
      getNodeDetail(d.id, { revalidate: true }).catch(() => { })
    }
    // // 点击也取消悬停（用户已明确操作）
    // cancelHoverLazyLoad(d)
  }

  // —— 悬停→1s 后懒加载 ——
  // 每个节点一个定时器；鼠标移出/拖拽/点击会取消
  const hoverTimers = new Map()

  function getNextLevelOf(node) {
    if (!node || !node.tagLevel) return null
    return NEXT_OF[node.tagLevel] || null   // 复用你已有的 NEXT_OF：Subject→Field→Topic→Keyword
  }

  function scheduleHoverLazyLoad(nodeDatum) {
    const id = nodeDatum?.id
    if (!id) return
    // 已有计时则重置
    cancelHoverLazyLoad(nodeDatum)

    const nextLevel = getNextLevelOf(nodeDatum)
    if (!nextLevel) return // Keyword 已是最深层

    hoverTimers.set(id, setTimeout(() => {
      // 严格复用你的懒加载队列，享受并发/批处理/去重保护
      addPreloadTask(nextLevel, [id])
      hoverTimers.delete(id)
    }, 1000)) // 1 秒阈值
  }

  function cancelHoverLazyLoad(nodeDatum) {
    const id = nodeDatum?.id
    if (!id) return
    const t = hoverTimers.get(id)
    if (t) {
      clearTimeout(t)
      hoverTimers.delete(id)
    }
  }

  // Determine and load the children of the given node’s next level
  const expandNodeChildren = (nodeData) => {
    if (!nodeData || !nodeData.tagLevel) return
    const nextLevel = NEXT_OF[nodeData.tagLevel]  // deduce next level based on tagLevel
    if (!nextLevel) return  // no deeper level (e.g., node is already Keyword)

    // 双击：在该父节点上方显示动态省略号
    showEllipsisForParent(nodeData)

    // Use the lazy-load queue to fetch children of this node at the next level
    addPreloadTask(nextLevel, [nodeData.id])

    // 兜底清理（避免极端情况下残留）
    setTimeout(() => removeEllipsisForParent(nodeData.id), 60000)
  }

  // ====== 配置 ======
  const LEVELS = ['Discipline', 'Subject', 'Field', 'Topic', 'Keyword']
  const TARGET_LEVEL = 'Keyword'      // 预热到的最深层
  const MAX_CONCURRENCY = 2           // 同时跑几条请求
  const BATCH_SIZE = 25               // 每批带多少 parentId，避免一次太大

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
    Discipline: new Set(), Subject: new Set(), Field: new Set(), Topic: new Set(), Keyword: new Set()
  }
  // —— 父子层级映射 ——（用来确定“下一层”与“合法父层”）
  const NEXT_OF = { Discipline: 'Subject', Subject: 'Field', Field: 'Topic', Topic: 'Keyword' }
  // 新增：允许的父层集合（可按需扩展）
  const ALLOWED_PARENTS = {
    Subject: new Set(['Discipline']),
    Field: new Set(['Subject']),
    Topic: new Set(['Subject', 'Field']),
    Keyword: new Set(['Subject', 'Field', 'Topic']),   // ✅ 允许 Field 直接出发 Keyword
  }

  // —— 正在加载中的父节点（防止同父并发重复）——
  const loadingChildrenByParent = {
    Discipline: new Set(), Subject: new Set(), Field: new Set(), Topic: new Set(), Keyword: new Set()
  }

  function resetLoadedCaches() {
    loadedNodeIds.clear()
    loadedEdgeKeys.clear()
    Object.keys(loadedChildrenByParent).forEach(level => loadedChildrenByParent[level].clear())
    Object.keys(loadingChildrenByParent).forEach(level => loadingChildrenByParent[level].clear())
  }

  // —— 统一规范化边 —— 
  function normalizeEdge(e) {
    const s = canonicalId(typeof e.source === 'object' ? e.source?.id : e.source)
    const t = canonicalId(typeof e.target === 'object' ? e.target?.id : e.target)
    const rel = e.relation || e.relationshipType || e.type || ''
    return { source: s, target: t, relationshipType: rel }
  }

  // —— 统一边 Key（与 D3 join key 保持一致最好）——
  function edgeKey(e) {
    const s = canonicalId(typeof e.source === 'object' ? e.source?.id : e.source)
    const t = canonicalId(typeof e.target === 'object' ? e.target?.id : e.target)
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

  // ====== 预加载队列/控制 ======
  const preloadQueue = []
  let running = 0
  let currentGen = 0
  let currentSig = null
  const inflight = new Map()   // key: `${gen}|${sig}|${level}|${batchIndex}` -> AbortController

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
    const canonParents = parentIds
      .map(canonicalId)
      .filter(Boolean)
    if (!canonParents.length) return
    preloadQueue.push({ gen: currentGen, sig: currentSig, level, parentIds: canonParents })
    pump()
  }

  // —— 队列执行器（并发控制）——
  function pump() {
    console.log('Pump called, running:', running, 'queue:', preloadQueue)
    while (running < MAX_CONCURRENCY && preloadQueue.length) {
      const task = preloadQueue.shift()
      runTask(task)
    }
  }

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

    const uniqueParents = Array.from(new Set((task.parentIds || []).map(canonicalId).filter(Boolean)))

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
          const incNodes = respNodes
            .map(normalizeNode)
            .filter(n => n && n.id && !loadedNodeIds.has(n.id))
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
          seedPositionsNearParents(incNodes, parentsBatch, level)

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
          // 完成/失败都移除省略号
          parentsBatch.forEach(pid => removeEllipsisForParent(pid))
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
    try { window.addEventListener('app:lang-changed', handleLangChanged) } catch (_) {}
  })

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
    document.removeEventListener('fullscreenchange', handleFullScreenChange)
    try { window.removeEventListener('app:lang-changed', handleLangChanged) } catch (_) {}
    abortAllInflight()
    // 清理所有悬停定时器
    hoverTimers.forEach(t => clearTimeout(t))
    hoverTimers.clear()
  })

  const idOf = (v) => canonicalId((typeof v === 'object' && v) ? v.id : v)

  // 修改后的获取相邻、先决和后续节点（链接对象中 source 和 target 为节点 ID）
  const getAdjacentNodes = (nodeId) => {
    const canon = canonicalId(nodeId)
    return links.value
      .filter(link => link.source === canon || link.target === canon)
      .map(link => link.source === canon ? link.target : link.source)
  }

  const getPrerequisiteNodes = (nodeId) => {
    const canon = canonicalId(nodeId)
    return links.value
      .filter(link => link.target === canon)
      .map(link => link.source)
  }

  const getSubsequentNodes = (nodeId) => {
    const canon = canonicalId(nodeId)
    return links.value
      .filter(link => link.source === canon)
      .map(link => link.target)
  }

  const showAdjacentNodes = () => {
    const adjacentNodeIds = selectedNodes.value.flatMap(node =>
      getAdjacentNodes(node.id)
    ).map(canonicalId);
    const uniqueAdjacentNodeIds = new Set(adjacentNodeIds);
    node.style('opacity', d => uniqueAdjacentNodeIds.has(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniqueAdjacentNodeIds.has(d.id) ? 1 : 0.1);
    link.style('opacity', d => (uniqueAdjacentNodeIds.has(idOf(d.source)) ||
      uniqueAdjacentNodeIds.has(idOf(d.target))) ? 1 : 0.1);
  }

  const showPrerequisiteNodes = () => {
    const prerequisiteNodeIds = selectedNodes.value.flatMap(node =>
      getPrerequisiteNodes(node.id)
    ).map(canonicalId);
    const uniquePrerequisiteNodeIds = new Set(prerequisiteNodeIds);
    node.style('opacity', d => uniquePrerequisiteNodeIds.has(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniquePrerequisiteNodeIds.has(d.id) ? 1 : 0.1);
    link.style('opacity', d => uniquePrerequisiteNodeIds.has(idOf(d.source)) ? 1 : 0.1);
  }

  const showSubsequentNodes = () => {
    const subsequentNodeIds = selectedNodes.value.flatMap(node =>
      getSubsequentNodes(node.id)
    ).map(canonicalId);
    const uniqueSubsequentNodeIds = new Set(subsequentNodeIds);
    node.style('opacity', d => uniqueSubsequentNodeIds.has(d.id) ? 1 : 0.1);
    labels.style('opacity', d => uniqueSubsequentNodeIds.has(d.id) ? 1 : 0.1);
    link.style('opacity', d => uniqueSubsequentNodeIds.has(idOf(d.target)) ? 1 : 0.1);
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
    const normalized = nodeId != null ? nodeId : null
    const nodeData = getNodeDatum(normalized)
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
      const payload = response?.data?.data ?? response?.data
      const candidates = Array.isArray(payload) ? payload : [payload]
      for (const item of candidates) {
        if (!item) continue
        const nodeLike = item.node || item.result || item
        const id = nodeLike?.identity ?? nodeLike?.id ?? nodeLike?.nodeId ?? item?.identity ?? item?.id ?? null
        if (id != null) return id
      }
      return null
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
    const userId = store.state.currentUserID || store.state.userInfo?.id
    if (!userId) {
      console.warn('Cannot load favorites: user is not authenticated')
      return
    }
    try {
      beginLoading()
      const response = await apiClient.get('/KnowledgeGraph/Favorites/MyFavorites')
      const favoriteData = Array.isArray(response?.data) ? response.data : []
      // Build id -> tagLevel map from server
      const idToLevel = new Map()
      favoriteData.forEach(item => {
        const id = canonicalId(item?.properties?.stableId ?? item?.properties?.id ?? item?.identity)
        const lvl = item?.tagLevel || null
        if (id) idToLevel.set(id, lvl)
      })
      const favoritedNodeIds = new Set(
        favoriteData
          .map(node =>
            canonicalId(
              node?.properties?.stableId ??
              node?.properties?.id ??
              node?.identity
            )
          )
          .filter(Boolean)
      )
      // Add any favorited nodes that are not yet in the current graph
      const missingIds = Array.from(favoritedNodeIds).filter(id => !nodeById.has(id))
      if (missingIds.length) {
        // Fetch minimal details for display names in parallel (best-effort)
        const fetchDetail = async (id) => {
          try {
            const res = await apiClient.get('/KnowledgeGraph/GetNodeDetails', { params: { nodeId: id } })
            const body = res?.data || {}
            return { id, name: body?.name || String(id) }
          } catch (_) {
            return { id, name: String(id) }
          }
        }
        const results = await Promise.allSettled(missingIds.map(fetchDetail))
        const incNodes = results
          .map((r, i) => {
            const fallbackId = canonicalId(missingIds[i])
            const v = r.status === 'fulfilled' ? r.value : { id: fallbackId, name: String(fallbackId) }
            const id = canonicalId(v.id)
            const level = idToLevel.get(id) || 'Field'
            return { id, name: v.name, tagLevel: level, degree: 0 }
          })
          .filter(n => n && n.id && !loadedNodeIds.has(n.id))

        // Track and render synchronously so styling applies immediately
        incNodes.forEach(n => loadedNodeIds.add(n.id))
        if (incNodes.length) {
          nodes.value = nodes.value.concat(incNodes)
          // Immediately update the D3 graph to create DOM elements for new nodes
          updateD3Graph(nodes.value, links.value)
        }
      }
      node
        .style('opacity', d => favoritedNodeIds.has(d.id) ? 1 : 0.1)
        .style('visibility', d => favoritedNodeIds.has(d.id) ? 'visible' : (shouldDisplayNode(d.tagLevel, currentZoomLevel) ? 'visible' : 'hidden'))
      labels
        .style('opacity', d => favoritedNodeIds.has(d.id) ? 1 : 0.1)
      // Force label text visible for favorited nodes
      labels
        .filter(d => favoritedNodeIds.has(d.id))
        .text(d => d.name)
      link.style('opacity', d =>
        favoritedNodeIds.has(idOf(d.source)) && favoritedNodeIds.has(idOf(d.target)) ? 1 : 0.1
      )
    } catch (error) {
      if (error?.response?.status === 400) {
        console.warn('Failed to load favorites (400 Bad Request)', error?.response?.data)
      } else {
        console.error('Error fetching favorite nodes:', error)
      }
    } finally {
      endLoading()
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
    loadGraphData,
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
    beginLoading,
    endLoading,
  }
}



