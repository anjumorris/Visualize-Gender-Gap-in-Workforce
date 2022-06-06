// Ulysses Lin
// CPSC 5320 SP 2022
// Final Project


var country_clicked = false;
var minimized_map = false;
var country_clicked_map_id = '';
var country_clicked_name = '';
var background_country_fill = '#F2F2F2';
var pop_data = {};
var BORDER_COLOR = '#595959';
var POP_PER_DOT = 500000,
  map_year = 1990,
  map_colors = {
    mwo: '#8EE4D1',
    mw: '#1DC9A4',
    wwo: '#E48EA1',
    ww: '#C91D42'
  },
  curr_map_type = 'all_dots';

function toggle_country_names(e) {
  d3.select('#country_names')
    .style('visibility', e.target.checked ? 'visible' : 'hidden')
}

// makeDots modified code from https://observablehq.com/@floledermann/dot-density-maps-with-d3
/*
Generate points at random locations inside polygon.
    polygon: polygon (Array of points [x,y])
    numPoints: number of points to generate

Returns an Array of points [x,y].

The returned Array will have a property complete, which is set to false if the
desired number of points could not be generated within `options.numIterations` attempts
*/
function makeDots(name, polygons, numPoints, options, multiPoly) { // options can be empty []
  var points = [],
    polygon = [],
    polys = 1,
    numPointsForPoly = [];

  if (multiPoly) {
    var multiPolyAreaSum = 0;
    polys = polygons.length;
    // numPoints = numPoints / polys;
    for (var i = 0; i < polys; i++) {
      numPointsForPoly.push(d3.polygonArea(polygons[i][0]));
      multiPolyAreaSum += d3.polygonArea(polygons[i][0]);
    }
    for (var i = 0; i < polys; i++) {
      numPointsForPoly[i] = numPoints * (numPointsForPoly[i] / multiPolyAreaSum);
    }
  }

  for (var i = 0; i < polys; i++) {
    polygon = multiPoly ? polygons[i][0] : polygons[i];
    multiPoly && (numPoints = numPointsForPoly[i])
    options = {
      maxIterations: numPoints * 50,
      distance: null, // by default: MIN(width, height) / numPoints / 4,
      edgeDistance: -1 // MOD
    };

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
    
    var pushed = 0;
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
          if (distToSegmentSquared(p, polygon[j], polygon[j+1]) < options.edgeDistance) {
            continue outer;
          }
        }
        points.push(p);
        pushed++;
        if (pushed >= numPoints) {
          break outer;
        }
      }
    }
    
    // points.complete = (points.length >= numPoints)
  }
  
  return points
}

// Code modified from https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
// Calculates distance from a point to an edge (two vertices)
// Used by makeDots()
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v[0] - w[0]) + sqr(v[1] - w[1]) }
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

// -----------------------------------------------------------------------------


function changeMapType(map_type) {
  curr_map_type = map_type.target.__data__.value == 'donuts' ? 'donuts' : 'all_dots';
  $('#map_title').text(map_type.target.__data__.label);
  $('#' + (map_type.target.__data__.value == 'donuts' ? 'all_dots' : 'donuts')).hide(800);
  $('#' + (map_type.target.__data__.value == 'donuts' ? 'donuts' : 'all_dots')).show(800);
}

/* map slider values */
var values = [];
for (var y = 1990; y <= 2020; y++) {
  values.push(y);
}

// The svg
var svg = d3.select("#all_map");

// Map and projection
var path = d3.geoPath();
var projection = d3.geoMercator()
  .scale(500)
  .center([0,20])
  .translate([-500, 400]);

// DOT DENSITY
d3.csv('/data/dot_wrangled.csv').then(function(data) {
  // Set up years for 1990-2020
  for (var y = 1990; y <= 2020; y++) {
    pop_data[y] = {};
  }
  for (row in data) {
    // WORKING POPULACE
    // mwo: men without advanced education
    // mw: men with advanced education
    // wwo: women without advanced education
    // ww: women with advanced education
    if (Object.keys(pop_data).includes(data[row].year)) {
      var mwo = parseInt(data[row].workingMenWithoutAdv),
        mw = parseInt(data[row].workingMenWithAdv),
        wwo = parseInt(data[row].workingWomenWithoutAdv),
        ww = parseInt(data[row].workingWomenWithAdv),
        sum = mwo + mw + wwo + ww;

      pop_data[data[row].year][data[row].country] = {
        mwo: mwo / sum,
        mw: mw / sum,
        wwo: wwo / sum,
        ww: ww / sum,
        sum: sum
      }
    }
  }

  d3.json('altered_world.geojson').then(function(topo) {

    // create a tooltip
    var tooltip = d3.select("#tooltip")
      // .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      // .html("<p>I'm a tooltip written in HTML</p><img src='https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true'></img><br>Fancy<br><span style='font-size: 40px;'>Isn't it?</span>");

  // Clicking off of a country
  document.body.addEventListener('click', function(e) {
    triggersEvent = Array.from(e.target.classList).some(function(toCheck) {
        return ['country'].includes(toCheck);
    });

    if (!triggersEvent) {
      d3.selectAll('.country')
        .style('opacity', 0.4)
        .style('stroke', BORDER_COLOR)
        .style('stroke-width', 1.5)
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

  function countryClick(clicked) {
    var d = clicked.target.__data__;
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
      .style('opacity', 0.4)
      .style('stroke', BORDER_COLOR)
      .style('stroke-width', 1.5)
    d3.select('#' + country_clicked_map_id)
      .transition()
      .duration(200)
      .style('opacity', 1)
      .style('stroke', 'black')
      .style('stroke-width', 3)
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
    d3.select('#tooltip')
      .transition()
      .duration(400)
      .style('opacity', 0)
  }
  
    let mouseOver = function(d) {
      var to_select = country_clicked_map_id ? '.country:not(#' + country_clicked_map_id + ')' : '.country',
      country_name = d.target.__data__.properties.name || d.target.__data__.properties.ADMIN;

      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style("opacity", 0.2)
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)

      tooltip.style("visibility", "visible");

      d3.select('#tooltip h3')
        .text(country_name)

      d3.select('#tooltip')
        .style('opacity', 1)

      updateTooltip(country_name, map_year)
    }
  
    let mouseLeave = function(d) {
      // minimized_map && 
      var to_select = country_clicked_map_id ? '.country:not(#' + country_clicked_map_id + ')' : '.country';
      d3.selectAll(to_select)
        .transition()
        .duration(200)
        .style('opacity', 0.4)

      tooltip.style("visibility", "hidden");
    }

    /* init widget */
    $("#slider").slider({
      value: 1990,
      min: 1990,
      max: 2020,
      step: 1,
      slide: function(event, ui) {
        $("#slider_year span").text(ui.value);
        changeYear(ui.value);
        map_year = ui.value;
      }
    });

    // Update the dot density diagram with new year data from slider change
    function changeYear(newYear) {
      if (curr_map_type == 'all_dots') {
        svg.select('#all_dots').remove()
  
        svg.append('g')
          .attr('id', 'all_dots')
      }

      var year_data = pop_data[newYear],
        asia_coords = topo.features;

      for (var c in asia_coords) {
        var matchedCountry = year_data[asia_coords[c].properties.name || asia_coords[c].properties.ADMIN],
          dots = matchedCountry ? matchedCountry.sum / POP_PER_DOT : 0,
          mwo_max = matchedCountry ? matchedCountry.mwo * dots : 0,
          mw_max = matchedCountry ? matchedCountry.mw * dots : 0,
          wwo_max = matchedCountry ? matchedCountry.wwo * dots : 0,
          ww_max = matchedCountry ? matchedCountry.ww * dots : 0,
          mwo_count = 0,
          mw_count = 0,
          wwo_count = 0,
          ww_count = 0,
          data_to_use = makeDots(asia_coords[c].properties.name, asia_coords[c].geometry.coordinates, matchedCountry ? matchedCountry.sum / POP_PER_DOT : 0, [], asia_coords[c].geometry.type == 'MultiPolygon');

          if (curr_map_type == 'donuts') {
        // DONUTS
        if (matchedCountry) {
          // code modified from https://stackoverflow.com/questions/33506489/how-to-get-a-path-centroid-d3
          var c_id = asia_coords[c].id || asia_coords[c].properties.ISO_A3;
          var bbox = document.getElementById('map_' + c_id).getBBox();
          svg.select('#country_names')
            .append('g')
            .attr('id', 'proportions_' + c_id)
            .append('text')
            .style('font-size', '12px')
            .attr('x', bbox.x + bbox.width/2 - 60)
            .attr('y', bbox.y + bbox.height/2 - 20)
            .style('font-weight', 600)
            .text(asia_coords[c].properties.name || asia_coords[c].properties.ADMIN)

            var pie_data = {mwo: matchedCountry.mwo, mw: matchedCountry.mw, wwo: matchedCountry.wwo, ww: matchedCountry.ww};
          
            var pie = d3.pie()
            .value(function(d) { return d[1]; })
            .sort(null);
            var data_ready = pie(Object.entries(pie_data));
          
            d3.select('#donuts')
            .append('g')
            .attr('id', 'proportions_image_' + c_id)
            .attr("transform", "translate(" + (bbox.x + bbox.width/2) + "," + (bbox.y + bbox.height/2) + ")")
            // .attr("transform", "translate(" + 200 + "," + 360 + ")")
            .selectAll()
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', d3.arc()
              .innerRadius(12)
              .outerRadius(20)
            )
            .attr('fill', function(d) { return map_colors[d.data[0]]; })
            .attr("width", width)
            .attr("height", height)
            .append("g")
        }

      } else {

        // svg.select('#all_dots').remove()

        // svg.append('g')
        //   .attr('id', 'all_dots')

        (asia_coords[c].geometry.type == 'MultiPolygon') && (data_to_use = shuffle(data_to_use));
        svg.select('#all_dots')
          .append('g')
          .attr('id', 'dots_' + c_id)
          .selectAll()
          .data(data_to_use)
          .enter()
          .append("circle")
          .attr('class', 'dot')
          .attr("cx", function(d) { return projection(d)[0]; })
          .attr("cy", function(d) { return projection(d)[1]; })
          .attr("r", "1.5px")
          .attr("fill", function(d) {
            if (mwo_count++ < mwo_max) {
              return map_colors.mwo;
            } else if (mw_count++ < mw_max) {
              return map_colors.mw;
            } else if (wwo_count++ < wwo_max) {
              return map_colors.wwo;
            } else if (ww_count++ < ww_max) {
              return map_colors.ww;
            } else {
              return 'white';
            }
          })
        }
      }
    }

    // svg.selectAll()
    //   .attr('fill', 'black')
  
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
        return background_country_fill;
      })
      .style("stroke", BORDER_COLOR)
      .style('stroke-width', 1.5)
      .attr("class", function(d){ return "country" } )
      .attr('id', function(d){ return 'map_' + (d.id || d.properties.ISO_A3); } )
      .style("opacity", 0.4)
      .on("mouseover", mouseOver )
      .on("mousemove", function(d) { 
        d3.select('#tooltip')
          .style('opacity', 1)
        return tooltip.style("top", (event.pageY - 300)+"px").style("left",(event.pageX + 100)+"px"); 
      })
      .on("mouseleave", mouseLeave )
      .on('click', countryClick)

      //----------------------MAP POPULATED--------------------------

    // MAP TYPE RADIOS
    var labels = d3.select("#view_picker")
      .selectAll()
      .data([
        { label: "Dot Density", value: "all_dots" },
        { label: "Donuts", value: "donuts" }
      ])
      .enter()
      .append('label');

    labels.append("input")
      .attr("type", "radio")
      .attr('id', function(d) { return 'option_id_' + d.value; })
      .attr("name", 'map_option')
      .attr("value", function(d) { return d.value; })
      .on("change", changeMapType)

    d3.select('#option_id_all_dots')
      .attr('checked', true)

    labels.append('span')
      .text(function(d) { return d.label; })

    // COUNTRY LABELS
    var show_names = d3.select("#country_name_toggle")
        .append('label');

      show_names.append("input")
        .attr("type", "checkbox")
        .attr('checked', false)
        .attr("name", 'country_name_toggle')
        .attr("value", false)
        .on("change", toggle_country_names)
    
      show_names.append('span')
        .text('Show country names')




    function shuffle(array) {
      let currentIndex = array.length,  randomIndex;
    
      // While there remain elements to shuffle.
      while (currentIndex != 0) {
    
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
          array[randomIndex], array[currentIndex]];
      }
    
      return array;
    }

    svg.append('g')
      .attr('id', 'all_dots')

    var d1990 = pop_data['1990'];
    // DOT DENSITY
    var asia_coords = topo.features;

    svg.append('g')
      .attr('id', 'country_names')

    svg.append('g')
      .attr('id', 'donuts')

    for (var c in asia_coords) {
      var matchedCountry = d1990[asia_coords[c].properties.name || asia_coords[c].properties.ADMIN],
        dots = matchedCountry ? matchedCountry.sum / POP_PER_DOT : 0,
        mwo_max = matchedCountry ? matchedCountry.mwo * dots : 0,
        mw_max = matchedCountry ? matchedCountry.mw * dots : 0,
        wwo_max = matchedCountry ? matchedCountry.wwo * dots : 0,
        ww_max = matchedCountry ? matchedCountry.ww * dots : 0,
        mwo_count = 0,
        mw_count = 0,
        wwo_count = 0,
        ww_count = 0,
        data_to_use = makeDots(asia_coords[c].properties.name, asia_coords[c].geometry.coordinates, matchedCountry ? matchedCountry.sum / POP_PER_DOT : 0, [], asia_coords[c].geometry.type == 'MultiPolygon');

        // asia_coords[c].id
        // matchedCountry.
        // mw: 0.6427449768672969
        // mwo: 0.1123595291356196
        // sum: 441023039
        // ww: 0.082750189384097
        // wwo: 0.16214530461298643

        // DONUTS
        if (matchedCountry) {
          // code modified from https://stackoverflow.com/questions/33506489/how-to-get-a-path-centroid-d3
          var c_id = asia_coords[c].id || asia_coords[c].properties.ISO_A3;
          var bbox = document.getElementById('map_' + c_id).getBBox();
          svg.select('#country_names')
            .append('g')
            .attr('id', 'proportions_' + c_id)
            .append('text')
            .style('font-size', '12px')
            .attr('x', bbox.x + bbox.width/2 - 60)
            .attr('y', bbox.y + bbox.height/2 - 20)
            .style('font-weight', 600)
            .text(asia_coords[c].properties.name || asia_coords[c].properties.ADMIN)

            var pie_data = {mwo: matchedCountry.mwo, mw: matchedCountry.mw, wwo: matchedCountry.wwo, ww: matchedCountry.ww};
          
            var pie = d3.pie()
            .value(function(d) { return d[1]; })
            .sort(null);
            var data_ready = pie(Object.entries(pie_data));
          
            d3.select('#donuts')
            .append('g')
            .attr('id', 'proportions_image_' + c_id)
            .attr("transform", "translate(" + (bbox.x + bbox.width/2) + "," + (bbox.y + bbox.height/2) + ")")
            // .attr("transform", "translate(" + 200 + "," + 360 + ")")
            .selectAll()
            .data(data_ready)
            .enter()
            .append('path')
            .attr('d', d3.arc()
              .innerRadius(12)
              .outerRadius(20)
            )
            .attr('fill', function(d) { return map_colors[d.data[0]]; })
            .attr("width", width)
            .attr("height", height)
            .append("g")
        }

      (asia_coords[c].geometry.type == 'MultiPolygon') && (data_to_use = shuffle(data_to_use));
      svg.select('#all_dots')
        .append('g')
        .attr('id', 'dots_' + c_id)
        .selectAll()
        .data(data_to_use)
        .enter()
        .append("circle")
        .attr('class', 'dot')
        .attr("cx", function(d) { return projection(d)[0]; })
        .attr("cy", function(d) { return projection(d)[1]; })
        .attr("r", "1.5px")
        .attr("fill", function(d) {
          if (mwo_count++ < mwo_max) {
            return map_colors.mwo;
          } else if (mw_count++ < mw_max) {
            return map_colors.mw;
          } else if (wwo_count++ < wwo_max) {
            return map_colors.wwo;
          } else if (ww_count++ < ww_max) {
            return map_colors.ww;
          } else {
            return 'white';
          }
        })
    }
  })



}) // END of d3.csv.then()



