import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Treemap = ({ data, width, height, color = "#FE4F30" }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!width || !height) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 1. Data Processing
        // If data is flat, valid hierarchy needs 'children'.
        // If passed data is array, we wrap it.
        let rootData = data;
        if (Array.isArray(data)) {
            rootData = {
                name: "Root",
                children: data
            };
        }
        if (!rootData || !rootData.children) {
            // Demo Data fallback
            rootData = {
                name: "Portfolio",
                children: [
                    { name: "Stocks", value: 400 },
                    { name: "Bonds", value: 200 },
                    { name: "Real Estate", value: 300 },
                    { name: "Crypto", value: 100 },
                    { name: "Cash", value: 50 }
                ]
            };
        }

        // 2. Hierarchy & Layout
        const root = d3.hierarchy(rootData)
            .sum(d => d.value || d.amount || d.count || 1) // Auto-detect value key
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([width, height])
            .padding(4)
            .round(true)
            (root);

        // 3. Color Scale
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

        // 4. Render Nodes
        const nodes = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Rectangles
        nodes.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorScale(d.data.name))
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("opacity", 0.8)
            .on("mouseover", function () {
                d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 0.8).attr("stroke", "none");
            });

        // Labels
        nodes.append("text")
            .selectAll("tspan")
            .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g)) // split camelCase or just use name
            .enter().append("tspan")
            .attr("x", 4)
            .attr("y", (d, i) => 13 + i * 12)
            .text(d => d)
            .attr("font-size", "10px")
            .attr("fill", "white")
            .attr("font-family", "Inter, sans-serif")
            .style("pointer-events", "none");

        // Values
        nodes.append("text")
            .attr("x", 4)
            .attr("y", d => (d.y1 - d.y0) - 6)
            .text(d => d.value)
            .attr("font-size", "9px")
            .attr("fill", "white")
            .attr("opacity", 0.8)
            .style("pointer-events", "none");

    }, [data, width, height]);

    return (
        <svg ref={svgRef} width={width} height={height} style={{ overflow: 'hidden' }} />
    );
};

export default Treemap;
