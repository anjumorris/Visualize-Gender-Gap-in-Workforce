// Color Palette

//Canvas Colors
var la95 = "#F5F4EF";
var paris95 = "#EFF5F5";

//Tokyo red and pinks
var tokyo45 = "#C91D42";
var tokyo55 = "#E2365B";
var tokyo90 = "#F9D2DB";
var tokyo95 = "#FCE9ED";


// London Greys
var london20 = "#333333";
var london35 = "#595959";
var london70 = "#B3B3B3";

//Default settings
const axisFontSize = "15";
const timeFormatter = "%Y";
defaultCountry = "Afghanistan";


// Text styling 
d3.select('h1')
    .style('color', 'black')
    .style("font-family", "lato");

d3.select('h3')
    .style('color', 'black')
    .style("font-family", "lato");


// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 600 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svgLine = d3.select("#regressionChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.csv("https://raw.githubusercontent.com/UlyssesLin/world_bank/main/data/regressionData/Forecast_newer.csv", function (d) {
    return {
        country: d.country, year: d3.timeParse(timeFormatter)(d.year), actualEstimate: d.actualEstimate,
        upperInterval: d.upperInterval, lowerInterval: d.lowerInterval
    }
}).then(function (data) {

    // List of groups (here I have one group per column)
    const allGroup = new Set(data.map(d => d.country))

    // add the options to the button
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; }) // corresponding value returned by the button


    //time related
    const parseTime = d3.timeParse("%Y");
    var timeLine = d3.extent(data, function (d) { return d.year; })
    var forcastStart = d3.timeParse(timeFormatter)("2020");

    update(defaultCountry);
    // A function that update the chart
    function update(selected_country) {

        // Clean previous written stuff
        svgLine.selectAll("*").remove();

        // Add X axis --> it is a date format

        const x = d3.scaleTime()
            .domain([timeLine[0], timeLine[1]])
            .range([0, width]);
        svgLine.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat(timeFormatter)))
            .selectAll("text")
            //.attr("transform", "translate(0,10)rotate(0)")
            .style("text-anchor", "middle")
            .style("color", london35)
            .style("font-family", "lato")
            .style("font-size", axisFontSize); // change here for axis marking (year)

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.upperInterval; })])
            .range([height, 0]);
        svgLine.append("g")
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style("text-anchor", "end")
            .style("color", london35)
            .style("font-family", "lato")
            .style("font-size", axisFontSize); //Change here for y axis font change


        // Set the gradient
        svgLine.append("linearGradient")
            .attr("id", "line-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", timeLine[0])
            .attr("y1", 0)
            .attr("x2", timeLine[1])
            .attr("y2", 0)
            .selectAll("stop")
            .data([
                { offset: "0%", color: tokyo45 },
                { offset: "100%", color: tokyo90 }
            ])
            .enter().append("stop")
            .attr("offset", function (d) { return d.offset; })
            .attr("stop-color", function (d) { return d.color; });

        // Show confidence interval
        svgLine.append("path")
            .datum(data.filter(function (d) { return (d.country == selected_country && d.year >= forcastStart) }))
            .attr("fill", tokyo95)
            .attr("stroke", "none")
            .attr("fill-opacity",0.5)
            .attr("d", d3.area()
                .x(function (d) { return x(d.year) })
                .y0(function (d) { return y(d.upperInterval) })
                .y1(function (d) { return y(d.lowerInterval) })
            )
        
        // Show Line 
        svgLine.append("path")
            .datum(data.filter(function (d) { return d.country == selected_country }))
            .attr("d", d3.line()
                .x(function (d) { return x(d.year) })
                .y(function (d) { return y(+d.actualEstimate) })
            )
            .attr("stroke", "url(#line-gradient)")
            .style("stroke-width", 6)
            .style("fill", "none");

        // Forcast divider line
        svgLine.append('line')
            .attr('x1', x(forcastStart))
            .attr('x2', x(forcastStart))
            .attr('y1', y(0))
            .attr('y2', y(height))
            .attr('stroke', london20)
            .attr('stroke-width', 2);

        svgLine.append("text") //Forecast
            .text("Forecast ---->")
            .attr("x", x(forcastStart) + 15)
            .attr("y", y(0.05))
            .attr("text-anchor", "start")
            .attr("font-size", axisFontSize)
            .attr("font-family", "lato")
            .style('fill', london20);
        svgLine.append("text") //History
            .text("<---- History")
            .attr("x", x(forcastStart) -15)
            .attr("y", y(0.05))
            .attr("text-anchor", "end")
            .attr("font-size", axisFontSize)
            .attr("font-family", "lato")
            .style('fill', london20);

        }
        
        // When a country on the map is clicked, update line chart
        // The usual d3.selectAll('.country').on('click', ...) is affected by some (async?) shenanigans...
        document.body.addEventListener('click', function(e) {
            if (e.target && e.target.__data__ && e.target.__data__.properties) {
                update(e.target.__data__.properties.name);
            }
        });
    })