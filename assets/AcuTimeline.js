(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
      (factory((global.myModule = global.myModule || {}), global.d3));
}(this, function (exports, d3) {
  'use strict';
  var timeline = function () {

    var DISPLAY_TYPES = ["circle", "rect", "inicio", "fin"];

    var hover = function () { },
      mouseover = function () { },
      mouseout = function () { },
      click = function () { },
      scroll = function () { },
      labelFunction = function (label) {
        return label;
      },
      labelFloat = 0, // floats up this many pixels
      navigateLeft = function () { },
      navigateRight = function () { },
      orient = "bottom",
      width = null,
      height = null,
      rowSeparatorsColor = null,
      backgroundColor = null,
      tickFormat = {
        formatDia: d3.timeFormat("%e%b"),
        formatHora: d3.timeFormat("%H"),
        tickTimeDia: d3.timeDay,
        tickTimeHora: d3.timeHour,
        tickInterval: 1,
        tickSize: 6,
        tickValues: null,
      },
      allowZoom = true,
      axisBgColor = "white",
      chartData = {},
      //colorCycle = d3.schemeCategory10,
      //tambien puedo asi:
      colorCycle = [
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#7f7f7f",
        "#bcbd22",
        "#17becf",
        "#393b79",
        "#637939",
        "#8c6d31",
        "#843c39",
        "#7b4173",
        "#5254a3",
        "#6b6ecf",
        "#9c9ede",
        "#8ca252",
        "#bd9e39",
        "#393b79",
        "#637939",
        "#8c6d31",
        "#843c39",
        "#7b4173",
        "#5254a3",
        "#6b6ecf",
        "#9c9ede",
        "#8ca252",
        "#bd9e39",
      ],
      colorPropertyName = null,
      display = "rect",
      beginning = 0,
      labelMargin = 0,
      ending = 0,
      margin = { left: 30, right: 30, top: 30, bottom: 30 },
      maxZoom = 5,
      stacked = false,
      rotateTicks = false,
      timeIsRelative = false,
      timeIsLinear = false,
      fullLengthBackgrounds = false,
      itemHeight = 20,
      itemMargin = 5,
      navMargin = 60,
      showTimeAxis = true,
      showAxisTop = false,
      showTodayLine = false,
      timeAxisTick = false,
      timeAxisTickFormat = { stroke: "stroke-dasharray", spacing: "4 10" },
      showTodayFormat = {
        marginTop: 25,
        marginBottom: 0,
        width: 1,
        color: colorCycle,
      },
      showBorderLine = false,
      showBorderFormat = {
        marginTop: 25,
        marginBottom: 0,
        width: 1,
        color: colorCycle,
      },
      showBorderLineClass = "timeline-border-line",
      showAxisHeaderBackground = false,
      showAxisNav = false,
      showAxisCalendarYear = false,
      xAxisClass = "timeline-xAxis";

    const arcInicio = d3.arc()
      .innerRadius(0)
      .outerRadius(itemHeight / 2)
      .startAngle(Math.PI)
      .endAngle(2 * Math.PI);

    const arcFin = d3.arc()
      .innerRadius(0)
      .outerRadius(itemHeight / 2)
      .startAngle(0)
      .endAngle(Math.PI);





    var appendTimeAxis = function (g, xAxis, yPosition) {
      if (showAxisHeaderBackground) {
        appendAxisHeaderBackground(g, 0, 0);
      }

      if (showAxisNav) {
        appendTimeAxisNav(g);
      }

      var axis = g
        .append("g")
        .attr("class", xAxisClass)
        .attr("transform", "translate(" + 0 + "," + yPosition + ")")
        .call(xAxis);

      return axis;
    };

    var appendTimeAxisCalendarYear = function (nav) {
      var calendarLabel = beginning.getFullYear();

      if (beginning.getFullYear() != ending.getFullYear()) {
        calendarLabel = beginning.getFullYear() + "-" + ending.getFullYear();
      }

      nav
        .append("text")
        .attr("transform", "translate(" + 20 + ", 0)")
        .attr("x", 0)
        .attr("y", 14)
        .attr("class", "calendarYear")
        .text(calendarLabel);
    };

    var appendTimeAxisNav = function (g) {
      var timelineBlocks = 6;
      var leftNavMargin = margin.left - navMargin;
      var incrementValue = (width - margin.left) / timelineBlocks;
      var rightNavMargin = width - margin.right - incrementValue + navMargin;

      var nav = g
        .append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, 20)");
      if (showAxisCalendarYear) {
        appendTimeAxisCalendarYear(nav);
      }

      nav
        .append("text")
        .attr("transform", "translate(" + leftNavMargin + ", 0)")
        .attr("x", 0)
        .attr("y", 14)
        .attr("class", "chevron")
        .text("<")
        .on("click", function () {
          return navigateLeft(beginning, chartData);
        });

      nav
        .append("text")
        .attr("transform", "translate(" + rightNavMargin + ", 0)")
        .attr("x", 0)
        .attr("y", 14)
        .attr("class", "chevron")
        .text(">")
        .on("click", function () {
          return navigateRight(ending, chartData);
        });
    };

    var appendAxisHeaderBackground = function (g, xAxis, yAxis) {
      g.insert("rect")
        .attr("class", "row-green-bar")
        .attr("x", xAxis)
        .attr("width", width)
        .attr("y", yAxis)
        .attr("height", itemHeight)
        .attr("fill", axisBgColor);
    };

    var appendTimeAxisTick = function (g, xAxis, maxStack) {
      g.append("g")
        .attr("class", "axis")
        .attr(
          "transform",
          "translate(" +
          0 +
          "," +
          (margin.top + (itemHeight + itemMargin) * maxStack) +
          ")"
        )
        .attr(timeAxisTickFormat.stroke, timeAxisTickFormat.spacing)
        .call(
          xAxis
            .tickFormat("")
            .tickSize(
              -(margin.top + (itemHeight + itemMargin) * (maxStack - 1) + 3),
              0,
              0
            )
        );
    };

    var appendBackgroundBar = function (yAxisMapping, index, g, data, datum) {
      var greenbarYAxis =
        (itemHeight + itemMargin) * yAxisMapping[index] + margin.top;
      g.selectAll("svg")
        .data(data)
        .enter()
        .insert("rect", ":first-child")
        .attr("class", "row-green-bar")
        .attr("x", fullLengthBackgrounds ? 0 : margin.left)
        .attr(
          "width",
          fullLengthBackgrounds ? width : width - margin.right - margin.left
        )
        .attr("y", greenbarYAxis)
        .attr("height", itemHeight)
        .attr(
          "fill",
          backgroundColor instanceof Function
            ? backgroundColor(datum, index)
            : backgroundColor
        );
    };

    var appendLabel = function (gParent, yAxisMapping, index, hasLabel, datum) {
      var fullItemHeight = itemHeight + itemMargin;
      var rowsDown =
        margin.top +
        fullItemHeight / 2 +
        fullItemHeight * (yAxisMapping[index] || 1);

      gParent
        .append("text")
        .attr("class", "timeline-label")
        .attr("transform", "translate(" + labelMargin + "," + rowsDown + ")")
        .text(hasLabel ? labelFunction(datum.label) : datum.id)
        .on("click", function (d, i) {
          console.log("label click!");
          var point = d3.pointer(d, this);
          /*
           gParent
             .append("rect")
             .attr("id", "clickpoint")
             .attr("x", point[0])
             .attr("width", 10)
             .attr("height", itemHeight);.
click(d, index, datum, point, xScale.invert(point[0]));              
*/
          click(d, index, datum, point);

        });
    };

    /*###########################
        ####    START timeline    ###
        #############################*/
    function timeline(gParent) {
      var gParentSize = gParent.node().getBoundingClientRect(); // the svg size
      var gParentItem = d3.select(gParent.node()); // the svg

      var g = gParent.append("g").attr("class", "container");

      var yAxisMapping = {},
        maxStack = 1,
        minTime = 0,
        maxTime = 0;

      setWidth();

      // check if the user wants relative time
      // if so, substract the first timestamp from each subsequent timestamps
      if (timeIsRelative) {
        g.each(function (d, i) {
          var originTime = 0;
          d.forEach(function (datum, index) {
            datum.times.forEach(function (time, j) {
              if (index === 0 && j === 0) {
                originTime = time.starting_time; //Store the timestamp that will serve as origin
                time.starting_time = 0; //Set the origin
                time.ending_time = time.ending_time - originTime; //Store the relative time (millis)
              } else {
                time.starting_time = time.starting_time - originTime;
                time.ending_time = time.ending_time - originTime;
              }
            });
          });
        });
      }

      // check how many stacks we're gonna need
      // do this here so that we can draw the axis before the graph
      if (stacked || ending === 0 || beginning === 0) {
        g.each(function (d, i) {
          d.forEach(function (datum, index) {
            // create y mapping for stacked graph
            if (stacked && Object.keys(yAxisMapping).indexOf(index) == -1) {
              yAxisMapping[index] = maxStack;
              maxStack++;
            }

            // figure out beginning and ending times if they are unspecified
            datum.times.forEach(function (time, i) {
              if (beginning === 0)
                if (
                  time.starting_time < minTime ||
                  (minTime === 0 && timeIsRelative === false)
                )
                  minTime = time.starting_time;
              if (ending === 0)
                if (time.ending_time > maxTime) maxTime = time.ending_time;
            });
          });
        });

        if (ending === 0) {
          ending = maxTime;
        }
        if (beginning === 0) {
          beginning = minTime;
        }
      }

      var scaleFactor =
        (1 / (ending - beginning)) * (width - margin.left - margin.right);

      function formatDays(d) {
        var days = Math.floor(d / 86400),
          hours = Math.floor((d - days * 86400) / 3600),
          minutes = Math.floor((d - days * 86400 - hours * 3600) / 60),
          seconds = d - days * 86400 - hours * 3600 - minutes * 60;
        var output = "";
        if (seconds) {
          output = seconds + "s";
        }
        if (minutes) {
          output = minutes + "m " + output;
        }
        if (hours) {
          output = hours + "h " + output;
        }
        if (days) {
          output = days + "d " + output;
        }
        return output;
      }

      var xScale;
      var xAxis;
      switch (orient) {
        case "bottom":
          xAxis = d3.axisBottom();
          break;
        case "top":
          xAxis = d3.axisTop();
          break;
        case "left":
          xAxis = d3.axisLeft();
          break;
        case "right":
          xAxis = d3.axisRight();
          break;
        default:
          throw new Error("Orientación no válida: " + orient);
      }
      
      if (timeIsLinear) {
        xScale = d3
          .scaleLinear()
          .domain([beginning, ending])
          .range([margin.left, width - margin.right]);

        xAxis
          .scale(xScale)
          .tickFormat(formatDays)
          .tickValues(d3Array.range(0, ending, 86400));
      } else {
        xScale = d3
          .scaleTime()
          .domain([beginning, ending])
          .range([margin.left, width - margin.right]);
        // que la linea de tiempo sea en dias en vez de horas si super las 72Hs
        if (ending - beginning > 72 * 60 * 60 * 1000){
          xAxis
            .scale(xScale)
            .tickFormat(tickFormat.formatDia)
            .tickSize(tickFormat.tickSize);
        }
        else {
          xAxis
            .scale(xScale)
            .tickFormat(tickFormat.formatHora)
            .tickSize(tickFormat.tickSize);
        }
        
      }
      if (tickFormat.tickValues != null) {
        xAxis.tickValues(tickFormat.tickValues);
      } else {

        if (ending - beginning > 72 * 60 * 60 * 1000) {
          xAxis.ticks(
            tickFormat.numTicks || tickFormat.tickTimeDia,
            tickFormat.tickInterval
          );
        }
        else {
          xAxis.ticks(
            tickFormat.numTicks || tickFormat.tickTimeHora,
            tickFormat.tickInterval
          );
        }






      }

      // append a view for zoom/pan support
      var view = g.append("g").attr("class", "view");

      // draw the chart
      g.each(function (d, i) {
        chartData = d;
        d.forEach(function (datum, index) {
          var data = datum.times;
          data.forEach(function (d) {
            d.name = datum.name;
          });

          var hasLabel = typeof datum.label != "undefined";

          // issue warning about using id per data set. Ids should be individual to data elements
          if (typeof datum.id != "undefined") {
            console.warn(
              "d3Timeline Warning: Ids per dataset is deprecated in favor of a 'class' key. Ids are now per data element."
            );
          }

          if (backgroundColor) {
            appendBackgroundBar(yAxisMapping, index, g, data, datum);
          }

          view
            .selectAll("svg")
            .data(data)
            .enter()

            .append(function (d, i) {
              if ("display" in d && d.display === "inicio" || d.display === "fin") {
                return document.createElementNS(d3.namespaces.svg, "path");
              }
              return document.createElementNS(d3.namespaces.svg, d.display || display);
            })

            .attr("x", getXPos)
            .attr("y", getStackPosition)
            .attr("width", function (d, i) {
              return (d.ending_time - d.starting_time) * scaleFactor;
            })
            .attr("cy", function (d, i) {
              return getStackPosition(d, i) + itemHeight / 2;
            })
            .attr("cx", getXPos)
            .attr("r", itemHeight / 2)
            .attr("height", itemHeight)
            .style("fill", function (d, i) {
              // con el color va a haber error: return colorCycle[index] originalmente era return colorCycle(index)
              // console.log(colorPropertyName, i)
              // console.log(colorCycle[index])
              var dColorPropName;
              if (d.color) return d.color;
              if (colorPropertyName) {
                dColorPropName = d[colorPropertyName];
                if (dColorPropName) {
                  return colorCycle(dColorPropName);
                } else {
                  return colorCycle(datum[colorPropertyName]);
                }
              }
              return colorCycle[index];
            })
            .on("mousemove", function (d, i) {
              hover(d, index, datum, i);
            })
            .on("mouseover", function (d, i) {
              mouseover(d, i, datum, i);
            })
            .on("mouseout", function (d, i) {
              mouseout(d, i, datum, i);
            })
            .on("click", function (d, i) {
              var point = d3.pointer(d, this);
              //var point = d3.mouse(this);

              //var selectedRect = d3.select(this).node();
              //var selectorLabel = "text#" + selectedRect.id + ".textnumbers";
              //var selectedLabel = d3.select(selectorLabel).node();


              click(
                d,
                index,
                datum,
                //selectedLabel,
                //selectedRect,
                xScale.invert(point[0])
              );


              //console.log("-->", d.srcElement.getAttribute("cy"))
            })
            .attr("class", function (d, i) {
              return datum.class
                ? "timelineSeries_" + datum.class
                : "timelineSeries_" + index;
            })
            .attr("id", function (d, i) {
              // use deprecated id field
              if (datum.id && !d.id) {
                return "timelineItem_" + datum.id;
              }

              return d.id ? d.id : "timelineItem_" + index + "_" + i;
            })

            .attr("d", (d) => {
              if (d.display === "fin") return arcFin();
              if (d.display === "inicio") return arcInicio();
              return null;
            })
            .attr("transform", function (d) {
              if (d.display === "inicio" || d.display === "fin") {
                return `translate(${getXPos(d)}, ${getStackPosition(d) + itemHeight / 2})`;
              }
              return null;
            });
          ;

          // appends the labels to the boxes - DAY/HOUR LABEL
          view
            .selectAll("svg")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "textlabels")
            .attr("id", function (d) {
              return d.id;
            })
            .attr("x", function (d, i) {
              return getXTextPos(d, i, d.label, ".textlabels");
            })
            .attr("y", getStackTextPosition() - labelFloat)
            .text(function (d) {
              return d.label;
            })
            .on("click", function (d, i) {
              // when clicking on the label, call the click for the rectangle with the same id


              var point = d3.pointer(d, this);
              //var point = d3.mouse(this);
              var id = this.id;
              //var labelSelector = "text#" + id + ".textnumbers";
              //var selectedLabel = d3.select(labelSelector).node();
              //var selector = "rect#" + id;
              //var selectedRect = d3.select(selector).node();
              click(
                d,
                index,
                datum,
                // selectedLabel,
                // selectedRect,
                xScale.invert(point[0])
              );
              console.log(d.srcElement.__data__.label);
            });

          // appends the NUMBER LABEL
          view
            .selectAll("svg")
            .data(data)
            .enter()
            .filter(function (d) {
              return d.labelNumber !== undefined;
            })
            .append("text")
            .attr("class", "textnumbers")
            .attr("id", function (d) {
              return d.id;
            })
            .attr("x", function (d, i) {
              return getXTextPos(d, i, d.labelNumber, ".textnumbers");
            })
            .attr("y", getStackTextPosition)
            .text(function (d) {
              return d.labelNumber;
            })
            .on("click", function (d, i) {
              // when clicking on the label, call the click for the rectangle with the same id
              var point = d3.pointer(d, this);
              //var point = d3.mouse(this);
              var id = this.id;
              var selectedLabel = d3.select(this).node();
              var selector = "rect#" + id;
              var selectedRect = d3.select(selector).node();
              click(
                d,
                index,
                datum,
                selectedLabel,
                selectedRect,
                xScale.invert(point[0])
              );
            });

          if (rowSeparatorsColor) {
            var lineYAxis =
              itemHeight +
              itemMargin / 2 +
              margin.top +
              (itemHeight + itemMargin) * yAxisMapping[index];
            gParent
              .append("svg:line")
              .attr("class", "row-separator")
              .attr("x1", 0 + margin.left)
              .attr("x2", width - margin.right)
              .attr("y1", lineYAxis)
              .attr("y2", lineYAxis)
              .attr("stroke-width", 1)
              .attr("stroke", rowSeparatorsColor);
          }

          // add the label
          if (hasLabel) {
            appendLabel(gParent, yAxisMapping, index, hasLabel, datum);
          }

          if (typeof datum.icon !== "undefined") {
            gParent
              .append("image")
              .attr("class", "timeline-label")
              .attr(
                "transform",
                "translate(" +
                0 +
                "," +
                (margin.top + (itemHeight + itemMargin) * yAxisMapping[index]) +
                ")"
              )
              .attr("xlink:href", datum.icon)
              .attr("width", margin.left)
              .attr("height", itemHeight);
          }

          function getStackPosition(d, i) {
            if (stacked) {
              return margin.top + (itemHeight + itemMargin) * yAxisMapping[index];
            }
            return margin.top;
          }
          function getStackTextPosition(d, i) {
            if (stacked) {
              return (
                margin.top +
                (itemHeight + itemMargin) * yAxisMapping[index] +
                itemHeight * 0.75
              );
            }
            return margin.top + itemHeight * 0.75;
          }
        });
      });

      var belowLastItem = margin.top + (itemHeight + itemMargin) * maxStack;
      var aboveFirstItem = margin.top;
      var timeAxisYPosition = showAxisTop ? aboveFirstItem : belowLastItem;
      var gX;
      if (showTimeAxis) {
        gX = appendTimeAxis(g, xAxis, timeAxisYPosition);
      }
      if (timeAxisTick) {
        appendTimeAxisTick(g, xAxis, maxStack);
      }

      if (width > gParentSize.width) {
        // only if the scrolling should be allowed
        var move = function () {
          g.select(".view").attr(
            "transform",
            "translate(" +
            d3.event.transform.x +
            ",0)" +
            "scale(" +
            d3.event.transform.k +
            " 1)"
          );

          g.selectAll(".timeline-xAxis").attr("transform", function (d) {
            return (
              "translate(" +
              d3.event.transform.x +
              ", " +
              timeAxisYPosition +
              ")" +
              "scale(" +
              d3.event.transform.k +
              " 1)"
            );
          });

          var new_xScale = d3.event.transform.rescaleX(xScale);
          g.selectAll(".timeline-xAxis").call(function (d) {
            xAxis.scale(new_xScale);
          });

          var xpos = -d3.event.transform.x;
          scroll(xpos, xScale);
        };
      }

      var zoom = d3
        .zoom()
        .scaleExtent([0, maxZoom]) // max zoom defaults to 5
        .translateExtent([
          [0, 0],
          [width, 0],
        ]) // [x0, y0], [x1, y1] don't allow translating y-axis
        .on("zoom", move);

      gParent.classed("scrollable", true).call(zoom);

      if (!allowZoom) {
        g.on("wheel", function () {
          d3.event.preventDefault();
          d3.event.stopImmediatePropagation();
        });
        g.on("dblclick.zoom", function () {
          d3.event.preventDefault();
          d3.event.stopImmediatePropagation();
        });
      }

      if (rotateTicks) {
        g.selectAll(".tick text").attr("transform", function (d) {
          return (
            "rotate(" +
            rotateTicks +
            ")translate(" +
            (this.getBBox().width / 2 + 10) +
            "," + // TODO: change this 10
            this.getBBox().height / 2 +
            ")"
          );
        });
      }

      // use the size of the elements added to the timeline to set the height
      //var gSize = g._groups[0][0].getBoundingClientRect();
      var gSize = g.node().getBoundingClientRect();
      setHeight();

      if (showBorderLine) {
        g.each(function (d, i) {
          d.forEach(function (datum) {
            var times = datum.times;
            times.forEach(function (time) {
              appendLine(
                xScale(time.starting_time),
                showBorderFormat,
                showBorderLineClass
              );
              appendLine(
                xScale(time.ending_time),
                showBorderFormat,
                showBorderLineClass
              );
            });
          });
        });
      }

      if (showTodayLine) {
        var todayLine = xScale(new Date());
        appendLine(todayLine, showTodayFormat);
      }

      function getXPos(d, i) {
        return margin.left + (d.starting_time - beginning) * scaleFactor;
      }

      function getTextWidth(text, font) {
        // re-use canvas object for better performance
        var canvas =
          getTextWidth.canvas ||
          (getTextWidth.canvas = document.createElement("canvas"));
        var context = canvas.getContext("2d");
        context.font = font;
        var metrics = context.measureText(text);
        return metrics.width;
      }

      function getXTextPos(d, i, text, style) {
        var width = 0;
        if (d.ending_time) {
          width = ((d.ending_time - d.starting_time) / 2) * scaleFactor;
        }
        if (text && style) {
          // get the style data for the class selector pass in
          var textl = getComputedStyle(document.querySelector(style));
          // create a fontsize fontfamily string - 12pt Graphik
          var fontInfo = textl.fontSize + " " + textl.fontFamily;
          // calculate the width of the text in that fontsize
          var tl = getTextWidth(text, fontInfo);
          // subtract half of the text length from the xPosition to keep the text centered
          var textLength = tl / 2;
          var xPosition =
            margin.left +
            (d.starting_time - beginning) * scaleFactor +
            width -
            textLength;
          return xPosition;
        } else {
          return margin.left + (d.starting_time - beginning) * scaleFactor + 5;
        }
      }

      function setHeight() {
        if (!height && !gParentSize.height) {
          if (itemHeight) {
            // set height based off of item height
            height = gSize.height + gSize.top - gParentSize.top;
            // set bounding rectangle height
            d3.select(gParent).node().attr("height", height);
          } else {
            throw "height of the timeline is not set";
          }
        } else {
          if (!height) {
            height = gParentSize.height;
          } else {
            gParentItem.node().attr("height", height);
            //view.node().attr("height", height);
          }
        }
      }

      function setWidth() {
        if (!width && !gParentSize.width) {
          try {
            width = Math.floor(gParentItem.node().attr("width"));
            if (!width) {
              throw "width of the timeline is not set. As of Firefox 27, timeline().with(x) needs to be explicitly set in order to render";
            }
          } catch (err) {
            console.log(err);
          }
        } else if (!width && gParentSize.width) {
          try {
            width = gParentSize.width;
          } catch (err) {
            console.log(err);
          }
        }
        // if both are set, do nothing
      }

      function appendLine(lineScale, lineFormat, lineClass) {
        lineClass = lineClass || "timeline-line";
        view
          .append("svg:line")
          .attr("x1", lineScale)
          .attr("y1", lineFormat.marginTop)
          .attr("x2", lineScale)
          .attr("y2", height - lineFormat.marginBottom)
          .attr("class", lineClass)
          .style("stroke", lineFormat.color) //"rgb(6,120,155)"
          .style("stroke-width", lineFormat.width);
      }
    }

    // SETTINGS

    timeline.margin = function (p) {
      if (!arguments.length) return margin;
      margin = p;
      return timeline;
    };

    timeline.orient = function (orientation) {
      if (!arguments.length) return orient;
      orient = orientation;
      return timeline;
    };

    timeline.itemHeight = function (h) {
      if (!arguments.length) return itemHeight;
      itemHeight = h;
      return timeline;
    };

    timeline.itemMargin = function (h) {
      if (!arguments.length) return itemMargin;
      itemMargin = h;
      return timeline;
    };

    timeline.navMargin = function (h) {
      if (!arguments.length) return navMargin;
      navMargin = h;
      return timeline;
    };

    timeline.height = function (h) {
      if (!arguments.length) return height;
      height = h;
      return timeline;
    };

    timeline.width = function (w) {
      if (!arguments.length) return width;
      width = w;
      return timeline;
    };

    timeline.display = function (displayType) {
      if (!arguments.length || DISPLAY_TYPES.indexOf(displayType) == -1)
        return display;
      display = displayType;
      return timeline;
    };

    timeline.labelFormat = function (f) {
      if (!arguments.length) return labelFunction;
      labelFunction = f;
      return timeline;
    };

    timeline.tickFormat = function (format) {
      if (!arguments.length) return tickFormat;
      tickFormat = format;
      return timeline;
    };

    timeline.allowZoom = function (zoomSetting) {
      if (!arguments.length) return allowZoom;
      allowZoom = zoomSetting;
      return timeline;
    };

    timeline.maxZoom = function (max) {
      if (!arguments.length) return maxZoom;
      maxZoom = max;
      return timeline;
    };

    timeline.hover = function (hoverFunc) {
      //console.log("Hover")
      if (!arguments.length) return hover;
      hover = hoverFunc;
      return timeline;
    };

    timeline.mouseover = function (mouseoverFunc) {
      if (!arguments.length) return mouseover;
      mouseover = mouseoverFunc;
      return timeline;
    };

    timeline.mouseout = function (mouseoutFunc) {
      if (!arguments.length) return mouseout;
      mouseout = mouseoutFunc;
      return timeline;
    };

    timeline.click = function (clickFunc) {
      //console.log("entré en timeline.click")
      if (!arguments.length) return click;
      click = clickFunc;
      return timeline;
    };

    timeline.scroll = function (scrollFunc) {
      if (!arguments.length) return scroll;
      scroll = scrollFunc;
      return timeline;
    };

    timeline.colors = function (colorFormat) {
      if (!arguments.length) return colorCycle;
      colorCycle = colorFormat;
      return timeline;
    };

    timeline.beginning = function (b) {
      if (!arguments.length) return beginning;
      beginning = b;
      return timeline;
    };

    timeline.ending = function (e) {
      if (!arguments.length) return ending;
      ending = e;
      return timeline;
    };

    timeline.labelMargin = function (m) {
      if (!arguments.length) return labelMargin;
      labelMargin = m;
      return timeline;
    };

    timeline.labelFloat = function (f) {
      if (!arguments.length) return labelFloat;
      labelFloat = f;
      return timeline;
    };

    timeline.rotateTicks = function (degrees) {
      if (!arguments.length) return rotateTicks;
      rotateTicks = degrees;
      return timeline;
    };

    timeline.stack = function () {
      stacked = !stacked;
      return timeline;
    };

    timeline.relativeTime = function () {
      timeIsRelative = !timeIsRelative;
      return timeline;
    };

    timeline.linearTime = function () {
      timeIsLinear = !timeIsLinear;
      return timeline;
    };

    timeline.showBorderLine = function () {
      showBorderLine = !showBorderLine;
      return timeline;
    };

    timeline.showBorderFormat = function (borderFormat) {
      if (!arguments.length) return showBorderFormat;
      showBorderFormat = borderFormat;
      return timeline;
    };

    // CSS class for the lines added by showBorder
    timeline.showBorderLineClass = function (borderClass) {
      if (!arguments.length) return showBorderLineClass;
      showBorderLineClass = borderClass;
      return timeline;
    };

    timeline.showToday = function () {
      showTodayLine = !showTodayLine;
      return timeline;
    };

    timeline.showTodayFormat = function (todayFormat) {
      if (!arguments.length) return showTodayFormat;
      showTodayFormat = todayFormat;
      return timeline;
    };

    timeline.colorProperty = function (colorProp) {
      if (!arguments.length) return colorPropertyName;
      colorPropertyName = colorProp;
      return timeline;
    };

    timeline.rowSeparators = function (color) {
      if (!arguments.length) return rowSeparatorsColor;
      rowSeparatorsColor = color;
      return timeline;
    };

    timeline.background = function (color) {
      if (!arguments.length) return backgroundColor;
      backgroundColor = color;
      return timeline;
    };

    timeline.showTimeAxis = function () {
      showTimeAxis = !showTimeAxis;
      return timeline;
    };

    timeline.showAxisTop = function () {
      showAxisTop = !showAxisTop;
      return timeline;
    };

    timeline.showAxisCalendarYear = function () {
      showAxisCalendarYear = !showAxisCalendarYear;
      return timeline;
    };

    timeline.showTimeAxisTick = function () {
      timeAxisTick = !timeAxisTick;
      return timeline;
    };

    timeline.fullLengthBackgrounds = function () {
      fullLengthBackgrounds = !fullLengthBackgrounds;
      return timeline;
    };

    timeline.showTimeAxisTickFormat = function (format) {
      if (!arguments.length) return timeAxisTickFormat;
      timeAxisTickFormat = format;
      return timeline;
    };

    timeline.showAxisHeaderBackground = function (bgColor) {
      showAxisHeaderBackground = !showAxisHeaderBackground;
      if (bgColor) {
        axisBgColor = bgColor;
      }
      return timeline;
    };

    // CSS class for the x-axis
    timeline.xAxisClass = function (axisClass) {
      if (!arguments.length) return xAxisClass;
      xAxisClass = axisClass;
      return timeline;
    };

    timeline.navigate = function (navigateBackwards, navigateForwards) {
      if (!arguments.length) return [navigateLeft, navigateRight];
      navigateLeft = navigateBackwards;
      navigateRight = navigateForwards;
      showAxisNav = !showAxisNav;
      return timeline;
    };

    timeline.version = function () {
      return "1.0.0";
    };
      return timeline;
  };
  exports.timeline = timeline;
}));


