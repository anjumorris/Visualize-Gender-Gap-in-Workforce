document.body.addEventListener('click', function(e) {
  triggersEvent = Array.from(e.target.classList).some(function(toCheck) {
      return ['country'].includes(toCheck);
  });

  if (!triggersEvent) {
    d3.selectAll('.country')
      .style('opacity', 0.8)
      .style('stroke', 'white')
    svg.transition()
      .duration(500)
      .attr('transform', 'translate(0, 0) scale(1)')
    country_clicked = false;
    minimized_map = false;
  }
}, true); 

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

  var country_clicked = false;
  var minimized_map = false;
  var country_clicked_name = '';

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
      var to_select = country_clicked_name ? '.country:not(#' + country_clicked_name + ')' : '.country';
      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style("opacity", .5)
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
    }
  
    let mouseLeave = function(d) {
      // minimized_map && 
      var to_select = country_clicked_name ? '.country:not(#' + country_clicked_name + ')' : '.country';
      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style('opacity', .8)
    }

    var countryClick = function(i, scene) {
      if (country_clicked_name == 'map_' + this.__data__.id) {
        return;
      }
      country_clicked = true;
      minimized_map = true;
      country_clicked_name = 'map_' + this.__data__.id;
      d3.selectAll('.country:not(#' + country_clicked_name + ')')
        .transition()
        .duration(200)
        .style('opacity', .8)
        .style('stroke', 'white')
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', 'black')
      svg.transition()
        .duration(500)
        .attr('transform', 'translate(-200, 0) scale(0.6)')
    }
  
    // Draw the map
    svg.append("g")
      .attr('id', 'map_g')
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
      .attr("class", function(d){ return "country" } )
      .attr('id', function(d){ return 'map_' + d.id; } )
      .style("opacity", .8)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave )
      .on('click', countryClick)

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

  

