// useKnowledgeGraph.js
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { apiClient } from '@/api'
import * as d3 from 'd3'
import { useGlobalLoading } from './GlobalLoader.vue'

// Context menu state
const contextMenuState = reactive({
  visible: false,
  position: { x: 0, y: 0 },
})

export default function useKnowledgeGraph(endpoint) {
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
      .on('zoom', (event) => {
        currentZoomLevel = event.transform.k
        svg.selectAll('g').attr('transform', event.transform)
        updateVisibilityBasedOnZoom()
      })

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

    link = svg.append('g').selectAll('line')
    node = svg.append('g').selectAll('circle')
    labels = svg.append('g').attr('class', 'labels').selectAll('text')

    await fetchData()

    // 设置初始缩放和平移
    const initialTransform = d3.zoomIdentity
      .translate(-width.value / 4, -height.value / 4)
      .scale(1.5)
    svg.call(zoom.transform, initialTransform)

    hideLoading()
  }

  // 更新图数据
  const updateD3Graph = (nodes, links) => {
    // 根据链接数计算每个节点的 degree
    nodes.forEach((node) => {
      node.degree = links.reduce((acc, link) => {
        if (link.source === node.id || link.target === node.id) {
          return acc + 1
        }
        return acc
      }, 0)

      // 根据节点信息动态分配颜色
      node.color = assignNodeColor(node)
      const baseColor = d3.color(node.color)
      if (baseColor) {
        node.strokeColor = baseColor.darker(0.8).toString()
        console.log('nodeColor:', node.color, 'baseColor:', baseColor.toString(), 'strokeColor:', node.strokeColor)
      } else {
        node.strokeColor = '#000'
      }
    })

    // 更新链接（假设 link.source 和 link.target 为节点 ID）
    link = link
      .data(links, (d) => d.id)
      .join('path')
      .attr('stroke-width', (d) => {
        const sourceNode = nodes.find(n => n.id === d.source)
        const targetNode = nodes.find(n => n.id === d.target)
        if (sourceNode && targetNode && targetNode.tagLevel === 'Field') {
          return 2.5 / currentZoomLevel ** 0.5
        } else if (sourceNode && targetNode && targetNode.tagLevel === 'Topic') {
          return 2.3 / currentZoomLevel ** 0.5
        } else {
          return 2 / currentZoomLevel ** 0.5
        }
      })
      .attr('stroke', (d) => {
        const sourceNode = nodes.find(n => n.id === d.source)
        const targetNode = nodes.find(n => n.id === d.target)
        if (!sourceNode || !targetNode) return linkColor
        const sourceColor = d3.rgb(sourceNode.color || linkColor)
        const targetColor = d3.rgb(targetNode.color || linkColor)
        const midColor = d3.rgb(
          (sourceColor.r + targetColor.r) / 2,
          (sourceColor.g + targetColor.g) / 2,
          (sourceColor.b + targetColor.b) / 2
        )
        return midColor.toString()
      })
      .attr('fill', 'none')
      .attr('stroke-opacity', linkOpacity)

    // 更新节点
    node = node
      .data(nodes, (d) => d.id)
      .join('circle')
      .attr('stroke', d => d.strokeColor)
      .attr('stroke-width', strokeWidth)
      .attr('r', (d) => {
        const degree = isNaN(d.degree) ? 0 : d.degree
        if (d.tagLevel === 'Subject') {
          return 12 + degree * 0.5
        } else if (d.tagLevel === 'Field') {
          return 8 + degree * 0.4
        } else if (d.tagLevel === 'Topic') {
          return 5 + degree * 0.2
        } else {
          return 4 + degree * 0.2
        }
      })
      .attr('fill', d => d.color)
      .call(drag(simulation))
      .on('click', (event, d) => {
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
            if (isSelected) {
              store.commit('removeSelectedNode', d)
            } else {
              store.commit('addSelectedNode', d)
            }
          } else {
            store.commit('setSelectedNodes', d)
          }
        } else {
          store.commit('setSelectedNodes', d)
        }
      })

    // 更新标签（文本）
    labels = labels
      .data(nodes, (d) => d.id)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')

    // 鼠标悬停时显示节点名称
    node.on('mouseover', function (event, d) {
      labels.filter(l => l.id === d.id).text(l => l.name)
    })

    simulation.nodes(nodes).on('tick', ticked)
    simulation.force('link').links(links)
    simulation.alpha(1).restart()

    updateVisibilityBasedOnZoom()
  }

  // 根据缩放级别更新节点、标签及链接的显示
  const updateVisibilityBasedOnZoom = () => {
    // 阈值设置
    const fieldThreshold = 0.2
    const topicThreshold = 0.5
    const keywordThreshold = 1.2
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
      } else if (currentZoomLevel <= topicLabelThreshold && !['Subject','Field'].includes(d.tagLevel)) {
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
        return ['Subject','Field'].includes(d.target.tagLevel) ? 'visible' : 'hidden'
      } else if (currentZoomLevel <= keywordThreshold) {
        return ['Subject','Field','Topic'].includes(d.target.tagLevel) ? 'visible' : 'hidden'
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
    if (d.tagLevel === 'TheoriesAndConcept') return '#4DB9E6'
    if (d.tagLevel === 'ModelsAndSystems') return '#597E52'
    if (d.tagLevel === 'MethodsAndProcesses') return '#F06292'
    if (d.tagLevel === 'PhenomenaAndEvents') return '#5C469C'
    if (d.tagLevel === 'ArtefactsAndTechnologies') return '#8C564B'
    if (d.tagLevel === 'FiguresAndInstitutions') return '#C6A969'
    if (d.tagLevel === 'PublicationsAndStandards') return '#BCBD22'
    if (d.tagLevel === 'LawsEthicsAndPrinciples') return '#AEC6CF'
    if (d.tagLevel === 'DataMetricsAndAlgorithms') return '#E377C2'
    if (d.tagLevel === 'PracticesFrameworkAndParadigms') return '#FFDD44'
    if (d.tagLevel === 'QuestionsAndProblems') return '#FFB347'
    if (d.tagLevel === 'LanguagesAndCultures') return '#FF33CC'
    else if (d.tagLevel === 'Keyword') return '#ccc'
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

  // 获取数据并更新图
  const fetchData = async () => {
    try {
      const response = await apiClient.get(endpoint)
      const backendData = response.data

      // 构造节点
      const newNodes = backendData.data.nodes.map(node => ({
        id: node.id,
        name: node.name,
        description: node.description,
        resources: node.resources || [],
        tagLevel: node.tagLevel || '',
        createdDate: node.createdDate,
        updatedDate: node.updatedDate
      }));

      // 构造链接（新 API 中 link 对象包含 source 和 target 为节点 ID）
      const newLinks = backendData.data.links.map(link => ({
        source: link.source,
        target: link.target,
        relationshipType: link.relation
      }));

      // 如果存在 data_pending，则处理待处理数据（格式请根据实际情况调整）
      if (backendData.data_pending && backendData.data_pending.length > 0) {
        backendData.data_pending.forEach((item) => {
          if (!newNodes.some(n => n.id === item.identity)) {
            newNodes.push({
              id: item.node.identity,
              name: item.node.properties.name,
              description: item.node.properties.description,
              resources: item.node.resources,
              tagLevel: item.node.tagLevel || '',
            });
          }
          if (item.relationship && item.relationship.type !== 'LINKS_TO') {
            newLinks.push({
              id: item.relationship.identity,
              source: item.relationship.start,  // assume these are node IDs
              target: item.relationship.end,
              relationshipType: item.relationship.type,
            });
          }
        });
      }

      links.value = newLinks
      nodes.value = newNodes
      updateD3Graph(newNodes, newLinks)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
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

  onMounted(() => {
    resizeObserver = new ResizeObserver(resizeSvg)
    const container = svgRef.value?.closest('.knowledgegraph-container')
    if (container) resizeObserver.observe(container)
    createForceDirectedGraph()
    if (selectedNodes.value.length > 0) {
      highlightSelectedNodes(selectedNodes.value)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)
  })

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
    document.removeEventListener('fullscreenchange', handleFullScreenChange)
  })

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
      link.style('opacity', d =>
        favoritedNodeIds.has(d.source.id) && favoritedNodeIds.has(d.target.id) ? 1 : 0.1)
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
