function change(map_type) {
  $('#map_title').text(map_type.label);
  $('#' + (map_type.value == 'case' ? 'all_map' : 'case_map')).hide();
  $('#' + map_type.value + '_map').show();
  // svg.select('#PLACEHOLDER')
  //     .transition()
  //     .duration(600)
  //     .text(map_type.label)
  //     .attr('opacity', region.target.checked ? 1 : 0)
}

/* map slider values */
var values = [];
for (var y = 1990; y <= 2020; y++) {
  values.push(y);
}

/* init widget */
$("#slider").slider({
    value: 1990,
    min: 1990,
    max: 2020,
    step: 1,
    slide: function(event, ui) {
      $("#slider_year span").text(ui.value);
    }
});

// The svg
  var svg = d3.select("#all_map"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
  
  // Map and projection
  var path = d3.geoPath();
  var projection = d3.geoMercator()
    .scale(500)
    .center([0,20])
    .translate([-500, 400]);
  
  // Data and color scale
  var data = d3.map();
  var colorScale = d3.scaleThreshold()
    .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
    .range(d3.schemeBlues[7]);
  
  // Load external data and boot
  d3.queue()
    .defer(d3.json, "altered_world.geojson")
    .defer(d3.csv, "/../data/world_populations.csv", function(d) { data.set(d.code, +d.pop); })
    .await(ready);
  
  function ready(error, topo) {
  
    let mouseOver = function(d) {
      d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", .5)
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("stroke", "black")
    }
  
    let mouseLeave = function(d) {
      d3.selectAll(".Country")
        .transition()
        .duration(200)
        .style("opacity", .8)
        d3.selectAll('.Country')
        .style('stroke', 'white')
    }
  
    // Draw the map
    svg.append("g")
      .selectAll("path")
      .data(topo.features)
      .enter()
      .append("path")
      // draw each country
      .attr("d", d3.geoPath()
        .projection(projection)
      )
      // set the color of each country
      .attr("fill", function (d) {
        d.total = data.get(d.id) || 0;
        return colorScale(d.total);
      })
      .style("stroke", "white")
      .style('stroke-width', 1)
      .attr("class", function(d){ return "Country" } )
      .style("opacity", .8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave )

    var labels = d3.select("#view_picker")
      .selectAll()
      .data([
        { label: "All Asia", value: "all" },
        { label: "Case Studies", value: "case" }
      ])
      .enter()
      .append('label');

    labels.append("input")
      .attr("type", "radio")
      .attr('id', function(d) { return 'option_id_' + d.value; })
      .attr("name", 'map_option')
      .attr("value", function(d) { return d.value; })
      // .style('accent-color', function(d) { return colors[d.toLowerCase()]; })
      .on("change", change)

    d3.select('#option_id_all')
      .attr('checked', true)

    labels.append('span')
      .text(function(d) { return d.label; })
  }