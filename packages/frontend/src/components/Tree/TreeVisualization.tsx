import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import type { DocumentNode } from '@shared/types';
import { useTreeStore } from '../../stores/treeStore';
import { useContextStore } from '../../stores/contextStore';

interface TreeVisualizationProps {
  width: number;
  height: number;
  data: DocumentNode[];
}

interface D3TreeNode extends d3.HierarchyPointNode<DocumentNode> {
  _children?: D3TreeNode[];
}

export default function TreeVisualization({ width, height, data }: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const {
    expandedNodes,
    selectedNodes,
    focusedNode,
    selectNode,
    toggleExpansion,
    setFocusedNode,
  } = useTreeStore();
  
  const {
    getIncludedNodes,
    getPinnedNodes,
    getExcludedNodes,
    includeNode,
    excludeNode,
    pinNode,
  } = useContextStore();

  const includedNodes = getIncludedNodes();
  const pinnedNodes = getPinnedNodes();
  const excludedNodes = getExcludedNodes();

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Set up dimensions and margins
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create root group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create hierarchy
    const root = d3.hierarchy<DocumentNode>(
      { 
        id: 'root',
        name: 'Root',
        type: 'folder' as const,
        path: '/',
        parentId: undefined,
        children: data.filter(node => !node.parentId),
        metadata: {
          size: 0,
          lastModified: new Date(),
          documentType: 'folder',
          tags: [],
          usageCount: 0,
        }
      },
      (d) => d.children
    );

    // Create tree layout
    const treeLayout = d3.tree<DocumentNode>()
      .size([innerHeight, innerWidth])
      .separation((a, b) => {
        const aWidth = getNodeWidth(a.data);
        const bWidth = getNodeWidth(b.data);
        return (aWidth + bWidth) / 2 + 20;
      });

    // Apply layout
    const treeData = treeLayout(root) as D3TreeNode;
    const nodes = treeData.descendants() as D3TreeNode[];
    const links = treeData.descendants().slice(1) as D3TreeNode[];

    // Handle node collapse/expand state
    nodes.forEach(d => {
      if (!expandedNodes.has(d.data.id) && d.children) {
        (d as any)._children = d.children;
        d.children = null;
      }
    });

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', 
          `translate(${margin.left + event.transform.x},${margin.top + event.transform.y}) scale(${event.transform.k})`
        );
      });

    svg.call(zoom);

    // Create links
    const linkGroup = g.append('g').attr('class', 'links');
    
    const linkSelection = linkGroup
      .selectAll('.link')
      .data(links, (d: any) => d.data.id);

    const linkEnter = linkSelection
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    linkEnter
      .merge(linkSelection as any)
      .transition()
      .duration(500)
      .attr('opacity', 1)
      .attr('d', (d: any) => {
        const source = d.parent;
        const target = d;
        return diagonal(source, target);
      });

    linkSelection.exit()
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .remove();

    // Create nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    const nodeSelection = nodeGroup
      .selectAll('.node')
      .data(nodes, (d: any) => d.data.id);

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('opacity', 0);

    // Add node circles
    nodeEnter
      .append('circle')
      .attr('r', (d: any) => getNodeRadius(d.data))
      .attr('fill', (d: any) => getNodeColor(d.data))
      .attr('stroke', (d: any) => getNodeStroke(d.data))
      .attr('stroke-width', (d: any) => selectedNodes.has(d.data.id) ? 3 : 1)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: any) => {
        event.stopPropagation();
        if (d.data.type === 'folder') {
          toggleExpansion(d.data.id);
        }
        selectNode(d.data.id, event.ctrlKey || event.metaKey);
        setFocusedNode(d.data.id);
      })
      .on('contextmenu', (event: MouseEvent, d: any) => {
        event.preventDefault();
        // Show context menu for context management
        showContextMenu(event, d.data);
      });

    // Add node labels
    nodeEnter
      .append('text')
      .attr('dy', '.35em')
      .attr('x', (d: any) => d.children || (d as any)._children ? -13 : 13)
      .style('text-anchor', (d: any) => d.children || (d as any)._children ? 'end' : 'start')
      .style('font-size', '12px')
      .style('font-family', 'Inter, sans-serif')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text((d: any) => d.data.name);

    // Add expand/collapse indicators
    nodeEnter
      .filter((d: any) => d.data.type === 'folder')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', '#6b7280')
      .style('pointer-events', 'none')
      .text((d: any) => {
        if (d.children) return '−';
        if ((d as any)._children) return '+';
        return '';
      });

    // Update existing nodes
    nodeSelection
      .merge(nodeEnter as any)
      .transition()
      .duration(500)
      .style('opacity', 1)
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

    // Update node appearance based on state
    nodeSelection
      .merge(nodeEnter as any)
      .select('circle')
      .attr('fill', (d: any) => getNodeColor(d.data))
      .attr('stroke', (d: any) => getNodeStroke(d.data))
      .attr('stroke-width', (d: any) => selectedNodes.has(d.data.id) ? 3 : 1);

    nodeSelection.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove();

    setIsInitialized(true);

    // Helper functions
    function diagonal(source: any, target: any) {
      return `M ${source.y} ${source.x}
              C ${(source.y + target.y) / 2} ${source.x},
                ${(source.y + target.y) / 2} ${target.x},
                ${target.y} ${target.x}`;
    }

    function getNodeWidth(node: DocumentNode): number {
      return node.name.length * 8 + 40; // Approximate width based on text
    }

    function getNodeRadius(node: DocumentNode): number {
      if (node.type === 'folder') return 8;
      return Math.min(12, Math.max(4, Math.sqrt(node.metadata.size / 1000)));
    }

    function getNodeColor(node: DocumentNode): string {
      if (pinnedNodes.has(node.id)) return '#f59e0b'; // Amber for pinned
      if (includedNodes.has(node.id)) return '#10b981'; // Green for included
      if (excludedNodes.has(node.id)) return '#ef4444'; // Red for excluded
      if (node.type === 'folder') return '#6366f1'; // Indigo for folders
      return '#8b5cf6'; // Purple for documents
    }

    function getNodeStroke(node: DocumentNode): string {
      if (focusedNode === node.id) return '#1f2937';
      if (selectedNodes.has(node.id)) return '#374151';
      return '#d1d5db';
    }

    function showContextMenu(event: MouseEvent, node: DocumentNode) {
      // This would show a context menu for context management
      // For now, we'll just cycle through states
      if (pinnedNodes.has(node.id)) {
        excludeNode(node.id);
      } else if (includedNodes.has(node.id)) {
        pinNode(node.id);
      } else if (excludedNodes.has(node.id)) {
        // Remove from excluded (back to neutral)
      } else {
        includeNode(node.id);
      }
    }

    // Add minimap
    if (innerWidth > 600 && innerHeight > 400) {
      createMinimap(svg, nodes, width, height);
    }

  }, [data, expandedNodes, selectedNodes, focusedNode, includedNodes, pinnedNodes, excludedNodes, width, height]);

  function createMinimap(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: D3TreeNode[], svgWidth: number, svgHeight: number) {
    const minimapWidth = 150;
    const minimapHeight = 100;
    const minimapPadding = 20;

    // Remove existing minimap
    svg.select('.minimap').remove();

    const minimap = svg
      .append('g')
      .attr('class', 'minimap')
      .attr('transform', `translate(${svgWidth - minimapWidth - minimapPadding}, ${minimapPadding})`);

    // Minimap background
    minimap
      .append('rect')
      .attr('width', minimapWidth)
      .attr('height', minimapHeight)
      .attr('fill', '#f9fafb')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Scale for minimap
    const xExtent = d3.extent(nodes, (d: any) => d.y) as [number, number];
    const yExtent = d3.extent(nodes, (d: any) => d.x) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([10, minimapWidth - 10]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([10, minimapHeight - 10]);

    // Minimap nodes
    minimap
      .selectAll('.minimap-node')
      .data(nodes.slice(1)) // Skip root
      .enter()
      .append('circle')
      .attr('class', 'minimap-node')
      .attr('cx', (d: any) => xScale(d.y))
      .attr('cy', (d: any) => yScale(d.x))
      .attr('r', 2)
      .attr('fill', (d: any) => {
        if (selectedNodes.has(d.data.id)) return '#3b82f6';
        if (d.data.type === 'folder') return '#6366f1';
        return '#8b5cf6';
      })
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: any) => {
        selectNode(d.data.id);
        setFocusedNode(d.data.id);
        
        // Center the main view on this node
        const mainSvg = d3.select(svgRef.current!);
        const zoom = d3.zoom<SVGSVGElement, unknown>();
        const transform = d3.zoomIdentity
          .translate(svgWidth / 2 - d.y, svgHeight / 2 - d.x)
          .scale(1);
        
        mainSvg.transition()
          .duration(750)
          .call(zoom.transform as any, transform);
      });
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      />
      
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">No documents to display</p>
            <p className="text-sm">Load your document tree to get started</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}