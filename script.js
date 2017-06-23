(function () {
    $(document).ready(function () {
        let r = [], d = []; // Data Arrays
        let dt, dt2;   // Data Table Objects
        $('#import').on('click', function () {
            $('#proc').show();
            var files = document.getElementById('selectFiles').files;
            if (files.length < 1)
                return false;

            var fr = new FileReader();
            fr.filename = files[0].name;
            fr.onload = function (e) {
                const txtData = e.target.filename.includes('xml') ? xml2json(parseXml(e.target.result), ' ') : e.target.result;
                d = parseData(txtData);

                // Add data to r if "Add to existing data" is checked
                // Otherwise assign data to r
                r = $('#chkAdd').is(':checked') ? r.concat(d) : d;

                ProcessData(r);

                // If dt has been assigned a value, redraw it using the new array r
                // Otherwise initialise the DataTable and assign it to dt
                if (dt) {
                    $('#dt').dataTable().fnClearTable();
                    $('#dt').dataTable().fnAddData(r);
                }
                else {
                    dt = $('#dt').DataTable({
                        data: r,
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
                }

                let arr = groupByInfo(r);
                arr.sort((a, b) => {
                    return b.values.length - a.values.length;
                });

                let dt2Data = arr.map(a => {
                    let arrayItem = [];
                    arrayItem.push(a.key.substr(0, 300));
                    arrayItem.push(a.values.length);
                    return arrayItem;
                });

                // If dt2 has been assigned a value, redraw it using the new array dt2Data
                // Otherwise initialise the DataTable and assign it to dt2
                if (dt2) {
                    $('#dtGroup').dataTable().fnClearTable();
                    $('#dtGroup').dataTable().fnAddData(dt2Data);
                }
                else {
                    dt2 = $('#dtGroup').DataTable({
                        data: dt2Data,
                        order: [[1, "desc"]],
                        dom: 'if<t>pl',
                        columns: [
                            { title: "Info", "className": "text-small" },
                            { title: "Occurances" }
                        ]
                    });
                }

                // Reset SVG for draw/redraw
                $('svg').html('');
                renderD3Bar(arr.slice(0, 10));

                $('#proc').hide();
                $('#main').show();
            }

            fr.readAsText(files.item(0));
        });

        $('#showAll').on("click", function (e) {
            e.preventDefault();
            $('#showAll').hide();
            $('#dt').dataTable().fnClearTable();
            $('#dt').dataTable().fnAddData(r);
        });

        $('#filter').on("click", function (e) {
            e.preventDefault();
            r = filterByDate(r, $('#start').val(), $('#end').val());
            $('#dt').dataTable().fnClearTable();
            $('#dt').dataTable().fnAddData(r);
        });

        $('input[type=datetime]').datetimepicker();
    });
})();

const renderD3Bar = (data) => {
    var width = 500,
        height = 300;

    var y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, function (d) { return d.values.length; })]);

    var chart = d3.select("svg")
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

const parseData = (txtData) => {
    const result = JSON.parse(txtData.replace(new RegExp('@SystemTime', 'g'), '_SystemTime'));
    return result.Events.Event.map(rs => {
        let ev = [];
        const type = rs.EventData.Data.includes("ERROR") ? "ERROR" : "WARN";
        const info = rs.EventData.Data.split(type)[1];
        const date = new Date(rs.System.TimeCreated._SystemTime);

        ev.push(rs.System.EventRecordID);
        ev.push(rs.System.Level);
        ev.push(type);
        ev.push(info ? info.replace("MyAccounts.Infrastructure.Logging.Log4NetLogger: ", "") : "");
        ev.push(date);

        return ev;
    });
};

// Group the array by "Info" field
const groupByInfo = (arr) => {
    return arr.reduce((rv, x) => {
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
};

// Group the array by "Date" field
const groupByDate = (arr) => {
    return arr.reduce((rv, x) => {
        const v = new Date(x[4]);
        let el = rv.find((r) => r && r.key === v);
        if (el) {
            el.values.push(x);
        }
        else {
            rv.push({ key: v, values: [x] });
        }
        return rv;
    }, []);
};

const filterByDate = (arr, startDate, endDate) => {
    return arr.filter(a => {
        if (new Date(a[4]) > new Date(startDate) && new Date(a[4]) < new Date(endDate))
            return true;

        return false;
    })
};

//Populate Facts
const ProcessData = (arr) => {
    var erArray = [], warnArray = [];
    var minDate = new Date(), maxDate = new Date(1900, 1, 1);
    arr.forEach(function(el) {
        minDate = minDate < el[4] ? minDate : el[4];
        maxDate = maxDate > el[4] ? maxDate : el[4];
        if(el[2] === "ERROR"){
            erArray.push(el);
        }

        if(el[2] === "WARN"){
            warnArray.push(el);
        }
    });

    var totalHours = ((maxDate - minDate)  / 3600000).toFixed(2);

    $('#totalEvents').text(arr.length);
    $('#totalErrors').text(erArray.length);
    $('#totalWarning').text(warnArray.length);

    $('#hourlyEvents').text((arr.length / totalHours).toFixed(2));
    $('#hourlyErrors').text((erArray.length / totalHours).toFixed(2));
    $('#hourlyWarning').text((warnArray.length / totalHours).toFixed(2));

};