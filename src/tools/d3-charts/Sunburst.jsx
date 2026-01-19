import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Sunburst = ({ data, width, height }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!width || !height) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const radius = Math.min(width, height) / 2;

        // 1. Data Processing
        let rootData = data;
        if (Array.isArray(data)) {
            rootData = {
                name: "Root",
                children: data
            };
        }
        if (!rootData || !rootData.children) {
            rootData = {
                name: "Skills",
                children: [
                    {
                        name: "Frontend", children: [
                            { name: "React", value: 10 },
                            { name: "D3", value: 8 },
                            { name: "CSS", value: 5 }
                        ]
                    },
                    {
                        name: "Backend", children: [
                            { name: "Node", value: 7 },
                            { name: "Mongo", value: 9 },
                            { name: "Express", value: 6 }
                        ]
                    },
                    {
                        name: "DevOps", children: [
                            { name: "Docker", value: 5 },
                            { name: "AWS", value: 4 }
                        ]
                    }
                ]
            };
        }

        // 2. Layout
        const root = d3.hierarchy(rootData)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);

        const partition = d3.partition()
            .size([2 * Math.PI, radius]);

        partition(root);

        // 3. Color Scale
        const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, root.children ? root.children.length + 1 : 1));

        // 4. Arc Generator
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius / 2)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1 - 1);

        // 5. Render
        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const path = g.append("g")
            .selectAll("path")
            .data(root.descendants().filter(d => d.depth))
            .join("path")
            .attr("fill", d => {
                while (d.depth > 1) d = d.parent;
                return color(d.data.name);
            })
            .attr("d", arc)
            .attr("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("opacity", 1).attr("transform", "scale(1.02)");
                // Center Text
                g.select("#center-text").text(`${d.data.name}: ${d.value}`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("opacity", 0.8).attr("transform", "scale(1)");
                g.select("#center-text").text("");
            });

        path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${d.value}`);

        // Center Text Placeholder
        g.append("text")
            .attr("id", "center-text")
            .attr("text-anchor", "middle")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "14px")
            .style("fill", "#555")
            .style("pointer-events", "none");

    }, [data, width, height]);

    return (
        <svg ref={svgRef} width={width} height={height} />
    );
};

export default Sunburst;
