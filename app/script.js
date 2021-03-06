$(document).ready(() => {
    let r = []; // Data Arrays
    let dt = $('#dt').DataTable({
        order: [[0, "asc"]],
        dom: 'if<t>lp',
        columns: [
            { title: "EventID" },
            { title: "Source" },
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


    $('#selectFiles').on("change", function (e) {
        var ext = this.value.match(/\.([^\.]+)$/)[1];
        switch (ext) {
            case 'xml':
            case 'json':
                break;
            default:
                alert('Only xml and json files can be imported.');
                this.value = '';
        }
    });

    $('#fuzzy').on("click", () => {
        $('#proc').show();
        setTimeout(() => {
            PopulateChartsAndTables(r, true);
        }, 1);
    });

    $('#import').on('click', function () {
        $('#proc').show();
        const files = document.getElementById('selectFiles').files;
        if (files.length < 1) {
            $('#proc').hide();
            return false;
        }

        let fr = new FileReader();
        fr.filename = files[0].name;
        fr.onload = function (e) {
            const eventsData = e.target.filename.includes('xml') ? xmlToJson($.parseXML(e.target.result), ' ') : JSON.parse(e.target.result);
            const d = parseData(eventsData.Events.Event);

            // Populate Source Filter Dropdown 
            PopulateSource(d);

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
        clearFilters();
        setTimeout(() => {
            PopulateChartsAndTables(r);
            $('#showAll').hide();
        }, 1);
    });

    $('#filter').on("click", function (e) {
        e.preventDefault();
        let arr = filterByDate(r, $('#start').val(), $('#end').val());
        arr = filterBySource(arr, $('#sourceddl').val());
        PopulateChartsAndTables(arr);
        $('#showAll').show();
    });

    $('input[type=datetime]').datetimepicker();
});


const clearFilters = () => {
    $('#start').val('');
    $('#end').val('');
    $('#sourceddl').val('');
}

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
            // $('#dt').dataTable().fnClearTable();
            // $('#dt').dataTable().fnAddData(d.values);
            $('#showAll').show();
            tooltip.style("display", "none");
            PopulateChartsAndTables(d.values);
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
        .on("click", function (d) {
            $('#showAll').show();
            tooltip.style("display", "none");
            PopulateChartsAndTables(d.values);
        })
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
        .on("click", function (d) {
            $('#showAll').show();
            tooltip.style("display", "none");
            PopulateChartsAndTables(d.values);
        })
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
        let info = rs.EventData.Data["#text"].split(type)[1];
        if (info) {
            const infoArray = info.split("Infrastructure.Logging.Log4NetLogger: ");
            info = infoArray.length > 1 ? infoArray[1] : rs.EventData.Data["#text"].split(type)[1];
        } else {
            info = "";
        }

        const date = new Date(rs.System.TimeCreated.SystemTime);

        ev.push(rs.System.EventRecordID["#text"]);
        ev.push(rs.System.Provider.Name);
        ev.push(rs.System.Level["#text"]);
        ev.push(type);
        ev.push(info);
        ev.push(date);

        return ev;
    });
};

// Group the array by "Info" field
const groupByInfo = (arr, applyGrouping) => {
    let dat = arr.reduce((rv, x) => {
        const v = x[4]; //index of info is 4 in the array
        let el;
        if (applyGrouping) {
            el = rv.find((r) => r && compareTwoStrings(r.key, v) > 0.9);
        }
        else {
            el = rv.find((r) => r && r.key === v);
        }
        
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
        return moment(item[5], "DD/MM/YYYY").format('DD/MM');
    });

    var unsortedArr = $.map(array, (val, i) => {
        return { key: i, values: val };
    });

    return unsortedArr.sort((a, b) => { return b.key < a.key });
};

// Group the array by "Date" field
const groupByHours = (arr) => {
    var array = _.groupBy(arr, (item) => {
        var d = parseInt(moment(item[5], "DD/MM/YYYY").format("H"));
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
        return { key: i, values: val };
    });

    return unsortedArr.sort((a, b) => { return b.key < a.key });
};

const filterByDate = (arr, startDate, endDate) => {
    const sd = moment(startDate), ed = moment(endDate);
    if (sd.isValid() && ed.isValid()) {
        return arr.filter(a => {
            return (new Date(a[5]) > new Date(startDate) && new Date(a[5]) < new Date(endDate));
        });
    }
    else {
        return arr;
    }
};

const filterBySource = (arr, sourceName) => {

    return (sourceName && sourceName.length > 1)
        ? arr.filter(a => { return a[1] == $('#sourceddl').val() })
        : arr;
}

//Populate Facts
const PopulateChartsAndTables = (r, applyGrouping = false) => {
    var erArray = [], warnArray = [];
    var minDate = new Date(), maxDate = new Date(1900, 1, 1);
    r.forEach(function (el) {
        minDate = minDate < el[5] ? minDate : el[5];
        maxDate = maxDate > el[5] ? maxDate : el[5];
        if (el[3] === "ERROR") {
            erArray.push(el);
        }

        if (el[3] === "WARN") {
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

    let arr = groupByInfo(r, applyGrouping);

    let dt2Data = arr.map(a => {
        let arrayItem = [];
        arrayItem.push(a.key.substr(0, 500));
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

const PopulateSource = (data) => {
    var unique = [...new Set(data.map(item => item[1]))];

    unique.forEach(function (item) {
        if (!$(`#sourceddl option[value=${item}]`).length) {
            $('#sourceddl').append(`<option value="${item}">${item}</option>`);
        }
    });
}