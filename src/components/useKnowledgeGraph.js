// useKnowledgeGraph.js
import { ref, computed, onMounted, reactive, watch } from 'vue';
// import useGraphEditMode from './useGraphEditMode';
import { useStore } from 'vuex';
import { apiClient } from '@/api';
import * as d3 from 'd3';
import { useGlobalLoading } from './GlobalLoader.vue';
// import { eventBus } from '../eventBus';

// Context menu state
const contextMenuState = reactive({
    visible: false,
    position: { x: 0, y: 0 },
});

export default function useKnowledgeGraph(endpoint) {
    const links = ref([]);  // Reactive reference for links
    const nodes = ref([]);  // Reactive reference for nodes
    const store = useStore();
    const svgRef = ref(null);
    let link, node, svg, labels, zoom, simulation;
    const selectedNodes = computed(() => store.state.selectedNodes);
    const width = 860;  // Example fixed width
    const height = 860; // Example fixed height
    let currentZoomLevel = 1;

    const { showLoading, hideLoading } = useGlobalLoading();

    // Directly use Vuex store to access and modify isEditing
    const isEditing = computed(() => store.state.isEditing);

    // D3 Drag behavior
    const drag = simulation => {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;

            // console.log("dragended is called, the current position is:(", event.x, ",", event.y, ")")
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    };

    // Function to create the force-directed graph
    const createForceDirectedGraph = async () => {
        showLoading(); // Show the loader
        
        zoom = d3.zoom()
            .scaleExtent([0.2, 4]) // Adjust these values as needed
            .on('zoom', (event) => {
                currentZoomLevel = event.transform.k; // Update current zoom level
                svg.selectAll('g').attr('transform', event.transform);
                updateVisibilityBasedOnZoom(); // Update visibility of nodes and labels
            });

        svg = d3.select(svgRef.value).append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(zoom)
            .on('contextmenu', handleSvgRightClick)
        // .on('click', handleNodeClick);

        simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX())
            .force("y", d3.forceY());

        link = svg.append('g')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .selectAll('line');

        node = svg.append('g')
            .selectAll('circle');

        labels = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")

        await fetchData(); // Fetch data from the backend

        hideLoading(); // Hide the global loading indicator
    };

    // Function to update the graph with fetched data
    const updateD3Graph = (nodes, links) => {
        // Compute degrees for each node based on connections with nodes of the same label
        nodes.forEach(node => {
            node.degree = links.reduce((acc, link) => {
                const source = nodes.find(n => n.id === link.source.id);
                const target = nodes.find(n => n.id === link.target.id);
                if (source && target) {
                    // Check if source and target have at least one common label
                    // const commonLabels = source.labels.filter(label => target.labels.includes(label));
                    if ((link.source.id === node.id || link.target.id === node.id)) {
                        return acc + 1;
                    }
                }
                return acc;
            }, 0);
        });

        // Update links
        link = link.data(links, d => d.id)
            .join('line')
            .attr('stroke-width', d => {
                const sourceNode = nodes.find(n => n.id === d.source.id);
                const targetNode = nodes.find(n => n.id === d.target.id);

                // Check if both connected nodes are topics
                if (sourceNode && targetNode && targetNode.labels.includes('Field')) {
                    return 2; // Thicker line for links between a Subject and a field
                } else if (sourceNode && targetNode && targetNode.labels.includes('Topic')) {
                    return 1.5; // Thicker line for links between a field and a topic or two topics
                } else {
                    return Math.sqrt(d.value || 1); // Normal width for other links
                }
            })
            .attr('stroke', d => {
                const sourceNode = nodes.find(n => n.id === d.source.id);
                const targetNode = nodes.find(n => n.id === d.target.id);

                // Determine color based on node label combinations
                if (sourceNode && targetNode) {
                    if (sourceNode.labels.includes('Subject') && targetNode.labels.includes('Field')) {
                        return '#c5282a'; // Red for links between a subject and a field
                    } else if (targetNode.labels.includes('Topic')) {
                        return '#d5282a'; // Red for links between two topics or a field and a topic
                    } else if ((sourceNode.labels.includes('Topic') && targetNode.labels.includes('Keyword')) ||
                        (sourceNode.labels.includes('Keyword') && targetNode.labels.includes('Topic'))) {
                        return '#999'; // Pink for links between a topic and a keyword
                    } else if ((sourceNode.labels.includes('Keyword') && targetNode.labels.includes('Tag')) ||
                        (sourceNode.labels.includes('Tag') && targetNode.labels.includes('Keyword'))) {
                        return '#00fff7'; // Green for links between a keyword and a tag
                    } else {
                        return '#999'; // Default color for other links
                    }
                } else {
                    return '#999'; // Default color if nodes are not found
                }
            })
            .attr('stroke-opacity', 0.6);

        // Update nodes with color based on labels
        node = node.data(nodes, d => d.id)
            .join('circle')
        // Update nodes
        node = node.data(nodes, d => d.id)
            .join('circle')
            .attr('r', d => {
                // Adjust node size
                return (d.labels.includes('Topic') || d.labels.includes('Field')) ? (10 + (isNaN(d.degree) ? 0 : d.degree)) * 0.8 : 5 + (isNaN(d.degree) ? 0 : d.degree) * 0.5;
            })
            .attr('fill', d => {
                if (d.labels.includes('pending_approval')) return '#848482';
                else {
                    if (d.labels.includes('Subject')) return '#c5282a';
                    if (d.labels.includes('Keyword')) return '#C6A969';
                    if (d.labels.includes('Topic')) return '#d5282a';
                    if (d.labels.includes('Field')) return '#c5282a';
                    if (d.labels.includes('People')) return '#597E52';
                    if (d.labels.includes('Works')) return '#4CB9E7';
                    if (d.labels.includes('Event')) return '#5C469C';
                    return '#ccc'; // Default color
                }
            })
            .call(drag(simulation))
            .on('click', (event, d) => {
                if (store.state.isEditing) {
                    if (store.state.displayNodeCreationForm) {
                        // 弹出确认对话框
                        if (confirm("确定离开创建节点页面？创建的节点将不会被保存！")) {
                            // 用户点击确认
                            store.dispatch('toggleNodeCreationForm', false);
                            store.commit('setSelectedNodes', d);
                        }
                    }
                    else if (store.state.displayLinkCreationForm) {
                        // 弹出确认对话框
                        if (confirm("确定离开创建关系页面？创建的关系将不会被保存！")) {
                            // 用户点击确认
                            store.dispatch('toggleLinkCreationForm', false);
                            store.commit('setSelectedNodes', d);
                        }
                    }
                    else if (event.shiftKey) {
                        // Check if the node is already selected
                        const isSelected = store.state.selectedNodes.includes(d);
                        if (isSelected) {
                            store.commit('removeSelectedNode', d);
                        } else {
                            store.commit('addSelectedNode', d);
                        }
                    } else {
                        // Reset selection to just this node
                        store.commit('setSelectedNodes', d);
                    }
                } else {
                    store.commit('setSelectedNodes', d);
                }
            });

        // Add labels to nodes
        labels = labels.data(nodes, d => d.id)
            .join("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .style('font-weight', 'bold')
            .style("fill", d => d.labels.includes('Topic') ? "#fff" : '#fff')
            .style("pointer-events", "none") // To prevent interference with node interactivity

        node.on('mouseover', function (event, d) {
            labels.filter(l => l === d).text(l => l.name); // Show name on hover
        });

        // node.on('mouseout', function (event, d) {
        //     labels.filter(l => l === d && !l.labels.includes('Topic')).text(''); // Hide name on mouseout, except for 'Topic' nodes
        // });

        // Restart the simulation with new data
        simulation.nodes(nodes).on('tick', ticked);
        simulation.force('link').links(links);
        simulation.alpha(1).restart();

        // Apply zoom level based visibility updates
        updateVisibilityBasedOnZoom();
    };

    const updateVisibilityBasedOnZoom = () => {
        // Define thresholds for zoom levels
        const fieldThreshold = 0.2;
        const topicThreshold = 0.5;
        const keywordThreshold = 0.9;
        const topicLabelThreshold = 0.7;
        const keywordLabelThreshold = 2;

        node
            .style('visibility', d => {
                if (d.labels.includes('Subject')) return 'visible';
                else if (currentZoomLevel > fieldThreshold && d.labels.includes('Field')) return 'visible';
                else if (currentZoomLevel > topicThreshold && d.labels.includes('Topic')) return 'visible';
                return currentZoomLevel > keywordThreshold ? 'visible' : 'hidden';
            })
            .on('mouseout', function (event, d) {
                if (currentZoomLevel <= topicLabelThreshold) labels.filter(l => l === d && !l.labels.includes('Subject')).text('') // Hide name on mouseout, except for 'Field' nodes
                else if (currentZoomLevel <= keywordLabelThreshold) labels.filter(l => l === d && (!l.labels.includes('Topic') && !l.labels.includes('Field') && !l.labels.includes('Subject'))).text('') // Hide name on mouseout, except for 'Field' and 'Topic' nodes
            });

        labels
            // .style('visibility', d => {
            //     if (d.labels.includes('Subject')) return 'visible';
            //     if (currentZoomLevel > topicLabelThreshold && d.labels.includes('Topic')) return 'visible';
            //     return currentZoomLevel > keywordLabelThreshold ? 'visible' : 'hidden';
            // })
            .style("font-size", 16 / currentZoomLevel)
            .style("stroke", d => {
                if (d.labels.includes('pending_approval')) return '#848482';
                else {
                    if (d.labels.includes('Subject')) return "#d5282a"
                    else if (currentZoomLevel > topicThreshold && d.labels.includes('Field')) return "#d5282a"
                    else if (currentZoomLevel > keywordThreshold && d.labels.includes('Topic')) return "#d5282a"
                    else return 'black'
                }
            })
            .style("stroke-width", d => {
                if (d.labels.includes('Subject')) return 1 / currentZoomLevel
                else if (currentZoomLevel > topicThreshold && d.labels.includes('Field')) return 1 / currentZoomLevel
                else if (currentZoomLevel > keywordThreshold && d.labels.includes('Topic')) return 1 / currentZoomLevel
                else return 0.5 / currentZoomLevel
            })// Adjust stroke width as needed
            .text(d => {
                if (d.labels.includes('Subject')) return d.name;
                else if (currentZoomLevel > fieldThreshold && d.labels.includes('Field')) return d.name;
                else if (currentZoomLevel > topicLabelThreshold && d.labels.includes('Topic')) return d.name;
                return currentZoomLevel > keywordLabelThreshold ? d.name : '';
            })
            .attr("alignment-baseline", d => {
                if (d.labels.includes('Subject')) return "middle"
                else if (currentZoomLevel > fieldThreshold && d.labels.includes('Field')) return "middle"
                else if (currentZoomLevel > keywordThreshold && d.labels.includes('Topic')) return "middle"
                else return "hanging"
            })
            .attr("dy", d => {
                if (d.labels.includes('Subject')) return 0
                else if (currentZoomLevel > fieldThreshold && d.labels.includes('Field')) return 0
                else if (currentZoomLevel > keywordThreshold && d.labels.includes('Topic')) return 0
                else return "-1.2em"
            }); // Adjust vertical position;


        link.style('visibility', d => {
            const sourceNode = nodes.value.find(n => n.id === d.source.id);
            const targetNode = nodes.value.find(n => n.id === d.target.id);
            if (!sourceNode || !targetNode) return 'hidden';

            if (currentZoomLevel <= fieldThreshold) {
                return (targetNode.labels.includes('Subject')) ? 'visible' : 'hidden';
            } else if (currentZoomLevel <= topicThreshold) {
                return (targetNode.labels.includes('Field')) ? 'visible' : 'hidden';
            } else if (currentZoomLevel <= keywordThreshold) {
                return targetNode.labels.includes('Topic') ? 'visible' : 'hidden';
            } else {
                return 'visible';
            }
        });
    };

    // Ticked function for updating node and link positions
    const ticked = () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        // Update label positions
        labels.attr('x', d => d.x)
            .attr('y', d => d.y); // Adjust label position above the node

    };

    // Fetch data from the backend
    const fetchData = async () => {
        try {
            const response = await apiClient.get(endpoint);
            const backendData = response.data;

            // Prepare nodes and links for D3
            const newNodes = [], newLinks = [];

            backendData.data.forEach(item => {
                // Process source nodes
                if (!newNodes.some(n => n.id === item.source.identity)) {
                    newNodes.push({
                        id: item.source.identity,
                        labels: item.source.labels,
                        name: item.source.properties.name,
                        // Removed the direct link property handling
                        description: item.source.properties.description,
                        resources: item.source.resources // Assuming resources are now passed as an array of links
                    });
                }

                // Process target nodes
                if (item.target && !newNodes.some(n => n.id === item.target.identity)) {
                    newNodes.push({
                        id: item.target.identity,
                        labels: item.target.labels,
                        name: item.target.properties.name,
                        // Removed the direct link property handling
                        description: item.target.properties.description,
                        resources: item.target.resources // Assuming resources are now passed as an array of links
                    });
                }

                // Process links
                if (item.relationship && item.relationship.type !== 'LINKS_TO') {
                    newLinks.push({
                        id: item.relationship.identity,
                        source: newNodes.find(n => n.id === item.relationship.start),
                        target: newNodes.find(n => n.id === item.relationship.end),
                        relationshipType: item.relationship.type
                    });
                }
            });

            if (backendData.data_pending && backendData.data_pending.length > 0) {
                backendData.data_pending.forEach(item => {
                    // Process all pending nodes
                    if (!newNodes.some(n => n.id === item.identity)) {
                        newNodes.push({
                            id: item.node.identity,
                            labels: item.node.labels,
                            name: item.node.properties.name,
                            // Removed the direct link property handling
                            description: item.node.properties.description,
                            resources: item.node.resources // Assuming resources are now passed as an array of links
                        });
                    }
                    // Process all pending links
                    if (item.relationship && item.relationship.type !== 'LINKS_TO') {
                        newLinks.push({
                            id: item.relationship.identity,
                            source: newNodes.find(n => n.id === item.relationship.start),
                            target: newNodes.find(n => n.id === item.relationship.end),
                            relationshipType: item.relationship.type
                        });
                    }
                });
            }

            links.value = newLinks; // Update the reactive reference
            nodes.value = newNodes;

            // Update D3 graph
            updateD3Graph(newNodes, newLinks);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    function highlightSelectedNodes(selectedNodes) {
        if (node && node.style) {
            // Reset styles for all nodes to remove any previous highlights
            node
                .style('stroke', '#ccc')  // Reset stroke color for all nodes
                .style('stroke-width', 0)  // Reset stroke width to none for all nodes

            // Highlight all selected nodes with a white stroke
            node
                .filter(d => selectedNodes.some(n => n.id === d.id))  // Filter nodes to find those that are selected
                .style('stroke', '#00ffff')  // Set stroke color to white for selected nodes
                .style('stroke-width', 4)  // Set stroke width to make it visible

            // Update the visualization to reflect changes
            node.raise();  // Bring the selected nodes to the front if overlapping
        } else {
            console.error('Node selection is undefined.');
        }
    }

    // Watch for changes in the selectedNodes
    watch(() => selectedNodes.value, (newNodes) => {
        highlightSelectedNodes(newNodes);
    }, { deep: true, immediate: true });

    onMounted(() => {
        createForceDirectedGraph();
        if (selectedNodes.value.length > 0) {
            highlightSelectedNodes(selectedNodes);
        }
    });

    // Assuming `nodes` and `links` are your D3 data arrays
    const getAdjacentNodes = (nodeId) => {
        return links.value
            .filter(link => link.source.id === nodeId || link.target.id === nodeId)
            .map(link => link.source.id === nodeId ? link.target : link.source);
    };

    const getPrerequisiteNodes = (nodeId) => {
        return links.value
            .filter(link => link.target.id === nodeId)
            .map(link => link.source);
    };

    const getSubsequentNodes = (nodeId) => {
        return links.value
            .filter(link => link.source.id === nodeId)
            .map(link => link.target);
    };

    const showAdjacentNodes = () => {
        const adjacentNodeIds = selectedNodes.value.flatMap(node =>
            getAdjacentNodes(node.id).map(n => n.id)
        );
        const uniqueAdjacentNodeIds = [...new Set(adjacentNodeIds)]; // Remove duplicates
        node.style('opacity', d => uniqueAdjacentNodeIds.includes(d.id) ? 1 : 0.1);
        labels.style('opacity', d => uniqueAdjacentNodeIds.includes(d.id) ? 1 : 0.1);
        link.style('opacity', d => uniqueAdjacentNodeIds.includes(d.source.id) || uniqueAdjacentNodeIds.includes(d.target.id) ? 1 : 0.1);
    };

    const showPrerequisiteNodes = () => {
        const prerequisiteNodeIds = selectedNodes.value.flatMap(node =>
            getPrerequisiteNodes(node.id).map(n => n.id)
        );
        const uniquePrerequisiteNodeIds = [...new Set(prerequisiteNodeIds)]; // Remove duplicates
        node.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.id) ? 1 : 0.1);
        labels.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.id) ? 1 : 0.1);
        link.style('opacity', d => uniquePrerequisiteNodeIds.includes(d.source.id) ? 1 : 0.1);
    };

    const showSubsequentNodes = () => {
        const subsequentNodeIds = selectedNodes.value.flatMap(node =>
            getSubsequentNodes(node.id).map(n => n.id)
        );
        const uniqueSubsequentNodeIds = [...new Set(subsequentNodeIds)]; // Remove duplicates
        node.style('opacity', d => uniqueSubsequentNodeIds.includes(d.id) ? 1 : 0.1);
        labels.style('opacity', d => uniqueSubsequentNodeIds.includes(d.id) ? 1 : 0.1);
        link.style('opacity', d => uniqueSubsequentNodeIds.includes(d.target.id) ? 1 : 0.1);
    };

    const resetView = () => {
        // Reset opacity of nodes and links
        node.style('opacity', 1);
        labels.style('opacity', 1);
        link.style('opacity', 1);

        // // Apply changes from the external state manager to D3
        // // Define the reset transformation
        // const resetTransform = d3.zoomIdentity;
        // svg.transition().duration(750).call(zoom.transform, resetTransform);

        // Release vuex stored variable: selected node
        store.commit('resetSelectedNodes');
    };

    const highlightAndCenterNode = (nodeId, svgElement) => {
        if (!svgElement) {
            console.error("SVG Element not found");
            return;
        }

        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;
        const zoomLevel = 1; // Adjust based on your requirements
        const transitionDuration = 750; // Duration for the zoom transition

        const nodeData = node.data().find(n => n.id === nodeId);
        if (!nodeData) {
            console.error("Node not found:", nodeId);
            return;
        }

        if (!zoom) {
            console.error("zoom behavior is not defined");
            return;
        }

        const targetX = width / 2 - nodeData.x * zoomLevel;
        const targetY = height / 2 - nodeData.y * zoomLevel;
        const transform = d3.zoomIdentity.translate(targetX, targetY).scale(zoomLevel);

        svg.transition()
            .duration(transitionDuration)
            .call(zoom.transform, transform);

        // Update the Vuex store if needed
        store.commit('setSelectedNodes', nodeData);
    };

    async function searchNode(searchQuery) {
        if (!searchQuery.trim()) {
            return null;
        }

        try {
            const response = await apiClient.get('/KnowledgeGraph/Search', {
                params: { query: searchQuery }
            });
            return response.data.identity; // Assuming the response data has an 'identity' field
        } catch (error) {
            console.error('Error during search:', error);
            return null;
        }
    }

    const showContextMenu = (x, y) => {
        contextMenuState.position = { x, y };
        contextMenuState.visible = true;
    };

    const hideContextMenu = () => {
        contextMenuState.visible = false;
    };

    const handleSvgRightClick = (event) => {
        event.preventDefault();
        if (!isEditing.value) return;

        const [x, y] = d3.pointer(event);
        // Display a context menu here or emit an event to show a Vue component-based context menu
        // Check if editing mode is active before showing the context menu
        if (isEditing.value) {
            showContextMenu(x, y);
        }
        // For simplicity, let's log the coordinates
        // console.log("Right-click at:", x, y);
        // Here you would typically trigger Vue state changes to show a custom context menu
        // and eventually call addNode() with the necessary node data
    };

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
        isEditing,
        contextMenuState,
        hideContextMenu,
        showContextMenu
    };
}
