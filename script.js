(function () {
    // TODO: Charts by days and hours

    $(document).ready(function () {
        let r = []; // Data Arrays
        let dt = $('#dt').DataTable({
            order: [[0, "asc"]],
            dom: 'if<t>lp',
            columns: [
                { title: "EventID" },
                { title: "Level" },
                { title: "Type" },
                { title: "Info" },
                { title: "TimeCreated" }
            ]
        });
        let dt2 = $('#dtGroup').DataTable({
            order: [[1, "desc"]],
            dom: 'if<t>pl',
            columns: [
                { title: "Info", "className": "text-small" },
                { title: "Occurances" }
            ]
        });   // Data Table Objects

        $('#import').on('click', function () {
            $('#proc').show();
            var files = document.getElementById('selectFiles').files;
            if (files.length < 1)
                return false;

            var fr = new FileReader();
            fr.filename = files[0].name;
            fr.onload = function (e) {
                const eventsData = e.target.filename.includes('xml') ? xmlToJson($.parseXML(e.target.result), ' ') : JSON.parse(e.target.result);
                const d = parseData(eventsData.Events.Event);

                // Add data to r if "Add to existing data" is checked
                // Otherwise assign data to r
                r = $('#chkAdd').is(':checked') ? r.concat(d) : d;

                PopulateChartsAndTables(r);
            }

            fr.readAsText(files.item(0));
        });

        $('#showAll').on("click", function (e) {
            $('#proc').show();
            e.preventDefault();
            PopulateChartsAndTables(r);
            $('#showAll').hide();
        });

        $('#filter').on("click", function (e) {
            e.preventDefault();
            const arr = filterByDate(r, $('#start').val(), $('#end').val());
            PopulateChartsAndTables(arr);
            $('#showAll').show();
        });

        $('input[type=datetime]').datetimepicker();
    });
})();

const renderD3Bar = (data) => {
    $('#c1').html('');
    var width = 400,
        height = 300;

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function (d) { return d.values.length; })]);

    var chart = d3.select("#c1")
        .attr("width", width)
        .attr("height", height)
        .attr("padding-left", "20px");

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var barWidth = width / 10; //data.length;

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(" + i * barWidth + ",0)"; });

    bar.append("rect")
        .attr("y", function (d) { return y(d.values.length); })
        .attr("height", function (d) { return height - y(d.values.length); })
        .attr("width", barWidth - 1)
        .on("click", function (d) {
            $('#dt').dataTable().fnClearTable();
            $('#dt').dataTable().fnAddData(d.values);
            $('#showAll').show();
        })
        .on("mousemove", function (d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY + 20 + "px")
                .style("display", "inline-block")
                .html(`Total Occurances: ${d.values.length} <br> ${d.key}...`);
        })
        .on("mouseout", function (d) { tooltip.style("display", "none"); });;

    bar.append("text")
        .attr("x", barWidth / 2)
        .attr("y", function (d) { return y(d.values.length) + 3; })
        .attr("dy", ".75em")
        .text(function (d) { return d.values.length; });
};

const renderDailyBar = (data) => {
    $('#c2').html('');
    var width = 200,
        height = 150;

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function (d) { return d.values.length; })]);

    var chart = d3.select("#c2")
        .attr("width", width)
        .attr("height", height)
        .attr("padding-left", "20px");

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var barWidth = width / data.length;

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(" + i * barWidth + ",0)"; });

    bar.append("rect")
        .attr("y", function (d) { return y(d.values.length); })
        .attr("height", function (d) { return height - y(d.values.length); })
        .attr("width", barWidth - 1)
        // .on("click", function (d) {
        //     $('#dt').dataTable().fnClearTable();
        //     $('#dt').dataTable().fnAddData(d.values);
        //     $('#showAll').show();
        // })
        .on("mousemove", function (d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY + 20 + "px")
                .style("display", "inline-block")
                .html(`Date: <b>${d.key}</b> <br> Events: <b>${d.values.length}</b>`);
        })
        .on("mouseout", function (d) { tooltip.style("display", "none"); });

    bar.append("text")
        .attr("x", barWidth / 2)
        .attr("y", function (d) { return y(d.values.length) + 3; })
        .attr("dy", ".75em")
        .text(function (d) { return d.values.length; });

}

const renderHourlyBar = (data) => {
    $('#c3').html('');
    var width = 200,
        height = 150;

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function (d) { return d.values.length; })]);

    var chart = d3.select("#c3")
        .attr("width", width)
        .attr("height", height)
        .attr("padding-left", "20px");

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var barWidth = width / data.length;

    var bar = chart.selectAll("g")
        .data(data)
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(" + i * barWidth + ",0)"; });

    bar.append("rect")
        .attr("y", function (d) { return y(d.values.length); })
        .attr("height", function (d) { return height - y(d.values.length); })
        .attr("width", barWidth - 1)
        // .on("click", function (d) {
        //     $('#dt').dataTable().fnClearTable();
        //     $('#dt').dataTable().fnAddData(d.values);
        //     $('#showAll').show();
        // })
        .on("mousemove", function (d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY + 20 + "px")
                .style("display", "inline-block")
                .html(`Hours: <b>${d.key}</b> <br> Events: <b>${d.values.length}</b>`);
        })
        .on("mouseout", function (d) { tooltip.style("display", "none"); });

    bar.append("text")
        .attr("x", barWidth / 2)
        .attr("y", function (d) { return y(d.values.length) + 3; })
        .attr("dy", ".75em")
        .text(function (d) { return d.values.length; });

}

const parseData = (arr) => {
    return arr.map(rs => {
        let ev = [];
        const type = rs.EventData.Data["#text"].includes("ERROR") ? "ERROR" : "WARN";
        const info = rs.EventData.Data["#text"].split(type)[1];
        const date = new Date(rs.System.TimeCreated.SystemTime);

        ev.push(rs.System.EventRecordID["#text"]);
        ev.push(rs.System.Level["#text"]);
        ev.push(type);
        ev.push(info ? info.replace("MyAccounts.Infrastructure.Logging.Log4NetLogger: ", "") : "");
        ev.push(date);

        return ev;
    });
};

// Group the array by "Info" field
const groupByInfo = (arr) => {
    let dat = arr.reduce((rv, x) => {
        const v = x[3];
        let el = rv.find((r) => r && r.key === v);
        if (el) {
            el.values.push(x);
        }
        else {
            rv.push({ key: v, values: [x] });
        }
        return rv;
    }, []);


    return dat.sort((a, b) => {
        return b.values.length - a.values.length;
    });
};

// Group the array by "Date" field
const groupByDate = (arr) => {
    var array = _.groupBy(arr, (item) => {
        return moment(item[4],"DD/MM/YYYY").format('DD/MM');
    });

    var unsortedArr = $.map(array, (val, i) => {
        return {key: i, values: val};
    });

    return unsortedArr.sort((a,b) => { return b.key < a.key});
};

// Group the array by "Date" field
const groupByHours = (arr) => {
    var array = _.groupBy(arr, (item) => {
        var d = parseInt( moment(item[4],"DD/MM/YYYY").format("H"));
        if (d >= 0 && d < 3) {
            return "00:00 - 02:59";
        } else if (d >= 3 && d < 6) {
            return "03:00 - 05:59";
        } else if (d >= 6 && d < 9) {
            return "06:00 - 08:59";
        } else if (d >= 9 && d < 12) {
            return "09:00 - 11:59";
        } else if (d >= 12 && d < 15) {
            return "12:00 - 14:59";
        } else if (d >= 15 && d < 18) {
            return "15:00 - 17:59";
        } else if (d >= 18 && d < 21) {
            return "18:00 - 20:59";
        } else {
            return "21:00 - 23:59";
        }
    });

    var unsortedArr = $.map(array, (val, i) => {
        return {key: i, values: val};
    });

    return unsortedArr.sort((a,b) => { return b.key < a.key});
};

const filterByDate = (arr, startDate, endDate) => {
    return arr.filter(a => {
        return (new Date(a[4]) > new Date(startDate) && new Date(a[4]) < new Date(endDate));
    })
};

//Populate Facts
const PopulateChartsAndTables = (r) => {
    var erArray = [], warnArray = [];
    var minDate = new Date(), maxDate = new Date(1900, 1, 1);
    r.forEach(function (el) {
        minDate = minDate < el[4] ? minDate : el[4];
        maxDate = maxDate > el[4] ? maxDate : el[4];
        if (el[2] === "ERROR") {
            erArray.push(el);
        }

        if (el[2] === "WARN") {
            warnArray.push(el);
        }
    });

    var totalHours = ((maxDate - minDate) / 3600000).toFixed(2);

    $('#totalEvents').text(r.length);
    $('#totalErrors').text(erArray.length);
    $('#totalWarning').text(warnArray.length);

    $('#hourlyEvents').text((r.length / totalHours).toFixed(2));
    $('#hourlyErrors').text((erArray.length / totalHours).toFixed(2));
    $('#hourlyWarning').text((warnArray.length / totalHours).toFixed(2));

    // pass the new array r to dt
    $('#dt').dataTable().fnClearTable();
    $('#dt').dataTable().fnAddData(r);

    let arr = groupByInfo(r);

    let dt2Data = arr.map(a => {
        let arrayItem = [];
        arrayItem.push(a.key.substr(0, 300));
        arrayItem.push(a.values.length);
        return arrayItem;
    });

    // pass the new array dt2Data to dt2
    $('#dtGroup').dataTable().fnClearTable();
    $('#dtGroup').dataTable().fnAddData(dt2Data);

    // Reset SVG for draw/redraw
    renderD3Bar(arr.slice(0, 10));
    renderDailyBar(groupByDate(r));
    renderHourlyBar(groupByHours(r));

    $('#proc').hide();
    $('#main').show();
};