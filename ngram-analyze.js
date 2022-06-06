function get_tgt_idx() {
    tgt_year = $('#target-year').val()
    years = d3.range(1500, 2020)
    return years.indexOf(Number(tgt_year))
}

function get_colors_year_norm(data) {
    colors = []
    for (let yr in d3.range(1500, 2020)) {
        color = i => d3.interpolateReds(d3.scaleLinear().domain([0, d3.max(data.map(d => d.timeseries[yr]))]).range([1, 0])(i))
        color = data.map(d => color(d.timeseries[yr]))
        colors.push(color)
    }
    return colors
}

function get_colors_thresh(data) {
    colors = []
    thresh = $('#thresh-value').val() / 100
    scheme = d3.schemePaired
    for (let yr in d3.range(1500, 2020)) {
        color = data.map(d => d.timeseries[yr] == 0 ? scheme[5] : d.timeseries[yr] < thresh ? scheme[4] : scheme[2])
        colors.push(color)
    }
    return colors
}

function get_colors(data) {
    if (d3.select('#continuous').property('checked')) {
        return get_colors_year_norm(data)
    } else if (d3.select('#threshold').property('checked')) {
        return get_colors_thresh(data)
    }
}


function create_background_rects({
    data = undefined,
    colors = undefined,
}) {
    if (colors === undefined) {
        colors = get_colors(data)

        function lock_input(elt) {
            let i = $(elt).attr('id').replace('lock_check_', '')
            let inputVal = document.getElementById($(elt).attr('id')).checked
            if (inputVal) {
                d3.select(`#word_${i}`).attr('style', 'background-color:#999999')
                d3.select(`#line_${i}`).attr('display', 'none')
            } else {
                d3.select(`#word_${i}`).attr('style', `background-color:${colors[get_tgt_idx()][i].replace(')', ', .8)')}`)
                d3.select(`#line_${i}`).attr('display', null)
            }
        }
        d3.selectAll('.lock_check').on('click', function() { lock_input(this) })
    }
    colors[0].map((c, i) => d3.select(`#word_${i}`).attr('style', `background-color:${colors[get_tgt_idx()][i].replace(')', ', .8)')}`))
}

function create_lineplot(data) {
    // based on https://observablehq.com/@d3/line-chart
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 80, // left margin, in pixels

    colors = get_colors(data)

    width = $('#output-text').width()
    height = $('#output-text').height()

    const svg = d3.select('#ngram-graph')
                  .attr('width', width)
                  .attr('height', height)
                  .attr('viewBox', [0, 0, width, height])
                  .style("-webkit-tap-highlight-color", "transparent")
                  .on("pointerenter", pointerentered)
                  .on("pointermove", pointermoved)
                  .on("pointerleave", pointerleft)
                  .on("touchstart", event => event.preventDefault());
    $('#ngram-graph').children().remove()

    const X = d3.range(1500, 2020)
    const Y = d3.map(data, d => d.timeseries)
    const I = d3.range(X.length)
    const O = d3.map(data, d => d)
    const T = d3.map(data, d => d.ngram)
    // compute domains
    xDomain = d3.extent(X)
    yDomain = [0, d3.max(Y.map(y => d3.max(y)))]

    // construct scales and axes
    const yRange = [height - marginBottom, marginTop]
    const xRange = [marginLeft, width - marginRight]
    const xScale = d3.scaleLinear(xDomain, xRange)
    const yScale = d3.scaleLinear(yDomain, yRange)
    const xAxis = d3.axisBottom(xScale).ticks(width / 50, 'd')
    const yAxis = d3.axisLeft(yScale).ticks(height / 50, 'p')

    const line = d3.map(d3.range(Y.length), j => d3.line()
                                                   .curve(d3.curveLinear)
                                                   .x(i => xScale(X[i]))
                                                   .y(i => yScale(Y[j][i])))

    svg.append("g")
       .attr("transform", `translate(0,${height-marginBottom})`)
       .call(xAxis);
    svg.append("g")
       .attr("transform", `translate(${marginLeft},0)`)
       .call(yAxis)
       .call(g => g.select(".domain").remove())
       .call(g => g.selectAll(".tick line").clone()
                   .attr("x2", width - marginLeft - marginRight)
                   .attr("stroke-opacity", 0.1))

    const path = svg.append('g')
       .attr('fill', 'none')
       .attr("stroke-width", 1.5)
       .attr("stroke-linecap", 'round')
       .attr("stroke-linejoin", 'round')
       .attr("stroke-opacity", 1)
     .selectAll('path')
     .data(d3.range(Y.length))
     .join('path')
       .style("mix-blend-mode", 'multiply')
       .attr("d", j => line[j](I))
       .attr('stroke', j => colors[get_tgt_idx()][j])
       .attr('id', j => `line_${j}`)

    tgt_year_drag = d3.drag()
                      .on('drag', tgt_year_dragged)
                      .on('end', tgt_year_dragended)
    tgt_year_line = svg.append('line')
       .attr('fill', 'none')
       .attr("stroke-width", 3)
       .attr("stroke-linecap", 'round')
       .attr("stroke-linejoin", 'round')
       .attr("stroke-opacity", 1)
       .attr('stroke', '#000000')
       .attr('id', 'tgt_year_line')
       .attr('x1', xScale($('#target-year').val()))
       .attr('x2', xScale($('#target-year').val()))
       .attr('y1', yScale(yDomain[0]))
       .attr('y2', yScale(yDomain[1]))
       .call(tgt_year_drag)
       .on('click', clicked)

    thresh_drag = d3.drag()
                    .on('drag', thresh_dragged)
                    .on('end', thresh_dragended)
    thresh_line = svg.append('line')
       .attr('fill', 'none')
       .attr("stroke-width", 3)
       .attr("stroke-linecap", 'round')
       .attr("stroke-linejoin", 'round')
       .attr("stroke-opacity", 1)
       .attr('stroke', '#000000')
       .attr('id', 'thresh_line')
       .attr('x1', xScale(xDomain[0]))
       .attr('x2', xScale(xDomain[1]))
       .attr('y1', yScale($('#thresh-value').val() / 100))
       .attr('y2', yScale($('#thresh-value').val() / 100))
       .call(thresh_drag)
       .on('click', clicked)

    function clicked(event, d) {
        if (event.defaultPrevented) return; // dragged
    }

    document.getElementById('target-year').addEventListener('change', move_tgt_year_line)

    function move_tgt_year_line(event) {
        min_yr = Number($('#target-year')[0].attributes.min.value)
        max_yr = Number($('#target-year')[0].attributes.max.value)
        new_yr = Math.min(Math.max($('#target-year').val(), min_yr), max_yr)
        tgt_year_line.attr('x1', xScale(new_yr))
                     .attr('x2', xScale(new_yr))
        path.attr('stroke', j => colors[get_tgt_idx()][j])
        create_background_rects({colors: colors})
    }

    function tgt_year_dragged(event, d) {
        new_yr = Math.min(Math.max(event.x, d3.min(xRange)), d3.max(xRange))
        d3.select(this).raise().attr("x1", new_yr).attr("x2", new_yr)
        $('#target-year').val(xScale.invert(new_yr))
    }

    function tgt_year_dragended(event, d) {
        min_yr = Number($('#target-year')[0].attributes.min.value)
        max_yr = Number($('#target-year')[0].attributes.max.value)
        new_yr = Math.round(xScale.invert(event.x))
        new_yr = Math.min(Math.max(new_yr, 1500), 2019)
        d3.select(this).raise().attr("x1", xScale(new_yr)).attr("x2", xScale(new_yr))
        $('#target-year').val(new_yr)
        $('#target-year')[0].dispatchEvent(new Event('change'))
    }

    document.getElementById('thresh-value').addEventListener('change', move_thresh_line)

    function move_thresh_line(event) {
        colors = get_colors_thresh(data)
        create_background_rects({colors: colors})
        thresh_line.attr('y1', yScale($('#thresh-value').val() / 100))
                     .attr('y2', yScale($('#thresh-value').val() / 100))
        path.attr('stroke', j => colors[get_tgt_idx()][j])
    }

    function thresh_dragged(event, d) {
        new_y = Math.min(Math.max(event.y, d3.min(yRange)), d3.max(yRange))
        d3.select(this).raise().attr("y1", new_y).attr("y2", new_y)
        new_thresh = yScale.invert(new_y) * 100
        $('#thresh-value').val(new_thresh)
    }

    function thresh_dragended(event, d) {
        new_y = Math.min(Math.max(event.y, d3.min(yRange)), d3.max(yRange))
        new_thresh = yScale.invert(new_y).toFixed(5)
        d3.select(this).raise().attr("y1", yScale(new_thresh)).attr("y2", yScale(new_thresh))
        $('#thresh-value').val(new_thresh * 100)
        $('#thresh-value')[0].dispatchEvent(new Event('change'))
    }

    document.getElementById('continuous').addEventListener('change', switch_to_continuous)
    document.getElementById('threshold').addEventListener('change', switch_to_thresh)

    function switch_to_continuous(event) {
        $('#thresh-value').prop('disabled', true)
        thresh_line.attr('display', 'none')
        colors = get_colors(data)
        $('#target-year')[0].dispatchEvent(new Event('change'))
    }

    function switch_to_thresh(event) {
        $('#thresh-value').prop('disabled', false)
        thresh_line.attr('display', null)
        colors = get_colors(data)
        $('#thresh-value')[0].dispatchEvent(new Event('change'))
    }

    const dot = svg.append("g")
                   .attr("display", "none");

    dot.append("circle")
       .attr("r", 2.5);

    dot.append("text")
       .attr("font-family", "sans-serif")
       .attr("font-size", 10)
       .attr("text-anchor", "middle")
       .attr("y", -8);

    function pointermoved(event) {
        const [xm, ym] = d3.pointer(event);
        const xi = d3.least(I, i => Math.abs(xScale(X[i]) - xm))
        const yi = d3.least(d3.range(Y.length), j => Math.abs(yScale(Y[j][xi]) - ym))
        path.style("stroke", j => yi === j ? null : "#ddd").filter(j => j === yi).raise();
        dot.attr("transform", `translate(${xScale(X[xi])},${yScale(Y[yi][xi])})`);
        if (T) dot.select("text").text(`${T[yi]}, ${X[xi]}: ${d3.format('.2p')(Y[yi][xi])}`);
        svg.property("value", O[yi]).dispatch("input", {bubbles: true});
    }

    function pointerentered() {
        path.style("mix-blend-mode", null).style("stroke", "#ddd");
        dot.attr("display", null);
    }

    function pointerleft() {
        path.style("mix-blend-mode", "multiply").style("stroke", null);
        dot.attr("display", "none");
        svg.node().value = null;
        svg.dispatch("input", {bubbles: true});
    }

    return svg.node()
}

function analyze_text() {
    text = $('#input-text').val()
    // break into words, see https://stackoverflow.com/a/36508315
    words = text.match(/\b([\w+]+)'?([\w+]+)?\b/g)
    words = words.join(',')
    ngram_url = `https://books.google.com/ngrams/json?content=${words}&year_start=1500&year_end=2019&corpus=26&smoothing=3`
    $.ajax({url: ngram_url, type: 'GET', dataType: 'jsonp'}).then(function(data) {
        create_background_rects({data: data})
        create_lineplot(data)
    })
    // get all non-white space text
    paragraphs = text.split('\n').filter(t => t.trim() != '')
    $('#output-text').children().remove()
    running_count = 0
    for (let t in paragraphs) {
        $('#output-text').append('<p>' + paragraphs[t].match(/\b([\w+]+)'?([\w+]+)?\b/g).map((word, i) => `<div class='switch'><input type='checkbox' class='lock_check' id='lock_check_${running_count+i}'><label for='lock_check_${running_count+i}' id=word_${running_count+i}>${word.replaceAll('+', ' ')}</label></div>`).join(' ') + '</p>')
        running_count += paragraphs[t].match(/\b([\w+]+)'?([\w+]+)?\b/g).length

    }

}
