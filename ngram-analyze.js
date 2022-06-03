function get_tgt_idx() {
    tgt_year = $('#target-year').val()
    years = d3.range(1500, 2020)
    return years.indexOf(Number(tgt_year))
}

function get_colors(data) {
    tgt_idx = get_tgt_idx()
    color = i => d3.interpolateReds(d3.scaleLinear().domain([0, d3.max(data.map(d => d.timeseries[tgt_idx]))]).range([1, 0])(i))
    return data.map(d => color(d.timeseries[tgt_idx]))
}

function create_background_rects(data) {
    colors = get_colors(data)
    data.map((d, i) => d3.select(`#${d.ngram}`).attr('style', `background-color:${colors[i].replace(')', ', .8)')}`))

    function lock_input(elt) {
        let word = $(elt).attr('id').replace('lock_check_', '')
        let inputVal = document.getElementById($(elt).attr('id')).checked
        if (inputVal) {
            d3.select(`#${word}`).attr('style', 'background-color:#999999')
            d3.select(`#line_${word}`).attr('display', 'none')
        } else {
            i = d3.select(`#${word}`).attr('class').replace(word + '_', '')
            d3.select(`#${word}`).attr('style', `background-color:${colors[i].replace(')', ', .8)')}`)
            d3.select(`#line_${word}`).attr('display', null)
        }
    }

    d3.selectAll('.lock_check').on('click', function() { lock_input(this) })
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
    const xScale = d3.scaleLinear(xDomain, [marginLeft, width - marginRight])
    const yScale = d3.scaleLinear(yDomain, [height - marginBottom, marginTop])
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
       .attr('stroke', j => colors[j])
       .attr('id', j => `line_${T[j]}`)

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
    words = text.match(/\b(\w+)'?(\w+)?\b/g)
    words = words.join(',')
    ngram_url = `https://books.google.com/ngrams/json?content=${words}&year_start=1500&year_end=2019&corpus=26&smoothing=3`
    $.ajax({url: ngram_url, type: 'GET', dataType: 'jsonp'}).then(function(data) {
        create_background_rects(data)
        create_lineplot(data)
    })
    // get all non-white space text
    paragraphs = text.split('\n').filter(t => t.trim() != '')
    $('#output-text').children().remove()
    for (let t in paragraphs) {
        $('#output-text').append('<p>' + paragraphs[t].match(/\b(\w+)'?(\w+)?\b/g).map((word, i) => `<input type='checkbox' class='lock_check' id='lock_check_${word}' name='lock_check_${word}'><span class='${word}_${i}' id=${word}>${word}</span>`).join(' ') + '</p>')
    }

}
