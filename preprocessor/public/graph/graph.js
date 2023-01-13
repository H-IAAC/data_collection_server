class Graph {

    // Number of pixels for each 1000ms in csv
    #graph_X_max_value;
    #graph_X_total_of_seconds;

    x;
    y;

    #y_min_value;
    #y_max_value;

    constructor(element_id) {
        this.element_id = element_id;
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

        /*svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(csv_file);*/



        //d3.csv(data.path + data.csv[0], function (data) {
        d3.csv(data.path + csv_file, function (data) {
            //console.log(data["Timestamp"] + " " + data["Value 1"]);
            return { date: data["Timestamp"], value1: data["Value 1"], value2: data["Value 2"], value3: data["Value 3"] }

        }, function (data) {
            var graph_X_total_of_pixels_to_represent_1sec = 300;

            //console.log("d3.extent(data, function (d) { return d.date; }): " + d3.extent(data, function (d) { return d.date; }));
            //console.log("d3.max(data, function (d) { return d.date; }): " + d3.max(data, function (d) { return d.date; }));
            //console.log("data: " + JSON.stringify(data.slice(-1)[0].date));
            //console.log("width: " + width);

            // Number of pixels for each 1000ms in csv
            self.graph_X_max_value = Number(data.slice(-1)[0].date);
            self.graph_X_total_of_seconds = data.slice(-1)[0].date / 1000; // '1000' is use because csv data is in milisec


            /*console.log("graph_X_max_value: " + self.graph_X_max_value );
            console.log("graph_X_total_of_seconds: " + self.graph_X_total_of_seconds );
            console.log("graph_X_total_of_pixels_to_represent_1sec: " + graph_X_total_of_pixels_to_represent_1sec );*/

            // Graph axis X
            self.x = d3.scaleLinear()
                // domain is the range displayed
                .domain([-1000, self.graph_X_max_value + 1000]) // from '0' to 'timestamp' value in the last csv row
                //.domain([currentTime - 1000, (self.graph_X_max_value + (currentTime + 1000))])



                // range is the pixels used to display the 'domain'
                .range([0, self.graph_X_total_of_seconds * graph_X_total_of_pixels_to_represent_1sec]);
            var x_bar = svg.append("g")
                .attr("class", self.element_id + "_axisX")
                .attr("transform", "translate(0," + height + ")");


            x_bar.call(d3.axisBottom(self.x));
            x_bar.append("g")
                .attr("class", "tick tickRef")
                .attr("transform", "translate(" + (self.x(0)) + ")");



            // Graph axis Y
            //console.log("data stringify: " + JSON.stringify(data));
            self.y_min_value = Math.min(...data.map(o => o.value1), ...data.map(o => o.value2), ...data.map(o => o.value3),
                ...data.map(o => o.value2), ...data.map(o => o.value2), ...data.map(o => o.value2),
                ...data.map(o => o.value3), ...data.map(o => o.value3), ...data.map(o => o.value3),
            );
            self.y_max_value = Math.max(...data.map(o => o.value1), ...data.map(o => o.value2), ...data.map(o => o.value3),
                ...data.map(o => o.value2), ...data.map(o => o.value2), ...data.map(o => o.value2),
                ...data.map(o => o.value3), ...data.map(o => o.value3), ...data.map(o => o.value3),
            );

            //console.log("min: " + self.y_min_value);
            //console.log("max: " + self.y_max_value);

            self.y = d3.scaleLinear()
                .domain([self.y_min_value, self.y_max_value])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(self.y));

            // Value1 line
            svg.append("path")
                .datum(data)
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
                .datum(data)
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
                .datum(data)
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

    removeUnwantedXaxisValues(svg) {
        svg.selectAll("[class$='_axisX']").selectAll(".tick")
            .each(function (d) {
                if (d === -1000 || d === -500) {
                    this.remove();
                }
            });
    }

    update(currentTime) {
        var svg = d3.selectAll("svg");

        //console.log("currentTime: " + currentTime);
        //console.log("--> currentTime: " + (currentTime - 1000));
        //console.log(this.element_id + " graph_X_max_value: " + this.graph_X_max_value);
        //console.log("--> graph_X_max_value: " + (this.graph_X_max_value + (currentTime + 1000)));
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
            .attr("y", -5)
            .text(function (d) { return (parseInt(currentTime, 10) + "ms"); });

        //move the graph left
        /*console.log(this.element_id + " currentTime: " + currentTime);
        console.log(this.element_id + " x(0): " + this.x(0));
        console.log(this.element_id + " x(currentTime): " + this.x(currentTime));
        console.log(this.element_id + " graph_X_max_value: " + this.graph_X_max_value);
        console.log(this.element_id + " x(graph_X_max_value): " + (this.x(this.graph_X_max_value)));
        */

        svg.select("." + this.element_id + "_graphValue1")
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .ease(d3.easeLinear)
            .attr("transform", "translate(" + (this.x(0) - this.x(currentTime)) + ")");
        svg.select("." + this.element_id + "_graphValue2")
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .ease(d3.easeLinear)
            .attr("transform", "translate(" + (this.x(0) - this.x(currentTime)) + ")");
        svg.select("." + this.element_id + "_graphValue3")
            .attr("transform", null)
            .transition()
            .delay(0)
            .duration(0)
            .ease(d3.easeLinear)
            .attr("transform", "translate(" + (this.x(0) - this.x(currentTime)) + ")");

        this.removeUnwantedXaxisValues(svg);
    }
}