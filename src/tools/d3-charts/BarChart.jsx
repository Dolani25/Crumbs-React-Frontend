import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data, width, height, color = "#FE4F30" }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0 || !width || !height) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 1. Setup Dimensions
        const margin = { top: 20, right: 30, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // 2. Setup Scales
        const keys = Object.keys(data[0]);
        const xKey = keys.find(k => ['name', 'label', 'year', 'date', 'x'].includes(k.toLowerCase())) || keys[0];
        const yKey = keys.find(k => ['value', 'count', 'amount', 'y'].includes(k.toLowerCase())) || keys[1];

        const x = d3.scaleBand()
            .domain(data.map(d => d[xKey]))
            .range([0, innerWidth])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[yKey]) * 1.1])
            .range([innerHeight, 0]);

        // 3. Draw Chart Area
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Grid Lines
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""))
            .style("stroke-dasharray", "3 3")
            .style("stroke-opacity", 0.1);

        // 5. Axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
            .select(".domain").remove();

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(10))
            .select(".domain").remove();

        // Style Text
        g.selectAll("text")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("fill", "#888");

        // 6. Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "8px")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("z-index", 1000);

        // 7. Bars
        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d[xKey]))
            .attr("y", innerHeight) // Start at bottom for animation
            .attr("width", x.bandwidth())
            .attr("height", 0) // Start with 0 height
            .attr("fill", color)
            .attr("rx", 4) // Rounded corners top
            .attr("ry", 4)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", d3.rgb(color).darker(0.2));
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d[xKey]}</strong><br/>${d[yKey]}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", color);
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr("y", d => y(d[yKey]))
            .attr("height", d => innerHeight - y(d[yKey]));

        // Cleanup
        return () => {
            tooltip.remove();
        };

    }, [data, width, height, color]);

    return (
        <svg ref={svgRef} width={width} height={height} style={{ overflow: 'visible' }} />
    );
};

export default BarChart;
