/*
Generate points at random locations inside polygon.
    polygon: polygon (Array of points [x,y])
    numPoints: number of points to generate

Returns an Array of points [x,y].

The returned Array will have a property complete, which is set to false if the
desired number of points could not be generated within `options.numIterations` attempts
*/
function makeDots(polygon, numPoints, options) { 

  options = Object.assign({
    // DEFAULT OPTIONS:
    maxIterations: numPoints * 50,
    distance: null, // by default: MIN(width, height) / numPoints / 4,
    edgeDistance: options.distance || 0
  },options);

  numPoints = Math.floor(numPoints)

  // calculate bounding box
  
  let xMin = Infinity,
    yMin = Infinity,
    xMax = -Infinity,
    yMax = -Infinity
  
  polygon.forEach(p => {
    if (p[0]<xMin) xMin = p[0]
    if (p[0]>xMax) xMax = p[0]
    if (p[1]<yMin) yMin = p[1]
    if (p[1]>yMax) yMax = p[1]
  });

  let width = xMax - xMin
  let height = yMax - yMin
  
  // default options depending on bounds
  
  options.distance = options.distance || Math.min(width, height) / numPoints / 4
  options.edgeDistance = options.edgeDistance || options.distance
  
  // generate points
  
  let points = [];
  
  outer:
  for (let i=0; i<options.maxIterations; i++) {
    let p = [xMin + Math.random() * width, yMin + Math.random() * height]
    if (d3.polygonContains(polygon, p)) {
      // check distance to other points
      for (let j=0; j<points.length; j++) {
        let dx = p[0]-points[j][0],
            dy = p[1]-points[j][1]
        
        if (Math.sqrt(dx*dx+dy*dy) < options.distance) continue outer;
      }
      // check distance to polygon edge
      for (let j=0; j<polygon.length-1; j++) {
        if (distToSegmentSquared(p, polygon[j], polygon[j+1]) < options.edgeDistance) continue outer;
      }
      points.push(p);
      if (points.length == numPoints) break;
    }
  }
  
  points.complete = (points.length >= numPoints)
  
  return points
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

// makeDots([[0,0],[0,10],[10,10],[10,0]], 5, []);
  // [[81.787959,7.523055],[81.637322,6.481775],[81.21802,6.197141],[80.348357,5.96837],[79.872469,6.763463],[79.695167,8.200843],[80.147801,9.824078],[80.838818,9.268427],[81.304319,8.564206],[81.787959,7.523055]]
// -----------------------------------------------------------------------------

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
    d3.select('.map_wrapper')
      .transition()
      .duration(500)
      .style('width', '780px')
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
  country_clicked_name = d.properties.name || d.properties.ADMIN;
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
  d3.select('.map_wrapper')
    .style('width', '480px')
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

      //----------------------MAP POPULATED--------------------------
var sri=[[81.787959,7.523055],[81.637322,6.481775],[81.21802,6.197141],[80.348357,5.96837],[79.872469,6.763463],[79.695167,8.200843],[80.147801,9.824078],[80.838818,9.268427],[81.304319,8.564206],[81.787959,7.523055]];
    svg.append('g')
      .attr('id', 'dots')
      .selectAll()
      .data(sri).enter()
      .append("circle")
      .attr('id', 'dingus')
      // .attr("cx", d3.geoPath()
      //   .projection(projection)
      // )
      .attr("cx", function(d) { return projection(d)[0]; })
      .attr("cy", function(d) { return projection(d)[1]; })
      // .attr("cx", function(d) { return d[0]; })
      // .attr("cy", function(d) { return d[1]; })
      .attr("r", "1px")
      .attr("fill", "red")
      

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

  

