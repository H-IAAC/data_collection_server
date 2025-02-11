class Graph {

    // Number of pixels for each 1000ms in csv
    x;
    y;

    constructor(element_id, graph_data, graph_timelapse, offset) {
        this.element_id = element_id;
        this.graph_data = graph_data;
        this.graph_timelapse = graph_timelapse;
        this.offset = Number(offset);
    }

    createdGraph(csv_file, currentTime) {
        var self = this;

        // set the dimensions and margins of the graph
        var margin = { top: 10, right: 10, bottom: 10, left: 60 },
            width = 460 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        //var svg = d3.select("#svg_graph_01")
        var svg = d3.select("#" + self.element_id)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "250px")
            .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        d3.csv(self.graph_data.path + csv_file, function (data) {
            return { date: data["VideoTimelapse"],
                     value1: (isNaN(data["Value 1"])) ? 0 : data["Value 1"],
                     value2: (isNaN(data["Value 2"])) ? 0 : data["Value 2"],
                     value3: (isNaN(data["Value 3"])) ? 0 : data["Value 3"]
                    }
        }, function (data) {
            self.data = data;

            var graph_X_total_of_pixels_to_represent_1sec = 300;

            // Number of pixels for each 1000ms in csv
            self.graph_X_max_value = Number(data.slice(-1)[0].date);
            self.graph_X_total_of_seconds = data.slice(-1)[0].date / 1000; // '1000' is use because csv data is in milisec

            // Graph axis X
            self.x = d3.scaleLinear()
                // domain is the range displayed
                .domain([-1000, self.graph_X_max_value + 1000]) // from '0' to 'timestamp' value in the last csv row

                // range is the pixels used to display the 'domain'
                .range([0, self.graph_X_total_of_seconds * graph_X_total_of_pixels_to_represent_1sec]);
            var x_bar = svg.append("g")
                .attr("class", self.element_id + "_axisX")
                .attr("transform", "translate(0," + height + ")");

            x_bar.call(d3.axisBottom(self.x));
            x_bar.append("g")
                .attr("class", "tick tickRef")
                .attr("transform", "translate(" + (self.x(0)) + ")");

            // Filter CSV data to render a limited data, based on the timestamp
            var data_limited = data.filter(function (item) {
                return item.date <= self.graph_timelapse;
            });
            //console.log("data_limited stringify: " + JSON.stringify(data_limited));          

            // Graph axis Y
            var min_max = self.getMinMax(data);
            self.y_min_value = min_max[0];
            self.y_max_value = min_max[1];

            self.y = d3.scaleLinear()
                .domain([self.y_min_value, self.y_max_value])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(self.y));

            // Value1 line
            svg.append("path")
                .datum(data_limited)
                .attr("class", self.element_id + "_graphValue1")
                .attr("fill", "none")
                .attr("stroke", "#ff0000")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function (d) { return self.x(d.date) })
                    .y(function (d) { return self.y(d.value1) })
                );

            // Value2 line
            svg.append("path")
                .datum(data_limited)
                .attr("class", self.element_id + "_graphValue2")
                .attr("fill", "none")
                .attr("stroke", "#00ff00")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function (d) { return self.x(d.date) })
                    .y(function (d) { return self.y(d.value2) })
                );

            // Value3 line
            svg.append("path")
                .datum(data_limited)
                .attr("class", self.element_id + "_graphValue3")
                .attr("fill", "none")
                .attr("stroke", "#0000ff")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function (d) { return self.x(d.date) })
                    .y(function (d) { return self.y(d.value3) })
                );

            svg.append('line')
                .style("stroke", "black")
                .style("opacity", 0.3)
                .attr("x1", self.x(0))
                .attr("y1", self.y(self.y_min_value))
                .attr("x2", self.x(0))
                .attr("y2", self.y(self.y_max_value));

            self.removeUnwantedXaxisValues(svg);

            if (currentTime != 0)
                self.update(currentTime);
        });

    }

    getMinMax(data) {
        var minValue1 = data.reduce((min, p) => Math.min(p.value1, min), data[0].value1);
        var minValue2 = data.reduce((min, p) => Math.min(p.value2, min), data[0].value2);
        var minValue3 = data.reduce((min, p) => Math.min(p.value3, min), data[0].value3);

        var maxValue1 = data.reduce((max, p) => Math.max(p.value1, max), data[0].value1);
        var maxValue2 = data.reduce((max, p) => Math.max(p.value2, max), data[0].value2);
        var maxValue3 = data.reduce((max, p) => Math.max(p.value3, max), data[0].value3);

         return [Math.min(minValue1, minValue2, minValue3), Math.max(maxValue1, maxValue2, maxValue3)];
    }

    removeUnwantedXaxisValues(svg) {
        svg.selectAll("[class$='_axisX']").selectAll(".tick")
            .each(function (d) {
                if (d === -1000 || d === -500) {
                    this.remove();
                }
            });
    }

    update(currentTime) {
        self = this;
        var svg = d3.selectAll("svg");

        if (self.offset >= 0)
            currentTime = currentTime + self.offset;
        else
            currentTime = currentTime - Math.abs(self.offset);

        this.x.domain([currentTime - 1000, (this.graph_X_max_value + (currentTime + 1000))]);

        //move the xaxis left
        svg.select("." + this.element_id + "_axisX")
            .transition()
            .duration(0)
            .delay(0)
            .duration(0)
            .ease(d3.easeLinear)
            .call(d3.axisBottom(this.x));

        svg.select("." + this.element_id + "_axisX")
            .append("g")
            .attr("class", "tick tickRef")
            .attr("transform", "translate(" + this.x(currentTime) + ")")
            .append("text")
            .attr("fill", "#000")
            .attr("fill", "red")
            .attr("y", -180)
            .text(function (d) { return (self.millisToMinutesAndSeconds(currentTime)); });

        // Filter CSV data to render a limited data, based on the timestamp
        var data_limited = this.data.filter(function (item) {
            return ((item.date <= self.graph_timelapse + currentTime) && (item.date > currentTime - 1000));
        });

        svg.select("." + this.element_id + "_graphValue1")
            .datum(data_limited)
            .attr("fill", "none")
            .attr("stroke", "#ff0000")
            .attr("stroke-width", 1.5)
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .ease(d3.easeLinear)
            .attr("d", d3.line()
                .x(function (d) { return self.x(d.date) })
                .y(function (d) { return self.y(d.value1) })
            );

        svg.select("." + this.element_id + "_graphValue2")
            .datum(data_limited)
            .attr("fill", "none")
            .attr("stroke", "#00ff00")
            .attr("stroke-width", 1.5)
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .attr("d", d3.line()
                .x(function (d) { return self.x(d.date) })
                .y(function (d) { return self.y(d.value2) })
            );

        svg.select("." + this.element_id + "_graphValue3")
            .datum(data_limited)
            .attr("fill", "none")
            .attr("stroke", "#0000ff")
            .attr("stroke-width", 1.5)
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .attr("d", d3.line()
                .x(function (d) { return self.x(d.date) })
                .y(function (d) { return self.y(d.value3) })
            );

        this.removeUnwantedXaxisValues(svg);
    }

    millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return (
            seconds == 60 ?
            (minutes+1) + ":00" :
            minutes + ":" + (seconds < 10 ? "0" : "") + seconds
        );
    }
}