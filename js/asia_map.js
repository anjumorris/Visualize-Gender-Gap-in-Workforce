document.body.addEventListener('click', function(e) {
  triggersEvent = Array.from(e.target.classList).some(function(toCheck) {
      return ['country'].includes(toCheck);
  });

  if (!triggersEvent) {
    d3.selectAll('.country')
      .style('opacity', 0.7)
      .style('stroke', 'white')
      .style('stroke-width', 1)
    svg.transition()
      .duration(500)
      .attr('transform', 'translate(0, 0) scale(1)')
    country_clicked = false;
    minimized_map = false;
    country_clicked_map_id = '';
    country_clicked_name = '';
    d3.select('#right_area')
      .transition()
      .duration(200)
      .style('opacity', 0)
  }
}, true); 

function changeMapType(map_type) {
  $('#map_title').text(map_type.target.__data__.label);
  $('#' + (map_type.target.__data__.value == 'case' ? 'all_map' : 'case_map')).hide();
  $('#' + map_type.target.__data__.value + '_map').show();
  // svg.select('#PLACEHOLDER')
  //     .transition()
  //     .duration(600)
  //     .text(map_type.label)
  //     .attr('opacity', region.target.checked ? 1 : 0)
}

function countryClick(d) {
  if (country_clicked_map_id == 'map_' + d.id) {
    return;
  }
  country_clicked = true;
  minimized_map = true;
  country_clicked_map_id = 'map_' + d.id;
  country_clicked_name = d.properties.name;
  d3.select('#country_clicked')
    .text(country_clicked_name)
  d3.selectAll('.country:not(#' + country_clicked_map_id + ')')
    .transition()
    .duration(200)
    .style('opacity', 0.7)
    .style('stroke', 'white')
    .style('stroke-width', 1)
  d3.select('#' + country_clicked_map_id)
    .transition()
    .duration(200)
    .style('opacity', 1)
    .style('stroke', 'black')
    .style('stroke-width', 2)
  svg.transition()
    .duration(500)
    .attr('width', 900)
    .attr('transform', 'translate(-200, 0) scale(0.6)')
  d3.select('#right_area')
    .transition()
    .duration(1000)
    .style('opacity', 1)
    // $('#right_area').show();
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
  var country_clicked_map_id = '';
  var country_clicked_name = '';

// The svg
  var svg = d3.select("#all_map");;
  
  // Map and projection
  var path = d3.geoPath();
  var projection = d3.geoMercator()
    .scale(500)
    .center([0,20])
    .translate([-500, 400]);

  d3.json('altered_world.geojson').then(function(topo) {
  
    let mouseOver = function(d) {
      var to_select = country_clicked_map_id ? '.country:not(#' + country_clicked_map_id + ')' : '.country';
      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style("opacity", 0.4)
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
    }
  
    let mouseLeave = function(d) {
      // minimized_map && 
      var to_select = country_clicked_map_id ? '.country:not(#' + country_clicked_map_id + ')' : '.country';
      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style('opacity', 0.7)
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
      // TODO: FILL COUNTRIES WITH DOTS
      .attr("fill", function (d) {
        return '#F97A1F';
      })
      .style("stroke", "white")
      .style('stroke-width', 1)
      .attr("class", function(d){ return "country" } )
      .attr('id', function(d){ return 'map_' + d.id; } )
      .style("opacity", 0.7)
      .on("mouseover", mouseOver )
      .on("mouseleave", mouseLeave )
      // .on('click', countryClick)

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
      .on("change", changeMapType)

    d3.select('#option_id_all')
      .attr('checked', true)

    labels.append('span')
      .text(function(d) { return d.label; })
  })

  

