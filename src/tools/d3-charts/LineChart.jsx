import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data, width, height, color = "#FE4F30" }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || data.length === 0 || !width || !height) return;

        // Clear previous render
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 1. Setup Dimensions
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // 2. Setup Scales
        // Detect keys: assume first key is X (name/label) and second is Y (value)
        const keys = Object.keys(data[0]);
        const xKey = keys.find(k => ['name', 'label', 'year', 'date', 'x'].includes(k.toLowerCase())) || keys[0];
        const yKey = keys.find(k => ['value', 'count', 'amount', 'y'].includes(k.toLowerCase())) || keys[1];

        const x = d3.scalePoint()
            .domain(data.map(d => d[xKey]))
            .range([0, innerWidth])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[yKey]) * 1.1]) // Add 10% padding on top
            .range([innerHeight, 0]);

        // 3. Draw Chart Area
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Grid Lines (Optional but nice)
        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-innerWidth)
                .tickFormat("")
            )
            .style("stroke-dasharray", "3 3")
            .style("stroke-opacity", 0.1);

        // 5. Axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
            .select(".domain").remove(); // Hide X axis line for cleaner look

        g.append("g")
            .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(10))
            .select(".domain").remove(); // Hide Y axis line

        // Style Text
        g.selectAll("text")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("fill", "#888");

        // 6. Line Generator
        const line = d3.line()
            .x(d => x(d[xKey]))
            .y(d => y(d[yKey]))
            .curve(d3.curveCatmullRom); // Smooth curves

        // 7. Render Line with Animation
        const path = g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("d", line);

        // Animate Line Drawing
        const totalLength = path.node().getTotalLength();
        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);

        // 8. Gradient Area below line (optional "beautiful" touch)
        const area = d3.area()
            .x(d => x(d[xKey]))
            .y0(innerHeight)
            .y1(d => y(d[yKey]))
            .curve(d3.curveCatmullRom);

        // Define Gradient
        const gradientId = "line-gradient";
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", gradientId)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.2);
        gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

        g.append("path")
            .datum(data)
            .attr("fill", `url(#${gradientId})`)
            .attr("d", area)
            .attr("opacity", 0)
            .transition()
            .delay(500)
            .duration(1000)
            .attr("opacity", 1);


        // 9. Interactive Dots & Tooltip
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

        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(d[xKey]))
            .attr("cy", d => y(d[yKey]))
            .attr("r", 0) // Start small
            .attr("fill", "white")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr("r", 6)
                    .attr("stroke-width", 3);

                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d[xKey]}</strong><br/>${d[yKey]}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition().duration(200)
                    .attr("r", 4)
                    .attr("stroke-width", 2);
                tooltip.transition().duration(200).style("opacity", 0);
            })
            .transition()
            .delay((d, i) => i * 100 + 1000) // Stagger popup
            .duration(500)
            .attr("r", 4);

        // Cleanup
        return () => {
            tooltip.remove();
        };

    }, [data, width, height, color]);

    return (
        <svg ref={svgRef} width={width} height={height} style={{ overflow: 'visible' }} />
    );
};

export default LineChart;
