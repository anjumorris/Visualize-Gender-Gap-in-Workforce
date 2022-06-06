// var defaultCountry = "India";
// var defaultYear = "2011";

var color = d3.scaleOrdinal(d3.schemeCategory10);//d3.scale.category10();

// Code block for Women
//country,year,womenJobCategory,womenPercents,menJobCategory,menPercents

const countryList = ["India", "Mongolia", "Japan"]
const yearList = ["2015", "2016", "2017"]

d3.select("#selectCountry")
.selectAll('myOptions')
.data(countryList)
.enter()
.append('option')
.text(function (d) { return d; }) // text showed in the menu
.attr("value", function (d) { return d; }) // corresponding value returned by the button

d3.select("#selectYear")
.selectAll('myOptions')
.data(yearList)
.enter()
.append('option')
.text(function (d) { return d; }) // text showed in the menu
.attr("value", function (d) { return d; }) // corresponding value returned by the button

// updateTooltip(defaultCountry, defaultYear)
function updateTooltip(selectedCountry, selectedYear) {
    var total = 0;
    var width,
        height,
        widthSquares = 10,
        heightSquares = 10,
        squareSize = 20,
        squareValue = 0,
        gap = 1,
        theDataFemale = [],
        theDataMale = [];

    d3.csv("https://raw.githubusercontent.com/UlyssesLin/world_bank/wafflechart/VA_wafflechart_new/waffle_Wrangled.csv", function (d) {
        return {
            country: d.country, year: d.year, womenJobCategory: d.womenJobCategory,
            womenPercents: d.womenPercents, menJobCategory: d.menJobCategory, menPercents: d.menPercents
        }
    }).then(function (data) {
            data = data.filter(function (row) {
            return row['country'] == selectedCountry && row['year'] == selectedYear;
        })



    //total
    total = d3.sum(data, function (d) { return d.womenPercents; });

    if (total != 0) {

        //value of a square
        squareValue = total / (widthSquares * heightSquares);

        //remap data
        data.forEach(function (d, i) {
        d.womenPercents = +d.womenPercents;
        d.units = Math.floor(d.womenPercents / squareValue);
        theDataFemale = theDataFemale.concat(
            Array(d.units + 1).join(1).split('').map(function () {
            return {
                squareValue: squareValue,
                units: d.units,
                womenPercents: d.womenPercents,
                groupIndex: i
            };
            })
        );
        });

        width = (squareSize * widthSquares) + widthSquares * gap + 25;
        height = (squareSize * heightSquares) + heightSquares * gap + 25;

        var oldwaffle = d3.select("#waffleFemale")
        oldwaffle.selectAll("*").remove();

        var waffle = d3.select("#waffleFemale")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .selectAll("div")
        .data(theDataFemale)
        .enter()
        .append("rect")
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", function (d) {
            return color(d.groupIndex);
        })
        .attr("x", function (d, i) {
            //group n squares for column
            col = Math.floor(i / heightSquares);
            return (col * squareSize) + (col * gap);
        })
        .attr("y", function (d, i) {
            row = i % heightSquares;
            return (heightSquares * squareSize) - ((row * squareSize) + (row * gap))
        })
        .append("title")
        .text(function (d, i) {
            return "Sectors: " + data[d.groupIndex].womenJobCategory + " | " + d.units + "%"
        })

        //add legend with categorical data
        var oldlegend = d3.select("#legend")
        oldlegend.selectAll("*").remove();

        var legend = d3.select("#legend")
        .append("svg")
        .attr('width', 300)
        .attr('height', 60)
        .append('g')
        .selectAll("div")
        .data(data)
        .enter()
        .append("g")
        .attr('transform', function (d, i) { return "translate(0," + i * 20 + ")"; });
        legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function (d, i) { return color(i) });
        legend.append("text")
        .attr("x", 25)
        .attr("y", 13)
        .text(function (d) { return d.womenJobCategory });

        //add value of a unit square
        var legend2 = d3.select("#legend")
        .select('svg')
        .append('g')
        .attr('transform', "translate(100,0)");

        legend2.append("text")
        .attr('y', '14')
        .attr('font-size', '18px')
        .attr("fill", "#444444");

        d3.select("#no_data")
            .style("display", "none");
        d3.select("#has_data")
            .style("display", "block");
    } else {
        d3.select("#no_data")
            .style("display", "block");
        d3.select("#has_data")
            .style("display", "none");
    }
});



// Code block for Men B
d3.csv("https://raw.githubusercontent.com/UlyssesLin/world_bank/wafflechart/VA_wafflechart_new/waffle_Wrangled.csv", function (d) {
    return {
    country: d.country, year: d.year, womenJobCategory: d.womenJobCategory,
    womenPercents: d.womenPercents, menJobCategory: d.menJobCategory, menPercents: d.menPercents
    }
}).then(function (data) {
    data = data.filter(function (row) {
    return row['country'] == selectedCountry && row['year'] == selectedYear;
    })

    //total
    total = d3.sum(data, function (d) { return d.menPercents; });

    if (total != 0) {

        //value of a square
        squareValue = total / (widthSquares * heightSquares);

        //remap data
        data.forEach(function (d, i) {
        d.menPercents = +d.menPercents;
        d.units = Math.floor(d.menPercents / squareValue);
        theDataMale = theDataMale.concat(
            Array(d.units + 1).join(1).split('').map(function () {
            return {
                squareValue: squareValue,
                units: d.units,
                menPercents: d.menPercents,
                groupIndex: i
            };
            })
        );
        });

        width = (squareSize * widthSquares) + widthSquares * gap + 25;
        height = (squareSize * heightSquares) + heightSquares * gap + 25;

        var oldwaffle2 = d3.select("#waffleMale")
        oldwaffle2.selectAll("*").remove();
        
        var waffle2 = d3.select("#waffleMale")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .selectAll("div")
        .data(theDataMale)
        .enter()
        .append("rect")
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", function (d) {
            return color(d.groupIndex);
        })
        .attr("x", function (d, i) {
            //group n squares for column
            col = Math.floor(i / heightSquares);
            return (col * squareSize) + (col * gap);
        })
        .attr("y", function (d, i) {
            row = i % heightSquares;
            return (heightSquares * squareSize) - ((row * squareSize) + (row * gap))
        })
        .append("title")
        .text(function (d, i) {
            return "Sectors: " + data[d.groupIndex].menJobCategory + " | " + d.units + "%"
        });
    }
});

// When the button is changed, run the updateChart function
d3.select("#selectCountry").on("change", function (event, d) {
    // recover the option that has been chosen
    const selectedC = d3.select(this).property("value")
    const selectedY = d3.select("#selectYear").property("value")
    // run the updateChart function with this selected option
    updateTooltip(selectedC, selectedY)
})

// When the button is changed, run the updateChart function
d3.select("#selectYear").on("change", function (event, d) {
    // recover the option that has been chosen
    const selectedY = d3.select(this).property("value")
    const selectedC = d3.select("#selectCountry").property("value")
    // run the updateChart function with this selected option
    updateTooltip(selectedC, selectedY)
})
}