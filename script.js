(function () {
    $(document).ready(function () {
        let r = [];
        let dt, dt2;
        $('#import').on('click', function () {
            $('#proc').show();
            var files = document.getElementById('selectFiles').files;
            if (files.length < 1)
                return false;

            var fr = new FileReader();
            fr.filename = files[0].name;
            fr.onload = function (e) {
                const txt = e.target.filename.includes('xml') ? xml2json(parseXml(e.target.result), ' ') : e.target.result;
                const result = JSON.parse(txt.replace(new RegExp('@SystemTime', 'g'), '_SystemTime'));
                const d = result.Events.Event.map(rs => {
                    let ev = [];
                    ev.push(rs.System.EventRecordID);
                    ev.push(rs.System.Level);
                    const type = rs.EventData.Data.includes("ERROR") ? "ERROR" : "WARN";
                    ev.push(type);
                    const info = rs.EventData.Data.split(type)[1];
                    ev.push(info ? info.replace("MyAccounts.Infrastructure.Logging.Log4NetLogger: ", "") : "");
                    //ev.eventData = rs.EventData.Data;
                    const date = new Date(rs.System.TimeCreated._SystemTime);
                    ev.push(date);
                    return ev;
                });

                r = $('#chkAdd').is(':checked') ? r.concat(d) : d;

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
                // arr = groupByArray(r, 3);
                arr.sort((a, b) => {
                    return b.values.length - a.values.length
                });

                let dt2Data = arr.map(a => {
                    let arrayItem = [];
                    arrayItem.push(a.key.substr(0, 300));
                    arrayItem.push(a.values.length);
                    return arrayItem;
                });

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


                $('svg').html('');
                renderD3Bar(arr.slice(0, 10));

                $('#proc').hide();
            }

            fr.readAsText(files.item(0));
        });

        $('#showAll').on("click", function (e) {
            e.preventDefault();
            $('#showAll').hide();
            $('#dt').dataTable().fnClearTable();
            $('#dt').dataTable().fnAddData(r);
        })
    });


    function renderD3Bar(data) {
        var width = 500,
            height = 300;

        var y = d3.scaleLinear()
            .range([height, 0]);

        var chart = d3.select("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("padding-left", "20px");

        var tooltip = d3.select("body").append("div").attr("class", "toolTip");

        y.domain([0, d3.max(data, function (d) { return d.values.length; })]);

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
                    .html(`Total Occurance: ${d.values.length} <br> ${d.key}...`);
            })
            .on("mouseout", function (d) { tooltip.style("display", "none"); });;

        bar.append("text")
            .attr("x", barWidth / 2)
            .attr("y", function (d) { return y(d.values.length) + 3; })
            .attr("dy", ".75em")
            .text(function (d) { return d.values.length; });
    }

})();

function groupByInfo(r) {
    return r.reduce((rv, x) => {
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

function groupByDate(r) {
    return r.reduce((rv, x) => {
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
}